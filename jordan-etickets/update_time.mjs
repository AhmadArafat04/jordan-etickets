import Database from 'better-sqlite3';

const db = new Database('./database/etickets.db');

// Update all events to 7pm (19:00)
const updateTime = db.prepare(`
    UPDATE events 
    SET time = '19:00'
    WHERE time = '20:00'
`);

const result = updateTime.run();

console.log(`✅ Updated ${result.changes} events to 7pm (19:00)`);

// Verify the changes
const events = db.prepare('SELECT id, title, date, time FROM events ORDER BY date').all();
console.log('\nAll events:');
events.forEach(event => {
    console.log(`- ${event.title}: ${event.date} at ${event.time}`);
});

db.close();
