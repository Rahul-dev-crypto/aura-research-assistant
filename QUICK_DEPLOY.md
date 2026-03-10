# 🚀 Quick Deploy to Vercel (5 Minutes)

## Step 1: Install Vercel CLI (1 min)

```bash
npm install -g vercel
```

## Step 2: Login to Vercel (30 sec)

```bash
vercel login
```

Follow the prompts to authenticate.

## Step 3: Deploy (2 min)

```bash
cd research-assistant
vercel
```

Answer the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **research-assistant** (or your choice)
- In which directory is your code located? **./** (press Enter)

Wait for deployment to complete. You'll get a preview URL.

## Step 4: Add Environment Variables (1 min)

```bash
vercel env add MONGODB_URI
```
Paste your MongoDB URI and press Enter.

```bash
vercel env add GEMINI_API_KEYS
```
Paste your Gemini API keys and press Enter.

```bash
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID
```
Paste your Google Client ID and press Enter.

```bash
vercel env add GOOGLE_CLIENT_SECRET
```
Paste your Google Client Secret and press Enter.

```bash
vercel env add SEMANTIC_SCHOLAR_API_KEYS
```
Paste your Semantic Scholar keys (or leave empty) and press Enter.

For each variable, select:
- **Production** (press Space to select)
- Press Enter to confirm

## Step 5: Deploy to Production (30 sec)

```bash
vercel --prod
```

Your app is now live! 🎉

## Step 6: Update Google OAuth (1 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add your Vercel URL to:
   - **Authorized JavaScript origins**: `https://your-project.vercel.app`
   - **Authorized redirect URIs**: `https://your-project.vercel.app/api/auth/google`
6. Save

## Done! 🎊

Visit your production URL and test:
- ✅ User registration
- ✅ Login (email/password)
- ✅ Google OAuth login
- ✅ Admin dashboard
- ✅ Research tools

---

## Troubleshooting

### Build Failed?
```bash
# Test build locally first
npm run build
```

### Environment Variables Not Working?
```bash
# List all env vars
vercel env ls

# Pull env vars to local
vercel env pull
```

### Need to Redeploy?
```bash
vercel --prod
```

---

## Alternative: Deploy via GitHub (No CLI)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/research-assistant.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repository
   - Add environment variables in the UI
   - Click "Deploy"

---

## Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your domain
4. Update DNS records as instructed
5. Wait for DNS propagation

---

**Need help?** Check DEPLOYMENT_GUIDE.md for detailed instructions.
