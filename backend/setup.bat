@echo off
REM Setup script for Python virtual environment (Windows)

echo Setting up Python virtual environment...

REM Check if Python 3 is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: python is not installed. Please install Python 3.11+ first.
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created!
) else (
    echo Virtual environment already exists.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

echo Setup complete!
echo.
echo To activate the virtual environment in the future, run:
echo   backend\venv\Scripts\activate.bat
echo.
echo Or use the run script:
echo   backend\run.bat

