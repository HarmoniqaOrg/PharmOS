const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.PORT = '0'; // Use random port for tests
process.env.DATABASE_URL = 'mongodb://localhost:27017/pharmos_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Global test timeout
jest.setTimeout(10000);

// Mock external dependencies
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    json: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
}));

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn(),
  })),
}));

// Mock MongoDB/Mongoose
const mockMongoose = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  connection: {
    readyState: 1,
    close: jest.fn().mockResolvedValue(undefined),
  },
  Schema: function(definition) {
    this.definition = definition;
    return this;
  },
  model: jest.fn(() => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    save: jest.fn(),
  })),
};

jest.mock('mongoose', () => mockMongoose);

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ 
    id: '1', 
    email: 'test@example.com',
    role: 'researcher'
  }),
  decode: jest.fn().mockReturnValue({ 
    id: '1', 
    email: 'test@example.com' 
  }),
}));

// Mock socket.io
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  })),
}));

// Global test utilities
global.createMockUser = () => ({
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  password: 'hashedPassword',
  full_name: 'Test User',
  role: 'researcher',
  created_at: new Date('2023-01-01'),
  updated_at: new Date('2023-01-01'),
});

global.createMockMolecule = () => ({
  _id: '507f1f77bcf86cd799439012',
  smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
  name: 'Aspirin',
  molecular_weight: 180.16,
  properties: {
    logP: 1.19,
    hbond_donors: 1,
    hbond_acceptors: 4,
    complexity: 25.5,
  },
  created_at: new Date('2023-01-01'),
});

global.createMockResearchPaper = () => ({
  _id: '507f1f77bcf86cd799439013',
  title: 'Novel Drug Discovery Approaches',
  authors: ['Dr. Smith', 'Dr. Johnson'],
  abstract: 'This paper explores innovative approaches to drug discovery...',
  journal: 'Journal of Pharmaceutical Sciences',
  year: 2023,
  doi: '10.1000/test.doi.123',
  keywords: ['drug discovery', 'pharmaceutical', 'AI'],
  created_at: new Date('2023-01-01'),
});

global.createMockClinicalTrial = () => ({
  _id: '507f1f77bcf86cd799439014',
  trial_id: 'NCT12345678',
  title: 'Phase II Study of Test Drug',
  phase: 'Phase II',
  status: 'Active',
  condition: 'Cancer',
  drug_name: 'TestDrug-123',
  start_date: '2023-01-01',
  estimated_completion: '2024-12-31',
  participant_count: 150,
  location: 'Multiple Centers',
});

global.createMockSafetyEvent = () => ({
  _id: '507f1f77bcf86cd799439015',
  event_id: 'EVT-001',
  drug_name: 'TestDrug-123',
  event_type: 'Adverse Reaction',
  severity: 'Moderate',
  description: 'Patient experienced mild nausea',
  reported_date: new Date('2023-01-01'),
  status: 'under_review',
  reporter: 'Dr. Test',
});

// Mock request/response helpers
global.createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

global.createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

global.createMockNext = () => jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
  if (mockMongoose.connection) {
    await mockMongoose.connection.close();
  }
});

console.log('Jest setup completed for PharmOS backend testing');