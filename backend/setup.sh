#!/bin/bash
# Setup script for Python backend

set -e

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "Error: uv is not installed."
    echo ""
    echo "Install it with:"
    echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo "  # or: brew install uv"
    exit 1
fi

# Install Python version if .python-version exists
if [ -f ".python-version" ]; then
    PYTHON_VERSION=$(cat .python-version)
    if ! uv python list | grep -q "$PYTHON_VERSION" 2>/dev/null; then
        echo "Installing Python $PYTHON_VERSION..."
        uv python install "$PYTHON_VERSION"
    fi
fi

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv
fi

# Install dependencies
echo "Installing dependencies..."
uv sync

echo ""
echo "Setup complete! Run the server with: ./run.sh"

