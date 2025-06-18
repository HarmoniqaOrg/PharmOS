const { AuthenticationError } = require('apollo-server-express');

// Helper function for pagination
function applyPagination(data, pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;
  const paginatedData = data.slice(offset, offset + limit);
  
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

const safetyEventResolvers = {
  Query: {
    safetyEvent: async (parent, { id }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await dataloaders.safetyEventLoader.load(id);
    },

    safetyEvents: async (parent, { filter, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Mock implementation
      const mockEvents = [];
      return applyPagination(mockEvents, pagination);
    },

    searchSafetyEvents: async (parent, { query, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Mock implementation
      const mockEvents = [];
      return applyPagination(mockEvents, pagination);
    },
  },

  SafetyEvent: {
    molecule: async (parent, args, { dataloaders }) => {
      if (parent.moleculeId) {
        return await dataloaders.moleculeLoader.load(parent.moleculeId);
      }
      return null;
    },

    clinicalTrial: async (parent, args, { dataloaders }) => {
      if (parent.clinicalTrialId) {
        return await dataloaders.clinicalTrialLoader.load(parent.clinicalTrialId);
      }
      return null;
    },

    reportedBy: async (parent, args, { dataloaders }) => {
      if (parent.reportedById) {
        return await dataloaders.userLoader.load(parent.reportedById);
      }
      return null;
    },
  },

  Mutation: {
    createSafetyEvent: async (parent, { input }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const newEvent = {
        id: `event_${Date.now()}`,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (pubsub) {
        pubsub.publish('SAFETY_EVENT_CREATED', { safetyEventCreated: newEvent });
      }

      return newEvent;
    },

    updateSafetyEvent: async (parent, { id, input }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const updatedEvent = {
        id,
        ...input,
        updatedAt: new Date(),
      };

      if (pubsub) {
        pubsub.publish('SAFETY_EVENT_UPDATED', { safetyEventUpdated: updatedEvent, id });
      }

      return updatedEvent;
    },

    deleteSafetyEvent: async (parent, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return true;
    },
  },
};

module.exports = safetyEventResolvers;