# 🚀 Manual Deployment Steps

Follow these steps in your terminal exactly as shown.

## Step 1: Open Terminal in Project Folder

```bash
cd research-assistant
```

## Step 2: Run Vercel Deploy Command

```bash
vercel
```

## Step 3: Answer the Prompts

When Vercel asks questions, answer like this:

### Question 1: Set up and deploy?
```
? Set up and deploy "I:\iem\Gen AI\research-assistant"?
Answer: yes (press Enter)
```

### Question 2: Which scope?
```
? Which scope should contain your project?
Answer: Select "Rahul's projects" (press Enter)
```

### Question 3: Link to existing project?
```
? Link to existing project?
Answer: no (type 'n' and press Enter)
```

### Question 4: Project name?
```
? What's your project's name?
Answer: aura-research (lowercase, no spaces)
```

### Question 5: Code location?
```
? In which directory is your code located?
Answer: ./ (press Enter)
```

### Question 6: Modify settings?
```
? Want to modify these settings?
Answer: no (type 'n' and press Enter)
```

## Step 4: Wait for Deployment

Vercel will now:
- Upload your files
- Build your app
- Deploy it

This takes 2-3 minutes.

## Step 5: Get Your URL

After deployment, you'll see:
```
✅ Production: https://aura-research.vercel.app
```

Copy this URL - you'll need it!

## Step 6: Add Environment Variables

Run these commands one by one:

### Add MongoDB URI
```bash
vercel env add MONGODB_URI
```
- Paste your MongoDB URI from .env.local
- Select: Production (press Space, then Enter)

### Add Gemini API Keys
```bash
vercel env add GEMINI_API_KEYS
```
- Paste your Gemini keys from .env.local
- Select: Production (press Space, then Enter)

### Add Google Client ID
```bash
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID
```
- Paste your Google Client ID from .env.local
- Select: Production (press Space, then Enter)

### Add Google Client Secret
```bash
vercel env add GOOGLE_CLIENT_SECRET
```
- Paste your Google Client Secret from .env.local
- Select: Production (press Space, then Enter)

### Add Semantic Scholar Keys (Optional)
```bash
vercel env add SEMANTIC_SCHOLAR_API_KEYS
```
- Paste your keys or leave empty
- Select: Production (press Space, then Enter)

## Step 7: Redeploy with Environment Variables

```bash
vercel --prod
```

Wait 2-3 minutes for redeployment.

## Step 8: Update Google OAuth

1. Go to: https://console.cloud.google.com
2. Select your project
3. Go to: APIs & Services → Credentials
4. Click on your OAuth 2.0 Client ID
5. Add to "Authorized JavaScript origins":
   ```
   https://aura-research.vercel.app
   ```
6. Add to "Authorized redirect URIs":
   ```
   https://aura-research.vercel.app/api/auth/google
   ```
7. Click "Save"

## Step 9: Create Admin Account

Visit in browser:
```
https://aura-research.vercel.app/api/auth/create-admin
```

You should see: "Admin account created successfully"

## Step 10: Test Your App

1. Visit: https://aura-research.vercel.app
2. Try registering a new user
3. Try logging in
4. Try Google OAuth login
5. Login as admin:
   - Username: admin
   - Password: admin123
6. Change admin password immediately!

## ✅ Done!

Your app is now live at: https://aura-research.vercel.app

---

## 🆘 If Something Goes Wrong

### Build Failed?
```bash
# Test build locally first
npm run build
```

### Environment Variables Not Working?
```bash
# List all env vars
vercel env ls

# Redeploy
vercel --prod
```

### Need to Start Over?
```bash
# Remove project
vercel remove aura-research

# Start fresh
vercel
```

---

## 📝 Quick Reference

| Command | Purpose |
|---------|---------|
| `vercel` | Deploy to preview |
| `vercel --prod` | Deploy to production |
| `vercel env add VAR_NAME` | Add environment variable |
| `vercel env ls` | List all variables |
| `vercel logs` | View deployment logs |
| `vercel ls` | List all deployments |

---

**Ready?** Open your terminal and start with Step 1!
