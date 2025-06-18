"""
Enhanced ML Service for PharmOS platform
Integrates all advanced ML capabilities: enhanced predictors, QSAR, docking, ensembles, and versioning
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, Any, List, Optional, Union
import numpy as np
from datetime import datetime
import logging

# Import all ML components
try:
    from models.molecular_descriptors import molecular_descriptors, morgan_fingerprints
    from models.advanced_predictor import advanced_predictor
    from models.qsar_models import qsar_modeling, QSARModel
    from models.docking_engine import docking_engine
    from models.ensemble_models import ensemble_manager
    from models.versioning import model_registry
except ImportError as e:
    logging.warning(f"Import error in enhanced ML service: {e}")
    # Create mock objects as fallbacks
    class MockComponent:
        def __getattr__(self, name):
            def mock_method(*args, **kwargs):
                return {'success': False, 'error': 'Component not available'}
            return mock_method
    
    molecular_descriptors = MockComponent()
    morgan_fingerprints = MockComponent()
    advanced_predictor = MockComponent()
    qsar_modeling = MockComponent()
    docking_engine = MockComponent()
    ensemble_manager = MockComponent()
    model_registry = MockComponent()

class EnhancedMLService:
    """Enhanced ML service integrating all ML capabilities"""
    
    def __init__(self):
        self.service_version = "2.0.0"
        self.capabilities = [
            'enhanced_molecular_descriptors',
            'advanced_property_prediction',
            'qsar_modeling',
            'molecular_docking',
            'virtual_screening',
            'ensemble_predictions',
            'model_versioning',
            'uncertainty_quantification',
            'pharmacophore_analysis'
        ]
        
        # Performance tracking
        self.prediction_count = 0
        self.service_metrics = {
            'total_predictions': 0,
            'successful_predictions': 0,
            'average_response_time': 0.0,
            'error_rate': 0.0
        }
        
        # Initialize service
        self._initialize_default_models()
    
    def _initialize_default_models(self):
        """Initialize default models and configurations"""
        try:
            # Register default models in versioning system
            model_registry.register_model('advanced_predictor', 'hybrid', 'Enhanced molecular predictor')
            model_registry.register_model('ensemble_predictor', 'ensemble', 'Ensemble prediction model')
            
            # Create default ensemble
            ensemble_manager.create_multi_predictor_ensemble('default_ensemble', 'molecular_weight')
            
            logging.info("Enhanced ML Service initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize ML service: {e}")
    
    def predict_molecular_properties(self, smiles: str, 
                                   include_uncertainty: bool = True,
                                   use_ensemble: bool = False) -> Dict[str, Any]:
        """Enhanced molecular property prediction with uncertainty quantification"""
        start_time = datetime.now()
        
        try:
            if use_ensemble:
                # Use ensemble prediction
                result = ensemble_manager.predict_with_ensemble(
                    'default_ensemble', smiles, include_uncertainty
                )
                
                if result.get('success'):
                    # Format ensemble results
                    ensemble_result = result['results'][0]
                    
                    prediction_result = {
                        'success': True,
                        'smiles': smiles,
                        'predictions': {
                            'molecular_weight': ensemble_result['ensemble_prediction'],
                            'ensemble_details': ensemble_result
                        },
                        'method': 'ensemble',
                        'uncertainty_included': include_uncertainty,
                        'model_version': self.service_version
                    }
                else:
                    # Fallback to advanced predictor
                    prediction_result = advanced_predictor.predict_properties(smiles)
                    prediction_result['method'] = 'advanced_predictor_fallback'
            else:
                # Use advanced predictor directly
                prediction_result = advanced_predictor.predict_properties(smiles)
                prediction_result['method'] = 'advanced_predictor'
            
            # Add enhanced descriptors
            descriptors = molecular_descriptors.extract_all_descriptors(smiles)
            prediction_result['enhanced_descriptors'] = descriptors
            
            # Add fingerprint if requested
            if include_uncertainty:
                fingerprint = morgan_fingerprints.generate_fingerprint(smiles)
                prediction_result['morgan_fingerprint'] = {
                    'bit_count': int(np.sum(fingerprint)),
                    'total_bits': len(fingerprint)
                }
            
            # Update metrics
            self._update_metrics(start_time, True)
            
            return prediction_result
            
        except Exception as e:
            self._update_metrics(start_time, False)
            return {
                'success': False,
                'error': str(e),
                'smiles': smiles,
                'model_version': self.service_version
            }
    
    def predict_biological_activity(self, smiles: str, target: str,
                                   include_docking: bool = False,
                                   binding_site: Optional[str] = None) -> Dict[str, Any]:
        """Enhanced biological activity prediction with optional docking"""
        start_time = datetime.now()
        
        try:
            # Get basic activity prediction
            activity_result = advanced_predictor.predict_activity(smiles, target, binding_site)
            
            if include_docking and target in ['EGFR_kinase', 'DRD2_gpcr', 'COX2_enzyme']:
                # Add docking prediction
                docking_result = docking_engine.dock_ligand(smiles, target)
                
                if docking_result.get('success'):
                    activity_result['docking_prediction'] = docking_result['binding_prediction']
                    activity_result['best_pose'] = docking_result['best_pose']
                    activity_result['ligand_efficiency'] = docking_result['ligand_efficiency']
                    activity_result['drug_likeness'] = docking_result['drug_likeness']
                    activity_result['method'] = 'activity_with_docking'
                else:
                    activity_result['docking_error'] = docking_result.get('error', 'Docking failed')
                    activity_result['method'] = 'activity_only'
            else:
                activity_result['method'] = 'activity_prediction'
            
            self._update_metrics(start_time, True)
            return activity_result
            
        except Exception as e:
            self._update_metrics(start_time, False)
            return {
                'success': False,
                'error': str(e),
                'smiles': smiles,
                'target': target,
                'model_version': self.service_version
            }
    
    def virtual_screening(self, smiles_list: List[str], target: str,
                         score_threshold: float = -5.0,
                         include_properties: bool = True) -> Dict[str, Any]:
        """Perform virtual screening with integrated property prediction"""
        start_time = datetime.now()
        
        try:
            # Perform docking-based screening
            docking_result = docking_engine.virtual_screening(smiles_list, target, score_threshold)
            
            if not docking_result.get('success'):
                return docking_result
            
            # Enhance results with property predictions
            enhanced_hits = []
            
            for hit in docking_result.get('top_hits', []):
                smiles = hit['smiles']
                
                # Add property predictions
                if include_properties:
                    prop_result = self.predict_molecular_properties(smiles, include_uncertainty=False)
                    if prop_result.get('success'):
                        hit['molecular_properties'] = prop_result['predictions']
                        hit['enhanced_descriptors'] = prop_result.get('enhanced_descriptors', {})
                
                enhanced_hits.append(hit)
            
            # Sort by combined score (docking + properties)
            for hit in enhanced_hits:
                if 'molecular_properties' in hit:
                    drug_likeness = hit['molecular_properties'].get('drug_likeness_score', 0.5)
                    binding_score = abs(hit['binding_affinity'])
                    hit['combined_score'] = binding_score * drug_likeness
                else:
                    hit['combined_score'] = abs(hit['binding_affinity'])
            
            enhanced_hits.sort(key=lambda x: x['combined_score'], reverse=True)
            
            self._update_metrics(start_time, True)
            
            return {
                'success': True,
                'target': target,
                'screening_results': docking_result,
                'enhanced_hits': enhanced_hits,
                'total_screened': len(smiles_list),
                'method': 'virtual_screening_with_properties'
            }
            
        except Exception as e:
            self._update_metrics(start_time, False)
            return {
                'success': False,
                'error': str(e),
                'target': target,
                'model_version': self.service_version
            }
    
    def train_qsar_model(self, smiles_list: List[str], target_values: List[float],
                        property_name: str, model_type: str = 'random_forest') -> Dict[str, Any]:
        """Train a new QSAR model and register it in versioning system"""
        try:
            # Train QSAR model
            qsar_result = qsar_modeling.train_property_model(
                smiles_list, target_values, property_name, model_type
            )
            
            if not qsar_result.get('success'):
                return qsar_result
            
            # Register in versioning system
            model_id = qsar_result['model_id']
            version = "1.0.0"
            
            # Get the trained model
            if model_id in qsar_modeling.models:
                trained_model = qsar_modeling.models[model_id]
                
                # Register and version the model
                model_registry.register_model(model_id, 'qsar', f'QSAR model for {property_name}')
                
                version_result = model_registry.create_version(
                    model_id, version, trained_model,
                    training_data=smiles_list,
                    performance_metrics=qsar_result.get('metrics', {}),
                    metadata={
                        'property_name': property_name,
                        'model_type': model_type,
                        'training_samples': len(smiles_list)
                    }
                )
                
                qsar_result['versioning'] = version_result
            
            return qsar_result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'model_version': self.service_version
            }
    
    def create_ensemble_model(self, ensemble_id: str, model_ids: List[str],
                            target_property: str, ensemble_method: str = 'weighted_average') -> Dict[str, Any]:
        """Create a new ensemble model from existing models"""
        try:
            # Create consensus ensemble
            ensemble_result = ensemble_manager.create_consensus_ensemble(
                ensemble_id, model_ids, target_property
            )
            
            if ensemble_result.get('success'):
                # Register ensemble in versioning system
                model_registry.register_model(ensemble_id, 'ensemble', f'Ensemble for {target_property}')
                
                # Get ensemble instance for versioning
                if ensemble_id in ensemble_manager.ensembles:
                    ensemble_instance = ensemble_manager.ensembles[ensemble_id]
                    
                    version_result = model_registry.create_version(
                        ensemble_id, "1.0.0", ensemble_instance,
                        metadata={
                            'ensemble_method': ensemble_method,
                            'base_models': model_ids,
                            'target_property': target_property
                        }
                    )
                    
                    ensemble_result['versioning'] = version_result
            
            return ensemble_result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'model_version': self.service_version
            }
    
    def predict_with_versioned_model(self, model_id: str, smiles: str,
                                   version: Optional[str] = None) -> Dict[str, Any]:
        """Make prediction using a specific versioned model"""
        try:
            # Load model from version registry
            load_result = model_registry.load_model(model_id, version)
            
            if not load_result.get('success'):
                return load_result
            
            model_instance = load_result['model_instance']
            version_info = load_result['version_info']
            
            # Make prediction based on model type
            if hasattr(model_instance, 'predict_properties'):
                # Advanced predictor
                result = model_instance.predict_properties(smiles)
            elif hasattr(model_instance, 'predict'):
                # QSAR or ensemble model
                if isinstance(model_instance, QSARModel):
                    result = model_instance.predict([smiles])
                else:
                    # Ensemble model
                    result = model_instance.predict([smiles])
            else:
                return {
                    'success': False,
                    'error': f'Unknown model type for {model_id}'
                }
            
            # Add version information
            result['model_version_info'] = version_info
            result['loaded_version'] = load_result['version']
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'model_id': model_id,
                'model_version': self.service_version
            }
    
    def deploy_model(self, model_id: str, version: str,
                    deployment_name: str = 'production') -> Dict[str, Any]:
        """Deploy a model version to production"""
        try:
            return model_registry.deploy_version(model_id, version, deployment_name)
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'model_version': self.service_version
            }
    
    def rollback_model(self, deployment_name: str = 'production') -> Dict[str, Any]:
        """Rollback to previous model deployment"""
        try:
            return model_registry.rollback_deployment(deployment_name)
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'model_version': self.service_version
            }
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get comprehensive service status and capabilities"""
        try:
            # Get model registry status
            models_info = model_registry.list_versions()
            
            # Get ensemble status
            ensembles_info = ensemble_manager.get_ensemble_info()
            
            # Get QSAR status
            qsar_info = qsar_modeling.get_model_info()
            
            # Get docking targets
            docking_info = docking_engine.get_target_info()
            
            return {
                'success': True,
                'service_version': self.service_version,
                'capabilities': self.capabilities,
                'service_metrics': self.service_metrics,
                'models_registry': {
                    'total_models': models_info.get('total_versions', 0),
                    'latest_models': models_info.get('versions', [])[:5]  # Top 5 recent
                },
                'ensembles': {
                    'total_ensembles': ensembles_info.get('total_ensembles', 0)
                },
                'qsar_models': {
                    'total_qsar_models': len(qsar_info.get('models', {}))
                },
                'docking_targets': docking_info.get('targets', {})
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'service_version': self.service_version
            }
    
    def compare_model_predictions(self, smiles: str, model_ids: List[str],
                                target_property: str = 'molecular_weight') -> Dict[str, Any]:
        """Compare predictions from multiple models"""
        try:
            predictions = {}
            
            for model_id in model_ids:
                result = self.predict_with_versioned_model(model_id, smiles)
                if result.get('success'):
                    # Extract relevant prediction
                    if 'predictions' in result:
                        pred_value = result['predictions'].get(target_property, 0.0)
                    elif 'results' in result and result['results']:
                        pred_value = result['results'][0].get('prediction', 0.0)
                    else:
                        pred_value = 0.0
                    
                    predictions[model_id] = {
                        'prediction': pred_value,
                        'model_info': result.get('model_version_info', {})
                    }
                else:
                    predictions[model_id] = {
                        'error': result.get('error', 'Unknown error')
                    }
            
            # Calculate statistics
            valid_predictions = [p['prediction'] for p in predictions.values() if 'prediction' in p]
            
            if valid_predictions:
                stats = {
                    'mean': np.mean(valid_predictions),
                    'std': np.std(valid_predictions),
                    'min': np.min(valid_predictions),
                    'max': np.max(valid_predictions),
                    'range': np.max(valid_predictions) - np.min(valid_predictions)
                }
            else:
                stats = {}
            
            return {
                'success': True,
                'smiles': smiles,
                'target_property': target_property,
                'model_predictions': predictions,
                'statistics': stats,
                'model_count': len(model_ids),
                'successful_predictions': len(valid_predictions)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'smiles': smiles,
                'model_version': self.service_version
            }
    
    def _update_metrics(self, start_time: datetime, success: bool):
        """Update service performance metrics"""
        response_time = (datetime.now() - start_time).total_seconds() * 1000  # ms
        
        self.service_metrics['total_predictions'] += 1
        if success:
            self.service_metrics['successful_predictions'] += 1
        
        # Update running average of response time
        total = self.service_metrics['total_predictions']
        current_avg = self.service_metrics['average_response_time']
        self.service_metrics['average_response_time'] = (current_avg * (total - 1) + response_time) / total
        
        # Update error rate
        self.service_metrics['error_rate'] = 1.0 - (self.service_metrics['successful_predictions'] / total)


# Create global enhanced service instance
enhanced_ml_service = EnhancedMLService()