# Research Assistant - Deployment Guide

## 🚀 Deployment Options

This guide covers deployment to **Vercel** (recommended for Next.js) and **alternative platforms**.

---

## Option 1: Deploy to Vercel (Recommended)

Vercel is the best platform for Next.js applications with zero configuration needed.

### Prerequisites
- GitHub/GitLab/Bitbucket account
- Vercel account (free tier available)

### Step 1: Prepare Your Repository

1. **Initialize Git (if not already done)**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Research Assistant"
   ```

2. **Create a GitHub repository**
   - Go to https://github.com/new
   - Create a new repository (e.g., "research-assistant")
   - Don't initialize with README (you already have code)

3. **Push your code**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/research-assistant.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign up/Login with your GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `research-assistant` (if in subfolder) or `.` (if root)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add these:

   ```
   GEMINI_API_KEYS=your_api_keys_here
   SEMANTIC_SCHOLAR_API_KEYS=your_keys_here
   MONGODB_URI=your_mongodb_connection_string
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

   ⚠️ **IMPORTANT**: Use your production MongoDB database, not localhost!

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Step 3: Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add to "Authorized JavaScript origins":
   ```
   https://your-project.vercel.app
   ```
6. Add to "Authorized redirect URIs":
   ```
   https://your-project.vercel.app/api/auth/google
   ```
7. Save changes

### Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Test user registration
3. Test Google OAuth login
4. Test admin features
5. Test research tools

---

## Option 2: Deploy to Netlify

### Step 1: Prepare for Netlify

1. **Create netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Push to GitHub** (same as Vercel steps)

### Step 2: Deploy

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables (same as Vercel)
6. Click "Deploy site"

---

## Option 3: Deploy to Railway

Railway is great for full-stack apps with databases.

### Step 1: Deploy

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Next.js

### Step 2: Configure

1. Add environment variables in Railway dashboard
2. Railway provides a custom domain automatically
3. Update Google OAuth settings with Railway domain

---

## Option 4: Deploy to Your Own Server (VPS)

For AWS, DigitalOcean, Linode, etc.

### Prerequisites
- Ubuntu/Debian server
- Node.js 18+ installed
- PM2 for process management
- Nginx for reverse proxy

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Deploy Application

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/research-assistant.git
cd research-assistant

# Install dependencies
npm install

# Create .env.local file
nano .env.local
# Paste your environment variables and save (Ctrl+X, Y, Enter)

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "research-assistant" -- start
pm2 save
pm2 startup
```

### Step 3: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/research-assistant
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/research-assistant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEYS` | Google Gemini API keys (comma-separated) | `key1,key2,key3` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxxxx` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `SEMANTIC_SCHOLAR_API_KEYS` | Semantic Scholar API keys for higher rate limits |

---

## Post-Deployment Checklist

### ✅ Security
- [ ] All environment variables are set correctly
- [ ] `.env.local` is in `.gitignore`
- [ ] MongoDB connection uses strong password
- [ ] Google OAuth is configured with production URLs
- [ ] HTTPS is enabled (SSL certificate)

### ✅ Functionality
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] Email/password login works
- [ ] Google OAuth login works
- [ ] Admin dashboard accessible
- [ ] Research tools functional
- [ ] Citation manager works
- [ ] Export features work

### ✅ Performance
- [ ] Images load quickly
- [ ] API responses are fast
- [ ] Database queries are optimized
- [ ] No console errors

### ✅ Admin Setup
- [ ] Create first admin account at `/api/auth/create-admin`
- [ ] Test admin features
- [ ] Verify user management works
- [ ] Test password viewing/reset

---

## Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

**Error: Environment variables not found**
- Ensure all required env vars are set in deployment platform
- Check for typos in variable names
- Restart the deployment

### Runtime Errors

**MongoDB Connection Failed**
- Verify MongoDB URI is correct
- Check if IP whitelist includes deployment server
- Ensure database user has correct permissions

**Google OAuth Not Working**
- Verify redirect URIs match exactly (including https://)
- Check client ID and secret are correct
- Ensure OAuth consent screen is configured

**API Rate Limits**
- Add more Gemini API keys
- Add Semantic Scholar API keys
- Implement caching if needed

---

## Monitoring & Maintenance

### Vercel
- View logs in Vercel dashboard
- Monitor function execution times
- Set up alerts for errors

### Self-Hosted
```bash
# View PM2 logs
pm2 logs research-assistant

# Monitor resources
pm2 monit

# Restart application
pm2 restart research-assistant

# Update application
cd research-assistant
git pull
npm install
npm run build
pm2 restart research-assistant
```

---

## Scaling Considerations

### Database
- Use MongoDB Atlas for automatic scaling
- Enable connection pooling
- Add indexes for frequently queried fields

### API Keys
- Add more Gemini API keys for higher throughput
- Implement Redis caching for API responses
- Use CDN for static assets

### Server Resources
- Monitor memory usage
- Scale horizontally with load balancer
- Use serverless functions for API routes

---

## Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

### Netlify
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Update DNS records
4. Enable HTTPS

### Self-Hosted
1. Point A record to your server IP
2. Configure Nginx with your domain
3. Run certbot for SSL

---

## Backup Strategy

### Database Backups
```bash
# MongoDB Atlas: Enable automatic backups in dashboard
# Self-hosted MongoDB:
mongodump --uri="your_mongodb_uri" --out=/backup/$(date +%Y%m%d)
```

### Code Backups
- Use Git for version control
- Push to GitHub regularly
- Tag releases: `git tag -a v1.0.0 -m "Release v1.0.0"`

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Google OAuth**: https://console.cloud.google.com

---

## Quick Deploy Commands

### Vercel CLI (Alternative to Web UI)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd research-assistant
vercel

# Add environment variables
vercel env add MONGODB_URI
vercel env add GEMINI_API_KEYS
# ... add all other variables

# Deploy to production
vercel --prod
```

---

**🎉 Congratulations! Your Research Assistant is now deployed!**

For issues or questions, check the troubleshooting section or review the deployment logs.
