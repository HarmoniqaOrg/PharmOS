"""
FastAPI ML Service for PharmOS platform
Provides health checks, metrics, and ML prediction endpoints
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from prometheus_client.multiprocess import MultiProcessCollector
from prometheus_client.registry import REGISTRY
import time
import sys
import os
import uvicorn
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import json
import logging
from contextlib import asynccontextmanager

# Add parent directory to path to import ML service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'ml'))

from ml.services.ml_service import ml_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prometheus metrics
request_count = Counter('ml_requests_total', 'Total ML requests', ['endpoint', 'method', 'status'])
request_duration = Histogram('ml_request_duration_seconds', 'ML request duration', ['endpoint'])
prediction_count = Counter('ml_predictions_total', 'Total predictions made', ['prediction_type'])
prediction_duration = Histogram('ml_prediction_duration_seconds', 'Prediction duration', ['prediction_type'])
model_accuracy = Gauge('ml_model_accuracy', 'Model accuracy', ['model_name'])
active_connections = Gauge('ml_active_connections', 'Active connections')

# Initialize model accuracy metrics
for model_name, model_info in ml_service.model_registry.items():
    if model_info.get('accuracy'):
        model_accuracy.labels(model_name=model_name).set(model_info['accuracy'])

# Request/Response models
class SMILESRequest(BaseModel):
    smiles: str
    properties: Optional[List[str]] = None

class ActivityRequest(BaseModel):
    smiles: str
    target: str

class AnalogRequest(BaseModel):
    smiles: str
    n_analogs: int = 5

class SimilarityRequest(BaseModel):
    smiles1: str
    smiles2: str

class BatchRequest(BaseModel):
    smiles_list: List[str]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("ML Service starting up...")
    yield
    # Shutdown
    logger.info("ML Service shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="PharmOS ML Service",
    description="Machine Learning services for pharmaceutical research",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for metrics
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    active_connections.inc()
    start_time = time.time()
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        request_count.labels(
            endpoint=request.url.path,
            method=request.method,
            status=response.status_code
        ).inc()
        
        request_duration.labels(endpoint=request.url.path).observe(duration)
        
        return response
    except Exception as e:
        duration = time.time() - start_time
        request_count.labels(
            endpoint=request.url.path,
            method=request.method,
            status=500
        ).inc()
        request_duration.labels(endpoint=request.url.path).observe(duration)
        raise
    finally:
        active_connections.dec()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "ml-service",
        "timestamp": time.time(),
        "models": list(ml_service.model_registry.keys()),
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# Detailed health check
@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with model status"""
    return {
        "status": "healthy",
        "service": "ml-service",
        "timestamp": time.time(),
        "models": ml_service.model_registry,
        "environment": os.getenv("ENVIRONMENT", "development"),
        "uptime": time.time(),
        "memory_usage": "available"  # Could add actual memory usage
    }

# Metrics endpoint for Prometheus
@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    from starlette.responses import Response
    return Response(generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)

# Root endpoint
@app.get("/")
async def root():
    """API information"""
    return {
        "service": "PharmOS ML Service",
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "metrics": "/metrics",
            "predict_properties": "/predict/properties",
            "predict_activity": "/predict/activity",
            "generate_analogs": "/generate/analogs",
            "calculate_similarity": "/calculate/similarity",
            "batch_predict": "/predict/batch",
            "models": "/models"
        }
    }

# Prediction endpoints
@app.post("/predict/properties")
async def predict_properties(request: SMILESRequest):
    """Predict molecular properties"""
    start_time = time.time()
    try:
        result = ml_service.predict_properties(request.smiles)
        prediction_count.labels(prediction_type="properties").inc()
        prediction_duration.labels(prediction_type="properties").observe(time.time() - start_time)
        return result
    except Exception as e:
        logger.error(f"Error predicting properties: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/activity")
async def predict_activity(request: ActivityRequest):
    """Predict activity against target"""
    start_time = time.time()
    try:
        result = ml_service.predict_activity(request.smiles, request.target)
        prediction_count.labels(prediction_type="activity").inc()
        prediction_duration.labels(prediction_type="activity").observe(time.time() - start_time)
        return result
    except Exception as e:
        logger.error(f"Error predicting activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/admet")
async def predict_admet(request: SMILESRequest):
    """Predict ADMET properties"""
    start_time = time.time()
    try:
        result = ml_service.predict_admet(request.smiles)
        prediction_count.labels(prediction_type="admet").inc()
        prediction_duration.labels(prediction_type="admet").observe(time.time() - start_time)
        return result
    except Exception as e:
        logger.error(f"Error predicting ADMET: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/analogs")
async def generate_analogs(request: AnalogRequest):
    """Generate molecular analogs"""
    start_time = time.time()
    try:
        result = ml_service.generate_analogs(request.smiles, request.n_analogs)
        prediction_count.labels(prediction_type="analogs").inc()
        prediction_duration.labels(prediction_type="analogs").observe(time.time() - start_time)
        return result
    except Exception as e:
        logger.error(f"Error generating analogs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate/similarity")
async def calculate_similarity(request: SimilarityRequest):
    """Calculate molecular similarity"""
    start_time = time.time()
    try:
        result = ml_service.calculate_similarity(request.smiles1, request.smiles2)
        prediction_count.labels(prediction_type="similarity").inc()
        prediction_duration.labels(prediction_type="similarity").observe(time.time() - start_time)
        return result
    except Exception as e:
        logger.error(f"Error calculating similarity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch")
async def batch_predict(request: BatchRequest):
    """Batch prediction for multiple molecules"""
    start_time = time.time()
    try:
        result = ml_service.batch_predict(request.smiles_list)
        prediction_count.labels(prediction_type="batch").inc()
        prediction_duration.labels(prediction_type="batch").observe(time.time() - start_time)
        return result
    except Exception as e:
        logger.error(f"Error in batch prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def get_models(model_name: Optional[str] = None):
    """Get model information"""
    try:
        if model_name is not None:
            result = ml_service.get_model_info(model_name)
        else:
            result = ml_service.get_model_info()
        return result
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/{model_name}")
async def get_model_info(model_name: str):
    """Get specific model information"""
    try:
        result = ml_service.get_model_info(model_name)
        if not result.get('success'):
            raise HTTPException(status_code=404, detail=result.get('error'))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )