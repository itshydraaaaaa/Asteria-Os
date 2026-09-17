@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

set "REPO_ROOT=%~dp0.."
set "CONFIG=%REPO_ROOT%\litellm_config.yaml"
set "PYTHON=%USERPROFILE%\.python_env\python.exe"

echo =========================================
echo   LiteLLM Proxy - Founder OS Multi-Model
echo =========================================
echo Endpoint: http://localhost:8000
echo Config:   %CONFIG%
echo Primary:  Google AI Studio (Gemini 2.5 Flash)
echo Fallback: OpenRouter (Auto Free)
echo.

"%PYTHON%" -m litellm.proxy.proxy_cli --config "%CONFIG%" --port 8000 --detailed_debug
