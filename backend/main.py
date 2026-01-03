from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Website Time Tracker API")

# CORS configuration to allow Chrome extension requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LimitReachedPayload(BaseModel):
    domain: str
    minutes: int
    timestamp: str


@app.get("/")
async def root():
    return {"status": "Website Time Tracker API is running"}


@app.post("/limit-reached")
async def limit_reached(payload: LimitReachedPayload):
    """
    Receive notification when a website time limit is reached.
    
    Args:
        payload: Contains domain, minutes, and timestamp
        
    Returns:
        Confirmation response
    """
    try:
        logger.info(
            f"Limit reached for {payload.domain}: "
            f"{payload.minutes} minutes at {payload.timestamp}"
        )
        
        # Here you could add additional logic:
        # - Store in database
        # - Send email notification
        # - Trigger other actions
        
        return {
            "status": "received",
            "domain": payload.domain,
            "minutes": payload.minutes,
            "timestamp": payload.timestamp
        }
    except Exception as e:
        logger.error(f"Error processing limit-reached notification: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

