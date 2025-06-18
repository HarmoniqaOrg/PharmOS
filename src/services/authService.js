const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'pharmos-dev-secret-key-2024';
    this.users = [
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
  }

  async authenticate(email, password) {
    const user = this.users.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);
    const { password_hash, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token
    };
  }

  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async createUser(userData) {
    const existingUser = this.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = {
      id: Date.now().toString(),
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      password_hash: hashedPassword,
      full_name: userData.full_name || '',
      role: userData.role || 'user'
    };

    this.users.push(newUser);
    const { password_hash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}

module.exports = new AuthService();