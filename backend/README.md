# Website Time Tracker Backend

Simple FastAPI server to receive notifications when website time limits are reached.

## Setup

### Prerequisites

Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# or: brew install uv
```

Install Python 3.10+ (if needed):
```bash
uv python install 3.14
```

### Setup

```bash
cd backend
./setup.sh
```

## Running the Server

```bash
cd backend
./run.sh
```

Or manually:
```bash
uv run python -m website_tracker_backend
```

Server runs on `http://localhost:8000`

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

