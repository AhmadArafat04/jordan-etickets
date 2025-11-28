import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'database', 'etickets.db'));

// Update all events to have 350 tickets available
const updateStmt = db.prepare(`
    UPDATE events 
    SET quantity = 350
    WHERE 1=1
`);
const result = updateStmt.run();
console.log(`✅ Updated ${result.changes} events to have 350 tickets available`);

db.close();
console.log('✅ All events now have 350 tickets!');
