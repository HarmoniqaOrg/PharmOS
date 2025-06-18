#!/usr/bin/env python3
"""
Generate mock data for PharmOS platform
Creates realistic fake data for development and testing
"""

import json
import random
import string
from datetime import datetime, timedelta
import os
from pathlib import Path

# Mock molecule SMILES strings
MOCK_MOLECULES = [
    {"smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O", "name": "Ibuprofen"},
    {"smiles": "CC(=O)Oc1ccccc1C(=O)O", "name": "Aspirin"},
    {"smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", "name": "Caffeine"},
    {"smiles": "CC1=C(C(=O)N(N1C)C2=CC=CC=C2)N(C)C", "name": "Antipyrine"},
    {"smiles": "CC(C)NCC(COC1=CC=CC2=C1CCCC2=O)O", "name": "Propranolol"},
    {"smiles": "CN1CCC[C@H]1C2=CN=CC=C2", "name": "Nicotine"},
    {"smiles": "CC1(C)S[C@@H]2[C@H](NC(=O)[C@H](N)C3=CC=CC=C3)C(=O)N2[C@H]1C(=O)O", "name": "Ampicillin"},
    {"smiles": "CC(C)(C)NCC(COC1=NSN=C1N2CCOCC2)O", "name": "Timolol"},
    {"smiles": "CCN(CC)C(=O)C1=CC=C(C=C1)N", "name": "Procainamide"},
    {"smiles": "CN1CCN(CC1)C2=NC3=C(C=CC(=C3)Cl)NC4=C2C=CC(=C4)Cl", "name": "Clozapine"}
]

# Mock research papers
MOCK_PAPERS = [
    {
        "title": "Novel Cardiovascular Drug Targets Identified Through AI-Driven Analysis",
        "abstract": "Using advanced machine learning algorithms, we identified several promising drug targets for cardiovascular disease treatment...",
        "authors": ["Smith, J.", "Johnson, M.", "Chen, L."],
        "journal": "Nature Medicine",
        "year": 2024,
        "pmid": "38456789"
    },
    {
        "title": "Machine Learning Approaches in Drug Discovery: A Comprehensive Review",
        "abstract": "This review examines the current state of machine learning applications in pharmaceutical research...",
        "authors": ["Williams, R.", "Davis, K.", "Thompson, A."],
        "journal": "Journal of Medicinal Chemistry",
        "year": 2024,
        "pmid": "38456790"
    },
    {
        "title": "Safety Profile of Novel Anti-Hypertensive Compounds",
        "abstract": "We evaluated the safety and efficacy of new anti-hypertensive drugs in phase 2 clinical trials...",
        "authors": ["Garcia, M.", "Lee, S.", "Patel, N."],
        "journal": "Circulation",
        "year": 2023,
        "pmid": "38456791"
    },
    {
        "title": "Artificial Intelligence in Clinical Trial Design and Patient Recruitment",
        "abstract": "AI-powered tools significantly improved patient matching and trial design efficiency...",
        "authors": ["Brown, D.", "Miller, E.", "Wilson, T."],
        "journal": "Clinical Trials",
        "year": 2024,
        "pmid": "38456792"
    },
    {
        "title": "Biomarkers for Early Detection of Cardiotoxicity in Cancer Therapy",
        "abstract": "Novel biomarkers show promise for early detection of cardiac complications in oncology patients...",
        "authors": ["Anderson, P.", "Taylor, R.", "Martin, S."],
        "journal": "JACC: CardioOncology",
        "year": 2023,
        "pmid": "38456793"
    }
]

# Mock clinical trials
MOCK_TRIALS = [
    {
        "trial_id": "NCT05123456",
        "title": "A Phase 3 Study of PharmOS-001 in Patients with Heart Failure",
        "phase": "Phase 3",
        "status": "Recruiting",
        "condition": "Heart Failure",
        "intervention": "PharmOS-001 vs Placebo",
        "sponsor": "PharmOS Therapeutics",
        "enrollment": 500,
        "start_date": "2024-01-15",
        "completion_date": "2025-12-31"
    },
    {
        "trial_id": "NCT05123457",
        "title": "Safety and Efficacy of AI-Designed Molecule AIM-247 in Hypertension",
        "phase": "Phase 2",
        "status": "Active",
        "condition": "Hypertension",
        "intervention": "AIM-247",
        "sponsor": "CardioHealth Inc",
        "enrollment": 200,
        "start_date": "2023-06-01",
        "completion_date": "2024-11-30"
    },
    {
        "trial_id": "NCT05123458",
        "title": "Biomarker-Guided Therapy in Acute Coronary Syndrome",
        "phase": "Phase 2",
        "status": "Enrolling",
        "condition": "Acute Coronary Syndrome",
        "intervention": "Personalized therapy based on biomarkers",
        "sponsor": "University Medical Center",
        "enrollment": 150,
        "start_date": "2023-09-15",
        "completion_date": "2025-03-31"
    }
]

