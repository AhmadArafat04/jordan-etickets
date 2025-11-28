# Complete Railway Deployment Guide

This guide will walk you through deploying your Jordan E-Tickets website to Railway for permanent hosting.

## What You'll Need

- A GitHub account (free)
- A Railway account (free tier available)
- Your CliQ number for receiving payments
- A Gmail account for sending ticket emails
- 30-45 minutes of your time

## Part 1: Prepare Your Code (5 minutes)

### Step 1: Update Your CliQ Information

Before deploying, update the `.env` file with your actual information:

```env
# Your CliQ payment details
CLIQ_NUMBER=079XXXXXXX          # Replace with your actual CliQ number
CLIQ_NAME=Your Business Name     # Replace with your name or business name

# Email for sending tickets
EMAIL_USER=your-email@gmail.com  # Replace with your Gmail
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx   # We'll generate this in Part 2
```

### Step 2: Test Locally (Optional but Recommended)

Before deploying, test the website on your computer:

```bash
cd jordan-etickets
npm install
npm start
```

Visit http://localhost:3000 and make sure everything works.

---

## Part 2: Set Up Gmail for Sending Tickets (10 minutes)

Your website needs to send ticket PDFs to customers via email. Here's how to set up Gmail:

### Step 1: Enable 2-Factor Authentication

