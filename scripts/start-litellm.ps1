# Start LiteLLM proxy on Windows with UTF-8 encoding
$ErrorActionPreference = "Stop"

$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$REPO_ROOT = Split-Path -Parent $SCRIPT_DIR
$CONFIG = Join-Path $REPO_ROOT "litellm_config.yaml"
$PYTHON = "$env:USERPROFILE\.python_env\python.exe"

# Read keys from .env.local if not already in env
$envLocal = Join-Path $REPO_ROOT ".env.local"
if (Test-Path $envLocal) {
    Get-Content $envLocal | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $k = $parts[0].Trim()
            $v = $parts[1].Trim()
            if (-not [System.Environment]::GetEnvironmentVariable($k)) {
                [System.Environment]::SetEnvironmentVariable($k, $v)
            }
        }
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  LiteLLM Proxy - Founder OS Multi-Model" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Endpoint: http://localhost:8000"
Write-Host "Config:   $CONFIG"
Write-Host "Primary:  Google AI Studio (Gemini 2.5 Flash)"
Write-Host "Fallback: OpenRouter (Auto Free)"
Write-Host ""

& $PYTHON -m litellm.proxy.proxy_cli --config "$CONFIG" --port 8000 --detailed_debug
