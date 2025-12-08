import express from 'express';
import db from '../database.js';
import crypto from 'crypto';

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query(
      'SELECT * FROM admins WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');

    // Update admin token
    await db.query(
      'UPDATE admins SET token = $1 WHERE id = $2',
      [token, admin.id]
    );

    res.json({ 
      token,
      username: admin.username
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
    const result = await db.query('SELECT * FROM admins WHERE token = $1', [token]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ valid: true, username: result.rows[0].username });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
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
