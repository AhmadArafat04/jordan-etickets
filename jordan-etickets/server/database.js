import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../database/etickets.db'));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    venue TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    sold INTEGER DEFAULT 0,
    image TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_number TEXT UNIQUE NOT NULL,
    event_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    payment_proof TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    ticket_number TEXT UNIQUE NOT NULL,
    qr_code TEXT NOT NULL,
    status TEXT DEFAULT 'valid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

// Create default admin user if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('admin123', 10);
  db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
    'admin@etickets.jo',
    hashedPassword,
    'Admin',
    'admin'
  );
  console.log('Default admin created: admin@etickets.jo / admin123');
}

export default db;
