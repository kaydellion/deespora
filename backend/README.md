# Deespora Backend Setup

## Prerequisites
- PHP 7.4+ with PDO MySQL extension and mail() function enabled
- MySQL 5.7+ or MariaDB
- XAMPP or similar local server with configured mail settings

## Setup Instructions

### 1) Configure Database Credentials

Copy the example config and fill with your actual credentials:

```bash
cp backend/config.example.php backend/config.php
```

Then edit `backend/config.php` and update:
- **Database settings**: host, port, name, user, pass
- **Email settings**: from_email, from_name

**Important**: `backend/config.php` is gitignored for security. Never commit it with real credentials.

### 2) Create Database and Tables

Run the SQL schema file:

```bash
mysql -u root -p < sql/deespora_schema.sql
```

Or import via phpMyAdmin or your preferred MySQL client.

This creates:
- Database: `deespora_db`
- Table: `subscribers` (stores email subscriptions)
- Table: `contacts` (stores contact form submissions)

### 3) Configure PHP Mail

The backend uses PHP's native `mail()` function. For local development with XAMPP:

**Windows (XAMPP):**
- Edit `php.ini` and configure SMTP settings
- Or use a tool like [sendmail for XAMPP](https://www.glob.com.au/sendmail/)

**Mac (XAMPP):**
- XAMPP on Mac uses Postfix by default
- Configure in `/Applications/XAMPP/xamppfiles/etc/php.ini`

All emails are sent to: **hello@deespora.com**

### 4) Test the Forms

- **Subscribe form**: Posts to `/backend/subscribe.php`
- **Contact form**: Posts to `/backend/contact.php`

Both endpoints:
- Return JSON responses: `{success: true}` or `{success: false, error: "..."}`
- Save data to MySQL database
- Send branded HTML email notifications to hello@deespora.com

## Email Templates

Branded HTML email templates are located in `backend/templates/`:
- `subscribe_email.html` - New subscriber notification (gradient header with subscriber email)
- `contact_email.html` - Contact form submission (full contact details with reply button)

Both templates feature:
- Deespora brand colors (#37B6AF gradient)
- Professional, mobile-responsive design
- Clean typography and spacing

## Troubleshooting

- **Email not sending**: 
  - Verify PHP mail() is configured in `php.ini`
  - Check XAMPP mail logs
  - For testing, use a mail catcher like MailHog
- **Database errors**: 
  - Verify MySQL connection settings in `backend/config.php`
  - Ensure database and tables exist
  - Check MySQL user permissions
- **404 errors**: 
  - Ensure XAMPP is running
  - Verify URLs match your setup (adjust `/` path if needed)
  - Check file permissions
