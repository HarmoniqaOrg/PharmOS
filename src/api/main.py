from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from datetime import datetime
import os
import sys
from dotenv import load_dotenv

# Add ML module to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../ml'))
from services.ml_service import ml_service

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PharmOS ML Service",
    description="Machine Learning and AI services for pharmaceutical research",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class MoleculeRequest(BaseModel):
    smiles: str
    properties: Optional[List[str]] = []

class MoleculeResponse(BaseModel):
    smiles: str
    molecular_weight: Optional[float] = None
    logp: Optional[float] = None
    properties: Dict[str, Any] = {}

class ResearchQuery(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = {}
    limit: int = 10

class PredictionRequest(BaseModel):
    molecule: str
    target: str
    model_type: str = "default"

class SafetyAnalysisRequest(BaseModel):
    compound: str
    dose: Optional[float] = None
    duration: Optional[int] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "PharmOS ML Service",
        "version": "0.1.0"
    }

# ML Model endpoints
@app.post("/api/v1/ml/predict", response_model=Dict[str, Any])
async def predict(request: PredictionRequest):
    """
    Make predictions using trained ML models
    """
    logger.info(f"Prediction request for molecule: {request.molecule}")
    
    if request.model_type == "activity":
        result = ml_service.predict_activity(request.molecule, request.target)
    else:
        result = ml_service.predict_properties(request.molecule)
    
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error', 'Prediction failed'))
    
    return {
        "molecule": request.molecule,
        "target": request.target,
        "prediction": result,
        "model_version": "0.1.0"
    }

@app.post("/api/v1/ml/molecule/properties", response_model=MoleculeResponse)
async def calculate_molecule_properties(request: MoleculeRequest):
    """
    Calculate molecular properties from SMILES string
    """
    logger.info(f"Property calculation for SMILES: {request.smiles}")
    
    result = ml_service.predict_properties(request.smiles)
    
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error', 'Property calculation failed'))
    
    predictions = result.get('predictions', {})
    return MoleculeResponse(
        smiles=request.smiles,
        molecular_weight=predictions.get('molecular_weight'),
        logp=predictions.get('logP'),
        properties=predictions
    )

@app.post("/api/v1/ml/similarity")
async def calculate_similarity(reference: str, candidates: List[str], method: str = "tanimoto"):
    """
    Calculate molecular similarity between compounds
    """
    logger.info(f"Similarity calculation: {len(candidates)} candidates")
    
    similarities = []
    for candidate in candidates:
        result = ml_service.calculate_similarity(reference, candidate)
        if result.get('success'):
            similarities.append({
                "smiles": candidate,
                "similarity": result['similarity']
            })
    
    return {
        "reference": reference,
        "method": "jaccard",  # Using simple method for now
        "similarities": sorted(similarities, key=lambda x: x['similarity'], reverse=True)
    }

@app.post("/api/v1/ml/generate")
async def generate_molecules(scaffold: Optional[str] = None, properties: Optional[Dict[str, float]] = None):
    """
    Generate novel molecules based on constraints
    """
    logger.info("Molecule generation request")
    
    if not scaffold:
        # Use a default scaffold if none provided
        scaffold = "CC(C)Cc1ccc(cc1)C(C)C(=O)O"  # Ibuprofen as example
    
    result = ml_service.generate_analogs(scaffold, n_analogs=5)
    
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error', 'Generation failed'))
    
    return {
        "generated_molecules": result['analogs'],
        "scaffold": scaffold,
        "properties": properties,
        "count": result['count']
    }

# Research AI endpoints
@app.post("/api/v1/ai/research/analyze")
async def analyze_research(query: ResearchQuery):
    """
    Analyze research literature using AI
    """
    logger.info(f"Research analysis: {query.query}")
    
    # TODO: Implement research analysis
    return {
        "query": query.query,
        "analysis": {
            "summary": "",
            "key_findings": [],
            "citations": []
        },
        "message": "Research analysis - implementation pending"
    }

