"""
Simple ML predictor for molecular properties
Uses basic feature engineering and simple models for demo purposes
"""

import numpy as np
from typing import Dict, Any, List
import random
import hashlib

class SimpleMolecularPredictor:
    """Simple predictor that works without external dependencies"""
    
    def __init__(self):
        self.model_version = "0.1.0"
        self.feature_extractors = {
            'atom_count': self._count_atoms,
            'ring_count': self._count_rings,
            'double_bonds': self._count_double_bonds,
            'heteroatoms': self._count_heteroatoms,
            'complexity': self._calculate_complexity
        }
    
    def _count_atoms(self, smiles: str) -> int:
        """Count heavy atoms in SMILES"""
        return len([c for c in smiles if c.isalpha() and c.upper() in 'CNOSPFCLBRI'])
    
    def _count_rings(self, smiles: str) -> int:
        """Estimate ring count from digit pairs"""
        digits = [c for c in smiles if c.isdigit()]
        return len(set(digits))
    
    def _count_double_bonds(self, smiles: str) -> int:
        """Count double bonds"""
        return smiles.count('=')
    
    def _count_heteroatoms(self, smiles: str) -> int:
        """Count non-carbon atoms"""
        return len([c for c in smiles.upper() if c in 'NOSPFCLBRI'])
    
    def _calculate_complexity(self, smiles: str) -> float:
        """Calculate molecular complexity score"""
        features = {
            'atoms': self._count_atoms(smiles),
            'rings': self._count_rings(smiles),
            'bonds': self._count_double_bonds(smiles),
            'hetero': self._count_heteroatoms(smiles)
        }
        return sum(features.values()) * 1.5
    
    def extract_features(self, smiles: str) -> Dict[str, float]:
        """Extract features from SMILES string"""
        features = {}
        for name, extractor in self.feature_extractors.items():
            features[name] = extractor(smiles)
        return features
    
    def predict_properties(self, smiles: str) -> Dict[str, Any]:
        """Predict molecular properties"""
        features = self.extract_features(smiles)
        
        # Generate consistent pseudo-random values based on SMILES
        seed = int(hashlib.md5(smiles.encode()).hexdigest()[:8], 16)
        np.random.seed(seed)
        
        # Simple property predictions based on features
        predictions = {
            'molecular_weight': features['atom_count'] * 12.5 + features['heteroatoms'] * 3 + np.random.normal(0, 10),
            'logP': np.clip(features['ring_count'] * 0.5 - features['heteroatoms'] * 0.2 + np.random.normal(0, 0.5), -3, 7),
            'solubility_log_mol_l': np.clip(-features['complexity'] * 0.1 + np.random.normal(-2, 0.5), -10, 2),
            'bioavailability_score': np.clip(0.8 - features['complexity'] * 0.01 + np.random.normal(0, 0.1), 0, 1),
            'synthetic_accessibility': np.clip(10 - features['complexity'] * 0.05, 1, 10),
            'drug_likeness': self._calculate_drug_likeness(features),
            'toxicity_risk': self._calculate_toxicity_risk(features)
        }
        
        return {
            'predictions': predictions,
            'features': features,
            'confidence': np.clip(0.7 + np.random.normal(0, 0.1), 0.5, 0.95),
            'model_version': self.model_version
        }
    
    def _calculate_drug_likeness(self, features: Dict[str, float]) -> float:
        """Calculate Lipinski's Rule of Five compliance"""
        score = 1.0
        
        # Approximate checks based on features
        if features['atom_count'] > 35:  # MW > ~500
            score -= 0.25
        if features['heteroatoms'] < 5:  # Low H-bond acceptors/donors
            score -= 0.25
        if features['complexity'] > 100:
            score -= 0.25
            
        return np.clip(score + np.random.normal(0, 0.05), 0, 1)
    
    def _calculate_toxicity_risk(self, features: Dict[str, float]) -> Dict[str, str]:
        """Predict toxicity risks"""
        complexity = features['complexity']
        
        # Simple risk assessment based on complexity
        risks = {}
        risk_categories = ['mutagenicity', 'tumorigenicity', 'irritant', 'reproductive']
        
        for category in risk_categories:
            if complexity < 30:
                risk = 'low'
            elif complexity < 60:
                risk = 'medium' if np.random.random() > 0.5 else 'low'
            else:
                risk = 'high' if np.random.random() > 0.7 else 'medium'
            risks[category] = risk
            
        return risks
    
    def predict_activity(self, smiles: str, target: str) -> Dict[str, Any]:
        """Predict activity against a specific target"""
        features = self.extract_features(smiles)
        
        # Generate consistent activity based on target and SMILES
        seed = int(hashlib.md5(f"{smiles}{target}".encode()).hexdigest()[:8], 16)
        np.random.seed(seed)
        
        # Simple activity prediction
        base_activity = 6.0 + np.random.normal(0, 1.5)
        activity_modifier = features['complexity'] * 0.01
        
        pIC50 = np.clip(base_activity - activity_modifier, 3, 9)
        
        return {
            'target': target,
            'pIC50': round(pIC50, 2),
            'IC50_nM': round(10 ** (9 - pIC50), 2),
            'activity_class': 'active' if pIC50 > 6 else 'moderately_active' if pIC50 > 5 else 'inactive',
            'confidence': np.clip(0.65 + np.random.normal(0, 0.1), 0.4, 0.9)
        }
    
    def generate_analogs(self, smiles: str, n_analogs: int = 5) -> List[Dict[str, Any]]:
        """Generate similar molecular structures"""
        analogs = []
        
        # Simple modifications to generate analogs
        modifications = [
            ('F', 'Cl'),
            ('Cl', 'Br'),
            ('O', 'S'),
            ('N', 'O'),
            ('C', 'N'),
            ('=', ''),
            ('C', 'CC'),
            (')', ')C')
        ]
        
        for i in range(n_analogs):
            analog_smiles = smiles
            n_mods = np.random.randint(1, 3)
            
            for _ in range(n_mods):
                if np.random.random() > 0.5 and modifications:
                    old, new = random.choice(modifications)
                    if old in analog_smiles:
                        analog_smiles = analog_smiles.replace(old, new, 1)
            
            if analog_smiles != smiles:
                props = self.predict_properties(analog_smiles)
                analogs.append({
                    'smiles': analog_smiles,
                    'similarity': np.clip(0.7 + np.random.normal(0, 0.1), 0.5, 0.95),
                    'properties': props['predictions']
                })
        
        return analogs

# Create global instance
predictor = SimpleMolecularPredictor()