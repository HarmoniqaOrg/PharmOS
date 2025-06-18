# PharmOS GraphQL API

## Overview

The PharmOS GraphQL API provides a comprehensive, type-safe interface for pharmaceutical research data. This schema supports real-time subscriptions, efficient data fetching with DataLoader patterns, and rich filtering capabilities.

## Schema Design

### Core Entities

1. **User** - User management and authentication
2. **Molecule** - Chemical compounds with SMILES notation
3. **ClinicalTrial** - Clinical trial data and management
4. **ResearchPaper** - Academic publications and literature
5. **SafetyEvent** - Adverse drug events and safety monitoring
6. **MLPrediction** - Machine learning predictions for molecules
7. **ResearchInsight** - AI-generated research insights

### Key Features

- **Type Safety**: Strongly typed schema with comprehensive enums
- **Pagination**: Built-in pagination for all list queries
- **Filtering**: Rich filtering capabilities for each entity type
- **Real-time Updates**: WebSocket subscriptions for live data
- **Analytics**: Aggregated data queries for dashboards
- **Batch Operations**: Efficient bulk operations
- **Cross-entity Relationships**: Linked data across all entities

## Query Examples

### Basic Queries

```graphql
# Get all molecules with pagination
query GetMolecules {
  molecules(pagination: { page: 1, limit: 10 }) {
    data {
      id
      name
      smiles
      molecularWeight
      logP
    }
    pagination {
      page
      total
      hasNextPage
    }
  }
}

# Get molecule with all related data
query GetMoleculeDetails($id: ID!) {
  molecule(id: $id) {
    id
    name
    smiles
    properties
    predictions {
      modelType
      confidence
      predictions
    }
    safetyEvents {
      eventType
      severity
      outcome
    }
    clinicalTrials {
      title
      phase
      status
    }
  }
}
```

### Advanced Filtering

```graphql
# Filter clinical trials by phase and status
query FilterTrials {
  clinicalTrials(
    filter: {
      phase: PHASE_3
      status: RECRUITING
      startDateAfter: "2024-01-01"
    }
    pagination: { limit: 20, sortBy: "startDate" }
  ) {
    data {
      trialId
      title
      condition
      enrollment
      sponsor
    }
  }
}

# Search molecules with ML predictions
query SearchMolecules($query: String!) {
  searchMolecules(
    query: $query
    pagination: { limit: 10 }
  ) {
    data {
      name
      smiles
      predictions {
        toxicityScore
        bioavailability
        confidence
      }
    }
  }
}
```

### Analytics Queries

```graphql
# Get safety analytics
query SafetyAnalytics {
  safetyAnalytics(
    filter: {
      reportedAfter: "2024-01-01"
      severity: SEVERE
    }
  ) {
    totalEvents
    bySeverity
    byOutcome
    byEventType
  }
}

# Clinical trial analytics
query TrialAnalytics {
  clinicalTrialAnalytics {
    totalCount
    byPhase
    byStatus
    enrollmentStats
  }
}
```

## Mutation Examples

### Creating Entities

```graphql
# Create a new molecule
mutation CreateMolecule($input: MoleculeInput!) {
  createMolecule(input: $input) {
    id
    name
    smiles
    createdAt
  }
}

# Create clinical trial
mutation CreateTrial($input: ClinicalTrialInput!) {
  createClinicalTrial(input: $input) {
    id
    trialId
    title
    phase
    status
  }
}
```

### Batch Operations

```graphql
# Create multiple molecules at once
mutation CreateMoleculesBatch($molecules: [MoleculeInput!]!) {
  createMoleculesBatch(molecules: $molecules) {
    id
    name
    smiles
  }
}
```

### ML Operations

```graphql
# Request ML prediction
mutation RequestPrediction($moleculeId: ID!, $modelType: PredictionModel!) {
  requestPrediction(moleculeId: $moleculeId, modelType: $modelType) {
    id
    predictions
    confidence
    timestamp
  }
}

# Generate new molecules
mutation GenerateMolecules($scaffold: String!, $count: Int) {
  generateMolecules(scaffold: $scaffold, count: $count) {
    name
    smiles
    properties
  }
}
```

## Subscription Examples

### Real-time Updates

