const API_URL = window.location.origin + '/api';

// Format date from YYYY-MM-DD to DD.MM.YYYY
function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
}

// Load events on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    setupModals();
});

// Load all events
async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();

        const grid = document.getElementById('events-grid');
        
        if (events.length === 0) {
            grid.innerHTML = '<p class="loading">No events available at the moment.</p>';
            return;
        }

        grid.innerHTML = events.map(event => `
            <div class="event-card" onclick="showEventDetails(${event.id})">
                ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-image">` : '<div class="event-image"></div>'}
                <div class="event-info">
                    <h3>${event.title}</h3>
                    <p class="event-meta">📅 ${formatDate(event.date)} at ${event.time}</p>
                    <p class="event-meta">📍 ${event.location || 'TBA'}</p>
                    <p class="event-price">${event.price} JOD</p>
                    <p class="event-availability">${event.available_tickets} tickets available</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('events-grid').innerHTML = '<p class="loading">Error loading events. Please try again later.</p>';
    }
}

// Show event details modal
async function showEventDetails(eventId) {
    try {
        const response = await fetch(`${API_URL}/events/${eventId}`);
        const event = await response.json();

        const modal = document.getElementById('event-modal');
        const details = document.getElementById('event-details');

        details.innerHTML = `
            ${event.image ? `<img src="${event.image}" alt="${event.title}" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;">` : ''}
            <h2>${event.title}</h2>
            <p style="margin: 1rem 0;">${event.description || ''}</p>
            <div style="margin: 1rem 0;">
                <p><strong>📅 Date:</strong> ${formatDate(event.date)}</p>
                <p><strong>🕐 Time:</strong> ${event.time}</p>
                <p><strong>📍 Venue:</strong> ${event.location || 'TBA'}</p>
                <p><strong>💰 Price:</strong> ${event.price} JOD per ticket</p>
                <p><strong>🎫 Available:</strong> ${event.available_tickets} tickets</p>
            </div>
            <button class="btn btn-primary" onclick="startCheckout(${event.id})">Buy Tickets</button>
        `;

        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading event details:', error);
        alert('Error loading event details');
    }
}

// Start checkout process
function startCheckout(eventId) {
    document.getElementById('event-modal').classList.remove('active');
    showCheckoutModal(eventId);
}

// Show checkout modal
async function showCheckoutModal(eventId) {
    try {
        const response = await fetch(`${API_URL}/events/${eventId}`);
        const event = await response.json();

        const modal = document.getElementById('checkout-modal');
        const content = document.getElementById('checkout-content');

        content.innerHTML = `
            <h2>Checkout - ${event.title}</h2>
            <form id="checkout-form" onsubmit="submitOrder(event, ${eventId})">
                <div class="step">
                    <h3>1. Your Information</h3>
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" id="customer-name" required>
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" id="customer-email" required>
                    </div>
                    <div class="form-group">
                        <label>Phone Number (07XXXXXXXX) *</label>
                        <input type="tel" id="customer-phone" pattern="07[0-9]{8}" required>
                    </div>
                    <div class="form-group">
                        <label>Age *</label>
                        <input type="number" id="customer-age" min="1" max="120" required>
                    </div>
                    <div class="form-group">
                        <label>Number of Tickets *</label>
                        <input type="number" id="ticket-quantity" min="1" max="${event.available_tickets}" value="1" required>
                    </div>
                </div>
                <div class="step">
                    <h3>2. Total Amount</h3>
                    <p style="font-size: 1.5rem; font-weight: bold; color: #667eea;">
                        <span id="total-amount">${event.price}</span> JOD
                    </p>
                </div>
                <button type="submit" class="btn btn-primary">Continue to Payment</button>
            </form>
        `;

        // Update total when quantity changes
        document.getElementById('ticket-quantity').addEventListener('input', (e) => {
            const quantity = parseInt(e.target.value) || 1;
            const total = event.price * quantity;
            document.getElementById('total-amount').textContent = total.toFixed(2);
        });

        modal.classList.add('active');
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading checkout');
    }
}

// Submit order
async function submitOrder(e, eventId) {
    e.preventDefault();

    const orderData = {
        event_id: eventId,
        customer_name: document.getElementById('customer-name').value,
        customer_email: document.getElementById('customer-email').value,
        customer_phone: document.getElementById('customer-phone').value,
        customer_age: parseInt(document.getElementById('customer-age').value),
        quantity: parseInt(document.getElementById('ticket-quantity').value)
    };

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Order failed');
        }

        showPaymentInstructions(result);
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error creating order');
    }
}

// Show payment instructions
function showPaymentInstructions(orderData) {
    document.getElementById('checkout-modal').classList.remove('active');

    const modal = document.getElementById('status-modal');
    const content = document.getElementById('status-content');

    content.innerHTML = `
        <h2>✅ Order Created!</h2>
        <div class="reference-number">
            Reference: ${orderData.reference_number}
        </div>
        <div class="payment-info">
            <h4>💳 Payment Instructions</h4>
            <p><strong>1. Open your banking app</strong></p>
            <p><strong>2. Go to CliQ payment</strong></p>
            <p><strong>3. Send payment to CliQ alias:</strong></p>
            <p style="font-size: 1.5rem; margin: 1rem 0; color: #667eea; font-weight: bold;">
                ${orderData.cliq_alias}
            </p>
            <p><strong>4. Amount: ${orderData.total_amount} JOD</strong></p>
            <p><strong>5. Include this reference in notes:</strong></p>
            <p style="font-size: 1.1rem; color: #667eea; font-weight: bold;">${orderData.reference_number}</p>
        </div>
        <div class="step" style="margin-top: 2rem;">
            <h3>Upload Payment Proof (Optional)</h3>
            <p style="color: #666; margin-bottom: 1rem;">You can upload a screenshot of your payment, or just include the reference number in your CliQ payment notes.</p>
            <form id="proof-form" onsubmit="uploadProof(event, '${orderData.reference_number}')">
                <div class="form-group">
                    <input type="file" id="payment-proof" accept="image/*">
                </div>
                <button type="submit" class="btn btn-success">Upload Screenshot</button>
            </form>
        </div>
        <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <p><strong>What happens next?</strong></p>
            <p>We'll verify your payment (usually within a few hours) and send your tickets to your email.</p>
            <p style="margin-top: 0.5rem;">Save your reference number: <strong>${orderData.reference_number}</strong></p>
        </div>
        <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 1rem;">Back to Events</button>
    `;

    modal.classList.add('active');
}

// Upload payment proof
async function uploadProof(e, reference) {
    e.preventDefault();

    const fileInput = document.getElementById('payment-proof');
    if (!fileInput.files[0]) {
        alert('Please select a file');
        return;
    }

    const formData = new FormData();
    formData.append('payment_proof', fileInput.files[0]);

    try {
        const response = await fetch(`${API_URL}/orders/${reference}/proof`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
        }

        alert('✅ Payment proof uploaded successfully!');
        fileInput.value = '';
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error uploading file');
    }
}

// Setup modal close buttons
function setupModals() {
    const modals = document.querySelectorAll('.modal');
    const closeBtns = document.querySelectorAll('.close');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => modal.classList.remove('active'));
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            modals.forEach(modal => modal.classList.remove('active'));
        }
    });
}
