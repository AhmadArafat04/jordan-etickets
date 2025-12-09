import express from 'express';
import db from '../database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query using email (not username)
    const admins = await db.query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    );

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];

    // Compare password using bcrypt
    const validPassword = await bcrypt.compare(password, admin.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-12345',
      { expiresIn: '24h' }
    );

    // Update admin token in database
    await db.query(
      'UPDATE admins SET token = $1 WHERE id = $2',
      [token, admin.id]
    );

    res.json({ 
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role || 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-12345'
    );

    // Check if token exists in database
    const admins = await db.query('SELECT * FROM admins WHERE token = $1', [token]);

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ valid: true, email: admins[0].email });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    await db.query('UPDATE admins SET token = NULL WHERE token = $1', [token]);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
