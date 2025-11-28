# Jordan E-Tickets - Event Ticketing Platform

A complete e-ticket website for selling event tickets in Jordan with manual CliQ payment verification.

## Features

### Customer Features
- Browse upcoming events with images, dates, venues, and prices
- View detailed event information
- Purchase tickets with quantity selection
- Receive payment instructions with unique reference numbers
- Upload payment proof (optional)
- Automatic ticket generation and email delivery after admin approval

### Admin Features
- Secure admin login
- Dashboard with statistics (events, orders, revenue)
- Create, edit, and delete events with images
- View pending orders with payment proofs
- Approve or reject orders
- Automatic ticket PDF generation with QR codes
- Email notifications to customers

### Payment System
- **Manual CliQ verification** - No merchant account needed!
- Customers send payment via CliQ with reference number
- Admin verifies payment and approves order
- Automatic ticket generation and email delivery
- Zero transaction fees

## Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Frontend**: Vanilla JavaScript (no framework needed)
- **Authentication**: JWT tokens with bcrypt
- **File Upload**: Multer
- **Email**: Nodemailer (configured for Gmail SMTP)

## Installation

### Prerequisites
- Node.js 18+ installed
- Git installed

### Local Setup

1. **Clone or download this project**
   ```bash
   cd jordan-etickets
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Edit the `.env` file:
   ```env
   PORT=3000
   JWT_SECRET=your-secret-key-change-this
   
   # CliQ Payment Info (customers will see this)
   CLIQ_NUMBER=079XXXXXXX
   CLIQ_NAME=Your Name or Business Name
   
   # Email Configuration (for sending tickets)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=Jordan E-Tickets <your-email@gmail.com>
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the website**
   - Website: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin.html
   - Default admin login: `admin@etickets.jo` / `admin123`

## Email Setup (Gmail)

To send tickets via email, you need to configure Gmail SMTP:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Click "2-Step Verification"
   - Scroll down and click "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Name it "Jordan E-Tickets"
   - Copy the 16-character password
3. **Update .env file**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=xxxx-xxxx-xxxx-xxxx  # The app password
   ```

## Deployment to Railway

Railway is the easiest way to deploy this website permanently.

### Step 1: Create GitHub Repository

1. **Create a GitHub account** at https://github.com (if you don't have one)

2. **Create a new repository**:
   - Click the "+" icon → "New repository"
   - Name: `jordan-etickets`
   - Make it Private
   - Click "Create repository"

3. **Upload your code to GitHub**:
   ```bash
   cd jordan-etickets
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/jordan-etickets.git
   git push -u origin main
   ```

### Step 2: Deploy to Railway

1. **Create Railway account**:
   - Go to https://railway.app
   - Click "Login" and sign in with your GitHub account

2. **Create new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `jordan-etickets` repository
   - Railway will automatically detect and deploy it

3. **Add environment variables**:
   - Click on your service
   - Go to "Variables" tab
   - Click "Raw Editor"
   - Paste all your environment variables:
   ```
   JWT_SECRET=your-secret-key-change-this
   CLIQ_NUMBER=079XXXXXXX
   CLIQ_NAME=Your Name
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   EMAIL_FROM=Jordan E-Tickets <your-email@gmail.com>
   ```
   - Click "Update Variables"

4. **Get your website URL**:
   - Go to "Settings" tab
   - Scroll to "Domains"
   - You'll see a URL like: `jordan-etickets-production.up.railway.app`
   - This is your permanent website URL!

5. **Optional: Add custom domain**:
   - Buy a domain from Namecheap, Google Domains, etc.
   - In Railway Settings → Domains, click "Custom Domain"
   - Enter your domain (e.g., `mytickets.com`)
   - Update your domain's DNS records as instructed

### Step 3: Test Your Live Website

1. Visit your Railway URL
2. Log in to admin panel with default credentials
3. Create a test event
4. Test the checkout process
5. **Change the default admin password!**

## How to Use

### For Admin (Event Organizer)

1. **Login to Admin Panel**
   - Go to `/admin.html`
   - Login with your credentials
   - **Important**: Change the default password immediately!

2. **Create Events**
   - Click "Events" tab
   - Click "Add New Event"
   - Fill in event details (title, description, date, time, venue, price, quantity)
   - Upload an event image
   - Click "Save Event"

3. **Manage Orders**
   - Check "Pending Orders" tab regularly (2-3 times per day)
   - View customer information and payment proof
   - Verify payment in your bank app using reference number
   - Click "✓ Approve" to generate and send tickets
   - Click "✗ Reject" if payment is invalid

4. **Update CliQ Information**
   - Edit the `.env` file (locally) or Railway environment variables
   - Update `CLIQ_NUMBER` and `CLIQ_NAME`
   - Restart the server

### For Customers

1. **Browse Events**
   - Visit the homepage
   - Click on any event to see details

2. **Purchase Tickets**
   - Click "Buy Tickets"
   - Fill in your information (name, email, phone)
   - Select number of tickets
   - Click "Continue to Payment"

3. **Make Payment**
   - You'll see payment instructions with:
     - CliQ number to send payment to
     - Total amount
     - Unique reference number
   - Open your banking app
   - Send payment via CliQ
   - Include the reference number in notes
   - Optionally upload a screenshot

4. **Receive Tickets**
   - Admin will verify your payment (usually within a few hours)
   - You'll receive an email with your ticket PDF
   - Ticket includes QR code and unique ID

## Database

The website uses SQLite database stored in `tickets.db`. 

**Important for Railway**: The database file is stored in the container and will be reset if the service restarts. For production use, you should:

1. Use Railway's PostgreSQL plugin (recommended)
2. Or backup the SQLite file regularly

To switch to PostgreSQL (optional):
1. In Railway, click "New" → "Database" → "PostgreSQL"
2. Update `server/database.js` to use `pg` instead of `better-sqlite3`
3. Update environment variables with database URL

## Security Notes

1. **Change default admin password** immediately after deployment
2. **Use strong JWT_SECRET** - generate a random string
3. **Never commit `.env` file** to Git (it's in `.gitignore`)
4. **Use Gmail App Password**, not your actual Gmail password
5. **Keep your Railway environment variables secure**

## Costs

### Railway Pricing
- **Free tier**: $5 credit per month (enough for small events)
- **Paid tier**: $5/month after free credit
- **Pay-as-you-go**: ~$0.01 per hour of usage

### For a 1-month event:
- Estimated cost: $0-10 depending on traffic
- No transaction fees (CliQ is direct)
- Much cheaper than payment gateway fees (3-4%)

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify all environment variables are set
- Check `npm install` completed successfully

### Emails not sending
- Verify Gmail App Password is correct
- Check EMAIL_HOST and EMAIL_PORT settings
- Make sure 2FA is enabled on Gmail account

### Images not uploading
- Check `public/uploads` directory exists and is writable
- Verify file size is under 5MB
- Check image format is supported (jpg, png, gif, webp)

### Railway deployment failed
- Check build logs in Railway dashboard
- Verify all environment variables are set
- Make sure `package.json` has correct start script

## Support

For issues with:
- **The website code**: Check the code in `server/` and `public/` directories
- **Railway deployment**: Visit Railway documentation at https://docs.railway.app
- **CliQ payments**: Contact your bank
- **Email delivery**: Check Gmail SMTP settings

## License

This project is provided as-is for your event ticketing needs. Feel free to modify and customize it for your specific requirements.

---

**Built with ❤️ for Jordan's event organizers**
