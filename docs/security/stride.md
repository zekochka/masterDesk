$ErrorActionPreference = 'Continue'
$logFile = Join-Path $PSScriptRoot 'scanner_smoke_result.txt'
"MasterDesk scanner smoke-test | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Set-Content -Path $logFile -Encoding UTF8
$passed = 0
$checks = 4

function Test-Command {
    param([string]$Name, [string[]]$DockerArgs)
    Add-Content -Path $logFile -Value "`n=== $Name ==="
    try {
        $output = & docker @DockerArgs 2>&1
        $code = $LASTEXITCODE
        $output | ForEach-Object { Add-Content -Path $logFile -Value "$_" }
        if ($code -eq 0) {
            Write-Host "PASS: $Name" -ForegroundColor Green
            Add-Content -Path $logFile -Value 'RESULT: PASS'
            return $true
        }
        Write-Host "FAIL: $Name (exit $code)" -ForegroundColor Yellow
        Add-Content -Path $logFile -Value "RESULT: FAIL (exit $code)"
        return $false
    } catch {
        Write-Host "FAIL: $Name - $_" -ForegroundColor Red
        Add-Content -Path $logFile -Value "RESULT: FAIL $_"
        return $false
    }
}

if (Test-Command 'Docker server/version' @('version')) { $passed++ }
if (Test-Command 'hello-world container' @('run','--rm','hello-world')) { $passed++ }
if (Test-Command 'Trivy version' @('run','--rm','aquasec/trivy:latest','--version')) { $passed++ }
if (Test-Command 'Gitleaks version' @('run','--rm','zricethezav/gitleaks:latest','version')) { $passed++ }

$percentage = [math]::Round(100 * $passed / $checks, 1)
$summary = "Total: $passed / $checks = $percentage% | scanner environment only; project scan NOT done"
Write-Host $summary
Add-Content -Path $logFile -Value "`n$summary"
Write-Host "Log: $logFile"