# Mock adverse events
ADVERSE_EVENTS = [
    "Headache", "Nausea", "Dizziness", "Fatigue", "Insomnia",
    "Dry mouth", "Constipation", "Diarrhea", "Rash", "Pruritus",
    "Hypertension", "Hypotension", "Tachycardia", "Bradycardia",
    "Elevated liver enzymes", "Muscle pain", "Joint pain"
]

def generate_random_id(prefix="", length=8):
    """Generate a random ID"""
    return prefix + ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def generate_mock_predictions():
    """Generate mock ML predictions"""
    predictions = []
    for mol in MOCK_MOLECULES[:5]:
        predictions.append({
            "molecule_id": generate_random_id("MOL-"),
            "smiles": mol["smiles"],
            "name": mol["name"],
            "predictions": {
                "toxicity_score": round(random.uniform(0.1, 0.9), 3),
                "bioavailability": round(random.uniform(0.3, 0.95), 3),
                "half_life_hours": round(random.uniform(2, 24), 1),
                "logP": round(random.uniform(-2, 5), 2),
                "solubility_mg_ml": round(random.uniform(0.01, 100), 2),
                "binding_affinity_nm": round(random.uniform(0.1, 1000), 1)
            },
            "confidence": round(random.uniform(0.7, 0.95), 2),
            "timestamp": datetime.now().isoformat()
        })
    return predictions

def generate_safety_events():
    """Generate mock safety events"""
    events = []
    drugs = ["PharmOS-001", "AIM-247", "CardioShield", "NeuroProtect", "MetaboFix"]
    
    for i in range(20):
        event_date = datetime.now() - timedelta(days=random.randint(1, 90))
        events.append({
            "event_id": generate_random_id("EVT-"),
            "drug_name": random.choice(drugs),
            "event_type": random.choice(ADVERSE_EVENTS),
            "severity": random.choice(["Mild", "Moderate", "Severe"]),
            "patient_age": random.randint(25, 75),
            "gender": random.choice(["M", "F"]),
            "outcome": random.choice(["Resolved", "Ongoing", "Resolved with sequelae"]),
            "reported_date": event_date.strftime("%Y-%m-%d"),
            "description": f"Patient experienced {random.choice(ADVERSE_EVENTS).lower()} after {random.randint(1, 30)} days of treatment"
        })
    return events

def generate_research_insights():
    """Generate mock research insights"""
    insights = []
    topics = ["Cardiovascular", "Oncology", "Neurology", "Immunology", "Metabolic"]
    
    for topic in topics:
        insights.append({
            "insight_id": generate_random_id("INS-"),
            "topic": topic,
            "summary": f"Recent advances in {topic} research show promising therapeutic targets",
            "key_findings": [
                f"Discovery of novel {topic.lower()} biomarkers",
                f"AI models predict {random.randint(70, 95)}% success rate",
                f"{random.randint(3, 10)} new drug candidates identified"
            ],
            "papers_analyzed": random.randint(50, 200),
            "confidence_score": round(random.uniform(0.75, 0.95), 2),
            "generated_date": datetime.now().isoformat()
        })
    return insights

def save_mock_data():
    """Save all mock data to files"""
    data_dir = Path("/mnt/d/PharmOS/data/mock")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # Save molecules
    with open(data_dir / "molecules.json", "w") as f:
        json.dump(MOCK_MOLECULES, f, indent=2)
    
    # Save research papers
    with open(data_dir / "research_papers.json", "w") as f:
        json.dump(MOCK_PAPERS, f, indent=2)
    
    # Save clinical trials
    with open(data_dir / "clinical_trials.json", "w") as f:
        json.dump(MOCK_TRIALS, f, indent=2)
    
    # Save ML predictions
    predictions = generate_mock_predictions()
    with open(data_dir / "ml_predictions.json", "w") as f:
        json.dump(predictions, f, indent=2)
    
    # Save safety events
    events = generate_safety_events()
    with open(data_dir / "safety_events.json", "w") as f:
        json.dump(events, f, indent=2)
    
    # Save research insights
    insights = generate_research_insights()
    with open(data_dir / "research_insights.json", "w") as f:
        json.dump(insights, f, indent=2)
    
    print(f"Mock data generated successfully in {data_dir}")
    print(f"- {len(MOCK_MOLECULES)} molecules")
    print(f"- {len(MOCK_PAPERS)} research papers")
    print(f"- {len(MOCK_TRIALS)} clinical trials")
    print(f"- {len(predictions)} ML predictions")
    print(f"- {len(events)} safety events")
    print(f"- {len(insights)} research insights")

if __name__ == "__main__":
    save_mock_data()