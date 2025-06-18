const request = require('supertest');
const express = require('express');
const authService = require('../../../src/services/authService');
const { authMiddleware } = require('../../../src/middleware/auth');

// Unmock dependencies for integration tests
jest.unmock('jsonwebtoken');
jest.unmock('bcryptjs');

// Create a test Express app with auth routes
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Auth routes (extracted from server.js)
  app.post('/api/v1/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const result = await authService.authenticate(email, password);
      res.json(result);
    } catch (error) {
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
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/v1/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  // Test protected endpoint
  app.get('/api/v1/protected', authMiddleware, (req, res) => {
    res.json({ message: 'Protected resource accessed', user: req.user });
  });

  return app;
};

describe('Auth API Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    // Reset auth service state
    authService.users = [
      {
        id: '1',
        email: 'demo@pharmos.ai',
        username: 'demo_user',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewvfma7XkwVpBVYa', // demo123
        full_name: 'Demo User',
        role: 'admin'
      },
      {
        id: '2',
        email: 'researcher@pharmos.ai',
        username: 'researcher',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewvfma7XkwVpBVYa', // demo123
        full_name: 'Research User',
        role: 'researcher'
      }
    ];
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'demo@pharmos.ai',
          password: 'demo123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('demo@pharmos.ai');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user).not.toHaveProperty('password_hash');
      expect(typeof response.body.token).toBe('string');
    });

    it('should login researcher user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'researcher@pharmos.ai',
          password: 'demo123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('researcher@pharmos.ai');
      expect(response.body.user.role).toBe('researcher');
      expect(response.body.user.full_name).toBe('Research User');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@pharmos.ai',
          password: 'demo123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'demo@pharmos.ai',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'demo123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'demo@pharmos.ai'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should reject login with empty request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should reject login with empty strings', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: '',
          password: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register new user successfully', async () => {
      const newUser = {
        email: 'newuser@pharmos.ai',
        password: 'newpassword123',
        full_name: 'New User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.full_name).toBe(newUser.full_name);
      expect(response.body.user).not.toHaveProperty('password_hash');
      expect(typeof response.body.token).toBe('string');
    });

    it('should register user with minimal information', async () => {
      const newUser = {
        email: 'minimal@pharmos.ai',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.username).toBe('minimal');
      expect(response.body.user.full_name).toBe('');
      expect(response.body.user.role).toBe('user');
    });

    it('should reject registration with existing email', async () => {
      const duplicateUser = {
        email: 'demo@pharmos.ai', // Already exists
        password: 'newpassword123',
        full_name: 'Duplicate User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('User already exists');
    });

    it('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          password: 'password123',
          full_name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@pharmos.ai',
          full_name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should handle invalid email format gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      // Should still create user (no email validation in current implementation)
      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('invalid-email');
    });

    it('should handle special characters in user data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'special+chars@pharmos.ai',
          password: 'password!@#$%',
          full_name: 'José María González'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('special+chars@pharmos.ai');
      expect(response.body.user.full_name).toBe('José María González');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Get auth token for testing
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'demo@pharmos.ai',
          password: 'demo123'
        });
      authToken = loginResponse.body.token;
    });

    it('should return user info for authenticated request', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('demo@pharmos.ai');
      expect(response.body.user.role).toBe('admin');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No token provided');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should reject request with empty token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });
  });

  describe('Protected endpoint integration', () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'researcher@pharmos.ai',
          password: 'demo123'
        });
      authToken = loginResponse.body.token;
    });

    it('should access protected resource with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/protected')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('researcher@pharmos.ai');
    });

    it('should reject protected resource access without token', async () => {
      const response = await request(app)
        .get('/api/v1/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should reject protected resource access with expired token', async () => {
      // Mock an expired token scenario
      const response = await request(app)
        .get('/api/v1/protected')
        .set('Authorization', 'Bearer expired.token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('End-to-end authentication flow', () => {
    it('should complete full registration and authentication flow', async () => {
      const userData = {
        email: 'e2e@pharmos.ai',
        password: 'e2epassword123',
        full_name: 'E2E Test User'
      };

      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);
      const { user: registeredUser, token: registerToken } = registerResponse.body;

      // Step 2: Login with new credentials
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(loginResponse.status).toBe(200);
      const { user: loggedInUser, token: loginToken } = loginResponse.body;

      // Step 3: Verify user data consistency
      expect(loggedInUser.email).toBe(registeredUser.email);
      expect(loggedInUser.full_name).toBe(registeredUser.full_name);

      // Step 4: Access protected resource with login token
      const protectedResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginToken}`);

      expect(protectedResponse.status).toBe(200);
      expect(protectedResponse.body.user.email).toBe(userData.email);

      // Step 5: Verify registration token also works
      const protectedResponse2 = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${registerToken}`);

      expect(protectedResponse2.status).toBe(200);
      expect(protectedResponse2.body.user.email).toBe(userData.email);
    });

    it('should handle concurrent login attempts', async () => {
      const loginPromises = Array(5).fill().map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'demo@pharmos.ai',
            password: 'demo123'
          })
      );

      const responses = await Promise.all(loginPromises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe('demo@pharmos.ai');
      });
    });

    it('should handle mixed valid and invalid login attempts', async () => {
      const requests = [
        { email: 'demo@pharmos.ai', password: 'demo123', expectedStatus: 200 },
        { email: 'invalid@pharmos.ai', password: 'demo123', expectedStatus: 401 },
        { email: 'researcher@pharmos.ai', password: 'demo123', expectedStatus: 200 },
        { email: 'demo@pharmos.ai', password: 'wrong', expectedStatus: 401 },
      ];

      for (const req of requests) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: req.email,
            password: req.password
          });

        expect(response.status).toBe(req.expectedStatus);
        
        if (req.expectedStatus === 200) {
          expect(response.body).toHaveProperty('token');
          expect(response.body.user.email).toBe(req.email);
        } else {
          expect(response.body).toHaveProperty('error');
        }
      }
    });
  });
});