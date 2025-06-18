const { AuthenticationError, UserInputError } = require('apollo-server-express');

// Helper function to apply pagination
function applyPagination(data, pagination = {}) {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;
  const offset = (page - 1) * limit;
  
  // Simple sorting (in real app, would be done in database)
  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (sortOrder === 'ASC') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });
  
  const paginatedData = sorted.slice(offset, offset + limit);
  
  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
      hasNextPage: offset + limit < data.length,
      hasPreviousPage: page > 1,
    },
  };
}

// Helper function to filter molecules
function filterMolecules(molecules, filter = {}) {
  return molecules.filter(mol => {
    if (filter.name && !mol.name.toLowerCase().includes(filter.name.toLowerCase())) {
      return false;
    }
    if (filter.smilesContains && !mol.smiles.includes(filter.smilesContains)) {
      return false;
    }
    if (filter.minMolecularWeight && mol.molecularWeight < filter.minMolecularWeight) {
      return false;
    }
    if (filter.maxMolecularWeight && mol.molecularWeight > filter.maxMolecularWeight) {
      return false;
    }
    if (filter.projectId && mol.projectId !== filter.projectId) {
      return false;
    }
    return true;
  });
}

const moleculeResolvers = {
  Query: {
    // Get molecule by ID
    molecule: async (parent, { id }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await dataloaders.moleculeLoader.load(id);
    },

    // Get molecule by SMILES
    moleculeBySmiles: async (parent, { smiles }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Mock implementation - find molecule by SMILES
      const fs = require('fs').promises;
      const path = require('path');
      try {
        const data = await fs.readFile(path.join(__dirname, '../../../data/mock/molecules.json'), 'utf8');
        const molecules = JSON.parse(data);
        const molecule = molecules.find(mol => mol.smiles === smiles);
        
        if (molecule) {
          const index = molecules.indexOf(molecule);
          return {
            id: `mol_${index + 1}`,
            name: molecule.name,
            smiles: molecule.smiles,
            molecularWeight: null,
            logP: null,
            properties: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        return null;
      } catch (error) {
        return null;
      }
    },

    // Get molecules with pagination and filtering
    molecules: async (parent, { filter, pagination }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Load all molecules
      const fs = require('fs').promises;
      const path = require('path');
      try {
        const data = await fs.readFile(path.join(__dirname, '../../../data/mock/molecules.json'), 'utf8');
        const moleculesData = JSON.parse(data);
        
        const molecules = moleculesData.map((mol, index) => ({
          id: `mol_${index + 1}`,
          name: mol.name,
          smiles: mol.smiles,
          molecularWeight: Math.random() * 500 + 100, // Mock weight
          logP: Math.random() * 6 - 1, // Mock logP
          properties: {},
          projectId: `proj_${(index % 3) + 1}`, // Mock project assignment
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        const filtered = filterMolecules(molecules, filter);
        return applyPagination(filtered, pagination);
      } catch (error) {
        return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
      }
    },

    // Search molecules
    searchMolecules: async (parent, { query, pagination }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const fs = require('fs').promises;
      const path = require('path');
      try {
        const data = await fs.readFile(path.join(__dirname, '../../../data/mock/molecules.json'), 'utf8');
        const moleculesData = JSON.parse(data);
        
        const molecules = moleculesData.map((mol, index) => ({
          id: `mol_${index + 1}`,
          name: mol.name,
          smiles: mol.smiles,
          molecularWeight: Math.random() * 500 + 100,
          logP: Math.random() * 6 - 1,
          properties: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        // Simple search by name or SMILES
        const searchResults = molecules.filter(mol => 
          mol.name.toLowerCase().includes(query.toLowerCase()) ||
          mol.smiles.includes(query)
        );

        return applyPagination(searchResults, pagination);
      } catch (error) {
        return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
      }
    },

    // Find similar molecules
    similarMolecules: async (parent, { smiles, threshold, limit }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Mock implementation - return random molecules
      const fs = require('fs').promises;
      const path = require('path');
      try {
        const data = await fs.readFile(path.join(__dirname, '../../../data/mock/molecules.json'), 'utf8');
        const moleculesData = JSON.parse(data);
        
        const molecules = moleculesData.slice(0, limit).map((mol, index) => ({
          id: `mol_${index + 1}`,
          name: mol.name,
          smiles: mol.smiles,
          molecularWeight: Math.random() * 500 + 100,
          logP: Math.random() * 6 - 1,
          properties: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        return molecules;
      } catch (error) {
        return [];
      }
    },
  },

  Molecule: {
    // Resolve molecule's predictions
    predictions: async (parent, args, { dataloaders }) => {
      return await dataloaders.mlPredictionsByMoleculeLoader.load(parent.id);
    },

    // Resolve molecule's safety events
    safetyEvents: async (parent, args, { dataloaders }) => {
      return await dataloaders.safetyEventsByMoleculeLoader.load(parent.id);
    },

    // Resolve molecule's clinical trials
    clinicalTrials: async (parent, args, { dataloaders }) => {
      // Mock implementation - return empty array for now
      return [];
    },

    // Resolve molecule's projects
    projects: async (parent, args, { dataloaders }) => {
      if (parent.projectId) {
        const project = await dataloaders.projectLoader.load(parent.projectId);
        return project ? [project] : [];
      }
      return [];
    },

    // Resolve molecule's research papers
    researchPapers: async (parent, args, { dataloaders }) => {
      // Mock implementation - return empty array for now
      return [];
    },
  },

  Mutation: {
    // Create new molecule
    createMolecule: async (parent, { input }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Validate SMILES format (basic check)
      if (!input.smiles || input.smiles.length < 3) {
        throw new UserInputError('Invalid SMILES format');
      }

      // Mock creation
      const newMolecule = {
        id: `mol_${Date.now()}`,
        name: input.name,
        smiles: input.smiles,
        molecularWeight: null,
        logP: null,
        properties: input.properties || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Publish subscription
      if (pubsub) {
        pubsub.publish('MOLECULE_CREATED', { moleculeCreated: newMolecule });
      }

      return newMolecule;
    },

    // Update molecule
    updateMolecule: async (parent, { id, input }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Mock update
      const updatedMolecule = {
        id,
        name: input.name,
        smiles: input.smiles,
        properties: input.properties,
        updatedAt: new Date(),
      };

      // Publish subscription
      if (pubsub) {
        pubsub.publish('MOLECULE_UPDATED', { 
          moleculeUpdated: updatedMolecule,
          id: id 
        });
      }

      return updatedMolecule;
    },

    // Delete molecule
    deleteMolecule: async (parent, { id }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Check permissions (mock)
      if (user.role !== 'admin' && user.role !== 'lead_scientist') {
        throw new AuthenticationError('Insufficient permissions');
      }

      // Mock deletion
      // Publish subscription
      if (pubsub) {
        pubsub.publish('MOLECULE_DELETED', { moleculeDeleted: id });
      }

      return true;
    },

    // Create multiple molecules
    createMoleculesBatch: async (parent, { molecules }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const createdMolecules = molecules.map((input, index) => {
        // Validate SMILES format
        if (!input.smiles || input.smiles.length < 3) {
          throw new UserInputError(`Invalid SMILES format for molecule ${index + 1}`);
        }

        return {
          id: `mol_batch_${Date.now()}_${index}`,
          name: input.name,
          smiles: input.smiles,
          molecularWeight: null,
          logP: null,
          properties: input.properties || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      // Publish subscriptions for each molecule
      if (pubsub) {
        createdMolecules.forEach(molecule => {
          pubsub.publish('MOLECULE_CREATED', { moleculeCreated: molecule });
        });
      }

      return createdMolecules;
    },
  },
};

module.exports = moleculeResolvers;