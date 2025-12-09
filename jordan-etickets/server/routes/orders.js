import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../database.js';

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
  return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Create new order
router.post('/', async (req, res) => {
  try {
    const { event_id, customer_name, customer_email, customer_phone, customer_age, quantity } = req.body;
    
    // Get event details
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND status = $2',
      [event_id, 'active']
    );
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = eventResult.rows[0];
    
    // Check availability
    if (event.quantity - event.sold < quantity) {
      return res.status(400).json({ error: 'Not enough tickets available' });
    }
    
    // Generate unique reference number
    let reference_number;
    let attempts = 0;
    do {
      reference_number = generateReference();
      const check = await pool.query('SELECT id FROM orders WHERE reference_number = $1', [reference_number]);
      if (check.rows.length === 0) break;
      attempts++;
    } while (attempts < 10);
    
    // Calculate total
    const total_amount = parseFloat(event.price) * quantity;
    
    // Create order
    const result = await pool.query(
      `INSERT INTO orders (reference_number, event_id, customer_name, customer_email, 
                          customer_phone, customer_age, quantity, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [reference_number, event_id, customer_name, customer_email, customer_phone, 
       customer_age, quantity, total_amount, 'pending']
    );
    
    // IMPORTANT: Send response IMMEDIATELY without waiting for email
    res.json({
      order_id: result.rows[0].id,
      reference_number,
      total_amount,
      cliq_alias: process.env.CLIQ_ALIAS || 'AZADMD'
    });
    
    // NOTE: Email sending removed to eliminate latency
    // Emails will only be sent when admin approves the order
    
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload payment proof
router.post('/:reference/proof', upload.single('payment_proof'), async (req, res) => {
  try {
    const { reference } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const orderResult = await pool.query('SELECT id FROM orders WHERE reference_number = $1', [reference]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    await pool.query(
      'UPDATE orders SET payment_proof = $1, status = $2 WHERE reference_number = $3',
      [req.file.filename, 'pending', reference]
    );
    
    res.json({ message: 'Payment proof uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
