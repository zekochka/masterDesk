param([string]$BaseUrl = 'http://localhost:5000')

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$project = 'masterdesk-smoke-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
$temp = Join-Path $root '.test-tmp'
New-Item -ItemType Directory -Path $temp -Force | Out-Null
$portReservation = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$portReservation.Start()
$env:POSTGRES_PORT = $portReservation.LocalEndpoint.Port.ToString()
$portReservation.Stop()
$env:POSTGRES_PASSWORD = [guid]::NewGuid().ToString('N')
$env:ConnectionStrings__Default = "Host=127.0.0.1;Port=$env:POSTGRES_PORT;Database=masterdesk;Username=masterdesk;Password=$env:POSTGRES_PASSWORD"
$env:Jwt__Key = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$env:SeedMaster__Login = 'smoke-master-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
$env:SeedMaster__Password = [guid]::NewGuid().ToString('N')
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = $BaseUrl
$apiProcess = $null
$frontendProcess = $null

function Assert([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}

function CallApi([string]$Method, [string]$Path, [object]$Body = $null, [string]$Token = '') {
    $headers = @{}
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    $args = @{ Uri = "$BaseUrl/api$Path"; Method = $Method; Headers = $headers; SkipHttpErrorCheck = $true }
    if ($null -ne $Body) {
        $args.ContentType = 'application/json'
        $args.Body = ConvertTo-Json -InputObject $Body -Compress
    }
    $response = Invoke-WebRequest @args
    $data = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
    return [pscustomobject]@{ Status = [int]$response.StatusCode; Data = $data }
}

function StartApi() {
    $exe = Join-Path $root 'backend/MasterDesk.Api/bin/Debug/net9.0/MasterDesk.Api.exe'
    $workingDirectory = Join-Path $root 'backend/MasterDesk.Api'
    $script:apiProcess = Start-Process -FilePath $exe -WorkingDirectory $workingDirectory -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $temp 'api.out.log') -RedirectStandardError (Join-Path $temp 'api.err.log')
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Start-Sleep -Milliseconds 500
        if ($script:apiProcess.HasExited) { throw 'API завершился при запуске. Проверьте .test-tmp/api.err.log.' }
        try {
            $response = Invoke-WebRequest -Uri "$BaseUrl/swagger/v1/swagger.json" -SkipHttpErrorCheck -TimeoutSec 1
            if ([int]$response.StatusCode -eq 200) { return }
        } catch { }
    }
    throw 'API не запустился за 20 секунд.'
}

