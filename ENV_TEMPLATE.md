# Environment Configuration Guide

This document describes all environment variables needed for the application.

## Setup Instructions

1. Copy the template below to create your `.env.local` file:
   ```bash
   cp ENV_TEMPLATE.md .env.local
   ```

2. Update the values with your actual configuration

## Required Environment Variables

### Database Configuration

```bash
# MySQL Database URL
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
# Example local: mysql://root:password@localhost:3306/google_search_me
# Example PlanetScale: mysql://username:password@aws.connect.psdb.cloud/google_search_me?sslaccept=strict
DATABASE_URL="mysql://root:password@localhost:3306/google_search_me"
```

### Authentication

```bash
# JWT Secret - Generate a secure random string for production
# You can generate one with: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### Google Maps API

```bash
# Get your API key from: https://console.cloud.google.com/google/maps-apis
# Last verified: December 24, 2025
# The following Google Maps APIs must be ENABLED for this key:
#   - Geolocation API
#   - Geocoding API
#   - Directions API
#   - Maps JavaScript API
#   - Places API (New)
#   - Places API
#   - Maps Static API
# To enable these APIs:
#   1. Go to Google Cloud Console > APIs & Services > Library
#   2. Search for each API above and click "Enable"
#   3. Ensure billing is set up (required for most Maps APIs)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyCHQECnK2DXcNXIQR0ZfvIEPrAJWIH8JsM"
```

### ImageKit (Photo Uploads)

```bash
# Sign up at: https://imagekit.io/
# ImageKit Configuration (add your actual keys here)
IMAGEKIT_PUBLIC_KEY=public_O/9pxeXVXghCIZD8o8ySi04JvK4=
IMAGEKIT_PRIVATE_KEY=private_z98e1q+JMejEDabjjvzijXlKH84=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/rgriola

```

### Email Configuration (Nodemailer)

```bash
# SMTP Configuration - Example using Gmail
#SMTP_HOST="smtp.gmail.com"
#SMTP_PORT="587"
#SMTP_USER="your-email@gmail.com"
#SMTP_PASS="your-app-password"  # For Gmail, use App Password not regular password
#EMAIL_FROM="your-email@gmail.com"

# Email Configuration
EMAIL_SERVICE=mailtrap
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=e61052be8f5ea6
EMAIL_PASS=34dc22b24e84eb
EMAIL_MODE=development
EMAIL_FROM_NAME=Development
EMAIL_FROM_ADDRESS=dev@localhost

```

### Application URLs

```bash
# Application URL (change in production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Node Environment

```bash
# Environment mode
NODE_ENV="development"  # Use "production" for production builds

```

## Complete .env.local Template

Copy this entire block to your `.env.local` file:

```bash
# Database
DATABASE_URL="mysql://root:password@localhost:3306/google_search_me"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="your-imagekit-public-key"
IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"
IMAGEKIT_URL_ENDPOINT="your-imagekit-url-endpoint"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

## Setting up MySQL Database

### Option 1: Local MySQL

1. Install MySQL locally
2. Create database:
   ```sql
   CREATE DATABASE google_search_me;
   ```
3. Update `DATABASE_URL` with your local credentials

### Option 2: Cloud MySQL (PlanetScale - Free Tier Available)

1. Sign up at https://planetscale.com
2. Create a new database
3. Get connection string
4. Update `DATABASE_URL` with PlanetScale connection string

### Option 3: Cloud MySQL (Railway)

1. Sign up at https://railway.app
2. Create a new MySQL database
3. Copy the connection string
4. Update `DATABASE_URL`

## Next Steps

After setting up your `.env.local` file:

1. Run Prisma migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