```graphql
# Subscribe to new safety events
subscription SafetyEvents {
  safetyEventCreated {
    id
    eventType
    severity
    drugName
    patientAge
    reportedDate
  }
}

# Subscribe to ML prediction completion
subscription MLPredictions($moleculeId: ID) {
  mlPredictionCompleted(moleculeId: $moleculeId) {
    id
    predictions
    confidence
    molecule {
      name
      smiles
    }
  }
}

# Subscribe to activity feed
subscription ActivityFeed {
  recentActivity
}
```

## DataLoader Patterns

The schema is designed for efficient data loading with DataLoader:

### Resolver Implementation Guidelines

```javascript
// Example resolver with DataLoader
const resolvers = {
  Molecule: {
    predictions: async (parent, args, { dataloaders }) => {
      return dataloaders.predictionsByMoleculeId.load(parent.id);
    },
    safetyEvents: async (parent, args, { dataloaders }) => {
      return dataloaders.safetyEventsByMoleculeId.load(parent.id);
    },
    clinicalTrials: async (parent, args, { dataloaders }) => {
      return dataloaders.clinicalTrialsByMoleculeId.load(parent.id);
    }
  }
};
```

### DataLoader Setup

```javascript
// Example DataLoader configuration
const createDataLoaders = () => ({
  predictionsByMoleculeId: new DataLoader(async (moleculeIds) => {
    const predictions = await MLPrediction.findByMoleculeIds(moleculeIds);
    return moleculeIds.map(id => 
      predictions.filter(p => p.moleculeId === id)
    );
  }),
  
  safetyEventsByMoleculeId: new DataLoader(async (moleculeIds) => {
    const events = await SafetyEvent.findByMoleculeIds(moleculeIds);
    return moleculeIds.map(id => 
      events.filter(e => e.moleculeId === id)
    );
  })
});
```

## Error Handling

### Custom Error Types

```graphql
type MutationResult {
  success: Boolean!
  message: String
  errors: [FieldError!]
}

type FieldError {
  field: String!
  message: String!
}
```

### Error Examples

```javascript
// Validation errors
throw new UserInputError('Invalid SMILES format', {
  field: 'smiles',
  message: 'The provided SMILES string is not valid'
});

// Authorization errors
throw new ForbiddenError('Insufficient permissions');

// Not found errors
throw new ApolloError('Molecule not found', 'MOLECULE_NOT_FOUND');
```

## Pagination Implementation

### Cursor-based Pagination

```graphql
type Connection {
  edges: [Edge!]!
  pageInfo: PageInfo!
}

type Edge {
  node: Node!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

## Security Considerations

### Authentication

```javascript
// Context setup with authentication
const context = ({ req }) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = verifyToken(token);
  
  return {
    user,
    dataloaders: createDataLoaders(),
    isAuthenticated: !!user
  };
};
```

### Authorization

```javascript
// Field-level authorization
const resolvers = {
  Query: {
    users: async (parent, args, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }
      return User.findAll();
    }
  }
};
```

## Performance Optimization

### Query Complexity Analysis

```javascript
import { createComplexityLimitRule } from 'graphql-query-complexity';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [createComplexityLimitRule(1000)]
});
```

### Caching

```javascript
// Redis caching for expensive operations
const resolvers = {
  Query: {
    moleculeAnalytics: async (parent, args, { redis }) => {
      const cacheKey = `analytics:molecule:${JSON.stringify(args)}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const result = await calculateMoleculeAnalytics(args);
      await redis.setex(cacheKey, 300, JSON.stringify(result));
      
      return result;
    }
  }
};
```

## Next Steps

1. **Implement Resolvers**: Create resolver functions for all queries and mutations
2. **Set up DataLoaders**: Implement efficient data loading patterns
3. **Add Authentication**: Integrate with existing auth system
4. **Configure Subscriptions**: Set up WebSocket server for real-time features
5. **Add Validation**: Implement input validation and sanitization
6. **Performance Testing**: Load test with realistic data volumes
7. **Documentation**: Generate API docs with GraphQL Playground

## Related Files

- `src/graphql/resolvers/` - Resolver implementations
- `src/graphql/dataloaders/` - DataLoader configurations
- `src/graphql/scalars/` - Custom scalar type definitions
- `src/graphql/directives/` - Custom directives
- `src/graphql/middleware/` - Authentication and validation middleware