"""
Entry point for running the package as a module: python -m website_tracker_backend
"""
from website_tracker_backend import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
