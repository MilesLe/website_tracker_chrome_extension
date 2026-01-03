@echo off
REM Run script that activates venv and starts the server (Windows)

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Running setup...
    call setup.bat
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run the server
echo Starting FastAPI server...
python main.py

