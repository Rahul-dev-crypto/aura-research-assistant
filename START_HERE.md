# 🚀 START HERE - Deployment Guide

## Welcome! Your Research Assistant is Ready to Deploy

All pre-deployment checks have passed. Follow this guide to deploy in **5-10 minutes**.

---

## 🎯 Choose Your Deployment Method

### 🥇 Recommended: Automated Script (Easiest)

**For Windows:**
```cmd
deploy.bat
```

**For Mac/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will guide you through everything!

---

### 🥈 Alternative: Quick Manual Deploy

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Add environment variables (copy from .env.local)
vercel env add MONGODB_URI
vercel env add GEMINI_API_KEYS
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET

# 5. Deploy to production
vercel --prod
```

---

## 📚 Documentation Overview

| File | When to Use |
|------|-------------|
| **START_HERE.md** | You are here! Start with this |
| **QUICK_DEPLOY.md** | 5-minute step-by-step guide |
| **DEPLOYMENT_GUIDE.md** | Complete guide for all platforms |
| **DEPLOYMENT_SUMMARY.md** | Quick reference and overview |
| **DEPLOYMENT_CHECKLIST.md** | Track your deployment progress |
| **README_DEPLOYMENT.md** | General deployment information |

---

## ⚡ Quick Start (3 Steps)

### Step 1: Run Pre-Check
```bash
node pre-deploy-check.mjs
```
✅ Verifies everything is ready

### Step 2: Deploy
```bash
vercel
```
✅ Deploys your app

### Step 3: Configure
- Add environment variables
- Update Google OAuth URLs
- Create admin account

**Done!** 🎉

---

## 🔑 What You'll Need

From your `.env.local` file:
- ✅ GEMINI_API_KEYS
- ✅ MONGODB_URI
- ✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET
- ⚪ SEMANTIC_SCHOLAR_API_KEYS (optional)

---

## ⚠️ Important After Deployment

### 1. Update Google OAuth (Required)
Go to [Google Cloud Console](https://console.cloud.google.com):
- Add your production URL to authorized origins
- Add redirect URI: `https://your-app.vercel.app/api/auth/google`

### 2. Create Admin Account (Required)
Visit: `https://your-app.vercel.app/api/auth/create-admin`

Default login:
- Username: `admin`
- Password: `admin123`

**⚠️ Change this password immediately!**

---

## 🎯 Deployment Flow

```
┌─────────────────────────────────────────┐
│  1. Run Pre-Check                       │
│     node pre-deploy-check.mjs           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. Deploy to Vercel                    │
│     vercel (or use deploy.bat)          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. Add Environment Variables           │
│     In Vercel dashboard or CLI          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  4. Update Google OAuth                 │
│     Add production URLs                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  5. Create Admin Account                │
│     Visit /api/auth/create-admin        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  6. Test Everything                     │
│     Login, test features                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
              ✅ DONE!
```

---

## 🆘 Need Help?

### Common Issues

**Build fails?**
→ Check `DEPLOYMENT_GUIDE.md` → Troubleshooting section

**MongoDB connection fails?**
→ Verify URI is from Atlas, not localhost

**Google OAuth doesn't work?**
→ Check redirect URIs match exactly

**Environment variables not loading?**
→ Redeploy after adding: `vercel --prod`

### Get More Help
- Read `DEPLOYMENT_GUIDE.md` for detailed solutions
- Check `DEPLOYMENT_CHECKLIST.md` to track progress
- Review `QUICK_DEPLOY.md` for step-by-step guide

---

## 🎉 Ready to Deploy!

**Estimated Time**: 5-10 minutes

**Difficulty**: Easy (automated scripts available)

**Cost**: Free (Vercel free tier)

---

## 🚀 Let's Go!

Choose your method above and start deploying!

**Quick Command**:
```bash
# Windows
deploy.bat

# Mac/Linux
./deploy.sh
```

Good luck! 🎊

---

**Questions?** Check the documentation files listed above.

**All set?** Run the deployment script and follow the prompts!
