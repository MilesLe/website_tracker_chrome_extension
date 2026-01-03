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

### Install Python

**Python 3.10+ is required. Python 3.12 is recommended but 3.10+ works perfectly fine for this project.**

**If you already have Python 3.10+ installed via pyenv, you can use it:**
```bash
cd backend
pyenv local 3.10.15  # or whatever 3.10+ version you have
```

**To install Python 3.12 (optional, for latest features):**

**First, install required dependencies (macOS):**
```bash
brew install gettext
brew link --force gettext
```

**Then install Python:**
```bash
pyenv install 3.12
```

**If you still get build errors, use the helper script:**
```bash
cd backend
./install-python.sh
```

**Or manually set environment variables in the same terminal session:**
```bash
# Make sure these are set BEFORE running pyenv install
export LDFLAGS="-L$(brew --prefix gettext)/lib"
export CPPFLAGS="-I$(brew --prefix gettext)/include"
pyenv install 3.12
```

**Important:** The environment variables must be set in the same terminal session where you run `pyenv install`. If you open a new terminal, you'll need to set them again.

**Set Python version for this project only (recommended):**
```bash
cd backend
pyenv local 3.10.15  # Use your existing Python 3.10.15
# OR
pyenv local 3.12     # If you installed 3.12
```

This creates/updates `.python-version` in the backend directory, so pyenv will automatically use the specified Python version when you're in that directory. You don't need to set it globally.

**Verify installation:**
```bash
python3 --version
```

**Note:** Setting `pyenv global 3.12` is optional. Using `pyenv local` keeps the Python version scoped to this project, which is better for project isolation.

### Using the project's Python version

This project specifies Python 3.12 in `backend/.python-version`. 

**To set it locally for this project (recommended):**
```bash
cd backend
pyenv local 3.12
```

This ensures that whenever you're in the `backend` directory, pyenv will automatically use Python 3.12. The virtual environment will be created with this version, keeping everything isolated to the project.

**You don't need to set it globally** - `pyenv local` is sufficient and keeps your system Python unchanged.

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

### Python build fails with "symbol(s) not found for architecture arm64"

This error usually means missing dependencies. Install them:

```bash
brew install gettext
brew link --force gettext
```

Then set environment variables and retry:
```bash
export LDFLAGS="-L$(brew --prefix gettext)/lib"
export CPPFLAGS="-I$(brew --prefix gettext)/include"
pyenv install 3.12
```

**Alternative: Use Homebrew Python instead**
If pyenv continues to have issues, you can use Homebrew's Python:
```bash
brew install python@3.12
```

Then create a symlink or use the full path:
```bash
# Add to PATH in ~/.zshrc or ~/.bash_profile
export PATH="/opt/homebrew/opt/python@3.12/bin:$PATH"
```

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

