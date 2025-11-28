const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'jordan-etickets', 'database', 'etickets.db'));

// Clear existing events
db.prepare('DELETE FROM events').run();

// Add the 7 events from the schedule
const events = [
    {
        title: 'توزيع هدايا الكريسماس',
        description: 'ليلة دي جي تسعينات',
        date: '2024-12-25',
        time: '20:00',
        venue: 'Amman City Center',
        price: 25,
        available_tickets: 100,
        image_url: '/images/event-placeholder.jpg'
    },
    {
        title: 'سهرة طرب شرقي',
        description: 'أمسية موسيقية شرقية رائعة',
        date: '2024-12-26',
        time: '20:00',
        venue: 'Amman City Center',
        price: 25,
        available_tickets: 100,
        image_url: '/images/event-placeholder.jpg'
    },
    {
        title: 'ليلة بينغو + جوائز',
        description: 'ليلة ترفيهية مع جوائز قيمة',
        date: '2024-12-27',
        time: '20:00',
        venue: 'Amman City Center',
        price: 25,
        available_tickets: 100,
        image_url: '/images/event-placeholder.jpg'
    },
    {
        title: 'ليلة دي جي تسعينات وذكريات',
        description: 'أجمل أغاني التسعينات',
        date: '2024-12-28',
        time: '20:00',
        venue: 'Amman City Center',
        price: 25,
        available_tickets: 100,
        image_url: '/images/event-placeholder.jpg'
    },
    {
        title: 'ديجي تسعينات',
        description: 'ليلة موسيقى التسعينات',
        date: '2024-12-29',
        time: '20:00',
        venue: 'Amman City Center',
        price: 25,
        available_tickets: 100,
        image_url: '/images/event-placeholder.jpg'
    },
    {
        title: 'أجواء أردنية – فلسطينية – وطنية',
        description: 'احتفال بالتراث والثقافة',
        date: '2024-12-30',
        time: '20:00',
        venue: 'Amman City Center',
        price: 25,
        available_tickets: 100,
        image_url: '/images/event-placeholder.jpg'
    },
    {
        title: 'توزيع الجوائز والهدايا (ختام السنة)',
        description: 'احتفال نهاية العام مع توزيع الجوائز',
        date: '2024-12-31',
        time: '20:00',
        venue: 'Amman City Center',
        price: 25,
        available_tickets: 100,
        image_url: '/images/event-placeholder.jpg'
    }
];

const insertEvent = db.prepare(`
    INSERT INTO events (title, description, date, time, venue, price, available_tickets, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

events.forEach(event => {
    insertEvent.run(
        event.title,
        event.description,
        event.date,
        event.time,
        event.venue,
        event.price,
        event.available_tickets,
        event.image_url
    );
});

console.log('✅ Successfully added 7 events to the database!');
db.close();
