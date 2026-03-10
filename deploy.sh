#!/bin/bash

# Research Assistant - Deployment Script
# This script helps you deploy to Vercel quickly

echo "🚀 Research Assistant - Deployment Helper"
echo "=========================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed"
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
    echo ""
fi

# Run pre-deployment check
echo "🔍 Running pre-deployment checks..."
node pre-deploy-check.mjs

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Pre-deployment checks failed!"
    echo "Please fix the issues above before deploying."
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Deploy to preview (test deployment)"
echo "2) Deploy to production"
echo "3) Add environment variables"
echo "4) View deployment logs"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to preview..."
        vercel
        ;;
    2)
        echo ""
        echo "🚀 Deploying to production..."
        vercel --prod
        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "📝 Don't forget to:"
        echo "1. Update Google OAuth redirect URIs with your production URL"
        echo "2. Visit /api/auth/create-admin to create admin account"
        echo "3. Test all features"
        ;;
    3)
        echo ""
        echo "📝 Adding environment variables..."
        echo ""
        echo "Adding MONGODB_URI..."
        vercel env add MONGODB_URI
        echo ""
        echo "Adding GEMINI_API_KEYS..."
        vercel env add GEMINI_API_KEYS
        echo ""
        echo "Adding NEXT_PUBLIC_GOOGLE_CLIENT_ID..."
        vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID
        echo ""
        echo "Adding GOOGLE_CLIENT_SECRET..."
        vercel env add GOOGLE_CLIENT_SECRET
        echo ""
        echo "Adding SEMANTIC_SCHOLAR_API_KEYS (optional)..."
        vercel env add SEMANTIC_SCHOLAR_API_KEYS
        echo ""
        echo "✅ Environment variables added!"
        echo "💡 Redeploy to apply changes: vercel --prod"
        ;;
    4)
        echo ""
        echo "📋 Fetching deployment logs..."
        vercel logs
        ;;
    5)
        echo ""
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "✨ Done!"
