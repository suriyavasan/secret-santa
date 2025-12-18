# Secret Santa Deployment Guide

## Pre-Deployment Checklist

### 1. WalletConnect Setup
Get a free WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com):
1. Sign up/Login
2. Create a new project
3. Copy your Project ID

Create `.env.local` file:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
```

### 2. Build Test
Test the production build locally:
```bash
npm run build
npm start
```

### 3. Database Files
The following files will be auto-generated on first run:
- `users-db.json` - User database
- `assignments.csv` - Assignment tracking
- `public/uploads/` - Proof images

## Deployment Options

### Option 1: Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variable: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
4. Deploy

**Important:** Vercel's serverless functions have file system limitations. Database files will reset on each deployment. Consider using:
- Vercel KV for persistent storage
- Or use Option 2/3 for better persistence

### Option 2: Railway
1. Connect GitHub repository
2. Add environment variable
3. Deploy
4. File system persists better than Vercel

### Option 3: Self-Hosted (VPS)
Best for file persistence:
```bash
# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "secret-santa" -- start

# Or use systemd
```

## Post-Deployment

### Reset Database
Call the reset endpoint to initialize/remix:
```bash
curl -X POST https://your-domain.com/api/reset
```

### Admin Functions
- View `assignments.csv` for tracking
- Check `public/uploads/` for proof images
- Download `users-db.json` for backup

## Security Notes
- Database files are in `.gitignore`
- Never commit `users-db.json` or `.env.local`
- Wallet addresses are stored lowercase
- Hash IDs are 16-character hex strings

## Support
For issues, check:
1. Environment variables are set
2. File permissions (if self-hosted)
3. Database initialized (call `/api/reset`)
