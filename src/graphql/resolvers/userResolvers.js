const { AuthenticationError, ForbiddenError } = require('apollo-server-express');

const userResolvers = {
  Query: {
    // Get current authenticated user
    me: async (parent, args, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await dataloaders.userLoader.load(user.id);
    },

    // Get user by ID
    user: async (parent, { id }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await dataloaders.userLoader.load(id);
    },

    // Get all users (admin only)
    users: async (parent, { filter, pagination = {} }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      if (user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      // Mock implementation - in real app, would query database
      const mockUsers = [
        {
          id: 'user_1',
          email: 'alice@pharmos.com',
          username: 'alice',
          firstName: 'Alice',
          lastName: 'Johnson',
          role: 'researcher',
          department: 'Research',
          permissions: ['read', 'write'],
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user_2',
          email: 'bob@pharmos.com',
          username: 'bob',
          firstName: 'Bob',
          lastName: 'Smith',
          role: 'lead_scientist',
          department: 'Clinical Development',
          permissions: ['read', 'write', 'approve'],
          isActive: true,
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
      ];

      return mockUsers;
    },
  },

  User: {
    // Resolve user's projects
    projects: async (parent, args, { dataloaders }) => {
      return await dataloaders.projectsByUserLoader.load(parent.id);
    },
  },

  Mutation: {
    // Note: User mutations like updateUserProfile, changeUserRole, etc. 
    // are not defined in the schema, so they're not included here.
    // In a real implementation, these would be added to the schema first.
  },
};

module.exports = userResolvers;