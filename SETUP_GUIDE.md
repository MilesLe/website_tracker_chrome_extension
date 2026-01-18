# Development Environment Setup Guide

This guide will help you set up Node.js and Python for this project.

## Node.js Setup

### Install nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc  # or ~/.bashrc
```

### Install Node.js

```bash
nvm install --lts
nvm use --lts
```

Or use the project's version:
```bash
cd extension
nvm install  # Uses .nvmrc
```

## Python Setup

### Install uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# or: brew install uv
```

Reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

### Install Python (Optional)

Python 3.14+ is required. If you don't have it, install with uv:

```bash
uv python install 3.14
```

Pin it for this project:
```bash
cd backend
uv python pin 3.14
```

## Quick Setup

### Extension
```bash
cd extension
npm install
npm run build
```

### Backend
```bash
cd backend
./setup.sh
```

## Troubleshooting

### uv command not found

Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.zshrc  # or ~/.bashrc
```

### Upgrading uv

If you installed `uv` via the official installer script (not Homebrew), use:
```bash
uv self update
```

If you installed `uv` via Homebrew, use:
```bash
brew upgrade uv
```

To check which method you used:
```bash
which uv
# If it shows ~/.local/bin/uv, use: uv self update
# If it shows /opt/homebrew/bin/uv or /usr/local/bin/uv, use: brew upgrade uv
```

### nvm command not found

Add to `~/.zshrc` or `~/.bash_profile`:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Then reload:
```bash
source ~/.zshrc
```

