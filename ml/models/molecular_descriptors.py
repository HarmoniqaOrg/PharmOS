"""
Enhanced molecular descriptors for PharmOS
Provides comprehensive feature extraction from SMILES strings
Uses only numpy and standard library for maximum compatibility
"""

import numpy as np
import re
from typing import Dict, List, Any, Tuple
import hashlib
from collections import defaultdict

class MolecularDescriptors:
    """Enhanced molecular descriptor calculator"""
    
    def __init__(self):
        self.atomic_weights = {
            'C': 12.011, 'N': 14.007, 'O': 15.999, 'S': 32.065,
            'P': 30.974, 'F': 18.998, 'Cl': 35.453, 'Br': 79.904,
            'I': 126.904, 'H': 1.008, 'B': 10.811, 'Si': 28.085
        }
        
        self.electronegativity = {
            'C': 2.55, 'N': 3.04, 'O': 3.44, 'S': 2.58,
            'P': 2.19, 'F': 3.98, 'Cl': 3.16, 'Br': 2.96,
            'I': 2.66, 'H': 2.20, 'B': 2.04, 'Si': 1.90
        }
        
        # Bond patterns for double/triple bonds
        self.bond_patterns = {
            'double_bond': r'=',
            'triple_bond': r'#',
            'aromatic': r'[a-z]',
        }
        
        # Functional group patterns
        self.functional_groups = {
            'carboxyl': r'C\(=O\)O',
            'amino': r'N\([CH]*\)',
            'hydroxyl': r'O[H]*',
            'carbonyl': r'C=O',
            'ester': r'C\(=O\)O[^H]',
            'amide': r'C\(=O\)N',
            'sulfonate': r'S\(=O\)\(=O\)',
            'phosphate': r'P\(=O\)',
            'nitro': r'N\(=O\)=O',
            'halogen': r'[FClBrI]'
        }
    
    def extract_all_descriptors(self, smiles: str) -> Dict[str, float]:
        """Extract comprehensive molecular descriptors"""
        descriptors = {}
        
        # Basic descriptors
        descriptors.update(self._basic_descriptors(smiles))
        
        # Topological descriptors
        descriptors.update(self._topological_descriptors(smiles))
        
        # Electronic descriptors
        descriptors.update(self._electronic_descriptors(smiles))
        
        # Functional group counts
        descriptors.update(self._functional_group_counts(smiles))
        
        # Lipinski descriptors
        descriptors.update(self._lipinski_descriptors(smiles))
        
        # Complexity metrics
        descriptors.update(self._complexity_metrics(smiles))
        
        return descriptors
    
    def _basic_descriptors(self, smiles: str) -> Dict[str, float]:
        """Calculate basic molecular properties"""
        atoms = self._extract_atoms(smiles)
        
        # Molecular weight
        mw = sum(self.atomic_weights.get(atom, 12.0) for atom in atoms)
        
        # Heavy atom count
        heavy_atoms = len([a for a in atoms if a != 'H'])
        
        # Heteroatom count
        heteroatoms = len([a for a in atoms if a not in ['C', 'H']])
        
        # Carbon count
        carbon_count = atoms.count('C')
        
        return {
            'molecular_weight': mw,
            'heavy_atom_count': heavy_atoms,
            'heteroatom_count': heteroatoms,
            'carbon_count': carbon_count,
            'total_atom_count': len(atoms)
        }
    
    def _topological_descriptors(self, smiles: str) -> Dict[str, float]:
        """Calculate topological properties"""
        # Ring analysis
        ring_count = self._count_rings(smiles)
        aromatic_rings = len(re.findall(r'[a-z]+', smiles))
        
        # Bond counts
        double_bonds = smiles.count('=')
        triple_bonds = smiles.count('#')
        
        # Branching analysis
        branches = smiles.count('(') + smiles.count('[')
        
        # Rotatable bonds (simplified estimation)
        rotatable_bonds = self._estimate_rotatable_bonds(smiles)
        
        return {
            'ring_count': ring_count,
            'aromatic_ring_count': aromatic_rings,
            'double_bond_count': double_bonds,
            'triple_bond_count': triple_bonds,
            'branch_count': branches,
            'rotatable_bond_count': rotatable_bonds
        }
    
    def _electronic_descriptors(self, smiles: str) -> Dict[str, float]:
        """Calculate electronic properties"""
        atoms = self._extract_atoms(smiles)
        
        # Electronegativity-based descriptors
        electronegativities = [self.electronegativity.get(atom, 2.5) for atom in atoms]
        
        avg_electronegativity = np.mean(electronegativities) if electronegativities else 0
        max_electronegativity = np.max(electronegativities) if electronegativities else 0
        min_electronegativity = np.min(electronegativities) if electronegativities else 0
        
        # Polar surface area estimation
        polar_atoms = len([a for a in atoms if a in ['N', 'O', 'S', 'P']])
        estimated_psa = polar_atoms * 20.0  # Rough estimation
        
        return {
            'avg_electronegativity': avg_electronegativity,
            'max_electronegativity': max_electronegativity,
            'min_electronegativity': min_electronegativity,
            'estimated_psa': estimated_psa,
            'polar_atom_count': polar_atoms
        }
    
    def _functional_group_counts(self, smiles: str) -> Dict[str, float]:
        """Count functional groups"""
        counts = {}
        for group_name, pattern in self.functional_groups.items():
            counts[f'{group_name}_count'] = len(re.findall(pattern, smiles, re.IGNORECASE))
        return counts
    
    def _lipinski_descriptors(self, smiles: str) -> Dict[str, float]:
        """Calculate Lipinski Rule of Five descriptors"""
        atoms = self._extract_atoms(smiles)
        mw = sum(self.atomic_weights.get(atom, 12.0) for atom in atoms)
        
        # Estimated LogP (very simplified)
        carbon_count = atoms.count('C')
        heteroatom_count = len([a for a in atoms if a not in ['C', 'H']])
        logp_estimate = (carbon_count * 0.5) - (heteroatom_count * 0.2)
        
        # H-bond donors (simplified: N-H, O-H)
        hbd = smiles.count('N') + smiles.count('O')  # Simplified
        
        # H-bond acceptors (simplified: N, O)
        hba = smiles.count('N') + smiles.count('O')
        
        # Lipinski violations
        violations = 0
        violations += 1 if mw > 500 else 0
        violations += 1 if logp_estimate > 5 else 0
        violations += 1 if hbd > 5 else 0
        violations += 1 if hba > 10 else 0
        
        return {
            'estimated_logp': logp_estimate,
            'hbd_count': hbd,
            'hba_count': hba,
            'lipinski_violations': violations
        }
    
    def _complexity_metrics(self, smiles: str) -> Dict[str, float]:
        """Calculate molecular complexity metrics"""
        # Character diversity
        unique_chars = len(set(smiles))
        total_chars = len(smiles)
        char_diversity = unique_chars / total_chars if total_chars > 0 else 0
        
        # Structural complexity based on multiple factors
        rings = self._count_rings(smiles)
        branches = smiles.count('(') + smiles.count('[')
        heteroatoms = len([c for c in smiles if c.upper() in 'NOSPFCLBRI'])
        
        structural_complexity = rings * 2 + branches * 1.5 + heteroatoms * 0.5
        
        # Bertz complexity index (simplified)
        bertz_index = len(smiles) + unique_chars + rings * 3
        
        return {
            'character_diversity': char_diversity,
            'structural_complexity': structural_complexity,
            'bertz_complexity': bertz_index,
            'smiles_length': len(smiles)
        }
    
    def _extract_atoms(self, smiles: str) -> List[str]:
        """Extract atoms from SMILES string"""
        # Remove brackets and numbers
        clean_smiles = re.sub(r'[\[\]()=#+\-123456789\\\/]', '', smiles)
        
        atoms = []
        i = 0
        while i < len(clean_smiles):
            if i < len(clean_smiles) - 1 and clean_smiles[i:i+2] in ['Cl', 'Br', 'Si']:
                atoms.append(clean_smiles[i:i+2])
                i += 2
            elif clean_smiles[i].isalpha():
                atoms.append(clean_smiles[i].upper())
                i += 1
            else:
                i += 1
        
        return atoms
    
    def _count_rings(self, smiles: str) -> int:
        """Count rings in SMILES"""
        # Simple ring detection based on ring closure numbers
        ring_closures = re.findall(r'\d', smiles)
        unique_closures = set(ring_closures)
        return len(unique_closures)
    
    def _estimate_rotatable_bonds(self, smiles: str) -> int:
        """Estimate rotatable bonds"""
        # Simplified: count single bonds not in rings
        # This is a rough approximation
        single_bonds = len(smiles) - smiles.count('=') - smiles.count('#')
        ring_bonds = self._count_rings(smiles) * 6  # Approximate
        return max(0, single_bonds - ring_bonds - 10)  # Rough estimation


