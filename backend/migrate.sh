#!/bin/bash
# Database migration script
# Destroys existing database and creates a new one

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "Error: uv is not installed."
    echo ""
    echo "Please install uv first:"
    echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo ""
    echo "Or on macOS with Homebrew:"
    echo "  brew install uv"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Running setup..."
    ./setup.sh
fi

# Run migration script
echo "Running database migration..."
uv run python -m website_tracker_backend.infrastructure.database.migrate
