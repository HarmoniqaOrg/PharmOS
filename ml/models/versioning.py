"""
Model versioning and lifecycle management system for PharmOS
Handles version control, deployment, rollback, and performance tracking
"""

import json
import os
import pickle
import hashlib
import shutil
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from pathlib import Path
import numpy as np
import sys

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class ModelVersion:
    """Represents a specific version of a model"""
    
    def __init__(self, model_id: str, version: str, model_type: str):
        self.model_id = model_id
        self.version = version
        self.model_type = model_type
        self.created_at = datetime.now().isoformat()
        self.metadata = {}
        self.performance_metrics = {}
        self.training_data_hash = None
        self.model_hash = None
        self.deployment_status = 'created'
        self.parent_version = None
        self.tags = []
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'model_id': self.model_id,
            'version': self.version,
            'model_type': self.model_type,
            'created_at': self.created_at,
            'metadata': self.metadata,
            'performance_metrics': self.performance_metrics,
            'training_data_hash': self.training_data_hash,
            'model_hash': self.model_hash,
            'deployment_status': self.deployment_status,
            'parent_version': self.parent_version,
            'tags': self.tags
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ModelVersion':
        """Create from dictionary"""
        version_obj = cls(data['model_id'], data['version'], data['model_type'])
        version_obj.created_at = data.get('created_at', version_obj.created_at)
        version_obj.metadata = data.get('metadata', {})
        version_obj.performance_metrics = data.get('performance_metrics', {})
        version_obj.training_data_hash = data.get('training_data_hash')
        version_obj.model_hash = data.get('model_hash')
        version_obj.deployment_status = data.get('deployment_status', 'created')
        version_obj.parent_version = data.get('parent_version')
        version_obj.tags = data.get('tags', [])
        return version_obj


