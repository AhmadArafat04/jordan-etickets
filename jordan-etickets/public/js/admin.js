const API_URL = window.location.origin + '/api';
let authToken = localStorage.getItem('adminToken');

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        showDashboard();
    } else {
        showLogin();
    }

    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Add event button
    document.getElementById('add-event-btn').addEventListener('click', () => {
        openEventForm();
    });

    // Event form
    document.getElementById('event-form').addEventListener('submit', handleEventSubmit);

    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        if (data.user.role !== 'admin') {
            throw new Error('Admin access required');
        }

        authToken = data.token;
        localStorage.setItem('adminToken', authToken);
        showDashboard();
    } catch (error) {
        alert(error.message || 'Login failed');
    }
}

// Handle logout
function handleLogout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    showLogin();
}

// Show login section
function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
}

// Show dashboard
function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    loadDashboardData();
}

// Load dashboard data
async function loadDashboardData() {
    await loadStats();
    await loadPendingOrders();
}

// Load stats
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const stats = await response.json();

        document.getElementById('stat-events').textContent = stats.totalEvents;
        document.getElementById('stat-orders').textContent = stats.totalOrders;
        document.getElementById('stat-pending').textContent = stats.pendingOrders;
        document.getElementById('stat-revenue').textContent = stats.totalRevenue.toFixed(2) + ' JOD';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load pending orders
