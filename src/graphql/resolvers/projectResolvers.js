const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');

// Helper function to apply pagination (reused from molecule resolvers)
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

// Helper function to filter projects
function filterProjects(projects, filter = {}) {
  return projects.filter(project => {
    if (filter.name && !project.name.toLowerCase().includes(filter.name.toLowerCase())) {
      return false;
    }
    if (filter.status && project.status !== filter.status) {
      return false;
    }
    if (filter.type && project.type !== filter.type) {
      return false;
    }
    if (filter.leadId && project.leadId !== filter.leadId) {
      return false;
    }
    if (filter.teamMemberId && !project.teamIds?.includes(filter.teamMemberId)) {
      return false;
    }
    if (filter.startDateAfter && new Date(project.startDate) < new Date(filter.startDateAfter)) {
      return false;
    }
    if (filter.startDateBefore && new Date(project.startDate) > new Date(filter.startDateBefore)) {
      return false;
    }
    if (filter.budget && project.budget !== filter.budget) {
      return false;
    }
    return true;
  });
}

// Mock projects data
const mockProjects = [
  {
    id: 'proj_1',
    name: 'CardioVascular Drug Discovery',
    description: 'AI-driven discovery of novel cardiovascular therapeutics',
    status: 'ACTIVE',
    type: 'DRUG_DISCOVERY',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2025-12-31'),
    budget: 2500000,
    leadId: 'user_1',
    teamIds: ['user_1', 'user_2', 'user_3'],
    progress: 45.5,
    milestones: [
      'Literature review completed',
      'Target identification',
      'Hit compound discovery',
      'Lead optimization in progress'
    ],
    tags: ['cardiovascular', 'ai-driven', 'drug-discovery'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date(),
  },
  {
    id: 'proj_2',
    name: 'Oncology Biomarker Study',
    description: 'Identifying predictive biomarkers for cancer immunotherapy',
    status: 'PLANNING',
    type: 'RESEARCH',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2025-06-30'),
    budget: 1800000,
    leadId: 'user_2',
    teamIds: ['user_2', 'user_4', 'user_5'],
    progress: 15.0,
    milestones: [
      'Protocol development',
      'Ethics approval pending',
      'Patient recruitment planning'
    ],
    tags: ['oncology', 'biomarkers', 'immunotherapy'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
  },
  {
    id: 'proj_3',
    name: 'PharmOS-001 Phase III Trial',
    description: 'Phase III clinical trial for PharmOS-001 in heart failure patients',
    status: 'ACTIVE',
    type: 'CLINICAL_DEVELOPMENT',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    budget: 5000000,
    leadId: 'user_3',
    teamIds: ['user_3', 'user_6', 'user_7'],
    progress: 62.3,
    milestones: [
      'Trial initiated',
      'First patient enrolled',
      '250 patients enrolled',
      'Interim analysis completed'
    ],
    tags: ['clinical-trial', 'phase-iii', 'heart-failure'],
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date(),
  },
];

const projectResolvers = {
  Query: {
    // Get project by ID
    project: async (parent, { id }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await dataloaders.projectLoader.load(id);
    },

    // Get projects with pagination and filtering
    projects: async (parent, { filter, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const filtered = filterProjects(mockProjects, filter);
      return applyPagination(filtered, pagination);
    },

    // Search projects
    searchProjects: async (parent, { query, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const searchResults = mockProjects.filter(project => 
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.description.toLowerCase().includes(query.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      return applyPagination(searchResults, pagination);
    },

    // Get current user's projects
    myProjects: async (parent, { pagination }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const userProjects = mockProjects.filter(project => 
        project.leadId === user.id || project.teamIds.includes(user.id)
      );

      return applyPagination(userProjects, pagination);
    },
  },

  Project: {
    // Resolve project lead
    lead: async (parent, args, { dataloaders }) => {
      if (parent.leadId) {
        return await dataloaders.userLoader.load(parent.leadId);
      }
      return null;
    },

    // Resolve project team members
    team: async (parent, args, { dataloaders }) => {
      if (parent.teamIds && parent.teamIds.length > 0) {
        return await dataloaders.userLoader.loadMany(parent.teamIds);
      }
      return [];
    },

    // Resolve project molecules
    molecules: async (parent, args, { dataloaders }) => {
      return await dataloaders.moleculesByProjectLoader.load(parent.id);
    },

    // Resolve project clinical trials
    clinicalTrials: async (parent, args, { dataloaders }) => {
      return await dataloaders.clinicalTrialsByProjectLoader.load(parent.id);
    },

    // Resolve project research papers
    researchPapers: async (parent, args, { dataloaders }) => {
      // Mock implementation - return empty array for now
      return [];
    },
  },

  Mutation: {
    // Create new project
    createProject: async (parent, { input }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Check if user has permission to create projects
      if (!['admin', 'lead_scientist', 'project_manager'].includes(user.role)) {
        throw new ForbiddenError('Insufficient permissions to create projects');
      }

      // Validate required fields
      if (!input.name || !input.type || !input.status) {
        throw new UserInputError('Missing required fields');
      }

      const newProject = {
        id: `proj_${Date.now()}`,
        name: input.name,
        description: input.description,
        status: input.status,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        budget: input.budget,
        leadId: input.leadId || user.id,
        teamIds: input.teamIds || [user.id],
        progress: 0,
        milestones: input.milestones || [],
        tags: input.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Publish subscription
      if (pubsub) {
        pubsub.publish('PROJECT_CREATED', { projectCreated: newProject });
      }

      return newProject;
    },

    // Update project
    updateProject: async (parent, { id, input }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Find project and check permissions
      const project = mockProjects.find(p => p.id === id);
      if (!project) {
        throw new UserInputError('Project not found');
      }

      // Check if user is project lead or admin
      if (project.leadId !== user.id && !['admin', 'project_manager'].includes(user.role)) {
        throw new ForbiddenError('Insufficient permissions to update this project');
      }

      const updatedProject = {
        ...project,
        ...input,
        id,
        updatedAt: new Date(),
      };

      // Publish subscription
      if (pubsub) {
        pubsub.publish('PROJECT_UPDATED', { 
          projectUpdated: updatedProject,
          id: id 
        });
      }

      return updatedProject;
    },

    // Delete project
    deleteProject: async (parent, { id }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Find project and check permissions
      const project = mockProjects.find(p => p.id === id);
      if (!project) {
        throw new UserInputError('Project not found');
      }

      // Only admin or project lead can delete
      if (project.leadId !== user.id && user.role !== 'admin') {
        throw new ForbiddenError('Insufficient permissions to delete this project');
      }

      // Publish subscription
      if (pubsub) {
        pubsub.publish('PROJECT_DELETED', { projectDeleted: id });
      }

      return true;
    },

    // Add user to project
    addUserToProject: async (parent, { userId, projectId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const project = mockProjects.find(p => p.id === projectId);
      if (!project) {
        throw new UserInputError('Project not found');
      }

      // Check permissions
      if (project.leadId !== user.id && !['admin', 'project_manager'].includes(user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      // Mock implementation - would update database
      return true;
    },

    // Remove user from project
    removeUserFromProject: async (parent, { userId, projectId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const project = mockProjects.find(p => p.id === projectId);
      if (!project) {
        throw new UserInputError('Project not found');
      }

      // Check permissions
      if (project.leadId !== user.id && !['admin', 'project_manager'].includes(user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      // Mock implementation - would update database
      return true;
    },
  },
};

module.exports = projectResolvers;