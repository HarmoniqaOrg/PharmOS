"""
Molecular docking simulation framework for PharmOS
Implements simplified docking algorithms for protein-ligand binding prediction
Uses grid-based scoring and conformational sampling
"""

import numpy as np
from typing import Dict, List, Any, Tuple, Optional
import sys
import os
from datetime import datetime
import hashlib
import json
import re

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

class ProteinTarget:
    """Simplified protein target representation"""
    
    def __init__(self, target_id: str, target_type: str = 'enzyme'):
        self.target_id = target_id
        self.target_type = target_type
        self.binding_site = self._generate_binding_site()
        self.pharmacophore_features = self._generate_pharmacophore()
        
    def _generate_binding_site(self) -> Dict[str, Any]:
        """Generate simplified binding site representation"""
        # Create a 3D grid representing the binding site
        site_size = 20  # 20x20x20 grid
        
        # Generate binding site properties based on target type
        hydrophobic_regions = np.random.random((site_size, site_size, site_size))
        electrostatic_field = np.random.normal(0, 1, (site_size, site_size, site_size))
        h_bond_acceptors = np.random.random((site_size, site_size, site_size)) > 0.9
        h_bond_donors = np.random.random((site_size, site_size, site_size)) > 0.9
        
        return {
            'grid_size': site_size,
            'hydrophobic': hydrophobic_regions,
            'electrostatic': electrostatic_field,
            'h_bond_acceptors': h_bond_acceptors,
            'h_bond_donors': h_bond_donors,
            'center': (site_size//2, site_size//2, site_size//2)
        }
    
    def _generate_pharmacophore(self) -> Dict[str, Any]:
        """Generate pharmacophore features for the target"""
        features = []
        
        # Add pharmacophore features based on target type
        if 'kinase' in self.target_type.lower():
            features.extend([
                {'type': 'hydrogen_bond_donor', 'position': (5, 5, 5), 'tolerance': 2.0},
                {'type': 'hydrogen_bond_acceptor', 'position': (15, 10, 8), 'tolerance': 2.0},
                {'type': 'hydrophobic', 'position': (10, 15, 12), 'tolerance': 3.0},
                {'type': 'aromatic', 'position': (8, 8, 10), 'tolerance': 2.5}
            ])
        elif 'gpcr' in self.target_type.lower():
            features.extend([
                {'type': 'positive_ionizable', 'position': (7, 7, 7), 'tolerance': 2.0},
                {'type': 'hydrophobic', 'position': (12, 12, 12), 'tolerance': 3.0},
                {'type': 'aromatic', 'position': (10, 8, 15), 'tolerance': 2.5}
            ])
        else:
            # Generic features
            features.extend([
                {'type': 'hydrogen_bond_donor', 'position': (6, 6, 6), 'tolerance': 2.0},
                {'type': 'hydrogen_bond_acceptor', 'position': (14, 14, 14), 'tolerance': 2.0},
                {'type': 'hydrophobic', 'position': (10, 10, 10), 'tolerance': 3.0}
            ])
        
        return {'features': features}


class LigandConformation:
    """Simplified ligand conformation representation"""
    
    def __init__(self, smiles: str, conformation_id: int = 0):
        self.smiles = smiles
        self.conformation_id = conformation_id
        self.descriptors = molecular_descriptors.extract_all_descriptors(smiles)
        self.coordinates = self._generate_coordinates()
        self.pharmacophore_features = self._extract_pharmacophore_features()
    
    def _generate_coordinates(self) -> np.ndarray:
        """Generate simplified 3D coordinates for the ligand"""
        # Simplified coordinate generation based on molecular size
        n_atoms = self.descriptors.get('heavy_atom_count', 10)
        
        # Generate random but reasonable coordinates
        np.random.seed(hash(self.smiles) % 2**32)
        coords = np.random.normal(0, 3, (n_atoms, 3))
        
        return coords
    
    def _extract_pharmacophore_features(self) -> List[Dict[str, Any]]:
        """Extract pharmacophore features from the ligand"""
        features = []
        
        # Analyze SMILES for pharmacophore features
        smiles = self.smiles.upper()
        
        # Hydrogen bond donors (simplified: OH, NH)
        if 'OH' in smiles or 'NH' in smiles:
            features.append({
                'type': 'hydrogen_bond_donor',
                'position': np.random.choice(len(self.coordinates)),
                'strength': 1.0
            })
        
        # Hydrogen bond acceptors (simplified: O, N)
        if 'O' in smiles or 'N' in smiles:
            features.append({
                'type': 'hydrogen_bond_acceptor',
                'position': np.random.choice(len(self.coordinates)),
                'strength': 1.0
            })
        
        # Hydrophobic features (simplified: long alkyl chains, aromatic rings)
        if 'CCCC' in smiles or 'c1ccccc1' in smiles.lower():
            features.append({
                'type': 'hydrophobic',
                'position': np.random.choice(len(self.coordinates)),
                'strength': 1.0
            })
        
        # Aromatic features
        if re.search(r'c\d*c', smiles.lower()):
            features.append({
                'type': 'aromatic',
                'position': np.random.choice(len(self.coordinates)),
                'strength': 1.0
            })
        
        # Ionizable features
        if 'N+' in smiles or 'COO-' in smiles:
            feature_type = 'positive_ionizable' if 'N+' in smiles else 'negative_ionizable'
            features.append({
                'type': feature_type,
                'position': np.random.choice(len(self.coordinates)),
                'strength': 1.0
            })
        
        return features


class DockingEngine:
    """Main docking engine for protein-ligand binding prediction"""
    
    def __init__(self):
        self.targets = {}
        self.scoring_weights = {
            'vdw': 1.0,
            'electrostatic': 0.5,
            'hydrogen_bond': 2.0,
            'hydrophobic': 0.8,
            'pharmacophore': 1.5,
            'strain': -1.0
        }
    
    def add_target(self, target_id: str, target_type: str = 'enzyme') -> ProteinTarget:
        """Add a protein target for docking"""
        target = ProteinTarget(target_id, target_type)
        self.targets[target_id] = target
        return target
    
    def dock_ligand(self, smiles: str, target_id: str, 
                   n_poses: int = 10, exhaustiveness: int = 8) -> Dict[str, Any]:
        """Dock a ligand to a protein target"""
        if target_id not in self.targets:
            return {'success': False, 'error': f'Target {target_id} not found'}
        
        try:
            target = self.targets[target_id]
            ligand = LigandConformation(smiles)
            
            # Generate multiple poses
            poses = self._generate_poses(ligand, target, n_poses)
            
            # Score all poses
            scored_poses = []
            for i, pose in enumerate(poses):
                score = self._score_pose(pose, target)
                scored_poses.append({
                    'pose_id': i,
                    'binding_affinity': score['total_score'],
                    'score_components': score,
                    'pose_coordinates': pose['coordinates'].tolist(),
                    'rmsd_to_reference': np.random.uniform(0.5, 3.0)  # Simplified
                })
            
            # Sort by binding affinity (lower is better)
            scored_poses.sort(key=lambda x: x['binding_affinity'])
            
            # Estimate binding constants
            best_score = scored_poses[0]['binding_affinity']
            kd_nm = self._score_to_kd(best_score)
            pic50 = -np.log10(kd_nm * 1e-9)
            
            return {
                'success': True,
                'smiles': smiles,
                'target_id': target_id,
                'best_pose': scored_poses[0],
                'all_poses': scored_poses,
                'binding_prediction': {
                    'binding_affinity_kcal_mol': best_score,
                    'estimated_kd_nm': kd_nm,
                    'estimated_pic50': pic50,
                    'binding_efficiency': best_score / ligand.descriptors.get('heavy_atom_count', 20)
                },
                'ligand_efficiency': self._calculate_ligand_efficiency(best_score, ligand),
                'drug_likeness': self._assess_drug_likeness(ligand)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'smiles': smiles,
                'target_id': target_id
            }
    
    def _generate_poses(self, ligand: LigandConformation, target: ProteinTarget, 
                       n_poses: int) -> List[Dict[str, Any]]:
        """Generate multiple binding poses for the ligand"""
        poses = []
        binding_site = target.binding_site
        site_center = binding_site['center']
        
        for i in range(n_poses):
            # Generate random pose within binding site
            pose_coords = ligand.coordinates.copy()
            
            # Random translation within binding site
            translation = np.random.normal(0, 2, 3)
            pose_coords += translation
            
            # Random rotation (simplified)
            rotation_angle = np.random.uniform(0, 2*np.pi)
            rotation_matrix = self._rotation_matrix_z(rotation_angle)
            pose_coords = np.dot(pose_coords, rotation_matrix.T)
            
            # Center in binding site
            pose_coords += np.array(site_center)
            
            poses.append({
                'coordinates': pose_coords,
                'translation': translation,
                'rotation_angle': rotation_angle,
                'ligand_features': ligand.pharmacophore_features
            })
        
        return poses
    
    def _rotation_matrix_z(self, angle: float) -> np.ndarray:
        """Generate rotation matrix around Z-axis"""
        cos_a, sin_a = np.cos(angle), np.sin(angle)
        return np.array([
            [cos_a, -sin_a, 0],
            [sin_a, cos_a, 0],
            [0, 0, 1]
        ])
    
    def _score_pose(self, pose: Dict[str, Any], target: ProteinTarget) -> Dict[str, float]:
        """Score a binding pose"""
        coords = pose['coordinates']
        binding_site = target.binding_site
        
        # Van der Waals score (simplified)
        vdw_score = self._calculate_vdw_score(coords, binding_site)
        
        # Electrostatic score
        electrostatic_score = self._calculate_electrostatic_score(coords, binding_site)
        
        # Hydrogen bonding score
        h_bond_score = self._calculate_hbond_score(pose, target)
        
        # Hydrophobic score
        hydrophobic_score = self._calculate_hydrophobic_score(coords, binding_site)
        
        # Pharmacophore score
        pharmacophore_score = self._calculate_pharmacophore_score(pose, target)
        
        # Strain penalty (simplified)
        strain_penalty = np.random.uniform(0, 2)  # Simplified conformational strain
        
        # Calculate total score
        total_score = (
            self.scoring_weights['vdw'] * vdw_score +
            self.scoring_weights['electrostatic'] * electrostatic_score +
            self.scoring_weights['hydrogen_bond'] * h_bond_score +
            self.scoring_weights['hydrophobic'] * hydrophobic_score +
            self.scoring_weights['pharmacophore'] * pharmacophore_score +
            self.scoring_weights['strain'] * strain_penalty
        )
        
        return {
            'total_score': total_score,
            'vdw_score': vdw_score,
            'electrostatic_score': electrostatic_score,
            'hydrogen_bond_score': h_bond_score,
            'hydrophobic_score': hydrophobic_score,
            'pharmacophore_score': pharmacophore_score,
            'strain_penalty': strain_penalty
        }
    
    def _calculate_vdw_score(self, coords: np.ndarray, binding_site: Dict[str, Any]) -> float:
        """Calculate van der Waals interaction score"""
        # Simplified VdW scoring based on distance to binding site center
        center = np.array(binding_site['center'])
        distances = np.linalg.norm(coords - center, axis=1)
        
        # Lennard-Jones-like potential (simplified)
        vdw_score = np.sum(-1.0 / (distances + 1.0)**6 + 0.5 / (distances + 1.0)**12)
        
        return vdw_score
    
    def _calculate_electrostatic_score(self, coords: np.ndarray, binding_site: Dict[str, Any]) -> float:
        """Calculate electrostatic interaction score"""
        # Sample electrostatic field at ligand coordinates
        grid_coords = np.clip(coords.astype(int), 0, binding_site['grid_size'] - 1)
        
        electrostatic_energies = []
        for coord in grid_coords:
            x, y, z = coord
            field_value = binding_site['electrostatic'][x, y, z]
            electrostatic_energies.append(field_value * 0.1)  # Scale factor
        
        return np.sum(electrostatic_energies)
    
    def _calculate_hbond_score(self, pose: Dict[str, Any], target: ProteinTarget) -> float:
        """Calculate hydrogen bonding score"""
        ligand_features = pose['ligand_features']
        binding_site = target.binding_site
        
        h_bond_score = 0.0
        
        for feature in ligand_features:
            if feature['type'] in ['hydrogen_bond_donor', 'hydrogen_bond_acceptor']:
                # Simplified: check for complementary features in binding site
                feature_pos = pose['coordinates'][feature['position']]
                grid_pos = np.clip(feature_pos.astype(int), 0, binding_site['grid_size'] - 1)
                
                if feature['type'] == 'hydrogen_bond_donor':
                    if binding_site['h_bond_acceptors'][tuple(grid_pos)]:
                        h_bond_score += 2.0 * feature['strength']
                else:  # hydrogen_bond_acceptor
                    if binding_site['h_bond_donors'][tuple(grid_pos)]:
                        h_bond_score += 2.0 * feature['strength']
        
        return h_bond_score
    
    def _calculate_hydrophobic_score(self, coords: np.ndarray, binding_site: Dict[str, Any]) -> float:
        """Calculate hydrophobic interaction score"""
        grid_coords = np.clip(coords.astype(int), 0, binding_site['grid_size'] - 1)
        
        hydrophobic_score = 0.0
        for coord in grid_coords:
            x, y, z = coord
            hydrophobic_value = binding_site['hydrophobic'][x, y, z]
            hydrophobic_score += hydrophobic_value * 0.5
        
        return hydrophobic_score
    
    def _calculate_pharmacophore_score(self, pose: Dict[str, Any], target: ProteinTarget) -> float:
        """Calculate pharmacophore matching score"""
        ligand_features = pose['ligand_features']
        target_features = target.pharmacophore_features['features']
        
        pharmacophore_score = 0.0
        
        for ligand_feature in ligand_features:
            for target_feature in target_features:
                if ligand_feature['type'] == target_feature['type']:
                    # Calculate distance between features
                    ligand_pos = pose['coordinates'][ligand_feature['position']]
                    target_pos = np.array(target_feature['position'])
                    distance = np.linalg.norm(ligand_pos - target_pos)
                    
                    # Score based on distance to tolerance
                    if distance <= target_feature['tolerance']:
                        score_contribution = (1.0 - distance / target_feature['tolerance']) * 3.0
                        pharmacophore_score += score_contribution * ligand_feature['strength']
        
        return pharmacophore_score
    
    def _score_to_kd(self, binding_score: float) -> float:
        """Convert binding score to dissociation constant (Kd in nM)"""
        # Simplified relationship: better (more negative) scores -> lower Kd
        kd_nm = np.exp(-binding_score) * 1000  # Rough conversion
        return max(0.1, min(10000000, kd_nm))  # Clamp to reasonable range
    
    def _calculate_ligand_efficiency(self, binding_score: float, ligand: LigandConformation) -> float:
        """Calculate ligand efficiency (binding affinity per heavy atom)"""
        heavy_atoms = ligand.descriptors.get('heavy_atom_count', 20)
        return abs(binding_score) / heavy_atoms
    
    def _assess_drug_likeness(self, ligand: LigandConformation) -> Dict[str, Any]:
        """Assess drug-likeness of the ligand"""
        descriptors = ligand.descriptors
        
        # Simplified drug-likeness assessment
        lipinski_violations = descriptors.get('lipinski_violations', 0)
        mw = descriptors.get('molecular_weight', 300)
        logp = descriptors.get('estimated_logp', 2)
        
        drug_like_score = 1.0
        if lipinski_violations > 1:
            drug_like_score -= 0.3
        if mw > 500:
            drug_like_score -= 0.2
        if abs(logp) > 5:
            drug_like_score -= 0.2
        
        return {
            'drug_likeness_score': max(0, drug_like_score),
            'lipinski_violations': lipinski_violations,
            'passes_ro5': lipinski_violations <= 1,
            'molecular_weight': mw,
            'estimated_logp': logp
        }
    
    def virtual_screening(self, smiles_list: List[str], target_id: str, 
                         score_threshold: float = -5.0) -> Dict[str, Any]:
        """Perform virtual screening of multiple ligands"""
        if target_id not in self.targets:
            return {'success': False, 'error': f'Target {target_id} not found'}
        
        results = []
        
        for smiles in smiles_list:
            docking_result = self.dock_ligand(smiles, target_id, n_poses=5)
            
            if docking_result['success']:
                best_score = docking_result['best_pose']['binding_affinity']
                
                if best_score <= score_threshold:
                    results.append({
                        'smiles': smiles,
                        'binding_affinity': best_score,
                        'estimated_pic50': docking_result['binding_prediction']['estimated_pic50'],
                        'drug_likeness_score': docking_result['drug_likeness']['drug_likeness_score'],
                        'ligand_efficiency': docking_result['ligand_efficiency'],
                        'passes_filter': True
                    })
                else:
                    results.append({
                        'smiles': smiles,
                        'binding_affinity': best_score,
                        'passes_filter': False
                    })
        
        # Sort by binding affinity
        results.sort(key=lambda x: x.get('binding_affinity', 0))
        
        # Calculate statistics
        passing_compounds = [r for r in results if r.get('passes_filter', False)]
        hit_rate = len(passing_compounds) / len(smiles_list) if smiles_list else 0
        
        return {
            'success': True,
            'target_id': target_id,
            'total_compounds': len(smiles_list),
            'hits': len(passing_compounds),
            'hit_rate': hit_rate,
            'score_threshold': score_threshold,
            'results': results,
            'top_hits': passing_compounds[:10]  # Top 10 hits
        }
    
    def get_target_info(self, target_id: Optional[str] = None) -> Dict[str, Any]:
        """Get information about docking targets"""
        if target_id:
            if target_id in self.targets:
                target = self.targets[target_id]
                return {
                    'success': True,
                    'target_id': target_id,
                    'target_type': target.target_type,
                    'binding_site_size': target.binding_site['grid_size'],
                    'pharmacophore_features': len(target.pharmacophore_features['features'])
                }
            else:
                return {'success': False, 'error': f'Target {target_id} not found'}
        else:
            return {
                'success': True,
                'targets': {
                    tid: {
                        'target_type': target.target_type,
                        'pharmacophore_features': len(target.pharmacophore_features['features'])
                    }
                    for tid, target in self.targets.items()
                }
            }


# Create global docking engine instance
docking_engine = DockingEngine()

# Add some default targets
docking_engine.add_target('EGFR_kinase', 'kinase')
docking_engine.add_target('DRD2_gpcr', 'gpcr')
docking_engine.add_target('COX2_enzyme', 'enzyme')