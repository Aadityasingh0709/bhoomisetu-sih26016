@echo off
echo ====================================================
echo  BhoomiSetu AI Recommendation Server
echo  KNN Model - Port 5001
echo ====================================================
echo.

cd /d "%~dp0"

set PYTHON=

if defined LOCALAPPDATA (
    if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
        set PYTHON="%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
    )
)

if not defined PYTHON (
    py -3.13 --version >nul 2>nul
    if %errorlevel% equ 0 (
        set PYTHON=py -3.13
    )
)

if not defined PYTHON (
    py -3 --version >nul 2>nul
    if %errorlevel% equ 0 (
        set PYTHON=py -3
    )
)

if not defined PYTHON (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set PYTHON=python
    ) else (
        where py >nul 2>nul
        if %errorlevel% equ 0 (
            set PYTHON=py
        ) else (
            echo [ERROR] Python not found in PATH. Please install Python 3.10+ and add it to PATH.
            pause
            exit /b 1
        )
    )
)

echo Using Python runtime: %PYTHON%
echo Checking Python packages...
%PYTHON% -c "import flask, flask_cors, sklearn, pandas, numpy, scipy; print('[OK] All packages ready')"
if %errorlevel% neq 0 (
    echo Installing required packages...
    %PYTHON% -m pip install -r requirements.txt
)

echo.
echo Starting AI server on http://localhost:5001
echo Press Ctrl+C to stop.
echo.

%PYTHON% app.py

