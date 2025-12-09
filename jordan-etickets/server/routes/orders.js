import express from 'express';
import db from '../database.js';
import { sendOrderConfirmationEmail } from '../emailService.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/payments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

// Create new order
router.post('/', upload.single('paymentProof'), async (req, res) => {
  const { 
    customer_name: customerName, 
    customer_email: customerEmail, 
    customer_phone: customerPhone, 
    customer_age: customerAge,
    event_id: eventId, 
    quantity: numTickets, 
    payment_method: paymentMethod 
  } = req.body;

  try {
    // Get event details
    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    
    if (eventResult.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult[0];

    // Check ticket availability
    if (event.available_tickets < parseInt(numTickets)) {
      return res.status(400).json({ error: 'Not enough tickets available' });
    }

    // Calculate total price
    const totalPrice = event.price * parseInt(numTickets);

    // Handle payment proof
    const paymentProof = req.file ? `/uploads/payments/${req.file.filename}` : null;

    // Create order
    const orderResult = await db.query(
      `INSERT INTO orders (
        customer_name, customer_email, customer_phone, customer_age,
        event_id, num_tickets, total_price, payment_method, payment_proof, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        customerName,
        customerEmail,
        customerPhone,
        parseInt(customerAge),
        eventId,
        parseInt(numTickets),
        totalPrice,
        paymentMethod,
        paymentProof,
        'pending'
      ]
    );

    // Update available tickets
    await db.query(
      'UPDATE events SET available_tickets = available_tickets - $1 WHERE id = $2',
      [parseInt(numTickets), eventId]
    );

    const createdOrder = orderResult[0];

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail({
        customer_email: customerEmail,
        customer_name: customerName,
        event_title: event.title,
        num_tickets: parseInt(numTickets),
        total_price: totalPrice
      });
      console.log('✅ Order confirmation email sent');
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail order creation if email fails
    }

    // Return formatted response for frontend
    res.status(201).json({
      ...createdOrder,
      reference_number: `ORD-${createdOrder.id}`,
      cliq_alias: process.env.CLIQ_ALIAS || 'JORDAN-TICKETS',
      total_amount: totalPrice
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        o.*,
        e.title as event_title,
        e.date as event_date,
        e.time as event_time,
        e.location as event_location
      FROM orders o
      LEFT JOIN events e ON o.event_id = e.id
      WHERE o.id = $1`,
      [req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
