#!/bin/bash
# Setup script for Python virtual environment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Python virtual environment...${NC}"

# Check for pyenv and .python-version file
if [ -f ".python-version" ] && command -v pyenv &> /dev/null; then
    PYTHON_VERSION=$(cat .python-version)
    echo -e "${BLUE}Found .python-version file. Using pyenv to ensure Python $PYTHON_VERSION is available...${NC}"
    
    # Check if the version is installed
    if ! pyenv versions --bare | grep -q "^${PYTHON_VERSION}$"; then
        echo -e "${YELLOW}Python $PYTHON_VERSION not found. Installing via pyenv...${NC}"
        pyenv install "$PYTHON_VERSION"
    fi
    
    # Set local version
    pyenv local "$PYTHON_VERSION"
    echo -e "${GREEN}Using Python $PYTHON_VERSION via pyenv${NC}"
fi

# Determine which Python command to use
if command -v pyenv &> /dev/null && [ -f ".python-version" ]; then
    PYTHON_CMD=$(pyenv which python)
    PYTHON3_CMD=$(pyenv which python3)
else
    PYTHON_CMD=python
    PYTHON3_CMD=python3
fi

# Check if Python 3 is available
if ! command -v "$PYTHON3_CMD" &> /dev/null; then
    echo "Error: python3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$($PYTHON3_CMD --version | cut -d' ' -f2 | cut -d'.' -f1,2)
REQUIRED_VERSION="3.11"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${YELLOW}Warning: Python $PYTHON_VERSION detected. Python 3.11+ is recommended.${NC}"
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment with $PYTHON3_CMD..."
    "$PYTHON3_CMD" -m venv venv
    echo -e "${GREEN}Virtual environment created!${NC}"
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Verify we're using the venv Python
VENV_PYTHON=$(which python)
echo -e "${BLUE}Using Python from: $VENV_PYTHON${NC}"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "To activate the virtual environment in the future, run:"
echo "  source backend/venv/bin/activate"
echo ""
echo "Or use the run script:"
echo "  ./backend/run.sh"

