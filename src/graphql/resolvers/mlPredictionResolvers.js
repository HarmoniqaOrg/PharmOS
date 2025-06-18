const { AuthenticationError } = require('apollo-server-express');

const mlPredictionResolvers = {
  Query: {
    mlPrediction: async (parent, { id }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await dataloaders.mlPredictionLoader.load(id);
    },

    mlPredictions: async (parent, { moleculeId, modelType, pagination }, { user, dataloaders }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      if (moleculeId) {
        return await dataloaders.mlPredictionsByMoleculeLoader.load(moleculeId);
      }
      
      return [];
    },
  },

  MLPrediction: {
    molecule: async (parent, args, { dataloaders }) => {
      return await dataloaders.moleculeLoader.load(parent.moleculeId);
    },
  },

  Mutation: {
    createMLPrediction: async (parent, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const newPrediction = {
        id: `pred_${Date.now()}`,
        ...input,
        timestamp: new Date(),
      };

      return newPrediction;
    },

    requestPrediction: async (parent, { moleculeId, modelType }, { user, pubsub }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Mock prediction request
      const prediction = {
        id: `pred_${Date.now()}`,
        moleculeId,
        modelType,
        modelVersion: '1.0.0',
        predictions: {
          toxicity_score: Math.random(),
          bioavailability: Math.random(),
        },
        confidence: Math.random(),
        timestamp: new Date(),
      };

      if (pubsub) {
        pubsub.publish('ML_PREDICTION_COMPLETED', { 
          mlPredictionCompleted: prediction,
          moleculeId 
        });
      }

      return prediction;
    },
  },
};

module.exports = mlPredictionResolvers;