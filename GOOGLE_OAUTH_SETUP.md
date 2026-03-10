# Google OAuth Setup Instructions

## Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. For Application type, select "Web application"
7. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - Your production URL
8. Add authorized redirect URIs:
   - `http://localhost:3000`
   - Your production URL
9. Copy the Client ID

## Step 2: Update Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

## Step 3: Implementation Status

The following files have been created/updated:
- ✅ `/src/app/api/auth/google/route.ts` - Google auth API endpoint
- ✅ `/src/models/User.ts` - Added googleId field
- ✅ `/src/components/ui/AuthModal.tsx` - Added Google sign-in handlers

## Step 4: How It Works

1. User clicks "Continue with Google"
2. Google One Tap appears
3. If existing user → Auto login
4. If new user → Show form with:
   - Name (pre-filled from Google)
   - Email (pre-filled, read-only)
   - Username (auto-generated, editable)
   - Phone number (required)
   - Password (required for account security)

## Step 5: Test the Integration

1. Click "Sign in" button
2. Click "Continue with Google"
3. Select your Google account
4. If first time: Complete the additional information form
5. If returning: Automatically logged in

## Note

The Google button is currently set up with a placeholder client ID. Replace it with your actual client ID from Google Cloud Console in the `.env.local` file.
