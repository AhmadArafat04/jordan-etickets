import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Generate unique reference number
function generateReference() {
  return 'TKT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Create new order
router.post('/', (req, res) => {
  try {
    const { event_id, customer_name, customer_email, customer_phone, customer_age, quantity } = req.body;

    // Get event details
    const event = db.prepare('SELECT * FROM events WHERE id = ? AND status = ?').get(event_id, 'active');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check availability
    if (event.quantity - event.sold < quantity) {
      return res.status(400).json({ error: 'Not enough tickets available' });
    }

    // Generate reference number
    let reference_number;
    let attempts = 0;
    do {
      reference_number = generateReference();
      attempts++;
    } while (db.prepare('SELECT id FROM orders WHERE reference_number = ?').get(reference_number) && attempts < 10);

    // Calculate total
    const total_amount = event.price * quantity;

    // Create order
    const result = db.prepare(`
      INSERT INTO orders (reference_number, event_id, customer_name, customer_email, 
                         customer_phone, customer_age, quantity, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(reference_number, event_id, customer_name, customer_email, customer_phone, 
           customer_age, quantity, total_amount, 'pending');

    res.json({
      order_id: result.lastInsertRowid,
      reference_number,
      total_amount,
      cliq_alias: process.env.CLIQ_ALIAS
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload payment proof
router.post('/:reference/proof', upload.single('payment_proof'), (req, res) => {
  try {
    const { reference } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const order = db.prepare('SELECT id FROM orders WHERE reference_number = ?').get(reference);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare('UPDATE orders SET payment_proof = ? WHERE reference_number = ?')
      .run(`/uploads/${req.file.filename}`, reference);

    res.json({ message: 'Payment proof uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check order status
router.get('/:reference', (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, e.title as event_title, e.date, e.time, e.venue
      FROM orders o
      JOIN events e ON o.event_id = e.id
      WHERE o.reference_number = ?
    `).get(req.params.reference);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
