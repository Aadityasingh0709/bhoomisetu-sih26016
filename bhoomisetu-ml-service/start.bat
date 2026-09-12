@echo off
echo ====================================================
echo  BhoomiSetu AI Recommendation Server
echo  KNN Model - Port 5001
echo ====================================================
echo.

set PYTHON=C:\Users\HP\AppData\Local\Programs\Python\Python313\python.exe

echo Checking Python packages...
%PYTHON% -c "import flask, sklearn, pandas, scipy; print('[OK] All packages ready')"
if %errorlevel% neq 0 (
    echo Installing required packages...
    %PYTHON% -m pip install flask flask-cors scikit-learn pandas numpy scipy
)

echo.
echo Starting AI server on http://localhost:5001
echo Press Ctrl+C to stop.
echo.

%PYTHON% app.py
