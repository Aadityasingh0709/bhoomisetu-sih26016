#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "===================================================="
echo " BhoomiSetu AI Recommendation Server"
echo " KNN Model - Port 5001"
echo "===================================================="
echo

if command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
elif command -v python >/dev/null 2>&1; then
    PYTHON=python
else
    echo "[ERROR] Python not found. Please install Python 3.10+."
    exit 1
fi

echo "Using Python: $PYTHON"
echo "Checking Python packages..."
$PYTHON -c "import flask, flask_cors, sklearn, pandas, numpy, scipy; print('[OK] All packages ready')" || {
    echo "Installing required packages..."
    $PYTHON -m pip install -r requirements.txt
}

echo
echo "Starting AI server on http://localhost:5001"
echo "Press Ctrl+C to stop."
echo

$PYTHON app.py
