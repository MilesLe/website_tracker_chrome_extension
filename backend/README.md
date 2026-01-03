# Website Time Tracker Backend

Simple FastAPI server to receive notifications when website time limits are reached.

## Setup

This project uses a Python virtual environment to keep dependencies isolated. The virtual environment will be created in the `venv/` directory.

### Quick Setup (Recommended)

**macOS/Linux:**
```bash
cd backend
./setup.sh
```

**Windows:**
```cmd
cd backend
setup.bat
```

This will:
1. Create a Python virtual environment (`venv/`)
2. Activate the virtual environment
3. Upgrade pip to the latest version
4. Install all required dependencies

### Manual Setup

If you prefer to set up manually:

1. **Create virtual environment:**
   ```bash
   cd backend
   python3 -m venv venv
   ```

2. **Activate virtual environment:**
   
   **macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```
   
   **Windows:**
   ```cmd
   venv\Scripts\activate.bat
   ```

3. **Upgrade pip:**
   ```bash
   pip install --upgrade pip
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

### Using the Run Script (Recommended)

**macOS/Linux:**
```bash
cd backend
./run.sh
```

**Windows:**
```cmd
cd backend
run.bat
```

The run script automatically activates the virtual environment and starts the server.

### Manual Run

1. **Activate virtual environment** (if not already activated):
   
   **macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```
   
   **Windows:**
   ```cmd
   venv\Scripts\activate.bat
   ```

2. **Run the server:**
   ```bash
   python main.py
   ```

   Or using uvicorn directly:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

The server will start on `http://localhost:8000`

### Deactivating Virtual Environment

When you're done, deactivate the virtual environment:
```bash
deactivate
```

## API Endpoints

### POST /limit-reached

Receives notifications when a website time limit is reached.

**Request Body:**
```json
{
  "domain": "youtube.com",
  "minutes": 60,
  "timestamp": "2023-10-27T12:00:00"
}
```

**Response:**
```json
{
  "status": "received",
  "domain": "youtube.com",
  "minutes": 60,
  "timestamp": "2023-10-27T12:00:00"
}
```

## CORS

The API is configured to accept requests from Chrome extensions. In production, you may want to restrict the `allow_origins` to specific extension IDs.

