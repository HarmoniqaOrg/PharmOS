const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const mockDataService = require('../services/mockDataService');
const authService = require('../services/authService');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
  }
});

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Dashboard stats endpoint
app.get('/api/v1/stats', async (req, res) => {
  try {
    const stats = await mockDataService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// API routes
app.get('/api/v1/status', (req, res) => {
  res.json({
    version: '0.1.0',
    api: 'PharmOS Platform API',
    endpoints: {
      research: '/api/v1/research',
      molecules: '/api/v1/molecules',
      clinical: '/api/v1/clinical',
      safety: '/api/v1/safety',
      auth: '/api/v1/auth'
    }
  });
});

// Auth endpoints
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const result = await authService.authenticate(email, password);
    res.json(result);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await authService.createUser({ email, password, full_name });
    const token = authService.generateToken(user);
    
    res.status(201).json({ user, token });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/v1/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Research endpoints
app.get('/api/v1/research/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    const papers = await mockDataService.getResearchPapers(query);
    const results = papers.slice(0, parseInt(limit));
    
    res.json({
      query,
      results: results.map((paper, index) => ({
        id: `PAPER-${index + 1}`,
        ...paper
      })),
      count: results.length,
      total: papers.length
    });
  } catch (error) {
    logger.error('Error searching research papers:', error);
    res.status(500).json({ error: 'Failed to search papers' });
  }
});

app.get('/api/v1/research/insights', async (req, res) => {
  try {
    const { topic } = req.query;
    const insights = await mockDataService.getResearchInsights(topic);
    res.json({ insights });
  } catch (error) {
    logger.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Molecule endpoints
app.get('/api/v1/molecules', async (req, res) => {
  try {
    const molecules = await mockDataService.getMolecules();
    res.json({ molecules });
  } catch (error) {
    logger.error('Error fetching molecules:', error);
    res.status(500).json({ error: 'Failed to fetch molecules' });
  }
});

app.post('/api/v1/molecules/analyze', async (req, res) => {
  try {
    const { smiles, properties } = req.body;
    
    if (!smiles) {
      return res.status(400).json({ error: 'SMILES string is required' });
    }
    
    const calculatedProps = mockDataService.calculateMolecularProperties(smiles);
    const analysis = {
      smiles,
      analysis: {
        molecular_weight: calculatedProps.molecularWeight.toFixed(2),
        logp: calculatedProps.logP.toFixed(2),
        hbond_donors: calculatedProps.hbondDonors,
        hbond_acceptors: calculatedProps.hbondAcceptors,
        rotatable_bonds: calculatedProps.rotableBonds,
        polar_surface_area: calculatedProps.polarSurfaceArea.toFixed(2),
        complexity: calculatedProps.complexity,
        properties: properties || []
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(analysis);
  } catch (error) {
    logger.error('Error analyzing molecule:', error);
    res.status(500).json({ error: 'Failed to analyze molecule' });
  }
});

app.get('/api/v1/molecules/:id/predictions', async (req, res) => {
  try {
    const { id } = req.params;
    const predictions = await mockDataService.getMLPredictions(id);
    
    if (!predictions) {
      return res.status(404).json({ error: 'Predictions not found' });
    }
    
    res.json(predictions);
  } catch (error) {
    logger.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// Clinical trials endpoints
app.get('/api/v1/clinical/trials', async (req, res) => {
  try {
    const { status, phase, condition } = req.query;
    const trials = await mockDataService.getClinicalTrials({ status, phase, condition });
    
    res.json({
      filters: { status, phase, condition },
      trials,
      count: trials.length,
      total: trials.length
    });
  } catch (error) {
    logger.error('Error fetching clinical trials:', error);
    res.status(500).json({ error: 'Failed to fetch trials' });
  }
});

app.get('/api/v1/clinical/trials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const trials = await mockDataService.getClinicalTrials();
    const trial = trials.find(t => t.trial_id === id);
    
    if (!trial) {
      return res.status(404).json({ error: 'Trial not found' });
    }
    
    res.json(trial);
  } catch (error) {
    logger.error('Error fetching trial details:', error);
    res.status(500).json({ error: 'Failed to fetch trial' });
  }
});

// Safety monitoring endpoints
app.get('/api/v1/safety/events', async (req, res) => {
  try {
    const { drug } = req.query;
    const events = await mockDataService.getSafetyEvents(drug);
    
    res.json({
      events,
      count: events.length,
      summary: {
        mild: events.filter(e => e.severity === 'Mild').length,
        moderate: events.filter(e => e.severity === 'Moderate').length,
        severe: events.filter(e => e.severity === 'Severe').length
      }
    });
  } catch (error) {
    logger.error('Error fetching safety events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/v1/safety/events', async (req, res) => {
  try {
    const { drug_name, event_type, severity, description } = req.body;
    
    if (!drug_name || !event_type || !severity) {
      return res.status(400).json({ 
        error: 'drug_name, event_type, and severity are required' 
      });
    }
    
    const newEvent = {
      event_id: `EVT-${Date.now()}`,
      drug_name,
      event_type,
      severity,
      description: description || `Patient experienced ${event_type.toLowerCase()}`,
      reported_date: new Date().toISOString(),
      status: 'received',
      reporter: 'System'
    };
    
    // In a real system, this would save to database
    res.status(201).json(newEvent);
  } catch (error) {
    logger.error('Error reporting safety event:', error);
    res.status(500).json({ error: 'Failed to report event' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('New WebSocket connection', { socketId: socket.id });
  
  socket.on('subscribe', (channel) => {
    socket.join(channel);
    logger.info(`Socket ${socket.id} subscribed to ${channel}`);
  });
  
  socket.on('disconnect', () => {
    logger.info('Socket disconnected', { socketId: socket.id });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`PharmOS API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`WebSocket server enabled`);
});