1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. Follow the steps to enable it (you'll need your phone)

### Step 2: Generate App Password

1. After enabling 2FA, go back to https://myaccount.google.com/security
2. Scroll down to "2-Step Verification"
3. Click on "App passwords" at the bottom
4. You might need to sign in again
5. Select:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - Type: "Jordan E-Tickets"
6. Click "Generate"
7. **Copy the 16-character password** (format: xxxx-xxxx-xxxx-xxxx)
8. Save this password - you'll need it later!

---

## Part 3: Upload Code to GitHub (10 minutes)

Railway deploys from GitHub, so we need to upload your code there.

### Step 1: Create GitHub Account

1. Go to https://github.com
2. Click "Sign up"
3. Choose a username, enter email and password
4. Verify your email address

### Step 2: Install Git (if not installed)

**Windows:**
- Download from https://git-scm.com/download/win
- Run installer with default settings

**Mac:**
- Open Terminal
- Type: `git --version`
- If not installed, it will prompt you to install

**Linux:**
```bash
sudo apt-get install git
```

### Step 3: Configure Git

Open Terminal (Mac/Linux) or Git Bash (Windows):

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@gmail.com"
```

### Step 4: Create GitHub Repository

1. Go to https://github.com
2. Click the "+" icon in top-right corner
3. Click "New repository"
4. Fill in:
   - **Repository name**: `jordan-etickets`
   - **Description**: "Event ticketing website for Jordan"
   - **Privacy**: Choose Private (recommended)
5. **DO NOT** check "Initialize with README"
6. Click "Create repository"

### Step 5: Upload Your Code

On the next page, you'll see commands. Open Terminal/Git Bash in your `jordan-etickets` folder and run:

```bash
# Navigate to your project folder
cd /path/to/jordan-etickets

# Initialize git
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - Jordan E-Tickets website"

# Add GitHub as remote (replace YOUR-USERNAME)
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/jordan-etickets.git

# Push to GitHub
git push -u origin main
```

You might be asked to login to GitHub. Use your GitHub username and password.

**Troubleshooting:**
- If push fails with authentication error, you may need to create a Personal Access Token:
  1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Generate new token with "repo" scope
  3. Use this token as password when pushing

---

## Part 4: Deploy to Railway (15 minutes)

Now let's deploy your website to Railway for permanent hosting!

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "Login"
3. Click "Login with GitHub"
4. Authorize Railway to access your GitHub account

### Step 2: Create New Project

1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"
3. You'll see a list of your repositories
4. Click on `jordan-etickets`
5. Railway will start deploying automatically

### Step 3: Wait for Initial Deployment

- You'll see build logs in real-time
- Wait for "Build successful" message
- This takes 2-5 minutes

### Step 4: Add Environment Variables

Your website needs configuration variables. Let's add them:

1. Click on your service (the box with your project name)
2. Go to "Variables" tab
3. Click "Raw Editor" button
4. Paste the following (replace with your actual values):

```
JWT_SECRET=change-this-to-random-string-abc123xyz789
CLIQ_NUMBER=079XXXXXXX
CLIQ_NAME=Your Name or Business Name
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM=Jordan E-Tickets <your-email@gmail.com>
```

5. Click "Update Variables"
6. Railway will automatically redeploy with new variables

### Step 5: Get Your Website URL

1. Go to "Settings" tab
2. Scroll down to "Networking" section
3. You'll see "Public Networking"
4. Click "Generate Domain"
5. Railway will give you a URL like: `jordan-etickets-production.up.railway.app`
6. **This is your permanent website URL!**
7. Copy this URL and save it

### Step 6: Test Your Live Website

1. Open your Railway URL in a browser
2. You should see your website homepage
3. Click "Admin" in the navigation
4. Login with default credentials:
   - Email: `admin@etickets.jo`
   - Password: `admin123`
5. You should see the admin dashboard

**If it doesn't work:**
- Check the "Deployments" tab for error logs
- Make sure all environment variables are set correctly
- Wait a few minutes and try again

---

## Part 5: First-Time Setup (5 minutes)

### Step 1: Change Admin Password

**IMPORTANT**: Change the default admin password immediately!

Currently, you need to do this by updating the database. Here's how:

1. Login to admin panel with default credentials
2. Create a new admin user with your desired password (you'll need to add this feature, or)
3. For now, you can change it by:
   - Going to Railway dashboard
   - Click "Data" tab
   - Access the SQLite database
   - Update the users table

**Better option**: Add a "Change Password" feature to the admin panel.

### Step 2: Create Your First Event

1. Login to admin panel
2. Click "Events" tab
3. Click "Add New Event"
4. Fill in event details:
   - Title: "Test Event"
   - Description: "This is a test event"
   - Date: Choose a future date
   - Time: Choose a time
   - Venue: "Test Venue, Amman"
   - Price: 10
   - Quantity: 100
   - Status: Active
5. Upload an event image (optional)
6. Click "Save Event"

### Step 3: Test the Customer Flow

1. Open your website URL in a new incognito/private window
2. You should see your test event on the homepage
3. Click on the event
4. Click "Buy Tickets"
5. Fill in test customer information
6. Complete the checkout process
7. You'll see payment instructions with your CliQ number

### Step 4: Test Order Approval

1. Go back to admin panel
2. Click "Pending Orders" tab
3. You should see the test order
4. Click "✓ Approve"
5. Check if the customer email received the ticket

If email doesn't arrive:
- Check your Gmail App Password is correct
- Check spam folder
- Verify EMAIL_USER and EMAIL_PASS in Railway variables

---

## Part 6: Optional - Custom Domain (10 minutes)

If you want a custom domain like `mytickets.com` instead of the Railway URL:

### Step 1: Buy a Domain

Buy a domain from:
- Namecheap (https://www.namecheap.com) - ~$10/year
- Google Domains (https://domains.google) - ~$12/year
- GoDaddy (https://www.godaddy.com) - ~$15/year

### Step 2: Add Domain to Railway

1. In Railway Settings → Networking
2. Click "Custom Domain"
3. Enter your domain (e.g., `mytickets.com`)
4. Railway will show you DNS records to add

### Step 3: Update DNS Records

1. Go to your domain registrar (Namecheap, Google Domains, etc.)
2. Find DNS settings
3. Add the records shown by Railway:
   - Type: CNAME
   - Name: @ (or your subdomain)
   - Value: (the Railway URL)
4. Save changes

### Step 4: Wait for DNS Propagation

- DNS changes take 5 minutes to 48 hours
- Usually works within 1-2 hours
- Test by visiting your custom domain

---

## Part 7: Going Live Checklist

Before announcing your website to customers:

- [ ] Admin password changed from default
- [ ] Test event created and visible on homepage
- [ ] Test order placed and approved successfully
- [ ] Ticket email received with PDF attachment
- [ ] CliQ number is correct in payment instructions
- [ ] Your business name is correct
- [ ] Website loads on mobile devices
- [ ] All images are displaying correctly
- [ ] Admin panel accessible and working

---

## Ongoing Management

### Daily Tasks (5-10 minutes, 2-3 times per day)

1. **Check Pending Orders**:
   - Login to admin panel
   - Go to "Pending Orders" tab
   - Check your bank app for CliQ payments
   - Match reference numbers
   - Approve valid orders

2. **Monitor Email Delivery**:
   - Make sure customers are receiving tickets
   - Check for any email errors

### Weekly Tasks

1. **Check Statistics**:
   - View total orders and revenue
   - See how many tickets sold per event

2. **Add New Events** (as needed):
   - Create new events before they're announced
   - Upload high-quality event images
   - Set correct prices and quantities

### Monthly Tasks

1. **Check Railway Usage**:
   - Go to Railway dashboard
   - Check usage and costs
   - Make sure you're within budget

2. **Backup Database** (important!):
   - Download the `tickets.db` file
   - Save it somewhere safe
   - This contains all your orders and events

---

## Troubleshooting Common Issues

### Issue: Website shows "Application Error"

**Solution:**
1. Go to Railway dashboard
2. Check "Deployments" tab for error logs
3. Common causes:
   - Missing environment variables
   - Syntax error in code
   - Port configuration issue
4. Fix the issue and redeploy

### Issue: Emails not sending

**Solution:**
1. Verify Gmail App Password is correct (not your regular password)
2. Check EMAIL_HOST is `smtp.gmail.com`
3. Check EMAIL_PORT is `587`
4. Make sure 2FA is enabled on Gmail
5. Try generating a new App Password

### Issue: Images not uploading

**Solution:**
1. Check file size (must be under 5MB)
2. Check file format (jpg, png, gif, webp only)
3. Try a different image
4. Check Railway logs for errors

### Issue: Orders not appearing in admin panel

**Solution:**
1. Refresh the page
2. Check browser console for JavaScript errors (F12)
3. Make sure you're logged in as admin
4. Check database connection in Railway logs

### Issue: Railway deployment failed

**Solution:**
1. Check build logs in Railway dashboard
2. Common causes:
   - Missing dependencies in package.json
   - Syntax error in code
   - Wrong Node.js version
3. Fix the issue in your code
4. Push to GitHub again:
   ```bash
   git add .
   git commit -m "Fix deployment issue"
   git push
   ```
5. Railway will automatically redeploy

---

## Updating Your Website

When you want to make changes to your website:

1. **Make changes locally**:
   - Edit files in your `jordan-etickets` folder
   - Test locally with `npm start`

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

3. **Railway auto-deploys**:
   - Railway detects the push
   - Automatically rebuilds and redeploys
   - Takes 2-5 minutes

---

## Cost Breakdown

### Railway Costs (for 1 month event)

- **Free tier**: $5 credit per month
- **Typical usage**: $0-10/month depending on traffic
- **What you pay for**:
  - Server time (per hour)
  - Bandwidth (per GB)
  - Build time

### Example Costs:

**Small event** (100 tickets, 500 visitors):
- Estimated cost: $0-5 (covered by free tier)

**Medium event** (500 tickets, 2000 visitors):
- Estimated cost: $5-10

**Large event** (1000+ tickets, 5000+ visitors):
- Estimated cost: $10-20

### Compared to Payment Gateway:

If you used Stripe or another payment gateway:
- Transaction fee: 3.4% + 2 JOD per transaction
- For 100 tickets at 10 JOD each: ~34 JOD in fees
- **With CliQ**: 0 JOD in fees + $5-10 hosting = Much cheaper!

---

## Getting Help

### Railway Support
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Twitter: @Railway

### GitHub Help
- Documentation: https://docs.github.com
- Community: https://github.community

### Gmail SMTP Issues
- Help: https://support.google.com/mail/answer/7126229

---

## Next Steps

After successful deployment:

1. **Promote your website**:
   - Share the URL on social media
   - Add it to your Instagram bio
   - Include it in event announcements

2. **Monitor performance**:
   - Check Railway dashboard regularly
   - Monitor order flow
   - Respond to customer inquiries

3. **Improve the website** (optional):
   - Add more event details
   - Customize colors and branding
   - Add WhatsApp integration
   - Implement automatic payment verification (requires payment gateway)

---

**Congratulations! Your e-ticket website is now live! 🎉**

You now have a professional ticketing platform that:
- ✅ Costs almost nothing to run
- ✅ Accepts CliQ payments (zero fees)
- ✅ Automatically generates and emails tickets
- ✅ Is accessible 24/7 from anywhere
- ✅ Looks professional and trustworthy

Good luck with your events!
