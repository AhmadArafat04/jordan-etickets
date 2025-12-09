import express from 'express';
import pool from '../database.js';

const router = express.Router();

// Get all active events
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, description, date, time, venue, price, 
             quantity, sold, image, status
      FROM events 
      WHERE status = 'active' AND quantity > sold
      ORDER BY date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, description, date, time, venue, price, 
             quantity, sold, image, status
      FROM events 
      WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
