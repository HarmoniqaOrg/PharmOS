const authService = require('../../../../src/services/authService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock the dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    const validEmail = 'demo@pharmos.ai';
    const validPassword = 'demo123';
    const invalidEmail = 'nonexistent@pharmos.ai';
    const invalidPassword = 'wrongpassword';

    it('should authenticate user with valid credentials', async () => {
      // Arrange
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock.jwt.token');

      // Act
      const result = await authService.authenticate(validEmail, validPassword);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).not.toHaveProperty('password_hash');
      expect(result.user.email).toBe(validEmail);
      expect(result.user.role).toBe('admin');
      expect(result.token).toBe('mock.jwt.token');
      expect(bcrypt.compare).toHaveBeenCalledWith(validPassword, expect.any(String));
    });

    it('should reject authentication with invalid email', async () => {
      // Act & Assert
      await expect(authService.authenticate(invalidEmail, validPassword))
        .rejects.toThrow('Invalid credentials');
      
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should reject authentication with invalid password', async () => {
      // Arrange
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.authenticate(validEmail, invalidPassword))
        .rejects.toThrow('Invalid credentials');
      
      expect(bcrypt.compare).toHaveBeenCalledWith(invalidPassword, expect.any(String));
    });

    it('should authenticate researcher user successfully', async () => {
      // Arrange
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('researcher.jwt.token');

      // Act
      const result = await authService.authenticate('researcher@pharmos.ai', validPassword);

      // Assert
      expect(result.user.email).toBe('researcher@pharmos.ai');
      expect(result.user.role).toBe('researcher');
      expect(result.user.full_name).toBe('Research User');
    });

    it('should handle bcrypt comparison errors', async () => {
      // Arrange
      bcrypt.compare.mockRejectedValue(new Error('Hash comparison failed'));

      // Act & Assert
      await expect(authService.authenticate(validEmail, validPassword))
        .rejects.toThrow('Hash comparison failed');
    });
  });

  describe('generateToken', () => {
    const mockUser = {
      id: '1',
      email: 'test@pharmos.ai',
      role: 'researcher'
    };

    it('should generate JWT token with correct payload', () => {
      // Arrange
      const expectedToken = 'generated.jwt.token';
      jwt.sign.mockReturnValue(expectedToken);

      // Act
      const token = authService.generateToken(mockUser);

      // Assert
      expect(token).toBe(expectedToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role
        },
        expect.any(String),
        { expiresIn: '24h' }
      );
    });

    it('should use environment JWT_SECRET if available', () => {
      // Arrange
      const originalSecret = authService.JWT_SECRET;
      authService.JWT_SECRET = 'test-secret'; // Directly modify the service instance
      jwt.sign.mockReturnValue('token');

      // Act
      authService.generateToken(mockUser);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'test-secret',
        expect.any(Object)
      );

      // Cleanup
      authService.JWT_SECRET = originalSecret;
    });

    it('should handle undefined user gracefully', () => {
      // Arrange
      jwt.sign.mockReturnValue('token');

      // Act
      const token = authService.generateToken({});

      // Assert
      expect(token).toBe('token');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: undefined,
          email: undefined,
          role: undefined
        },
        expect.any(String),
        { expiresIn: '24h' }
      );
    });
  });

  describe('verifyToken', () => {
    const validToken = 'valid.jwt.token';
    const invalidToken = 'invalid.jwt.token';

    it('should verify valid token successfully', () => {
      // Arrange
      const expectedPayload = {
        id: '1',
        email: 'test@pharmos.ai',
        role: 'researcher'
      };
      jwt.verify.mockReturnValue(expectedPayload);

      // Act
      const result = authService.verifyToken(validToken);

      // Assert
      expect(result).toEqual(expectedPayload);
      expect(jwt.verify).toHaveBeenCalledWith(validToken, expect.any(String));
    });

    it('should reject invalid token', () => {
      // Arrange
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      // Act & Assert
      expect(() => authService.verifyToken(invalidToken))
        .toThrow('Invalid token');
      
      expect(jwt.verify).toHaveBeenCalledWith(invalidToken, expect.any(String));
    });

    it('should reject expired token', () => {
      // Arrange
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Act & Assert
      expect(() => authService.verifyToken(validToken))
        .toThrow('Invalid token');
    });

    it('should reject token with invalid signature', () => {
      // Arrange
      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      // Act & Assert
      expect(() => authService.verifyToken(validToken))
        .toThrow('Invalid token');
    });
  });

  describe('createUser', () => {
    const validUserData = {
      email: 'newuser@pharmos.ai',
      password: 'securepassword123',
      full_name: 'New User',
      username: 'newuser',
      role: 'researcher'
    };

    beforeEach(() => {
      // Reset the users array to original state
      authService.users = [
        {
          id: '1',
          email: 'demo@pharmos.ai',
          username: 'demo_user',
          password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewvfma7XkwVpBVYa',
          full_name: 'Demo User',
          role: 'admin'
        },
        {
          id: '2',
          email: 'researcher@pharmos.ai',
          username: 'researcher',
          password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewvfma7XkwVpBVYa',
          full_name: 'Research User',
          role: 'researcher'
        }
      ];
    });

    it('should create new user successfully', async () => {
      // Arrange
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1234567890);

      // Act
      const result = await authService.createUser(validUserData);

      // Assert
      expect(result).toEqual({
        id: '1234567890',
        email: validUserData.email,
        username: validUserData.username,
        full_name: validUserData.full_name,
        role: validUserData.role
      });
      expect(result).not.toHaveProperty('password_hash');
      expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 10);
      
      // Verify user was added to users array
      const addedUser = authService.users.find(u => u.email === validUserData.email);
      expect(addedUser).toBeDefined();
      expect(addedUser.password_hash).toBe('hashedPassword123');

      // Cleanup
      Date.now = originalDateNow;
    });

    it('should create user with default values when optional fields missing', async () => {
      // Arrange
      const minimalUserData = {
        email: 'minimal@pharmos.ai',
        password: 'password123'
      };
      bcrypt.hash.mockResolvedValue('hashedPassword');
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 9876543210);

      // Act
      const result = await authService.createUser(minimalUserData);

      // Assert
      expect(result).toEqual({
        id: '9876543210',
        email: minimalUserData.email,
        username: 'minimal', // Generated from email
        full_name: '',
        role: 'user' // Default role
      });

      // Cleanup
      Date.now = originalDateNow;
    });

    it('should reject creation of user with existing email', async () => {
      // Arrange
      const duplicateUserData = {
        email: 'demo@pharmos.ai', // Already exists
        password: 'password123'
      };

      // Act & Assert
      await expect(authService.createUser(duplicateUserData))
        .rejects.toThrow('User already exists');
      
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should handle bcrypt hashing errors', async () => {
      // Arrange
      bcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

      // Act & Assert
      await expect(authService.createUser(validUserData))
        .rejects.toThrow('Hashing failed');
    });

    it('should generate username from email if not provided', async () => {
      // Arrange
      const userDataWithoutUsername = {
        email: 'complex.email+test@pharmos.ai',
        password: 'password123'
      };
      bcrypt.hash.mockResolvedValue('hashedPassword');
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1111111111);

      // Act
      const result = await authService.createUser(userDataWithoutUsername);

      // Assert
      expect(result.username).toBe('complex.email+test');

      // Cleanup
      Date.now = originalDateNow;
    });

    it('should handle empty user data gracefully', async () => {
      // Arrange
      const emptyUserData = {};
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Act & Assert
      await expect(authService.createUser(emptyUserData))
        .rejects.toThrow(); // Should throw some error due to missing required fields
    });
  });

  describe('Integration scenarios', () => {
    it('should support full user registration and authentication flow', async () => {
      // Arrange
      const newUserData = {
        email: 'integration@pharmos.ai',
        password: 'integrationtest123',
        full_name: 'Integration Test User',
        role: 'researcher'
      };
      
      bcrypt.hash.mockResolvedValue('hashedIntegrationPassword');
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('integration.jwt.token');
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 2222222222);

      // Act - Register user
      const createdUser = await authService.createUser(newUserData);
      
      // Act - Authenticate user
      const authResult = await authService.authenticate(newUserData.email, newUserData.password);

      // Assert
      expect(createdUser.email).toBe(newUserData.email);
      expect(authResult.user.email).toBe(newUserData.email);
      expect(authResult.token).toBe('integration.jwt.token');

      // Cleanup
      Date.now = originalDateNow;
    });
  });
});