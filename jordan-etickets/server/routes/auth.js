import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Register (for customers)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
    ).run(email, hashedPassword, name, 'customer');

    const token = jwt.sign(
      { id: result.lastInsertRowid, email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        name,
        role: 'customer'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
