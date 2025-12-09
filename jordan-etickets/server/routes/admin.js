import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
const { createTransport } = nodemailer;
import pool from '../database.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);
router.use(isAdmin);

// Configure multer for event images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../../public/images'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `event-${Date.now()}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Get all events (including inactive)
router.get('/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create event
router.post('/events', upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, time, venue, price, quantity } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO events (title, description, date, time, venue, price, quantity, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [title, description, date, time, venue, parseFloat(price), parseInt(quantity), image]
    );

    res.json({ id: result.rows[0].id, message: 'Event created successfully' });
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update event
router.put('/events/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, time, venue, price, quantity, status } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : undefined;

    let query = `
      UPDATE events 
      SET title = $1, description = $2, date = $3, time = $4, venue = $5, 
          price = $6, quantity = $7, status = $8
    `;
    const params = [title, description, date, time, venue, parseFloat(price), parseInt(quantity), status];

    if (image) {
      query += ', image = $9 WHERE id = $10';
      params.push(image, req.params.id);
    } else {
      query += ' WHERE id = $9';
      params.push(req.params.id);
    }

    await pool.query(query, params);

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Event update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Event delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, e.title as event_title
      FROM orders o
      JOIN events e ON o.event_id = e.id
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending orders
router.get('/orders/pending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, e.title as event_title, e.date, e.time, e.venue
      FROM orders o
      JOIN events e ON o.event_id = e.id
      WHERE o.status = $1
      ORDER BY o.created_at DESC
    `, ['pending']);

    res.json(result.rows);
  } catch (error) {
    console.error('Pending orders fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate ticket number
function generateTicketNumber() {
  return 'TICKET-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Generate PDF ticket
async function generateTicketPDF(ticket, order, event) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24).text('مرحبا تسعينات', { align: 'center' });
      doc.moveDown();
      doc.fontSize(20).text(event.title, { align: 'center' });
      doc.moveDown();

      // Event details
      doc.fontSize(12);
      doc.text(`Date: ${event.date}`, { continued: true });
      doc.text(`    Time: ${event.time}`);
      doc.text(`Venue: ${event.venue}`);
      doc.moveDown();

      // Ticket holder
      doc.text(`Ticket Holder: ${order.customer_name}`);
      doc.text(`Email: ${order.customer_email}`);
      doc.text(`Phone: ${order.customer_phone}`);
      doc.moveDown();

      // Ticket number
      doc.fontSize(14).text(`Ticket Number: ${ticket.ticket_number}`);
      doc.moveDown();

      // QR Code
      const qrImage = await QRCode.toDataURL(ticket.qr_code);
      const qrBuffer = Buffer.from(qrImage.split(',')[1], 'base64');
      doc.image(qrBuffer, { fit: [200, 200], align: 'center' });
      doc.moveDown();

      // Footer
      doc.fontSize(10).text('Please present this ticket at the venue entrance.', { align: 'center' });
      doc.text('This ticket is valid for one person only.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Send ticket email
async function sendTicketEmail(order, event, ticketPDF) {
  const transporter = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: order.customer_email,
    subject: `Your Ticket for ${event.title}`,
    html: `
      <h2>Your Ticket is Ready!</h2>
      <p>Dear ${order.customer_name},</p>
      <p>Thank you for your purchase. Your ticket for <strong>${event.title}</strong> has been confirmed.</p>
      <p><strong>Event Details:</strong></p>
      <ul>
        <li>Date: ${event.date}</li>
        <li>Time: ${event.time}</li>
        <li>Venue: ${event.venue}</li>
      </ul>
      <p>Please find your ticket(s) attached to this email. You can also download them from our website using your reference number: <strong>${order.reference_number}</strong></p>
      <p>See you at the event!</p>
      <p>Best regards,<br>مرحبا تسعينات Team</p>
    `,
    attachments: [
      {
        filename: `ticket-${order.reference_number}.pdf`,
        content: ticketPDF
      }
    ]
  });
}

// Approve order and generate tickets
router.post('/orders/:id/approve', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const orderId = req.params.id;

    // Get order details
    const orderResult = await client.query(`
      SELECT o.*, e.title, e.description, e.date, e.time, e.venue, e.price
      FROM orders o
      JOIN events e ON o.event_id = e.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (order.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Order already processed' });
    }

    // Check if tickets already exist
    const existingTickets = await client.query('SELECT id FROM tickets WHERE order_id = $1', [orderId]);
    if (existingTickets.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Tickets already generated for this order' });
    }

    // Generate tickets
    const tickets = [];
    for (let i = 0; i < order.quantity; i++) {
      const ticket_number = generateTicketNumber();
      const qr_code = `${process.env.WEBSITE_URL || 'https://jordan-etickets-production.up.railway.app'}/verify/${ticket_number}`;

      const result = await client.query(
        `INSERT INTO tickets (order_id, ticket_number, qr_code)
         VALUES ($1, $2, $3) RETURNING id`,
        [orderId, ticket_number, qr_code]
      );

      tickets.push({
        id: result.rows[0].id,
        ticket_number,
        qr_code
      });
    }

    // Update order status
    await client.query(
      'UPDATE orders SET status = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['approved', orderId]
    );

    // Update event sold count
    await client.query(
      'UPDATE events SET sold = sold + $1 WHERE id = $2',
      [order.quantity, order.event_id]
    );

    await client.query('COMMIT');

    // Generate and send PDF tickets
    try {
      const event = {
        title: order.title,
        description: order.description,
        date: order.date,
        time: order.time,
        venue: order.venue
      };

      for (const ticket of tickets) {
        const ticketPDF = await generateTicketPDF(ticket, order, event);
        await sendTicketEmail(order, event, ticketPDF);
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails - tickets are still generated
    }

    res.json({ 
      message: 'Order approved and tickets generated',
      tickets: tickets.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order approval error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Reject order
router.post('/orders/:id/reject', async (req, res) => {
  try {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['rejected', req.params.id]);
    res.json({ message: 'Order rejected' });
  } catch (error) {
    console.error('Order rejection error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalEventsResult = await pool.query('SELECT COUNT(*) as count FROM events');
    const activeEventsResult = await pool.query('SELECT COUNT(*) as count FROM events WHERE status = $1', ['active']);
    const totalOrdersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    const pendingOrdersResult = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['pending']);
    const totalRevenueResult = await pool.query('SELECT SUM(total_amount) as total FROM orders WHERE status = $1', ['approved']);
    const totalTicketsResult = await pool.query('SELECT COUNT(*) as count FROM tickets');

    res.json({
      totalEvents: parseInt(totalEventsResult.rows[0].count),
      activeEvents: parseInt(activeEventsResult.rows[0].count),
      totalOrders: parseInt(totalOrdersResult.rows[0].count),
      pendingOrders: parseInt(pendingOrdersResult.rows[0].count),
      totalRevenue: parseFloat(totalRevenueResult.rows[0].total) || 0,
      totalTickets: parseInt(totalTicketsResult.rows[0].count)
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
