import Database from 'better-sqlite3';

const db = new Database('./database/etickets.db');

try {
    // Add age column to orders table
    db.exec(`
        ALTER TABLE orders 
        ADD COLUMN customer_age INTEGER
    `);
    
    console.log('✅ Successfully added customer_age column to orders table');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  customer_age column already exists');
    } else {
        console.error('❌ Error:', error.message);
    }
}

// Verify the schema
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'").get();
console.log('\nOrders table schema:');
console.log(schema.sql);

db.close();
