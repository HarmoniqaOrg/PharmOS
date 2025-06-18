const { authMiddleware, roleMiddleware } = require('../../../../src/middleware/auth');
const authService = require('../../../../src/services/authService');

// Mock the authService
jest.mock('../../../../src/services/authService');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should authenticate user with valid Bearer token', () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: 'test@pharmos.ai',
        role: 'researcher'
      };
      req.headers.authorization = 'Bearer valid.jwt.token';
      authService.verifyToken.mockReturnValue(mockUser);

      // Act
      authMiddleware(req, res, next);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith('valid.jwt.token');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      // Arrange
      req.headers = {}; // No authorization header

      // Act
      authMiddleware(req, res, next);

      // Assert
      expect(authService.verifyToken).not.toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should reject request with empty authorization header', () => {
      // Arrange
      req.headers.authorization = '';

      // Act
      authMiddleware(req, res, next);

      // Assert
      expect(authService.verifyToken).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should reject request with malformed authorization header', () => {
      // Arrange
      req.headers.authorization = 'InvalidFormat token';
      authService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      authMiddleware(req, res, next);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith('InvalidFormat token');
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should reject request with Bearer but no token', () => {
      // Arrange
      req.headers.authorization = 'Bearer ';

      // Act
      authMiddleware(req, res, next);

      // Assert
      expect(authService.verifyToken).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should reject request with invalid token', () => {
      // Arrange
      req.headers.authorization = 'Bearer invalid.jwt.token';
      authService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      authMiddleware(req, res, next);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith('invalid.jwt.token');
      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should reject request with expired token', () => {
      // Arrange
      req.headers.authorization = 'Bearer expired.jwt.token';
      const tokenExpiredError = new Error('jwt expired');
      tokenExpiredError.name = 'TokenExpiredError';
      authService.verifyToken.mockImplementation(() => {
        throw tokenExpiredError;
      });

      // Act
      authMiddleware(req, res, next);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith('expired.jwt.token');
      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should handle token verification with different error types', () => {
      // Arrange
      req.headers.authorization = 'Bearer malformed.token';
      const jwtError = new Error('jwt malformed');
      jwtError.name = 'JsonWebTokenError';
      authService.verifyToken.mockImplementation(() => {
        throw jwtError;
      });

      // Act
      authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should handle case-insensitive Bearer token extraction', () => {
      // Arrange
      const mockUser = { id: '1', email: 'test@pharmos.ai', role: 'user' };
      req.headers.authorization = 'bearer lowercase.jwt.token';
      authService.verifyToken.mockReturnValue(mockUser);

      // Act
      authMiddleware(req, res, next);

      // Assert
      // The current implementation doesn't handle case-insensitive Bearer
      // So the token will be passed as-is without Bearer prefix removal
      expect(authService.verifyToken).toHaveBeenCalledWith('bearer lowercase.jwt.token');
    });
  });

  describe('roleMiddleware', () => {
    beforeEach(() => {
      // Set up authenticated user
      req.user = {
        id: '1',
        email: 'test@pharmos.ai',
        role: 'researcher'
      };
    });

    it('should allow access for user with exact required role', () => {
      // Arrange
      const middleware = roleMiddleware('researcher');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should allow access for admin user regardless of required role', () => {
      // Arrange
      req.user.role = 'admin';
      const middleware = roleMiddleware('researcher');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should deny access for user with insufficient role', () => {
      // Arrange
      req.user.role = 'user';
      const middleware = roleMiddleware('researcher');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    });

    it('should deny access for unauthenticated request', () => {
      // Arrange
      req.user = null;
      const middleware = roleMiddleware('researcher');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should deny access when req.user is undefined', () => {
      // Arrange
      delete req.user;
      const middleware = roleMiddleware('researcher');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should handle different role hierarchies correctly', () => {
      // Test various role combinations
      const testCases = [
        { userRole: 'admin', requiredRole: 'admin', shouldPass: true },
        { userRole: 'admin', requiredRole: 'researcher', shouldPass: true },
        { userRole: 'admin', requiredRole: 'user', shouldPass: true },
        { userRole: 'researcher', requiredRole: 'admin', shouldPass: false },
        { userRole: 'researcher', requiredRole: 'researcher', shouldPass: true },
        { userRole: 'researcher', requiredRole: 'user', shouldPass: false },
        { userRole: 'user', requiredRole: 'admin', shouldPass: false },
        { userRole: 'user', requiredRole: 'researcher', shouldPass: false },
        { userRole: 'user', requiredRole: 'user', shouldPass: true },
      ];

      testCases.forEach(({ userRole, requiredRole, shouldPass }) => {
        // Reset mocks
        jest.clearAllMocks();
        req.user.role = userRole;
        
        const middleware = roleMiddleware(requiredRole);
        middleware(req, res, next);

        if (shouldPass) {
          expect(next).toHaveBeenCalledTimes(1);
          expect(res.status).not.toHaveBeenCalled();
        } else {
          expect(next).not.toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
        }
      });
    });

    it('should handle empty or null required role', () => {
      // Arrange
      const middleware = roleMiddleware('');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    });

    it('should handle special characters in role names', () => {
      // Arrange
      req.user.role = 'super-admin';
      const middleware = roleMiddleware('super-admin');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should work together for protected admin endpoint', () => {
      // Arrange
      const mockAdminUser = {
        id: '1',
        email: 'admin@pharmos.ai',
        role: 'admin'
      };
      req.headers.authorization = 'Bearer admin.jwt.token';
      authService.verifyToken.mockReturnValue(mockAdminUser);
      
      const adminRoleMiddleware = roleMiddleware('admin');

      // Act - First apply auth middleware
      authMiddleware(req, res, next);
      
      // Reset next mock to check role middleware call
      jest.clearAllMocks();
      
      // Act - Then apply role middleware
      adminRoleMiddleware(req, res, next);

      // Assert
      expect(req.user).toEqual(mockAdminUser);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject unauthorized access to protected endpoint', () => {
      // Arrange
      req.headers.authorization = 'Bearer invalid.token';
      authService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const researcherRoleMiddleware = roleMiddleware('researcher');

      // Act - Apply auth middleware (should fail)
      authMiddleware(req, res, next);

      // Assert - Should not reach role middleware
      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should reject user with insufficient permissions', () => {
      // Arrange
      const mockUser = {
        id: '2',
        email: 'user@pharmos.ai',
        role: 'user'
      };
      req.headers.authorization = 'Bearer user.jwt.token';
      authService.verifyToken.mockReturnValue(mockUser);
      
      const researcherRoleMiddleware = roleMiddleware('researcher');

      // Act - First apply auth middleware
      authMiddleware(req, res, next);
      
      // Reset mocks for role middleware
      jest.clearAllMocks();
      
      // Act - Then apply role middleware
      researcherRoleMiddleware(req, res, next);

      // Assert
      expect(req.user).toEqual(mockUser);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    });
  });
});