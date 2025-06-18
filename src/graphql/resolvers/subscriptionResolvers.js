const { withFilter } = require('graphql-subscriptions');

const subscriptionResolvers = {
  Subscription: {
    // Molecule subscriptions
    moleculeCreated: {
      subscribe: (parent, args, { pubsub }) => {
        return pubsub.asyncIterator(['MOLECULE_CREATED']);
      },
    },

    moleculeUpdated: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(['MOLECULE_UPDATED']),
        (payload, variables) => {
          // If no specific ID requested, send all updates
          if (!variables.id) return true;
          // Otherwise, only send updates for the specific molecule
          return payload.id === variables.id;
        }
      ),
    },

    moleculeDeleted: {
      subscribe: (parent, args, { pubsub }) => {
        return pubsub.asyncIterator(['MOLECULE_DELETED']);
      },
    },

    // Project subscriptions
    projectCreated: {
      subscribe: (parent, args, { pubsub }) => {
        return pubsub.asyncIterator(['PROJECT_CREATED']);
      },
    },

    projectUpdated: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(['PROJECT_UPDATED']),
        (payload, variables) => {
          if (!variables.id) return true;
          return payload.id === variables.id;
        }
      ),
    },

    projectDeleted: {
      subscribe: (parent, args, { pubsub }) => {
        return pubsub.asyncIterator(['PROJECT_DELETED']);
      },
    },

    // Clinical Trial subscriptions
    clinicalTrialCreated: {
      subscribe: (parent, args, { pubsub }) => {
        return pubsub.asyncIterator(['CLINICAL_TRIAL_CREATED']);
      },
    },

    clinicalTrialUpdated: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(['CLINICAL_TRIAL_UPDATED']),
        (payload, variables) => {
          if (!variables.id) return true;
          return payload.id === variables.id;
        }
      ),
    },

    clinicalTrialDeleted: {
      subscribe: (parent, args, { pubsub }) => {
        return pubsub.asyncIterator(['CLINICAL_TRIAL_DELETED']);
      },
    },

    // Safety Event subscriptions
    safetyEventCreated: {
      subscribe: (parent, args, { pubsub }) => {
        return pubsub.asyncIterator(['SAFETY_EVENT_CREATED']);
      },
    },

    safetyEventUpdated: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(['SAFETY_EVENT_UPDATED']),
        (payload, variables) => {
          if (!variables.id) return true;
          return payload.id === variables.id;
        }
      ),
    },

    // ML Prediction subscriptions
    mlPredictionCompleted: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(['ML_PREDICTION_COMPLETED']),
        (payload, variables) => {
          if (!variables.moleculeId) return true;
          return payload.moleculeId === variables.moleculeId;
        }
      ),
    },

    // Research Insight subscriptions
    researchInsightGenerated: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(['RESEARCH_INSIGHT_GENERATED']),
        (payload, variables) => {
          if (!variables.topic) return true;
          return payload.topic === variables.topic;
        }
      ),
    },

    // Activity feeds
    recentActivity: {
      subscribe: (parent, args, { pubsub }) => {
        return pubsub.asyncIterator(['RECENT_ACTIVITY']);
      },
    },

    userActivity: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(['USER_ACTIVITY']),
        (payload, variables) => {
          return payload.userId === variables.userId;
        }
      ),
    },

    projectActivity: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(['PROJECT_ACTIVITY']),
        (payload, variables) => {
          return payload.projectId === variables.projectId;
        }
      ),
    },

    // Notifications
    notifications: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(['NOTIFICATIONS']),
        (payload, variables) => {
          return payload.userId === variables.userId;
        }
      ),
    },

    systemAlerts: {
      subscribe: (parent, args, { pubsub }) => {
        return pubsub.asyncIterator(['SYSTEM_ALERTS']);
      },
    },

    // Real-time collaboration
    collaborationUpdates: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(['COLLABORATION_UPDATES']),
        (payload, variables) => {
          return payload.entityType === variables.entityType && 
                 payload.entityId === variables.entityId;
        }
      ),
    },
  },
};

module.exports = subscriptionResolvers;