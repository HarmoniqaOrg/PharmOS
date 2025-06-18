"""
Ensemble modeling framework for PharmOS
Combines multiple ML models for improved predictions and uncertainty quantification
Includes voting, stacking, and weighted ensemble methods
"""

import numpy as np
from typing import Dict, List, Any, Tuple, Optional, Union
from sklearn.ensemble import VotingRegressor, VotingClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import cross_val_score, KFold
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score
import sys
import os
from datetime import datetime
import json

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from molecular_descriptors import molecular_descriptors
    from advanced_predictor import advanced_predictor
    from qsar_models import qsar_modeling, QSARModel
    from docking_engine import docking_engine
except ImportError:
    # Fallback if imports fail
    class MockPredictor:
        def predict_properties(self, smiles: str) -> Dict[str, Any]:
            return {'success': True, 'predictions': {'molecular_weight': 300}}
    
    class MockQSAR:
        def predict_with_model(self, model_id: str, smiles: str) -> Dict[str, Any]:
            return {'success': True, 'results': [{'prediction': 0.5}]}
    
    advanced_predictor = MockPredictor()
    qsar_modeling = MockQSAR()

class EnsembleModel:
    """Individual ensemble model combining multiple base models"""
    
    def __init__(self, ensemble_id: str, target_property: str, 
                 ensemble_method: str = 'weighted_average'):
        self.ensemble_id = ensemble_id
        self.target_property = target_property
        self.ensemble_method = ensemble_method
        self.base_models = {}
        self.model_weights = {}
        self.meta_model = None
        self.is_trained = False
        self.performance_metrics = {}
        self.uncertainty_model = None
        
    def add_base_model(self, model_id: str, model_instance: Any, weight: float = 1.0):
        """Add a base model to the ensemble"""
        self.base_models[model_id] = model_instance
        self.model_weights[model_id] = weight
    
    def train(self, smiles_list: List[str], target_values: List[float], 
              validation_split: float = 0.2) -> Dict[str, Any]:
        """Train the ensemble model"""
        if len(self.base_models) < 2:
            return {'success': False, 'error': 'Need at least 2 base models for ensemble'}
        
        try:
            # Split data for validation
            n_val = int(len(smiles_list) * validation_split)
            train_smiles = smiles_list[:-n_val] if n_val > 0 else smiles_list
            val_smiles = smiles_list[-n_val:] if n_val > 0 else []
            train_targets = target_values[:-n_val] if n_val > 0 else target_values
            val_targets = target_values[-n_val:] if n_val > 0 else []
            
            # Get predictions from all base models
            train_predictions = self._get_base_predictions(train_smiles)
            
            if self.ensemble_method == 'stacking':
                # Train meta-model for stacking
                self._train_meta_model(train_predictions, train_targets)
            elif self.ensemble_method == 'weighted_average':
                # Optimize weights based on individual model performance
                self._optimize_weights(train_predictions, train_targets)
            
            # Train uncertainty model
            self._train_uncertainty_model(train_predictions, train_targets)
            
            # Evaluate on validation set if available
            if val_smiles:
                val_predictions = self._get_base_predictions(val_smiles)
                ensemble_preds = self._combine_predictions(val_predictions)
                
                rmse = np.sqrt(mean_squared_error(val_targets, ensemble_preds))
                r2 = r2_score(val_targets, ensemble_preds)
                
                self.performance_metrics = {
                    'validation_rmse': rmse,
                    'validation_r2': r2,
                    'base_model_count': len(self.base_models),
                    'training_samples': len(train_smiles)
                }
            else:
                # Use cross-validation on training data
                cv_scores = self._cross_validate(smiles_list, target_values)
                self.performance_metrics = {
                    'cv_rmse_mean': np.mean(cv_scores),
                    'cv_rmse_std': np.std(cv_scores),
                    'base_model_count': len(self.base_models),
                    'training_samples': len(smiles_list)
                }
            
            self.is_trained = True
            
            return {
                'success': True,
                'ensemble_id': self.ensemble_id,
                'performance': self.performance_metrics,
                'base_models': list(self.base_models.keys()),
                'ensemble_method': self.ensemble_method
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def predict(self, smiles_list: Union[str, List[str]], 
               include_uncertainty: bool = True) -> Dict[str, Any]:
        """Make ensemble predictions"""
        if not self.is_trained:
            return {'success': False, 'error': 'Ensemble not trained'}
        
        if isinstance(smiles_list, str):
            smiles_list = [smiles_list]
        
        try:
            # Get predictions from base models
            base_predictions = self._get_base_predictions(smiles_list)
            
            # Combine predictions using ensemble method
            ensemble_preds = self._combine_predictions(base_predictions)
            
            # Calculate uncertainty if requested
            uncertainty_estimates = None
            if include_uncertainty:
                uncertainty_estimates = self._estimate_uncertainty(base_predictions)
            
            # Format results
            results = []
            for i, smiles in enumerate(smiles_list):
                result = {
                    'smiles': smiles,
                    'ensemble_prediction': float(ensemble_preds[i]),
                    'base_predictions': {
                        model_id: float(preds[i]) 
                        for model_id, preds in base_predictions.items()
                    }
                }
                
                if uncertainty_estimates is not None:
                    result.update({
                        'prediction_std': float(uncertainty_estimates['std'][i]),
                        'confidence_interval': (
                            float(ensemble_preds[i] - 1.96 * uncertainty_estimates['std'][i]),
                            float(ensemble_preds[i] + 1.96 * uncertainty_estimates['std'][i])
                        ),
                        'model_agreement': float(uncertainty_estimates['agreement'][i])
                    })
                
                results.append(result)
            
            return {
                'success': True,
                'results': results,
                'ensemble_method': self.ensemble_method,
                'base_models_used': list(self.base_models.keys())
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_base_predictions(self, smiles_list: List[str]) -> Dict[str, np.ndarray]:
        """Get predictions from all base models"""
        predictions = {}
        
        for model_id, model in self.base_models.items():
            model_preds = []
            
            for smiles in smiles_list:
                # Handle different model types
                if hasattr(model, 'predict_properties'):
                    # Advanced predictor
                    result = model.predict_properties(smiles)
                    if result.get('success'):
                        pred = result['predictions'].get(self.target_property, 0.0)
                    else:
                        pred = 0.0
                
                elif hasattr(model, 'predict'):
                    # QSAR model or sklearn model
                    if isinstance(model, QSARModel):
                        result = model.predict([smiles])
                        if result.get('success'):
                            pred = result['results'][0]['prediction']
                        else:
                            pred = 0.0
                    else:
                        # Sklearn model - would need feature extraction
                        pred = 0.0  # Placeholder
                
                else:
                    # Fallback
                    pred = 0.0
                
                model_preds.append(pred)
            
            predictions[model_id] = np.array(model_preds)
        
        return predictions
    
    def _combine_predictions(self, base_predictions: Dict[str, np.ndarray]) -> np.ndarray:
        """Combine base model predictions using ensemble method"""
        pred_arrays = list(base_predictions.values())
        pred_matrix = np.array(pred_arrays).T  # Shape: (n_samples, n_models)
        
        if self.ensemble_method == 'simple_average':
            return np.mean(pred_matrix, axis=1)
        
        elif self.ensemble_method == 'weighted_average':
            weights = np.array([self.model_weights.get(mid, 1.0) 
                              for mid in base_predictions.keys()])
            weights = weights / weights.sum()  # Normalize
            return np.average(pred_matrix, axis=1, weights=weights)
        
        elif self.ensemble_method == 'median':
            return np.median(pred_matrix, axis=1)
        
        elif self.ensemble_method == 'stacking' and self.meta_model is not None:
            return self.meta_model.predict(pred_matrix)
        
        else:
            # Default to simple average
            return np.mean(pred_matrix, axis=1)
    
    def _train_meta_model(self, base_predictions: Dict[str, np.ndarray], 
                         targets: List[float]):
        """Train meta-model for stacking ensemble"""
        pred_matrix = np.array(list(base_predictions.values())).T
        self.meta_model = LinearRegression()
        self.meta_model.fit(pred_matrix, targets)
    
    def _optimize_weights(self, base_predictions: Dict[str, np.ndarray], 
                         targets: List[float]):
        """Optimize model weights based on individual performance"""
        targets = np.array(targets)
        
        for model_id, preds in base_predictions.items():
            mse = mean_squared_error(targets, preds)
            # Weight inversely proportional to MSE
            self.model_weights[model_id] = 1.0 / (mse + 1e-6)
    
    def _train_uncertainty_model(self, base_predictions: Dict[str, np.ndarray], 
                                targets: List[float]):
        """Train model to predict uncertainty"""
        # Simple uncertainty model based on prediction variance
        pred_matrix = np.array(list(base_predictions.values())).T
        prediction_vars = np.var(pred_matrix, axis=1)
        
        # Store relationship between variance and actual error
        ensemble_preds = self._combine_predictions(base_predictions)
        actual_errors = np.abs(np.array(targets) - ensemble_preds)
        
        # Simple linear relationship (could be improved)
        if len(prediction_vars) > 1 and np.var(prediction_vars) > 0:
            correlation = np.corrcoef(prediction_vars, actual_errors)[0, 1]
            self.uncertainty_model = {
                'correlation': correlation,
                'error_scale': np.mean(actual_errors) / np.mean(prediction_vars) if np.mean(prediction_vars) > 0 else 1.0
            }
        else:
            self.uncertainty_model = {'correlation': 0.0, 'error_scale': 1.0}
    
    def _estimate_uncertainty(self, base_predictions: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """Estimate prediction uncertainty"""
        pred_matrix = np.array(list(base_predictions.values())).T
        
        # Standard deviation across models
        prediction_std = np.std(pred_matrix, axis=1)
        
        # Model agreement (1 - normalized std)
        mean_preds = np.mean(pred_matrix, axis=1)
        relative_std = prediction_std / (np.abs(mean_preds) + 1e-6)
        agreement = 1.0 / (1.0 + relative_std)
        
        return {
            'std': prediction_std,
            'agreement': agreement
        }
    
    def _cross_validate(self, smiles_list: List[str], targets: List[float], 
                       cv_folds: int = 5) -> List[float]:
        """Perform cross-validation on ensemble"""
        kf = KFold(n_splits=cv_folds, shuffle=True, random_state=42)
        cv_scores = []
        
        for train_idx, val_idx in kf.split(smiles_list):
            train_smiles = [smiles_list[i] for i in train_idx]
            val_smiles = [smiles_list[i] for i in val_idx]
            train_targets = [targets[i] for i in train_idx]
            val_targets = [targets[i] for i in val_idx]
            
            # Get predictions
            train_preds = self._get_base_predictions(train_smiles)
            val_preds = self._get_base_predictions(val_smiles)
            
            # Train temporary ensemble on fold
            if self.ensemble_method == 'weighted_average':
                temp_weights = self.model_weights.copy()
                self._optimize_weights(train_preds, train_targets)
            
            # Evaluate on validation fold
            ensemble_val_preds = self._combine_predictions(val_preds)
            rmse = np.sqrt(mean_squared_error(val_targets, ensemble_val_preds))
            cv_scores.append(rmse)
            
            # Restore weights if modified
            if self.ensemble_method == 'weighted_average':
                self.model_weights = temp_weights
        
        return cv_scores


class EnsembleManager:
    """Manages multiple ensemble models"""
    
    def __init__(self):
        self.ensembles = {}
        self.ensemble_registry = {}
    
    def create_ensemble(self, ensemble_id: str, target_property: str, 
                       ensemble_method: str = 'weighted_average') -> EnsembleModel:
        """Create a new ensemble model"""
        ensemble = EnsembleModel(ensemble_id, target_property, ensemble_method)
        self.ensembles[ensemble_id] = ensemble
        
        self.ensemble_registry[ensemble_id] = {
            'target_property': target_property,
            'ensemble_method': ensemble_method,
            'created_at': datetime.now().isoformat(),
            'status': 'created'
        }
        
        return ensemble
    
    def create_multi_predictor_ensemble(self, ensemble_id: str, 
                                      target_property: str = 'molecular_weight') -> Dict[str, Any]:
        """Create ensemble combining different predictor types"""
        try:
            ensemble = self.create_ensemble(ensemble_id, target_property, 'weighted_average')
            
            # Add advanced predictor
            ensemble.add_base_model('advanced_predictor', advanced_predictor, weight=1.0)
            
            # Create and add simple QSAR models (would normally be pre-trained)
            from sklearn.ensemble import RandomForestRegressor
            from sklearn.linear_model import LinearRegression
            
            rf_model = RandomForestRegressor(n_estimators=50, random_state=42)
            linear_model = LinearRegression()
            
            ensemble.add_base_model('random_forest', rf_model, weight=0.8)
            ensemble.add_base_model('linear_regression', linear_model, weight=0.6)
            
            return {
                'success': True,
                'ensemble_id': ensemble_id,
                'base_models': list(ensemble.base_models.keys()),
                'message': 'Multi-predictor ensemble created'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_consensus_ensemble(self, ensemble_id: str, model_ids: List[str], 
                                 target_property: str) -> Dict[str, Any]:
        """Create consensus ensemble from existing QSAR models"""
        try:
            ensemble = self.create_ensemble(ensemble_id, target_property, 'weighted_average')
            
            # Add QSAR models to ensemble
            for model_id in model_ids:
                # Check if model exists in QSAR modeling
                model_info = qsar_modeling.get_model_info(model_id)
                if model_info.get('success'):
                    ensemble.add_base_model(model_id, qsar_modeling.models.get(model_id), weight=1.0)
            
            if len(ensemble.base_models) == 0:
                return {
                    'success': False,
                    'error': 'No valid QSAR models found'
                }
            
            return {
                'success': True,
                'ensemble_id': ensemble_id,
                'base_models': list(ensemble.base_models.keys()),
                'message': 'Consensus ensemble created from QSAR models'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def train_ensemble(self, ensemble_id: str, smiles_list: List[str], 
                      target_values: List[float]) -> Dict[str, Any]:
        """Train an ensemble model"""
        if ensemble_id not in self.ensembles:
            return {'success': False, 'error': f'Ensemble {ensemble_id} not found'}
        
        ensemble = self.ensembles[ensemble_id]
        result = ensemble.train(smiles_list, target_values)
        
        if result.get('success'):
            self.ensemble_registry[ensemble_id]['status'] = 'trained'
            self.ensemble_registry[ensemble_id]['performance'] = result.get('performance', {})
        
        return result
    
    def predict_with_ensemble(self, ensemble_id: str, smiles_list: Union[str, List[str]], 
                            include_uncertainty: bool = True) -> Dict[str, Any]:
        """Make predictions using an ensemble"""
        if ensemble_id not in self.ensembles:
            return {'success': False, 'error': f'Ensemble {ensemble_id} not found'}
        
        return self.ensembles[ensemble_id].predict(smiles_list, include_uncertainty)
    
    def compare_ensembles(self, target_property: str) -> Dict[str, Any]:
        """Compare performance of ensembles for a target property"""
        property_ensembles = [
            eid for eid, info in self.ensemble_registry.items()
            if info['target_property'] == target_property and info['status'] == 'trained'
        ]
        
        if not property_ensembles:
            return {
                'success': False,
                'error': f'No trained ensembles found for property {target_property}'
            }
        
        comparison = []
        for ensemble_id in property_ensembles:
            info = self.ensemble_registry[ensemble_id]
            performance = info.get('performance', {})
            
            comparison.append({
                'ensemble_id': ensemble_id,
                'ensemble_method': info['ensemble_method'],
                'validation_r2': performance.get('validation_r2', performance.get('cv_rmse_mean', None)),
                'base_model_count': performance.get('base_model_count', 0),
                'created_at': info['created_at']
            })
        
        # Sort by performance
        comparison.sort(key=lambda x: x.get('validation_r2', 0), reverse=True)
        
        return {
            'success': True,
            'property': target_property,
            'ensemble_comparison': comparison,
            'best_ensemble': comparison[0] if comparison else None
        }
    
    def get_ensemble_info(self, ensemble_id: Optional[str] = None) -> Dict[str, Any]:
        """Get information about ensembles"""
        if ensemble_id:
            if ensemble_id in self.ensemble_registry:
                info = self.ensemble_registry[ensemble_id].copy()
                if ensemble_id in self.ensembles:
                    ensemble = self.ensembles[ensemble_id]
                    info.update({
                        'base_models': list(ensemble.base_models.keys()),
                        'model_weights': ensemble.model_weights,
                        'is_trained': ensemble.is_trained
                    })
                return {'success': True, 'ensemble_info': info}
            else:
                return {'success': False, 'error': f'Ensemble {ensemble_id} not found'}
        else:
            return {
                'success': True,
                'ensembles': self.ensemble_registry,
                'total_ensembles': len(self.ensemble_registry)
            }


# Create global ensemble manager
ensemble_manager = EnsembleManager()