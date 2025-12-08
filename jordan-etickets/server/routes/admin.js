import express from 'express';
import db from '../database.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
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

// Middleware to check admin authentication
const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const result = await db.query('SELECT * FROM admins WHERE token = $1', [token]);
    
    if (result.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.admin = result[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Get all orders
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        o.id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.customer_age,
        o.event_id,
        o.num_tickets,
        o.total_price,
        o.payment_method,
        o.payment_proof,
        o.status,
        o.created_at,
        e.title as event_title,
        e.date as event_date,
        e.time as event_time,
        e.location as event_location
      FROM orders o
      LEFT JOIN events e ON o.event_id = e.id
      ORDER BY o.created_at DESC
    `);

    res.json(result);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        o.*,
        e.title as event_title,
        e.date as event_date,
        e.time as event_time,
        e.location as event_location,
        e.price as event_price
      FROM orders o
      LEFT JOIN events e ON o.event_id = e.id
      WHERE o.id = $1
    `, [req.params.id]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, orderId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Generate ticket for approved order
router.post('/orders/:id/generate-ticket', requireAdmin, async (req, res) => {
  const orderId = req.params.id;

  try {
    // Get order details
    const orderResult = await db.query(`
      SELECT 
        o.*,
        e.title as event_title,
        e.date as event_date,
        e.time as event_time,
        e.location as event_location
      FROM orders o
      LEFT JOIN events e ON o.event_id = e.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult[0];

    if (order.status !== 'approved') {
      return res.status(400).json({ error: 'Order must be approved first' });
    }

    // Generate ticket code
    const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Insert ticket
    const ticketResult = await db.query(
      `INSERT INTO tickets (order_id, ticket_code, customer_name, event_title, event_date, event_time, event_location, num_tickets)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        orderId,
        ticketCode,
        order.customer_name,
        order.event_title,
        order.event_date,
        order.event_time,
        order.event_location,
        order.num_tickets
      ]
    );

    res.json(ticketResult[0]);
  } catch (error) {
    console.error('Error generating ticket:', error);
    res.status(500).json({ error: 'Failed to generate ticket' });
  }
});

// Get all tickets
router.get('/tickets', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        t.*,
        o.customer_email,
        o.customer_phone
      FROM tickets t
      LEFT JOIN orders o ON t.order_id = o.id
      ORDER BY t.created_at DESC
    `);

    res.json(result);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get dashboard statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const totalEventsResult = await db.query('SELECT COUNT(*) as count FROM events');
    const totalOrdersResult = await db.query('SELECT COUNT(*) as count FROM orders');
    const pendingOrdersResult = await db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    const approvedOrdersResult = await db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'approved'");
    const totalRevenueResult = await db.query("SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status = 'approved'");
    const totalTicketsResult = await db.query("SELECT COALESCE(SUM(num_tickets), 0) as total FROM orders WHERE status = 'approved'");

    res.json({
      totalEvents: parseInt(totalEventsResult[0].count),
      totalOrders: parseInt(totalOrdersResult[0].count),
      pendingOrders: parseInt(pendingOrdersResult[0].count),
      approvedOrders: parseInt(approvedOrdersResult[0].count),
      totalRevenue: parseFloat(totalRevenueResult[0].total),
      totalTickets: parseInt(totalTicketsResult[0].total)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all events
router.get('/events', requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events ORDER BY date ASC');
    res.json(result);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create new event
router.post('/events', requireAdmin, upload.single('image'), async (req, res) => {
  const { title, description, date, time, location, price, available_tickets } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await db.query(
      `INSERT INTO events (title, description, date, time, location, price, available_tickets, image, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, date, time, location, parseFloat(price), parseInt(available_tickets), image, 'active']
    );

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/events/:id', requireAdmin, upload.single('image'), async (req, res) => {
  const { title, description, date, time, location, price, available_tickets, status } = req.body;
  const eventId = req.params.id;

  try {
    let query;
    let params;

    if (req.file) {
      const image = `/uploads/${req.file.filename}`;
      query = `UPDATE events 
               SET title = $1, description = $2, date = $3, time = $4, location = $5, 
                   price = $6, available_tickets = $7, image = $8, status = $9
               WHERE id = $10
               RETURNING *`;
      params = [title, description, date, time, location, parseFloat(price), parseInt(available_tickets), image, status || 'active', eventId];
    } else {
      query = `UPDATE events 
               SET title = $1, description = $2, date = $3, time = $4, location = $5, 
                   price = $6, available_tickets = $7, status = $8
               WHERE id = $9
               RETURNING *`;
      params = [title, description, date, time, location, parseFloat(price), parseInt(available_tickets), status || 'active', eventId];
    }

    const result = await db.query(query, params);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/events/:id', requireAdmin, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete associated image file if exists
    if (result[0].image) {
      const imagePath = path.join(__dirname, '../../public', result[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
