import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        venue TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL,
        sold INTEGER DEFAULT 0,
        image TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        reference_number TEXT UNIQUE NOT NULL,
        event_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_age INTEGER,
        quantity INTEGER NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_proof TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id)
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        ticket_number TEXT UNIQUE NOT NULL,
        qr_code TEXT NOT NULL,
        status TEXT DEFAULT 'valid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
    `);

    // Migration: Add missing columns to events table
    await client.query(`
      DO $$ 
      BEGIN
        -- Add venue column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='events' AND column_name='venue'
        ) THEN
          ALTER TABLE events ADD COLUMN venue TEXT DEFAULT 'TBD';
        END IF;
        
        -- Add quantity column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='events' AND column_name='quantity'
        ) THEN
          ALTER TABLE events ADD COLUMN quantity INTEGER DEFAULT 100;
        END IF;
        
        -- Add sold column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='events' AND column_name='sold'
        ) THEN
          ALTER TABLE events ADD COLUMN sold INTEGER DEFAULT 0;
        END IF;
        
        -- Add status column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='events' AND column_name='status'
        ) THEN
          ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'active';
        END IF;
      END $$;
    `);

    // Create default admin user if not exists
    const adminCheck = await client.query('SELECT id FROM users WHERE role = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['admin@etickets.jo', hashedPassword, 'Admin', 'admin']
      );
      console.log('Default admin created: admin@etickets.jo / admin123');
    }
  } finally {
    client.release();
  }
}

// Initialize on startup
initDatabase().catch(console.error);

export default pool;