class MorganFingerprints:
    """Morgan fingerprint implementation using numpy"""
    
    def __init__(self, radius: int = 2, n_bits: int = 1024):
        self.radius = radius
        self.n_bits = n_bits
    
    def generate_fingerprint(self, smiles: str) -> np.ndarray:
        """Generate Morgan fingerprint from SMILES"""
        # Simplified Morgan fingerprint using hash-based approach
        fingerprint = np.zeros(self.n_bits, dtype=int)
        
        # Generate atom environments
        environments = self._generate_environments(smiles)
        
        # Hash environments to fingerprint bits
        for env in environments:
            hash_val = int(hashlib.md5(env.encode()).hexdigest()[:8], 16)
            bit_index = hash_val % self.n_bits
            fingerprint[bit_index] = 1
        
        return fingerprint
    
    def _generate_environments(self, smiles: str) -> List[str]:
        """Generate atomic environments for fingerprinting"""
        environments = []
        
        # Extract atoms and their contexts
        atoms = re.findall(r'[A-Z][a-z]?', smiles)
        
        for i, atom in enumerate(atoms):
            # Create environment strings at different radii
            for radius in range(self.radius + 1):
                env = f"{atom}_{radius}"
                
                # Add neighbor information (simplified)
                if i > 0:
                    env += f"_{atoms[i-1]}"
                if i < len(atoms) - 1:
                    env += f"_{atoms[i+1]}"
                
                environments.append(env)
        
        return environments
    
    def calculate_similarity(self, fp1: np.ndarray, fp2: np.ndarray) -> float:
        """Calculate Tanimoto similarity between fingerprints"""
        intersection = np.sum(fp1 & fp2)
        union = np.sum(fp1 | fp2)
        return intersection / union if union > 0 else 0.0


# Create global instances
molecular_descriptors = MolecularDescriptors()
morgan_fingerprints = MorganFingerprints()