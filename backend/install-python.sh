#!/bin/bash
# Helper script to install Python 3.12 with pyenv and required dependencies

set -e

echo "Installing Python 3.12 with pyenv..."

# Check if gettext is installed
if ! brew list gettext &>/dev/null; then
    echo "Installing gettext..."
    brew install gettext
    brew link --force gettext
fi

# Set environment variables
export LDFLAGS="-L$(brew --prefix gettext)/lib"
export CPPFLAGS="-I$(brew --prefix gettext)/include"

echo "Environment variables set:"
echo "  LDFLAGS=$LDFLAGS"
echo "  CPPFLAGS=$CPPFLAGS"
echo ""

# Install Python
echo "Installing Python 3.12 (this may take several minutes)..."
pyenv install 3.12

echo ""
echo "Python 3.12 installed successfully!"
echo ""
echo "To set it locally for this project, run:"
echo "  cd backend"
echo "  pyenv local 3.12"

