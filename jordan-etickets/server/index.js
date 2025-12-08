import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './database.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
