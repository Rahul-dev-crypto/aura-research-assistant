# Google OAuth Setup - Final Instructions

## Current Status
✅ Code is fully implemented and ready
✅ Environment variables configured
✅ Server running
⏳ Waiting for Google Cloud Console configuration to propagate

## The Problem
The error "The given origin is not allowed for the given client ID" means Google doesn't recognize your localhost as an authorized origin yet.

## Solution - Follow These Exact Steps:

### Step 1: Go to Google Cloud Console
Open: https://console.cloud.google.com/apis/credentials

### Step 2: Find Your OAuth Client
Look for: `Client ID for Web application`
Client ID: `848308749958-f43d7ugcek12tjgast8flvsnoocsr2t9.apps.googleusercontent.com`

### Step 3: Click on it to Edit

### Step 4: Configure Authorized JavaScript Origins
In the "Authorized JavaScript origins" section:

1. Click "+ ADD URI"
2. Type: `http://localhost:3000`
3. Press Enter

4. Click "+ ADD URI" again
5. Type: `http://127.0.0.1:3000`
6. Press Enter

7. Click "+ ADD URI" again
8. Type: `http://192.168.56.1:3000`
9. Press Enter

**Result: You should have 3 URLs in this section**

### Step 5: Configure Authorized Redirect URIs
In the "Authorized redirect URIs" section:

1. **FIRST: Delete any empty or wrong URLs** (like the ones with :5500 or strengthgaming)

2. Click "+ ADD URI"
3. Type: `http://localhost:3000`
4. Press Enter

5. Click "+ ADD URI" again
6. Type: `http://127.0.0.1:3000`
7. Press Enter

8. Click "+ ADD URI" again
9. Type: `http://192.168.56.1:3000`
10. Press Enter

**Result: You should have 3 URLs in this section**

### Step 6: Save
Click the "SAVE" button at the bottom of the page

### Step 7: Wait
**IMPORTANT:** Google takes 5-10 minutes to propagate these changes across their servers. Be patient!

### Step 8: Clear Browser Cache
- Close all browser tabs with localhost:3000
- Clear browser cache OR use Incognito/Private mode
- Open a fresh tab

### Step 9: Test
1. Go to `http://localhost:3000` (use localhost, not 192.168.56.1)
2. Click "Sign in"
3. Click "Continue with Google"
4. Google One Tap should appear!

## Verification Checklist

Before testing, verify you have:
- [ ] 3 URLs in "Authorized JavaScript origins"
- [ ] 3 URLs in "Authorized redirect URIs"
- [ ] All URLs use `http://` (not https)
- [ ] All URLs use port `:3000` (not :5500 or other)
- [ ] No trailing slashes on any URL
- [ ] Clicked "SAVE" button
- [ ] Waited at least 5 minutes
- [ ] Cleared browser cache or using Incognito

## The 6 URLs You Need

Copy these exactly:

**Authorized JavaScript origins:**
```
http://localhost:3000
http://127.0.0.1:3000
http://192.168.56.1:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000
http://127.0.0.1:3000
http://192.168.56.1:3000
```

## Temporary Workaround

While waiting for Google to propagate:
- Use the regular "Login" or "Register" buttons
- Or use "Continue as Guest"
- Google Sign-In will work after the propagation period

## Still Not Working?

If after 10 minutes it still doesn't work:

1. **Verify the Client ID matches:**
   - In Google Console: `848308749958-f43d7ugcek12tjgast8flvsnoocsr2t9.apps.googleusercontent.com`
   - In `.env.local`: Check `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

2. **Check you're using the right URL:**
   - Use `http://localhost:3000` NOT `http://192.168.56.1:3000`

3. **Try Incognito mode:**
   - This bypasses all cache issues

4. **Check browser console:**
   - Press F12
   - Look for any new error messages
   - Share them if you need more help

## When It Works

Once configured, the flow will be:
1. Click "Continue with Google"
2. Google One Tap appears
3. Select your Google account
4. If first time: Fill in phone number and password
5. Logged in successfully!

## Need Help?

If you're still stuck after following all steps:
1. Take a screenshot of your Google Cloud Console configuration
2. Take a screenshot of the browser console errors
3. Verify you waited at least 10 minutes after saving