async function loadPendingOrders() {
    try {
        const response = await fetch(`${API_URL}/admin/orders/pending`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const orders = await response.json();
        const container = document.getElementById('pending-orders-list');

        if (orders.length === 0) {
            container.innerHTML = '<p class="loading">No pending orders</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>${order.event_title}</h3>
                        <span class="status-badge status-${order.status}">${order.status}</span>
                    </div>
                    <div class="order-actions">
                        <button class="btn btn-success" onclick="approveOrder(${order.id})">✓ Approve</button>
                        <button class="btn btn-danger" onclick="rejectOrder(${order.id})">✗ Reject</button>
                    </div>
                </div>
                <div class="order-details">
                    <p><strong>Reference:</strong> ${order.reference_number}</p>
                    <p><strong>Customer:</strong> ${order.customer_name}</p>
                    <p><strong>Email:</strong> ${order.customer_email}</p>
                    <p><strong>Phone:</strong> ${order.customer_phone}</p>
                    <p><strong>Age:</strong> ${order.customer_age || 'N/A'}</p>
                    <p><strong>Quantity:</strong> ${order.quantity} tickets</p>
                    <p><strong>Total:</strong> ${order.total_amount} JOD</p>
                    <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                    ${order.payment_proof ? `<img src="${order.payment_proof}" class="payment-proof" style="max-width: 300px;">` : '<p><em>No payment proof uploaded</em></p>'}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading pending orders:', error);
    }
}

// Load all orders
async function loadAllOrders() {
    try {
        const response = await fetch(`${API_URL}/admin/orders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const orders = await response.json();
        const container = document.getElementById('all-orders-list');

        if (orders.length === 0) {
            container.innerHTML = '<p class="loading">No orders yet</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>${order.event_title}</h3>
                        <span class="status-badge status-${order.status}">${order.status}</span>
                    </div>
                </div>
                <div class="order-details">
                    <p><strong>Reference:</strong> ${order.reference_number}</p>
                    <p><strong>Customer:</strong> ${order.customer_name} (${order.customer_email})</p>
                    <p><strong>Age:</strong> ${order.customer_age || 'N/A'}</p>
                    <p><strong>Quantity:</strong> ${order.quantity} tickets</p>
                    <p><strong>Total:</strong> ${order.total_amount} JOD</p>
                    <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load events
async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/admin/events`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const events = await response.json();
        const container = document.getElementById('events-list');

        if (events.length === 0) {
            container.innerHTML = '<p class="loading">No events yet</p>';
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>${event.title}</h3>
                        <span class="status-badge status-${event.status === 'active' ? 'approved' : 'pending'}">${event.status}</span>
                    </div>
                    <div class="order-actions">
                        <button class="btn btn-primary" onclick="editEvent(${event.id})">Edit</button>
                        <button class="btn btn-danger" onclick="deleteEvent(${event.id})">Delete</button>
                    </div>
                </div>
                <div class="order-details">
                    <p><strong>Date:</strong> ${event.date} at ${event.time}</p>
                    <p><strong>Venue:</strong> ${event.venue}</p>
                    <p><strong>Price:</strong> ${event.price} JOD</p>
                    <p><strong>Tickets:</strong> ${event.sold} / ${event.quantity} sold</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Switch tab
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load data for the tab
    if (tabName === 'pending-orders') {
        loadPendingOrders();
    } else if (tabName === 'all-orders') {
        loadAllOrders();
    } else if (tabName === 'events') {
        loadEvents();
    }
}

// Approve order
async function approveOrder(orderId) {
    if (!confirm('Approve this order and generate tickets?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/orders/${orderId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Approval failed');
        }

        alert('✅ Order approved and tickets sent!');
        loadPendingOrders();
        loadStats();
    } catch (error) {
        alert(error.message || 'Error approving order');
    }
}

// Reject order
async function rejectOrder(orderId) {
    if (!confirm('Reject this order?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/orders/${orderId}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Rejection failed');
        }

        alert('Order rejected');
        loadPendingOrders();
        loadStats();
    } catch (error) {
        alert(error.message || 'Error rejecting order');
    }
}

// Open event form
function openEventForm(eventData = null) {
    const modal = document.getElementById('event-form-modal');
    const form = document.getElementById('event-form');
    const title = document.getElementById('event-form-title');

    if (eventData) {
        title.textContent = 'Edit Event';
        document.getElementById('event-id').value = eventData.id;
        document.getElementById('event-title').value = eventData.title;
        document.getElementById('event-description').value = eventData.description || '';
        document.getElementById('event-date').value = eventData.date;
        document.getElementById('event-time').value = eventData.time;
        document.getElementById('event-venue').value = eventData.venue;
        document.getElementById('event-price').value = eventData.price;
        document.getElementById('event-quantity').value = eventData.quantity;
        document.getElementById('event-status').value = eventData.status;
    } else {
        title.textContent = 'Add Event';
        form.reset();
        document.getElementById('event-id').value = '';
    }

    modal.classList.add('active');
}

// Edit event
async function editEvent(eventId) {
    try {
        const response = await fetch(`${API_URL}/events/${eventId}`);
        const event = await response.json();
        openEventForm(event);
    } catch (error) {
        alert('Error loading event');
    }
}

// Handle event form submit
async function handleEventSubmit(e) {
    e.preventDefault();

    const eventId = document.getElementById('event-id').value;
    const formData = new FormData();

    formData.append('title', document.getElementById('event-title').value);
    formData.append('description', document.getElementById('event-description').value);
    formData.append('date', document.getElementById('event-date').value);
    formData.append('time', document.getElementById('event-time').value);
    formData.append('venue', document.getElementById('event-venue').value);
    formData.append('price', document.getElementById('event-price').value);
    formData.append('quantity', document.getElementById('event-quantity').value);
    formData.append('status', document.getElementById('event-status').value);

    const imageFile = document.getElementById('event-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const url = eventId ? `${API_URL}/admin/events/${eventId}` : `${API_URL}/admin/events`;
        const method = eventId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Save failed');
        }

        alert('✅ Event saved successfully!');
        document.getElementById('event-form-modal').classList.remove('active');
        loadEvents();
    } catch (error) {
        alert(error.message || 'Error saving event');
    }
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Delete this event? This cannot be undone.')) return;

    try {
        const response = await fetch(`${API_URL}/admin/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Delete failed');
        }

        alert('Event deleted');
        loadEvents();
        loadStats();
    } catch (error) {
        alert(error.message || 'Error deleting event');
    }
}
