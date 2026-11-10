$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envPath = Join-Path $root '.env'
$configPath = Join-Path $root 'backend/MasterDesk.Api/appsettings.Development.json'

if (-not (Test-Path -LiteralPath $envPath) -and -not (Test-Path -LiteralPath $configPath)) {
    $port = '55432'
    $password = [guid]::NewGuid().ToString('N')
    $jwtKey = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
    @("POSTGRES_PORT=$port", "POSTGRES_PASSWORD=$password") | Set-Content -LiteralPath $envPath -Encoding utf8
    @{
        ConnectionStrings = @{ Default = "Host=127.0.0.1;Port=$port;Database=masterdesk;Username=masterdesk;Password=$password" }
        Jwt = @{ Key = $jwtKey }
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $configPath -Encoding utf8
} elseif (-not (Test-Path -LiteralPath $envPath) -or -not (Test-Path -LiteralPath $configPath)) {
    throw 'Both .env and backend/MasterDesk.Api/appsettings.Development.json must exist, or neither.'
}

Push-Location $root
try {
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose failed.' }
} finally {
    Pop-Location
}

Write-Output 'Local PostgreSQL is ready. Run: dotnet run --project backend/MasterDesk.Api'
