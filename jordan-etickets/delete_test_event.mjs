import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'database', 'etickets.db'));

// First, delete any orders related to the test event
const deleteOrdersStmt = db.prepare(`
    DELETE FROM orders 
    WHERE event_id IN (SELECT id FROM events WHERE title = '90s Retro Party')
`);
const ordersResult = deleteOrdersStmt.run();
console.log(`✅ Deleted ${ordersResult.changes} order(s) related to test event`);

// Now delete the test event
const deleteEventStmt = db.prepare("DELETE FROM events WHERE title = '90s Retro Party'");
const eventResult = deleteEventStmt.run();
console.log(`✅ Deleted test event: ${eventResult.changes} event(s) removed`);

db.close();
console.log('✅ Test event successfully removed!');
