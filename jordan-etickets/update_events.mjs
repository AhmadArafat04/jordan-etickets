import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'database', 'etickets.db'));

// Update all events to use new image and price 20 JOD
const updateStmt = db.prepare(`
    UPDATE events 
    SET image = '/images/event-image.jpg',
        price = 20
    WHERE 1=1
`);
const updateResult = updateStmt.run();
console.log(`✅ Updated ${updateResult.changes} events with new image and price 20 JOD`);

db.close();
console.log('✅ All changes completed successfully!');
