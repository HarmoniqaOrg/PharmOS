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

const researchPaperResolvers = {
  Query: {
    researchPaper: async (parent, { id }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await dataloaders.researchPaperLoader.load(id);
    },

    researchPaperByPmid: async (parent, { pmid }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      // Mock implementation
      return null;
    },

    researchPapers: async (parent, { filter, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Mock implementation
      const mockPapers = [];
      return applyPagination(mockPapers, pagination);
    },

    searchResearchPapers: async (parent, { query, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Mock implementation
      const mockPapers = [];
      return applyPagination(mockPapers, pagination);
    },
  },

  ResearchPaper: {
    project: async (parent, args, { dataloaders }) => {
      if (parent.projectId) {
        return await dataloaders.projectLoader.load(parent.projectId);
      }
      return null;
    },

    molecules: async (parent, args, { dataloaders }) => {
      return [];
    },

    clinicalTrials: async (parent, args, { dataloaders }) => {
      return [];
    },

    researchInsights: async (parent, args, { dataloaders }) => {
      return [];
    },
  },

  Mutation: {
    createResearchPaper: async (parent, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const newPaper = {
        id: `paper_${Date.now()}`,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return newPaper;
    },

    updateResearchPaper: async (parent, { id, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const updatedPaper = {
        id,
        ...input,
        updatedAt: new Date(),
      };

      return updatedPaper;
    },

    deleteResearchPaper: async (parent, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return true;
    },
  },
};

module.exports = researchPaperResolvers;