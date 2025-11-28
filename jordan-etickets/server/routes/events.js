import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all active events
router.get('/', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT id, title, description, date, time, venue, price, 
             quantity, sold, image, status
      FROM events 
      WHERE status = 'active' AND quantity > sold
      ORDER BY date ASC
    `).all();

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single event
router.get('/:id', (req, res) => {
  try {
    const event = db.prepare(`
      SELECT id, title, description, date, time, venue, price, 
             quantity, sold, image, status
      FROM events 
      WHERE id = ?
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
