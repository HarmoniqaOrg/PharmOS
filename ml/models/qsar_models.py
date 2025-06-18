"""
QSAR (Quantitative Structure-Activity Relationship) modeling for PharmOS
Implements multiple regression models with cross-validation and feature selection
"""

import numpy as np
from typing import Dict, List, Any, Tuple, Optional, Union
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.svm import SVR
from sklearn.model_selection import cross_val_score, KFold, train_test_split
from sklearn.feature_selection import SelectKBest, f_regression, RFE
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import sys
import os
from datetime import datetime
import hashlib
import json

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from molecular_descriptors import molecular_descriptors
except ImportError:
    # Fallback if import fails
    class MockDescriptors:
        def extract_all_descriptors(self, smiles: str) -> Dict[str, float]:
            return {'molecular_weight': len(smiles) * 10}
    molecular_descriptors = MockDescriptors()

class QSARModel:
    """Individual QSAR model with training and prediction capabilities"""
    
    def __init__(self, model_type: str = 'random_forest', target_property: str = 'activity'):
        self.model_type = model_type
        self.target_property = target_property
        self.model = None
        self.scaler = StandardScaler()
        self.feature_selector = None
        self.feature_names = []
        self.performance_metrics = {}
        self.is_trained = False
        self.training_timestamp = None
        
        # Initialize model based on type
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the machine learning model"""
        models = {
            'linear': LinearRegression(),
            'ridge': Ridge(alpha=1.0),
            'lasso': Lasso(alpha=0.1),
            'elastic_net': ElasticNet(alpha=0.1, l1_ratio=0.5),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'svr': SVR(kernel='rbf', gamma='scale')
        }
        
        self.model = models.get(self.model_type, RandomForestRegressor(random_state=42))
    
    def prepare_features(self, smiles_list: List[str]) -> np.ndarray:
        """Extract and prepare features from SMILES list"""
        features = []
        
        for smiles in smiles_list:
            descriptors = molecular_descriptors.extract_all_descriptors(smiles)
            feature_vector = self._descriptors_to_vector(descriptors)
            features.append(feature_vector)
        
        return np.array(features)
    
    def _descriptors_to_vector(self, descriptors: Dict[str, float]) -> List[float]:
        """Convert descriptors dictionary to feature vector"""
        # Define comprehensive feature set for QSAR
        if not self.feature_names:
            self.feature_names = [
                'molecular_weight', 'heavy_atom_count', 'heteroatom_count',
                'carbon_count', 'ring_count', 'aromatic_ring_count',
                'double_bond_count', 'triple_bond_count', 'branch_count',
                'rotatable_bond_count', 'avg_electronegativity', 'max_electronegativity',
                'min_electronegativity', 'estimated_psa', 'polar_atom_count',
                'estimated_logp', 'hbd_count', 'hba_count', 'lipinski_violations',
                'character_diversity', 'structural_complexity', 'bertz_complexity',
                'carboxyl_count', 'amino_count', 'hydroxyl_count', 'carbonyl_count',
                'halogen_count'
            ]
        
        feature_vector = []
        for feature_name in self.feature_names:
            feature_vector.append(descriptors.get(feature_name, 0.0))
        
        return feature_vector
    
    def train(self, smiles_list: List[str], target_values: List[float], 
              feature_selection: bool = True, cv_folds: int = 5) -> Dict[str, Any]:
        """Train the QSAR model with cross-validation"""
        try:
            # Prepare features
            X = self.prepare_features(smiles_list)
            y = np.array(target_values)
            
            # Feature scaling
            X_scaled = self.scaler.fit_transform(X)
            
            # Feature selection if requested
            if feature_selection and X_scaled.shape[1] > 10:
                self.feature_selector = SelectKBest(score_func=f_regression, k=min(15, X_scaled.shape[1]))
                X_scaled = self.feature_selector.fit_transform(X_scaled, y)
            
            # Cross-validation
            cv_scores = cross_val_score(self.model, X_scaled, y, cv=cv_folds, 
                                      scoring='neg_mean_squared_error')
            
            # Train final model
            self.model.fit(X_scaled, y)
            
            # Calculate performance metrics
            y_pred = self.model.predict(X_scaled)
            self.performance_metrics = {
                'rmse': np.sqrt(mean_squared_error(y, y_pred)),
                'mae': mean_absolute_error(y, y_pred),
                'r2': r2_score(y, y_pred),
                'cv_rmse_mean': np.sqrt(-cv_scores.mean()),
                'cv_rmse_std': np.sqrt(cv_scores.std()),
                'training_samples': len(y),
                'feature_count': X_scaled.shape[1]
            }
            
            self.is_trained = True
            self.training_timestamp = datetime.now().isoformat()
            
            return {
                'success': True,
                'metrics': self.performance_metrics,
                'feature_importance': self._get_feature_importance(),
                'cv_scores': cv_scores.tolist()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def predict(self, smiles_list: Union[str, List[str]]) -> Dict[str, Any]:
        """Make predictions using the trained model"""
        if not self.is_trained:
            return {'success': False, 'error': 'Model not trained'}
        
        try:
            # Handle single SMILES string
            if isinstance(smiles_list, str):
                smiles_list = [smiles_list]
            
            # Prepare features
            X = self.prepare_features(smiles_list)
            X_scaled = self.scaler.transform(X)
            
            # Apply feature selection if used during training
            if self.feature_selector is not None:
                X_scaled = self.feature_selector.transform(X_scaled)
            
            # Make predictions
            predictions = self.model.predict(X_scaled)
            
            # Calculate prediction intervals (simplified)
            prediction_std = np.std(predictions) if len(predictions) > 1 else 0.1
            confidence_intervals = [(pred - 1.96 * prediction_std, pred + 1.96 * prediction_std) 
                                  for pred in predictions]
            
            results = []
            for i, smiles in enumerate(smiles_list):
                results.append({
                    'smiles': smiles,
                    'prediction': float(predictions[i]),
                    'confidence_interval': confidence_intervals[i],
                    'model_type': self.model_type,
                    'target_property': self.target_property
                })
            
            return {
                'success': True,
                'results': results,
                'model_performance': self.performance_metrics
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        importance_dict = {}
        
        if hasattr(self.model, 'feature_importances_'):
            # For tree-based models
            importances = self.model.feature_importances_
            
            # Map to feature names considering feature selection
            if self.feature_selector is not None:
                selected_features = self.feature_selector.get_support()
                selected_names = [name for i, name in enumerate(self.feature_names) if selected_features[i]]
            else:
                selected_names = self.feature_names
            
            for i, importance in enumerate(importances):
                if i < len(selected_names):
                    importance_dict[selected_names[i]] = float(importance)
        
        elif hasattr(self.model, 'coef_'):
            # For linear models
            coefficients = np.abs(self.model.coef_)
            
            if self.feature_selector is not None:
                selected_features = self.feature_selector.get_support()
                selected_names = [name for i, name in enumerate(self.feature_names) if selected_features[i]]
            else:
                selected_names = self.feature_names
            
            for i, coef in enumerate(coefficients):
                if i < len(selected_names):
                    importance_dict[selected_names[i]] = float(coef)
        
        return importance_dict


class QSARModeling:
    """Main QSAR modeling class for multiple properties and models"""
    
    def __init__(self):
        self.models = {}
        self.model_registry = {}
        
    def create_model(self, model_id: str, model_type: str, target_property: str) -> QSARModel:
        """Create a new QSAR model"""
        model = QSARModel(model_type=model_type, target_property=target_property)
        self.models[model_id] = model
        
        self.model_registry[model_id] = {
            'model_type': model_type,
            'target_property': target_property,
            'created_at': datetime.now().isoformat(),
            'status': 'created'
        }
        
        return model
    
    def train_activity_model(self, smiles_list: List[str], activities: List[float], 
                           model_type: str = 'random_forest') -> Dict[str, Any]:
        """Train a QSAR model for biological activity prediction"""
        model_id = f"activity_{model_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        model = self.create_model(model_id, model_type, 'activity')
        result = model.train(smiles_list, activities)
        
        if result['success']:
            self.model_registry[model_id]['status'] = 'trained'
            self.model_registry[model_id]['performance'] = result['metrics']
        
        result['model_id'] = model_id
        return result
    
    def train_property_model(self, smiles_list: List[str], property_values: List[float],
                           property_name: str, model_type: str = 'random_forest') -> Dict[str, Any]:
        """Train a QSAR model for molecular property prediction"""
        model_id = f"{property_name}_{model_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        model = self.create_model(model_id, model_type, property_name)
        result = model.train(smiles_list, property_values)
        
        if result['success']:
            self.model_registry[model_id]['status'] = 'trained'
            self.model_registry[model_id]['performance'] = result['metrics']
        
        result['model_id'] = model_id
        return result
    
    def predict_with_model(self, model_id: str, smiles_list: Union[str, List[str]]) -> Dict[str, Any]:
        """Make predictions using a specific model"""
        if model_id not in self.models:
            return {'success': False, 'error': f'Model {model_id} not found'}
        
        return self.models[model_id].predict(smiles_list)
    
    def ensemble_predict(self, smiles_list: Union[str, List[str]], 
                        property_name: str, method: str = 'average') -> Dict[str, Any]:
        """Make ensemble predictions using multiple models for the same property"""
        # Find all models for the given property
        property_models = [model_id for model_id, info in self.model_registry.items() 
                          if info['target_property'] == property_name and info['status'] == 'trained']
        
        if not property_models:
            return {'success': False, 'error': f'No trained models found for property {property_name}'}
        
        # Handle single SMILES string
        if isinstance(smiles_list, str):
            smiles_list = [smiles_list]
        
        # Collect predictions from all models
        all_predictions = []
        model_weights = []
        
        for model_id in property_models:
            result = self.predict_with_model(model_id, smiles_list)
            if result['success']:
                predictions = [r['prediction'] for r in result['results']]
                all_predictions.append(predictions)
                
                # Weight by model performance (R² score)
                r2 = self.model_registry[model_id]['performance'].get('r2', 0.5)
                model_weights.append(max(0.1, r2))  # Minimum weight of 0.1
        
        if not all_predictions:
            return {'success': False, 'error': 'No successful predictions from ensemble models'}
        
        # Calculate ensemble predictions
        all_predictions = np.array(all_predictions)
        model_weights = np.array(model_weights)
        model_weights = model_weights / model_weights.sum()  # Normalize weights
        
        if method == 'average':
            ensemble_preds = np.mean(all_predictions, axis=0)
        elif method == 'weighted_average':
            ensemble_preds = np.average(all_predictions, axis=0, weights=model_weights)
        elif method == 'median':
            ensemble_preds = np.median(all_predictions, axis=0)
        else:
            ensemble_preds = np.mean(all_predictions, axis=0)
        
        # Calculate prediction uncertainty
        pred_std = np.std(all_predictions, axis=0)
        
        # Format results
        results = []
        for i, smiles in enumerate(smiles_list):
            results.append({
                'smiles': smiles,
                'ensemble_prediction': float(ensemble_preds[i]),
                'prediction_std': float(pred_std[i]),
                'confidence_interval': (float(ensemble_preds[i] - 1.96 * pred_std[i]),
                                      float(ensemble_preds[i] + 1.96 * pred_std[i])),
                'models_used': len(property_models),
                'method': method
            })
        
        return {
            'success': True,
            'results': results,
            'ensemble_method': method,
            'models_used': property_models
        }
    
    def compare_models(self, property_name: str) -> Dict[str, Any]:
        """Compare performance of all models for a given property"""
        property_models = [model_id for model_id, info in self.model_registry.items() 
                          if info['target_property'] == property_name and info['status'] == 'trained']
        
        if not property_models:
            return {'success': False, 'error': f'No trained models found for property {property_name}'}
        
        comparison = []
        for model_id in property_models:
            model_info = self.model_registry[model_id]
            performance = model_info.get('performance', {})
            
            comparison.append({
                'model_id': model_id,
                'model_type': model_info['model_type'],
                'rmse': performance.get('rmse', None),
                'mae': performance.get('mae', None),
                'r2': performance.get('r2', None),
                'cv_rmse': performance.get('cv_rmse_mean', None),
                'training_samples': performance.get('training_samples', None),
                'trained_at': model_info.get('created_at', None)
            })
        
        # Sort by R² score (descending)
        comparison.sort(key=lambda x: x.get('r2', 0), reverse=True)
        
        return {
            'success': True,
            'property': property_name,
            'model_comparison': comparison,
            'best_model': comparison[0] if comparison else None
        }
    
    def get_model_info(self, model_id: Optional[str] = None) -> Dict[str, Any]:
        """Get information about models"""
        if model_id:
            if model_id in self.model_registry:
                info = self.model_registry[model_id].copy()
                if model_id in self.models:
                    info['feature_importance'] = self.models[model_id]._get_feature_importance()
                return {'success': True, 'model_info': info}
            else:
                return {'success': False, 'error': f'Model {model_id} not found'}
        else:
            return {
                'success': True,
                'models': self.model_registry,
                'total_models': len(self.model_registry)
            }


# Create global QSAR modeling instance
qsar_modeling = QSARModeling()