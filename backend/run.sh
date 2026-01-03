#!/bin/bash
# Run script that activates venv and starts the server

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check for pyenv and .python-version file
if [ -f ".python-version" ] && command -v pyenv &> /dev/null; then
    PYTHON_VERSION=$(cat .python-version)
    # Ensure pyenv uses the correct version
    eval "$(pyenv init -)"
    pyenv local "$PYTHON_VERSION" 2>/dev/null || true
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Running setup..."
    ./setup.sh
fi

# Activate virtual environment
source venv/bin/activate

# Verify we're using the venv Python
VENV_PYTHON=$(which python)
echo "Using Python from: $VENV_PYTHON"

# Run the server
echo "Starting FastAPI server..."
python main.py

