# Development Environment Setup Guide

This guide will help you set up Node.js and Python for this project.

## Node.js Setup (using nvm)

### Install nvm

**macOS/Linux:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Or if you get SSL certificate errors:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash --insecure
```

**After installation, reload your shell:**
```bash
source ~/.bashrc
# or if using zsh:
source ~/.zshrc
```

**Verify nvm is installed:**
```bash
nvm --version
```

### Install Node.js LTS

```bash
nvm install --lts
nvm use --lts
nvm alias default lts/*
```

**Verify installation:**
```bash
node --version
npm --version
```

### Using the project's Node.js version

This project specifies Node.js 20 in `.nvmrc`. To use it:

```bash
cd extension
nvm install  # Installs version from .nvmrc
nvm use      # Switches to version from .nvmrc
```

## Python Setup (using pyenv)

### Install pyenv

**macOS (using Homebrew):**
```bash
brew install pyenv
```

**macOS/Linux (manual):**
```bash
curl https://pyenv.run | bash
```

**Add to your shell configuration** (`~/.zshrc` or `~/.bash_profile`):
```bash
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

**Reload your shell:**
```bash
source ~/.zshrc
# or
source ~/.bash_profile
```

**Verify pyenv is installed:**
```bash
pyenv --version
```

### Install Python 3.12

```bash
pyenv install 3.12
pyenv global 3.12
```

**Verify installation:**
```bash
python3 --version
```

### Using the project's Python version

This project specifies Python 3.12 in `backend/.python-version`. The setup script will automatically use it if pyenv is installed.

## Alternative: Using Homebrew (macOS)

If you prefer not to use version managers:

### Install Node.js
```bash
brew install node
```

### Install Python
```bash
brew install python@3.12
```

## Quick Setup Commands

Once Node.js and Python are installed:

### Extension Setup
```bash
cd extension
npm install
npm run build
```

### Backend Setup
```bash
cd backend
./setup.sh        # macOS/Linux
# or
setup.bat         # Windows
```

## Troubleshooting

### nvm command not found

1. Check if nvm is installed:
   ```bash
   ls -la ~/.nvm
   ```

2. Add to your shell config (`~/.zshrc` or `~/.bash_profile`):
   ```bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
   ```

3. Reload shell:
   ```bash
   source ~/.zshrc
   ```

### pyenv command not found

1. Check if pyenv is installed:
   ```bash
   ls -la ~/.pyenv
   ```

2. Add to your shell config:
   ```bash
   export PYENV_ROOT="$HOME/.pyenv"
   [[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
   eval "$(pyenv init -)"
   ```

3. Reload shell:
   ```bash
   source ~/.zshrc
   ```

### SSL Certificate Errors

If you encounter SSL certificate errors when installing nvm or pyenv:

**For nvm:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash --insecure
```

**For pyenv:**
```bash
curl -k https://pyenv.run | bash
```

Or install via Homebrew (macOS):
```bash
brew install nvm
brew install pyenv
```

