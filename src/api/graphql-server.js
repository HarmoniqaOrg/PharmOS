const { ApolloServer } = require('apollo-server-express');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { PubSub } = require('graphql-subscriptions');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Import GraphQL components
const resolvers = require('../graphql/resolvers');
const { createDataLoaders } = require('../graphql/dataloaders');

// Create PubSub instance for subscriptions
const pubsub = new PubSub();

// Load GraphQL schema
const typeDefs = fs.readFileSync(
  path.join(__dirname, '../graphql/schema.graphql'),
  'utf8'
);

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Mock authentication middleware
function authenticateUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // Mock authentication - in real app, would verify JWT token
  if (!token) {
    return null;
  }
  
  // Mock user based on token
  const mockUsers = {
    'admin-token': {
      id: 'user_admin',
      email: 'admin@pharmos.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      department: 'Administration',
      permissions: ['read', 'write', 'admin'],
    },
    'researcher-token': {
      id: 'user_researcher',
      email: 'researcher@pharmos.com',
      username: 'researcher',
      firstName: 'Jane',
      lastName: 'Researcher',
      role: 'researcher',
      department: 'Research',
      permissions: ['read', 'write'],
    },
    'demo-token': {
      id: 'user_demo',
      email: 'demo@pharmos.com',
      username: 'demo',
      firstName: 'Demo',
      lastName: 'User',
      role: 'researcher',
      department: 'Research',
      permissions: ['read'],
    },
  };
  
  return mockUsers[token] || null;
}

// Create Apollo Server
const server = new ApolloServer({
  schema,
  context: ({ req, connection }) => {
    // Handle subscription connections
    if (connection) {
      return {
        ...connection.context,
        pubsub,
        dataloaders: createDataLoaders(),
      };
    }
    
    // Handle HTTP requests
    const user = authenticateUser(req);
    
    return {
      user,
      pubsub,
      dataloaders: createDataLoaders(),
      req,
    };
  },
  subscriptions: {
    onConnect: (connectionParams, webSocket, context) => {
      // Handle WebSocket authentication
      const token = connectionParams.authorization?.replace('Bearer ', '');
      const user = token ? authenticateUser({ headers: { authorization: `Bearer ${token}` } }) : null;
      
      console.log('WebSocket connection established', user ? `for user ${user.username}` : 'anonymously');
      
      return {
        user,
        pubsub,
        dataloaders: createDataLoaders(),
      };
    },
    onDisconnect: (webSocket, context) => {
      console.log('WebSocket connection closed');
    },
  },
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };
  },
  introspection: true,
  playground: process.env.NODE_ENV === 'development',
});

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PharmOS GraphQL API',
    version: '1.0.0',
  });
});

// GraphQL endpoint info
app.get('/graphql-info', (req, res) => {
  res.json({
    graphql: '/graphql',
    playground: process.env.NODE_ENV === 'development' ? '/graphql' : null,
    subscriptions: 'ws://localhost:4000/graphql',
    authentication: {
      header: 'Authorization',
      format: 'Bearer <token>',
      testTokens: {
        admin: 'admin-token',
        researcher: 'researcher-token',
        demo: 'demo-token',
      },
    },
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Start server
async function startServer() {
  const PORT = process.env.GRAPHQL_PORT || 4000;
  
  try {
    // Start Apollo Server first (required in v3)
    await server.start();
    
    // Apply middleware after server starts
    server.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false, // We handle CORS above
    });

    await new Promise((resolve) => {
      httpServer.listen(PORT, () => {
        console.log(`🚀 PharmOS GraphQL Server ready at http://localhost:${PORT}${server.graphqlPath}`);
        console.log(`🔗 GraphQL Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
        
        // Create subscription server
        SubscriptionServer.create(
          {
            schema,
            execute,
            subscribe,
            onConnect: (connectionParams, webSocket, context) => {
              const token = connectionParams.authorization?.replace('Bearer ', '');
              const user = token ? authenticateUser({ headers: { authorization: `Bearer ${token}` } }) : null;
              
              console.log('WebSocket connection established', user ? `for user ${user.username}` : 'anonymously');
              
              return {
                user,
                pubsub,
                dataloaders: createDataLoaders(),
              };
            },
            onDisconnect: (webSocket, context) => {
              console.log('WebSocket connection closed');
            },
          },
          {
            server: httpServer,
            path: server.graphqlPath,
          }
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎮 GraphQL Playground available at http://localhost:${PORT}${server.graphqlPath}`);
          console.log('\n📖 Test Authentication Tokens:');
          console.log('   Admin: admin-token');
          console.log('   Researcher: researcher-token');
          console.log('   Demo: demo-token');
          console.log('\n💡 Usage: Set Authorization header to "Bearer <token>"');
        }
        
        resolve();
      });
    });
  } catch (error) {
    console.error('Failed to start GraphQL server:', error);
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('GraphQL server closed');
    process.exit(0);
  });
});

// Export for testing or external use
module.exports = { app, server, httpServer, startServer };

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}