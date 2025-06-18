const { AuthenticationError, UserInputError } = require('apollo-server-express');

// Helper function to apply pagination
function applyPagination(data, pagination = {}) {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;
  const offset = (page - 1) * limit;
  
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

const clinicalTrialResolvers = {
  Query: {
    // Get clinical trial by ID
    clinicalTrial: async (parent, { id }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await dataloaders.clinicalTrialLoader.load(id);
    },

    // Get clinical trial by trial ID
    clinicalTrialByTrialId: async (parent, { trialId }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Mock implementation
      const fs = require('fs').promises;
      const path = require('path');
      try {
        const data = await fs.readFile(path.join(__dirname, '../../../data/mock/clinical_trials.json'), 'utf8');
        const trials = JSON.parse(data);
        const trial = trials.find(t => t.trial_id === trialId);
        
        if (trial) {
          const index = trials.indexOf(trial);
          return {
            id: `trial_${index + 1}`,
            trialId: trial.trial_id,
            title: trial.title,
            phase: trial.phase.replace(' ', '_').toUpperCase(),
            status: trial.status.toUpperCase(),
            condition: trial.condition,
            intervention: trial.intervention,
            sponsor: trial.sponsor,
            enrollment: trial.enrollment,
            startDate: new Date(trial.start_date),
            completionDate: trial.completion_date ? new Date(trial.completion_date) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        return null;
      } catch (error) {
        return null;
      }
    },

    // Get clinical trials with filtering
    clinicalTrials: async (parent, { filter, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const fs = require('fs').promises;
      const path = require('path');
      try {
        const data = await fs.readFile(path.join(__dirname, '../../../data/mock/clinical_trials.json'), 'utf8');
        const trialsData = JSON.parse(data);
        
        const trials = trialsData.map((trial, index) => ({
          id: `trial_${index + 1}`,
          trialId: trial.trial_id,
          title: trial.title,
          phase: trial.phase.replace(' ', '_').toUpperCase(),
          status: trial.status.toUpperCase(),
          condition: trial.condition,
          intervention: trial.intervention,
          sponsor: trial.sponsor,
          enrollment: trial.enrollment,
          startDate: new Date(trial.start_date),
          completionDate: trial.completion_date ? new Date(trial.completion_date) : null,
          projectId: `proj_${(index % 3) + 1}`, // Mock project assignment
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        // Apply filters
        let filtered = trials;
        if (filter) {
          filtered = trials.filter(trial => {
            if (filter.phase && trial.phase !== filter.phase) return false;
            if (filter.status && trial.status !== filter.status) return false;
            if (filter.condition && !trial.condition.toLowerCase().includes(filter.condition.toLowerCase())) return false;
            if (filter.sponsor && !trial.sponsor.toLowerCase().includes(filter.sponsor.toLowerCase())) return false;
            if (filter.projectId && trial.projectId !== filter.projectId) return false;
            return true;
          });
        }

        return applyPagination(filtered, pagination);
      } catch (error) {
        return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
      }
    },

    // Search clinical trials
    searchClinicalTrials: async (parent, { query, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const fs = require('fs').promises;
      const path = require('path');
      try {
        const data = await fs.readFile(path.join(__dirname, '../../../data/mock/clinical_trials.json'), 'utf8');
        const trialsData = JSON.parse(data);
        
        const trials = trialsData.map((trial, index) => ({
          id: `trial_${index + 1}`,
          trialId: trial.trial_id,
          title: trial.title,
          phase: trial.phase.replace(' ', '_').toUpperCase(),
          status: trial.status.toUpperCase(),
          condition: trial.condition,
          intervention: trial.intervention,
          sponsor: trial.sponsor,
          enrollment: trial.enrollment,
          startDate: new Date(trial.start_date),
          completionDate: trial.completion_date ? new Date(trial.completion_date) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        const searchResults = trials.filter(trial => 
          trial.title.toLowerCase().includes(query.toLowerCase()) ||
          trial.condition.toLowerCase().includes(query.toLowerCase()) ||
          trial.intervention.toLowerCase().includes(query.toLowerCase())
        );

        return applyPagination(searchResults, pagination);
      } catch (error) {
        return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
      }
    },
  },

  ClinicalTrial: {
    // Resolve trial's project
    project: async (parent, args, { dataloaders }) => {
      if (parent.projectId) {
        return await dataloaders.projectLoader.load(parent.projectId);
      }
      return null;
    },

    // Resolve trial's molecules
    molecules: async (parent, args, { dataloaders }) => {
      // Mock implementation - return empty array
      return [];
    },

    // Resolve trial's safety events
    safetyEvents: async (parent, args, { dataloaders }) => {
      // Mock implementation - return empty array
      return [];
    },

    // Resolve trial's publications
    publications: async (parent, args, { dataloaders }) => {
      // Mock implementation - return empty array
      return [];
    },
  },

  Mutation: {
    // Create clinical trial
    createClinicalTrial: async (parent, { input }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Validate required fields
      if (!input.trialId || !input.title || !input.phase || !input.condition) {
        throw new UserInputError('Missing required fields');
      }

      const newTrial = {
        id: `trial_${Date.now()}`,
        trialId: input.trialId,
        title: input.title,
        phase: input.phase,
        status: input.status,
        condition: input.condition,
        intervention: input.intervention,
        sponsor: input.sponsor,
        enrollment: input.enrollment,
        startDate: input.startDate,
        completionDate: input.completionDate,
        description: input.description,
        primaryEndpoint: input.primaryEndpoint,
        secondaryEndpoints: input.secondaryEndpoints || [],
        eligibilityCriteria: input.eligibilityCriteria,
        locations: input.locations || [],
        projectId: input.projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Publish subscription
      if (pubsub) {
        pubsub.publish('CLINICAL_TRIAL_CREATED', { clinicalTrialCreated: newTrial });
      }

      return newTrial;
    },

    // Update clinical trial
    updateClinicalTrial: async (parent, { id, input }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Mock update
      const updatedTrial = {
        id,
        ...input,
        updatedAt: new Date(),
      };

      // Publish subscription
      if (pubsub) {
        pubsub.publish('CLINICAL_TRIAL_UPDATED', { 
          clinicalTrialUpdated: updatedTrial,
          id: id 
        });
      }

      return updatedTrial;
    },

    // Delete clinical trial
    deleteClinicalTrial: async (parent, { id }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Check permissions
      if (!['admin', 'clinical_lead'].includes(user.role)) {
        throw new AuthenticationError('Insufficient permissions');
      }

      // Publish subscription
      if (pubsub) {
        pubsub.publish('CLINICAL_TRIAL_DELETED', { clinicalTrialDeleted: id });
      }

      return true;
    },
  },
};

module.exports = clinicalTrialResolvers;