try {
    docker compose -p $project -f (Join-Path $root 'docker-compose.yml') up -d | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Не удалось запустить PostgreSQL.' }
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        $health = docker inspect -f '{{.State.Health.Status}}' "$project-postgres-1"
        if ($health -eq 'healthy') { break }
        Start-Sleep -Milliseconds 500
    }
    Assert ($health -eq 'healthy') 'PostgreSQL не стал доступен.'
    $databaseUser = docker exec "$project-postgres-1" psql -U masterdesk -d masterdesk -tAc 'SELECT current_user'
    Assert ($databaseUser.Trim() -eq 'masterdesk') 'Контейнер PostgreSQL не создал пользователя masterdesk.'
    StartApi

    $guest = CallApi 'POST' '/requests' @{ deviceType = 'Ноутбук'; brandModel = 'ThinkPad'; description = 'Не включается'; contactPhone = '+77000000000' }
    Assert ($guest.Status -eq 401) 'Гость смог создать заявку.'

    $login = 'smoke-client-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
    $registered = CallApi 'POST' '/auth/register' @{ login = $login; password = 'test-password-123'; confirmPassword = 'test-password-123'; role = 'Master' }
    Assert ($registered.Status -eq 201 -and $registered.Data.user.role -eq 'User') 'Регистрация присвоила неверную роль.'
    $clientToken = $registered.Data.token
    $duplicate = CallApi 'POST' '/auth/register' @{ login = $login.ToUpperInvariant(); password = 'test-password-123'; confirmPassword = 'test-password-123' }
    Assert ($duplicate.Status -eq 409) 'Логин не уникален без учёта регистра.'

    if ($BaseUrl -eq 'http://localhost:5000') {
        $frontendDirectory = Join-Path $root 'frontend'
        $node = (Get-Command node).Source
        $frontendProcess = Start-Process -FilePath $node -WorkingDirectory $frontendDirectory -PassThru -WindowStyle Hidden `
            -ArgumentList @('node_modules/@angular/cli/bin/ng.js', 'serve', '--host', '127.0.0.1', '--port', '4200') `
            -RedirectStandardOutput (Join-Path $temp 'angular.out.log') -RedirectStandardError (Join-Path $temp 'angular.err.log')
        for ($attempt = 0; $attempt -lt 60; $attempt++) {
            Start-Sleep -Milliseconds 500
            if ($frontendProcess.HasExited) { throw 'Angular dev server завершился при запуске. Проверьте .test-tmp/angular.err.log.' }
            try {
                $page = Invoke-WebRequest -Uri 'http://127.0.0.1:4200/' -TimeoutSec 1
                if ([int]$page.StatusCode -eq 200) { break }
            } catch { }
        }
        Assert ($page.StatusCode -eq 200) 'Angular dev server не запустился.'
        $proxiedMe = Invoke-WebRequest -Uri 'http://127.0.0.1:4200/api/auth/me' -Headers @{ Authorization = "Bearer $clientToken" } -SkipHttpErrorCheck
        Assert ([int]$proxiedMe.StatusCode -eq 200) 'Angular proxy не передал авторизованный запрос в API.'
    }

    $created = CallApi 'POST' '/requests' @{ deviceType = 'Ноутбук'; brandModel = 'ThinkPad'; description = 'Не включается'; contactPhone = '+77000000000'; clientId = [guid]::NewGuid() } $clientToken
    Assert ($created.Status -eq 201 -and $created.Data.status -eq 'new') 'Клиент не создал новую заявку.'
    Assert ($created.Data.clientId -eq $registered.Data.user.id) 'ClientId взят из тела запроса.'
    $requestId = $created.Data.id

    $other = CallApi 'POST' '/auth/register' @{ login = ('smoke-other-' + [guid]::NewGuid().ToString('N').Substring(0, 8)); password = 'test-password-123'; confirmPassword = 'test-password-123' }
    Assert ($other.Status -eq 201) 'Не удалось создать второго клиента.'
    Assert ((CallApi 'GET' "/requests/$requestId" $null $other.Data.token).Status -eq 403) 'Клиент увидел чужую заявку.'
    Assert ((CallApi 'PATCH' "/requests/$requestId/accept" @{} $clientToken).Status -eq 403) 'Клиент принял заявку.'

    $master = CallApi 'POST' '/auth/login' @{ login = $env:SeedMaster__Login; password = $env:SeedMaster__Password }
    Assert ($master.Status -eq 200 -and $master.Data.user.role -eq 'Master') 'Тестовый мастер не вошёл.'
    $masterToken = $master.Data.token
    $available = CallApi 'GET' '/requests/available' $null $masterToken
    Assert ($available.Status -eq 200 -and $available.Data.id -contains $requestId) 'Мастер не видит новую заявку.'
    Assert ((CallApi 'PATCH' "/requests/$requestId/accept" @{} $masterToken).Status -eq 200) 'Мастер не принял заявку.'
    Assert ((CallApi 'PATCH' "/requests/$requestId/accept" @{} $masterToken).Status -eq 409) 'Повторное принятие не запрещено.'
    $assigned = CallApi 'GET' '/requests/assigned' $null $masterToken
    Assert ($assigned.Status -eq 200 -and $assigned.Data.id -contains $requestId) 'Мастер не видит свою заявку.'
    Assert ((CallApi 'PATCH' "/requests/$requestId/complete" @{} $masterToken).Status -eq 200) 'Мастер не завершил ремонт.'
    Assert ((CallApi 'PATCH' "/requests/$requestId/complete" @{} $masterToken).Status -eq 409) 'Повторное завершение не запрещено.'

    Stop-Process -Id $apiProcess.Id -Force
    $apiProcess = $null
    StartApi
    $afterRestart = CallApi 'GET' "/requests/$requestId" $null $clientToken
    Assert ($afterRestart.Status -eq 200 -and $afterRestart.Data.status -eq 'completed') 'Статус не сохранился после перезапуска API.'
    Assert ($null -ne $afterRestart.Data.acceptedAt -and $null -ne $afterRestart.Data.completedAt) 'Даты переходов не сохранились.'
    $proxyResult = if ($BaseUrl -eq 'http://localhost:5000') { ', Angular proxy' } else { '' }
    Write-Output "PostgreSQL smoke test passed: auth, roles, ownership, transitions, persistence${proxyResult}."
}
finally {
    if ($frontendProcess -and -not $frontendProcess.HasExited) { Stop-Process -Id $frontendProcess.Id -Force }
    if ($apiProcess -and -not $apiProcess.HasExited) { Stop-Process -Id $apiProcess.Id -Force }
    docker compose -p $project -f (Join-Path $root 'docker-compose.yml') down -v | Out-Null
}
