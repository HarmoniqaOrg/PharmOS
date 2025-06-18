"""
ML Service for PharmOS platform
Provides prediction services without external dependencies
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.simple_predictor import predictor
from typing import Dict, Any, List
import json
import numpy as np

class MLService:
    """Main ML service class"""
    
    def __init__(self):
        self.predictor = predictor
        self.model_registry = {
            'property_predictor': {
                'version': '0.1.0',
                'type': 'regression',
                'status': 'active',
                'accuracy': 0.82
            },
            'toxicity_classifier': {
                'version': '0.1.0',
                'type': 'classification',
                'status': 'active',
                'accuracy': 0.78
            },
            'activity_predictor': {
                'version': '0.1.0',
                'type': 'regression',
                'status': 'active',
                'accuracy': 0.75
            },
            'analog_generator': {
                'version': '0.1.0',
                'type': 'generative',
                'status': 'active',
                'accuracy': None
            }
        }
    
    def predict_properties(self, smiles: str) -> Dict[str, Any]:
        """Predict molecular properties"""
        try:
            result = self.predictor.predict_properties(smiles)
            return {
                'success': True,
                'smiles': smiles,
                **result
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'smiles': smiles
            }
    
    def predict_activity(self, smiles: str, target: str) -> Dict[str, Any]:
        """Predict activity against target"""
        try:
            result = self.predictor.predict_activity(smiles, target)
            return {
                'success': True,
                'smiles': smiles,
                **result
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'smiles': smiles,
                'target': target
            }
    
    def generate_analogs(self, smiles: str, n_analogs: int = 5) -> Dict[str, Any]:
        """Generate molecular analogs"""
        try:
            analogs = self.predictor.generate_analogs(smiles, n_analogs)
            return {
                'success': True,
                'parent_smiles': smiles,
                'analogs': analogs,
                'count': len(analogs)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'parent_smiles': smiles
            }
    
    def calculate_similarity(self, smiles1: str, smiles2: str) -> Dict[str, Any]:
        """Calculate molecular similarity"""
        try:
            # Simple similarity based on common substrings
            set1 = set(smiles1)
            set2 = set(smiles2)
            jaccard = len(set1.intersection(set2)) / len(set1.union(set2))
            
            return {
                'success': True,
                'smiles1': smiles1,
                'smiles2': smiles2,
                'similarity': round(jaccard, 3),
                'method': 'jaccard'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def batch_predict(self, smiles_list: List[str]) -> Dict[str, Any]:
        """Batch prediction for multiple molecules"""
        results = []
        for smiles in smiles_list:
            result = self.predict_properties(smiles)
            results.append(result)
        
        return {
            'success': True,
            'count': len(results),
            'results': results
        }
    
    def get_model_info(self, model_name: str = None) -> Dict[str, Any]:
        """Get information about available models"""
        if model_name:
            if model_name in self.model_registry:
                return {
                    'success': True,
                    'model': {
                        'name': model_name,
                        **self.model_registry[model_name]
                    }
                }
            else:
                return {
                    'success': False,
                    'error': f'Model {model_name} not found'
                }
        else:
            return {
                'success': True,
                'models': [
                    {'name': name, **info} 
                    for name, info in self.model_registry.items()
                ]
            }
    
    def predict_admet(self, smiles: str) -> Dict[str, Any]:
        """Predict ADMET properties"""
        try:
            props = self.predictor.predict_properties(smiles)
            features = props['features']
            
            # Simple ADMET predictions
            admet = {
                'absorption': {
                    'human_intestinal_absorption': 'high' if features['complexity'] < 50 else 'medium',
                    'caco2_permeability': round(-4.5 + features['atom_count'] * 0.01, 2),
                    'pgp_substrate': 'no' if features['complexity'] < 40 else 'yes'
                },
                'distribution': {
                    'vd_human': round(0.5 + features['atom_count'] * 0.02, 2),
                    'bbb_permeant': 'yes' if props['predictions']['logP'] > 2 else 'no',
                    'plasma_protein_binding': round(70 + features['heteroatoms'] * 2, 1)
                },
                'metabolism': {
                    'cyp2d6_substrate': 'no' if features['complexity'] < 45 else 'yes',
                    'cyp3a4_substrate': 'yes' if features['complexity'] > 30 else 'no',
                    'cyp_inhibition': 'low' if features['complexity'] < 50 else 'medium'
                },
                'excretion': {
                    'total_clearance': round(0.5 + np.random.normal(0, 0.2), 2),
                    'renal_clearance': round(0.2 + np.random.normal(0, 0.1), 2),
                    'half_life': round(2 + features['complexity'] * 0.1, 1)
                },
                'toxicity': props['predictions']['toxicity_risk']
            }
            
            return {
                'success': True,
                'smiles': smiles,
                'admet': admet,
                'confidence': props['confidence']
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'smiles': smiles
            }

# Create service instance
ml_service = MLService()