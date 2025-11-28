import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'database', 'etickets.db'));

// Update all events venue to Cantina 7th circle
const updateStmt = db.prepare(`
    UPDATE events 
    SET venue = 'Cantina 7th circle'
    WHERE 1=1
`);
const result = updateStmt.run();
console.log(`✅ Updated ${result.changes} events to venue: Cantina 7th circle`);

db.close();
console.log('✅ Venue updated successfully!');