@app.post("/api/v1/ai/research/extract")
async def extract_entities(text: str, entity_types: List[str] = ["drug", "disease", "gene"]):
    """
    Extract biomedical entities from text
    """
    logger.info(f"Entity extraction from text (length: {len(text)})")
    
    # TODO: Implement entity extraction
    return {
        "entities": {},
        "entity_types": entity_types,
        "message": "Entity extraction - implementation pending"
    }

# Safety AI endpoints
@app.post("/api/v1/ai/safety/predict")
async def predict_safety(request: SafetyAnalysisRequest):
    """
    Predict safety profile of compounds
    """
    logger.info(f"Safety prediction for: {request.compound}")
    
    # Get ADMET predictions which include toxicity
    result = ml_service.predict_admet(request.compound)
    
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error', 'Safety prediction failed'))
    
    toxicity = result['admet']['toxicity']
    
    # Calculate overall risk
    risk_scores = {'low': 0, 'medium': 1, 'high': 2}
    avg_risk = sum(risk_scores.get(v, 0) for v in toxicity.values()) / len(toxicity)
    
    if avg_risk < 0.5:
        risk_category = "low"
    elif avg_risk < 1.5:
        risk_category = "medium"
    else:
        risk_category = "high"
    
    return {
        "compound": request.compound,
        "safety_profile": {
            "toxicity_score": round(avg_risk / 2, 2),  # Normalize to 0-1
            "toxicity_details": toxicity,
            "risk_category": risk_category,
            "confidence": result['confidence']
        }
    }

@app.post("/api/v1/ai/safety/interactions")
async def predict_interactions(drugs: List[str]):
    """
    Predict drug-drug interactions
    """
    logger.info(f"Interaction prediction for {len(drugs)} drugs")
    
    # TODO: Implement interaction prediction
    return {
        "drugs": drugs,
        "interactions": [],
        "severity_matrix": {},
        "message": "Interaction prediction - implementation pending"
    }

# Agent endpoints
@app.post("/agent/research")
async def research_agent(task: Dict[str, Any]):
    """
    Research agent endpoint for literature analysis
    """
    logger.info("Research agent task received")
    
    # TODO: Implement research agent
    return {
        "task_id": f"TASK-{datetime.utcnow().timestamp()}",
        "status": "pending",
        "message": "Research agent - implementation pending"
    }

@app.post("/agent/molecule")
async def molecule_agent(task: Dict[str, Any]):
    """
    Molecule design agent endpoint
    """
    logger.info("Molecule agent task received")
    
    # TODO: Implement molecule agent
    return {
        "task_id": f"TASK-{datetime.utcnow().timestamp()}",
        "status": "pending",
        "message": "Molecule agent - implementation pending"
    }

@app.post("/agent/clinical")
async def clinical_agent(task: Dict[str, Any]):
    """
    Clinical trials agent endpoint
    """
    logger.info("Clinical agent task received")
    
    # TODO: Implement clinical agent
    return {
        "task_id": f"TASK-{datetime.utcnow().timestamp()}",
        "status": "pending",
        "message": "Clinical agent - implementation pending"
    }

@app.post("/agent/safety")
async def safety_agent(task: Dict[str, Any]):
    """
    Safety monitoring agent endpoint
    """
    logger.info("Safety agent task received")
    
    # TODO: Implement safety agent
    return {
        "task_id": f"TASK-{datetime.utcnow().timestamp()}",
        "status": "pending",
        "message": "Safety agent - implementation pending"
    }

# Model management endpoints
@app.get("/api/v1/models")
async def list_models():
    """
    List available ML models
    """
    result = ml_service.get_model_info()
    
    if not result.get('success'):
        raise HTTPException(status_code=500, detail="Failed to retrieve models")
    
    return {
        "models": result['models']
    }

@app.post("/api/v1/models/train")
async def train_model(model_name: str, dataset: str, hyperparameters: Optional[Dict[str, Any]] = None):
    """
    Trigger model training
    """
    logger.info(f"Training request for model: {model_name}")
    
    # TODO: Implement model training pipeline
    return {
        "job_id": f"JOB-{datetime.utcnow().timestamp()}",
        "model_name": model_name,
        "status": "queued",
        "message": "Model training - implementation pending"
    }

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("NODE_ENV") == "development" else False,
        log_level="info"
    )