const { merge } = require('lodash');

// Import custom scalars
const scalars = require('../scalars');

// Import individual resolvers
const userResolvers = require('./userResolvers');
const moleculeResolvers = require('./moleculeResolvers');
const projectResolvers = require('./projectResolvers');
const clinicalTrialResolvers = require('./clinicalTrialResolvers');
const researchPaperResolvers = require('./researchPaperResolvers');
const safetyEventResolvers = require('./safetyEventResolvers');
const mlPredictionResolvers = require('./mlPredictionResolvers');
const researchInsightResolvers = require('./researchInsightResolvers');
const subscriptionResolvers = require('./subscriptionResolvers');

// Combine all resolvers
const resolvers = merge(
  scalars,
  userResolvers,
  moleculeResolvers,
  projectResolvers,
  clinicalTrialResolvers,
  researchPaperResolvers,
  safetyEventResolvers,
  mlPredictionResolvers,
  researchInsightResolvers,
  subscriptionResolvers
);

module.exports = resolvers;