class ModelRegistry:
    """Registry for managing model versions and metadata"""
    
    def __init__(self, registry_path: str = "ml/model_registry"):
        self.registry_path = Path(registry_path)
        self.registry_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize registry files
        self.models_file = self.registry_path / "models.json"
        self.versions_file = self.registry_path / "versions.json"
        self.deployments_file = self.registry_path / "deployments.json"
        
        # Load existing data
        self.models = self._load_models()
        self.versions = self._load_versions()
        self.deployments = self._load_deployments()
    
    def _load_models(self) -> Dict[str, Dict[str, Any]]:
        """Load models registry"""
        if self.models_file.exists():
            with open(self.models_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _load_versions(self) -> Dict[str, Dict[str, Any]]:
        """Load versions registry"""
        if self.versions_file.exists():
            with open(self.versions_file, 'r') as f:
                data = json.load(f)
                # Convert to ModelVersion objects
                versions = {}
                for version_key, version_data in data.items():
                    versions[version_key] = ModelVersion.from_dict(version_data)
                return versions
        return {}
    
    def _load_deployments(self) -> Dict[str, Dict[str, Any]]:
        """Load deployments registry"""
        if self.deployments_file.exists():
            with open(self.deployments_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_models(self):
        """Save models registry"""
        with open(self.models_file, 'w') as f:
            json.dump(self.models, f, indent=2)
    
    def _save_versions(self):
        """Save versions registry"""
        # Convert ModelVersion objects to dictionaries
        version_data = {}
        for version_key, version_obj in self.versions.items():
            version_data[version_key] = version_obj.to_dict()
        
        with open(self.versions_file, 'w') as f:
            json.dump(version_data, f, indent=2)
    
    def _save_deployments(self):
        """Save deployments registry"""
        with open(self.deployments_file, 'w') as f:
            json.dump(self.deployments, f, indent=2)
    
    def register_model(self, model_id: str, model_type: str, 
                      description: str = "") -> Dict[str, Any]:
        """Register a new model"""
        if model_id in self.models:
            return {'success': False, 'error': f'Model {model_id} already exists'}
        
        self.models[model_id] = {
            'model_id': model_id,
            'model_type': model_type,
            'description': description,
            'created_at': datetime.now().isoformat(),
            'latest_version': None,
            'total_versions': 0,
            'status': 'active'
        }
        
        self._save_models()
        
        return {
            'success': True,
            'model_id': model_id,
            'message': f'Model {model_id} registered successfully'
        }
    
    def create_version(self, model_id: str, version: str, model_instance: Any,
                      training_data: Optional[List[str]] = None,
                      performance_metrics: Optional[Dict[str, float]] = None,
                      metadata: Optional[Dict[str, Any]] = None,
                      parent_version: Optional[str] = None) -> Dict[str, Any]:
        """Create a new version of a model"""
        if model_id not in self.models:
            return {'success': False, 'error': f'Model {model_id} not registered'}
        
        version_key = f"{model_id}:{version}"
        
        if version_key in self.versions:
            return {'success': False, 'error': f'Version {version} already exists for model {model_id}'}
        
        # Create model version
        model_version = ModelVersion(model_id, version, self.models[model_id]['model_type'])
        model_version.metadata = metadata or {}
        model_version.performance_metrics = performance_metrics or {}
        model_version.parent_version = parent_version
        
        # Calculate hashes
        if training_data:
            data_str = ''.join(sorted(training_data))
            model_version.training_data_hash = hashlib.md5(data_str.encode()).hexdigest()
        
        # Save model instance
        model_dir = self.registry_path / "models" / model_id / version
        model_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Save model using pickle
            model_file = model_dir / "model.pkl"
            with open(model_file, 'wb') as f:
                pickle.dump(model_instance, f)
            
            # Calculate model hash
            with open(model_file, 'rb') as f:
                model_content = f.read()
                model_version.model_hash = hashlib.md5(model_content).hexdigest()
            
            # Save version
            self.versions[version_key] = model_version
            
            # Update model info
            self.models[model_id]['latest_version'] = version
            self.models[model_id]['total_versions'] += 1
            
            # Save to disk
            self._save_versions()
            self._save_models()
            
            return {
                'success': True,
                'model_id': model_id,
                'version': version,
                'version_key': version_key,
                'model_hash': model_version.model_hash,
                'message': f'Version {version} created for model {model_id}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to save model: {str(e)}'
            }
    
    def load_model(self, model_id: str, version: Optional[str] = None) -> Dict[str, Any]:
        """Load a specific version of a model"""
        if model_id not in self.models:
            return {'success': False, 'error': f'Model {model_id} not found'}
        
        # Use latest version if not specified
        if version is None:
            version = self.models[model_id]['latest_version']
            if version is None:
                return {'success': False, 'error': f'No versions available for model {model_id}'}
        
        version_key = f"{model_id}:{version}"
        
        if version_key not in self.versions:
            return {'success': False, 'error': f'Version {version} not found for model {model_id}'}
        
        try:
            model_file = self.registry_path / "models" / model_id / version / "model.pkl"
            
            if not model_file.exists():
                return {'success': False, 'error': f'Model file not found for {version_key}'}
            
            with open(model_file, 'rb') as f:
                model_instance = pickle.load(f)
            
            return {
                'success': True,
                'model_id': model_id,
                'version': version,
                'model_instance': model_instance,
                'version_info': self.versions[version_key].to_dict()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to load model: {str(e)}'
            }
    
    def deploy_version(self, model_id: str, version: str, 
                      deployment_name: str = 'production',
                      rollback_on_failure: bool = True) -> Dict[str, Any]:
        """Deploy a specific version to an environment"""
        version_key = f"{model_id}:{version}"
        
        if version_key not in self.versions:
            return {'success': False, 'error': f'Version {version_key} not found'}
        
        # Get current deployment for rollback
        current_deployment = self.deployments.get(deployment_name)
        
        try:
            # Update deployment
            self.deployments[deployment_name] = {
                'model_id': model_id,
                'version': version,
                'deployed_at': datetime.now().isoformat(),
                'status': 'active',
                'previous_deployment': current_deployment
            }
            
            # Update version status
            self.versions[version_key].deployment_status = 'deployed'
            
            # Mark previous version as superseded
            if current_deployment:
                prev_version_key = f"{current_deployment['model_id']}:{current_deployment['version']}"
                if prev_version_key in self.versions:
                    self.versions[prev_version_key].deployment_status = 'superseded'
            
            self._save_deployments()
            self._save_versions()
            
            return {
                'success': True,
                'deployment_name': deployment_name,
                'model_id': model_id,
                'version': version,
                'previous_deployment': current_deployment,
                'message': f'Version {version} deployed to {deployment_name}'
            }
            
        except Exception as e:
            # Rollback if requested and there was a previous deployment
            if rollback_on_failure and current_deployment:
                self.deployments[deployment_name] = current_deployment
                self._save_deployments()
            
            return {
                'success': False,
                'error': f'Deployment failed: {str(e)}'
            }
    
    def rollback_deployment(self, deployment_name: str = 'production') -> Dict[str, Any]:
        """Rollback to previous deployment"""
        if deployment_name not in self.deployments:
            return {'success': False, 'error': f'Deployment {deployment_name} not found'}
        
        current_deployment = self.deployments[deployment_name]
        previous_deployment = current_deployment.get('previous_deployment')
        
        if not previous_deployment:
            return {'success': False, 'error': 'No previous deployment to rollback to'}
        
        try:
            # Rollback
            self.deployments[deployment_name] = {
                **previous_deployment,
                'deployed_at': datetime.now().isoformat(),
                'status': 'active',
                'rollback_from': current_deployment
            }
            
            # Update version statuses
            current_version_key = f"{current_deployment['model_id']}:{current_deployment['version']}"
            if current_version_key in self.versions:
                self.versions[current_version_key].deployment_status = 'rolled_back'
            
            prev_version_key = f"{previous_deployment['model_id']}:{previous_deployment['version']}"
            if prev_version_key in self.versions:
                self.versions[prev_version_key].deployment_status = 'deployed'
            
            self._save_deployments()
            self._save_versions()
            
            return {
                'success': True,
                'deployment_name': deployment_name,
                'rolled_back_to': previous_deployment,
                'message': f'Rolled back to version {previous_deployment["version"]}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Rollback failed: {str(e)}'
            }
    
    def tag_version(self, model_id: str, version: str, tag: str) -> Dict[str, Any]:
        """Add a tag to a version"""
        version_key = f"{model_id}:{version}"
        
        if version_key not in self.versions:
            return {'success': False, 'error': f'Version {version_key} not found'}
        
        if tag not in self.versions[version_key].tags:
            self.versions[version_key].tags.append(tag)
            self._save_versions()
        
        return {
            'success': True,
            'model_id': model_id,
            'version': version,
            'tag': tag,
            'message': f'Tag {tag} added to version {version}'
        }
    
    def update_performance_metrics(self, model_id: str, version: str, 
                                 metrics: Dict[str, float]) -> Dict[str, Any]:
        """Update performance metrics for a version"""
        version_key = f"{model_id}:{version}"
        
        if version_key not in self.versions:
            return {'success': False, 'error': f'Version {version_key} not found'}
        
        self.versions[version_key].performance_metrics.update(metrics)
        self._save_versions()
        
        return {
            'success': True,
            'model_id': model_id,
            'version': version,
            'updated_metrics': metrics,
            'message': 'Performance metrics updated'
        }
    
    def list_versions(self, model_id: Optional[str] = None) -> Dict[str, Any]:
        """List all versions for a model or all models"""
        if model_id:
            if model_id not in self.models:
                return {'success': False, 'error': f'Model {model_id} not found'}
            
            model_versions = [
                v.to_dict() for k, v in self.versions.items() 
                if k.startswith(f"{model_id}:")
            ]
            
            # Sort by creation date
            model_versions.sort(key=lambda x: x['created_at'], reverse=True)
            
            return {
                'success': True,
                'model_id': model_id,
                'versions': model_versions,
                'total_versions': len(model_versions)
            }
        else:
            all_versions = [v.to_dict() for v in self.versions.values()]
            all_versions.sort(key=lambda x: x['created_at'], reverse=True)
            
            return {
                'success': True,
                'versions': all_versions,
                'total_versions': len(all_versions)
            }
    
    def compare_versions(self, model_id: str, version1: str, version2: str) -> Dict[str, Any]:
        """Compare two versions of a model"""
        v1_key = f"{model_id}:{version1}"
        v2_key = f"{model_id}:{version2}"
        
        if v1_key not in self.versions:
            return {'success': False, 'error': f'Version {version1} not found'}
        
        if v2_key not in self.versions:
            return {'success': False, 'error': f'Version {version2} not found'}
        
        v1 = self.versions[v1_key]
        v2 = self.versions[v2_key]
        
        comparison = {
            'model_id': model_id,
            'version1': {
                'version': version1,
                'created_at': v1.created_at,
                'performance_metrics': v1.performance_metrics,
                'deployment_status': v1.deployment_status,
                'model_hash': v1.model_hash
            },
            'version2': {
                'version': version2,
                'created_at': v2.created_at,
                'performance_metrics': v2.performance_metrics,
                'deployment_status': v2.deployment_status,
                'model_hash': v2.model_hash
            },
            'differences': {
                'performance_delta': {},
                'hash_different': v1.model_hash != v2.model_hash,
                'training_data_different': v1.training_data_hash != v2.training_data_hash
            }
        }
        
        # Calculate performance differences
        for metric in set(v1.performance_metrics.keys()) | set(v2.performance_metrics.keys()):
            val1 = v1.performance_metrics.get(metric, 0)
            val2 = v2.performance_metrics.get(metric, 0)
            comparison['differences']['performance_delta'][metric] = val2 - val1
        
        return {
            'success': True,
            'comparison': comparison
        }
    
    def delete_version(self, model_id: str, version: str, 
                      force: bool = False) -> Dict[str, Any]:
        """Delete a version (with safety checks)"""
        version_key = f"{model_id}:{version}"
        
        if version_key not in self.versions:
            return {'success': False, 'error': f'Version {version_key} not found'}
        
        version_obj = self.versions[version_key]
        
        # Safety checks
        if version_obj.deployment_status == 'deployed' and not force:
            return {
                'success': False,
                'error': 'Cannot delete deployed version. Use force=True to override.'
            }
        
        if self.models[model_id]['latest_version'] == version and not force:
            return {
                'success': False,
                'error': 'Cannot delete latest version. Use force=True to override.'
            }
        
        try:
            # Delete model files
            model_dir = self.registry_path / "models" / model_id / version
            if model_dir.exists():
                shutil.rmtree(model_dir)
            
            # Remove from registry
            del self.versions[version_key]
            
            # Update model info
            self.models[model_id]['total_versions'] -= 1
            if self.models[model_id]['latest_version'] == version:
                # Find new latest version
                remaining_versions = [
                    v for k, v in self.versions.items() 
                    if k.startswith(f"{model_id}:")
                ]
                if remaining_versions:
                    latest = max(remaining_versions, key=lambda x: x.created_at)
                    self.models[model_id]['latest_version'] = latest.version
                else:
                    self.models[model_id]['latest_version'] = None
            
            self._save_versions()
            self._save_models()
            
            return {
                'success': True,
                'model_id': model_id,
                'version': version,
                'message': f'Version {version} deleted'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to delete version: {str(e)}'
            }
    
    def get_deployment_status(self, deployment_name: str = 'production') -> Dict[str, Any]:
        """Get current deployment status"""
        if deployment_name not in self.deployments:
            return {
                'success': True,
                'deployment_name': deployment_name,
                'status': 'no_deployment'
            }
        
        deployment = self.deployments[deployment_name]
        version_key = f"{deployment['model_id']}:{deployment['version']}"
        
        version_info = None
        if version_key in self.versions:
            version_info = self.versions[version_key].to_dict()
        
        return {
            'success': True,
            'deployment_name': deployment_name,
            'deployment': deployment,
            'version_info': version_info
        }


# Create global model registry
model_registry = ModelRegistry()