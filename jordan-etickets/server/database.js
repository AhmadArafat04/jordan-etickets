import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initDatabase = async () => {
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
        price REAL NOT NULL,
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
        total_amount REAL NOT NULL,
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
};

// Initialize on startup
initDatabase().catch(console.error);

// Wrapper object to match SQLite API
const db = {
  // Execute a query that returns rows
  prepare: (sql) => {
    return {
      all: async (...params) => {
        const client = await pool.connect();
        try {
          // Convert ? placeholders to $1, $2, etc.
          let paramIndex = 1;
          const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
          const result = await client.query(pgSql, params);
          return result.rows;
        } finally {
          client.release();
        }
      },
      get: async (...params) => {
        const client = await pool.connect();
        try {
          let paramIndex = 1;
          const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
          const result = await client.query(pgSql, params);
          return result.rows[0];
        } finally {
          client.release();
        }
      },
      run: async (...params) => {
        const client = await pool.connect();
        try {
          let paramIndex = 1;
          const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
          
          // Handle RETURNING clause for INSERT statements
          let finalSql = pgSql;
          if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
            finalSql = pgSql + ' RETURNING id';
          }
          
          const result = await client.query(finalSql, params);
          return {
            lastInsertRowid: result.rows[0]?.id,
            changes: result.rowCount
          };
        } finally {
          client.release();
        }
      }
    };
  },
  
  // Direct query execution
  query: async (sql, params = []) => {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
};

export default db;
