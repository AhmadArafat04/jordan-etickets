import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import db from '../database.js';
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
    const events = await db.prepare('SELECT * FROM events ORDER BY created_at DESC').all();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create event
router.post('/events', upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, time, venue, price, quantity } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : null;

    const result = await db.prepare(`
      INSERT INTO events (title, description, date, time, venue, price, quantity, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, date, time, venue, parseFloat(price), parseInt(quantity), image);

    res.json({ id: result.lastInsertRowid, message: 'Event created successfully' });
  } catch (error) {
    console.error(error);
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
      SET title = ?, description = ?, date = ?, time = ?, venue = ?, 
          price = ?, quantity = ?, status = ?
    `;
    const params = [title, description, date, time, venue, parseFloat(price), parseInt(quantity), status];

    if (image) {
      query += ', image = ?';
      params.push(image);
    }

    query += ' WHERE id = ?';
    params.push(req.params.id);

    await db.prepare(query).run(...params);

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    await db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await db.prepare(`
      SELECT o.*, e.title as event_title
      FROM orders o
      JOIN events e ON o.event_id = e.id
      ORDER BY o.created_at DESC
    `).all();

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending orders
router.get('/orders/pending', async (req, res) => {
  try {
    const orders = await db.prepare(`
      SELECT o.*, e.title as event_title, e.date, e.time, e.venue
      FROM orders o
      JOIN events e ON o.event_id = e.id
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC
    `).all();

    res.json(orders);
  } catch (error) {
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
      doc.fontSize(24).text('Jordan E-Tickets', { align: 'center' });
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
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
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
      <p>Best regards,<br>Jordan E-Tickets Team</p>
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
  try {
    const orderId = req.params.id;

    // Get order details
    const order = await db.prepare(`
      SELECT o.*, e.title, e.description, e.date, e.time, e.venue, e.price
      FROM orders o
      JOIN events e ON o.event_id = e.id
      WHERE o.id = ?
    `).get(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order already processed' });
    }

    // Check if tickets already exist
    const existingTickets = await db.prepare('SELECT id FROM tickets WHERE order_id = ?').all(orderId);
    if (existingTickets.length > 0) {
      return res.status(400).json({ error: 'Tickets already generated for this order' });
    }

    // Generate tickets
    const tickets = [];
    for (let i = 0; i < order.quantity; i++) {
      const ticket_number = generateTicketNumber();
      const qr_code = `${process.env.WEBSITE_URL}/verify/${ticket_number}`;

      const result = await db.prepare(`
        INSERT INTO tickets (order_id, ticket_number, qr_code)
        VALUES (?, ?, ?)
      `).run(orderId, ticket_number, qr_code);

      tickets.push({
        id: result.lastInsertRowid,
        ticket_number,
        qr_code
      });
    }

    // Update order status
    await db.prepare('UPDATE orders SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('approved', orderId);

    // Update event sold count
    await db.prepare('UPDATE events SET sold = sold + ? WHERE id = ?')
      .run(order.quantity, order.event_id);

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
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject order
router.post('/orders/:id/reject', async (req, res) => {
  try {
    await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('rejected', req.params.id);
    res.json({ message: 'Order rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalEventsRow = await db.prepare('SELECT COUNT(*) as count FROM events').get();
    const totalEvents = totalEventsRow.count;
    const activeEventsRow = await db.prepare('SELECT COUNT(*) as count FROM events WHERE status = ?').get('active');
    const activeEvents = activeEventsRow.count;
    const totalOrdersRow = await db.prepare('SELECT COUNT(*) as count FROM orders').get();
    const totalOrders = totalOrdersRow.count;
    const pendingOrdersRow = await db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('pending');
    const pendingOrders = pendingOrdersRow.count;
    const totalRevenueRow = await db.prepare('SELECT SUM(total_amount) as total FROM orders WHERE status = ?').get('approved');
    const totalRevenue = totalRevenueRow.total || 0;
    const totalTicketsRow = await db.prepare('SELECT COUNT(*) as count FROM tickets').get();
    const totalTickets = totalTicketsRow.count;

    res.json({
      totalEvents,
      activeEvents,
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalTickets
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;s
