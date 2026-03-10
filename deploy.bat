@echo off
REM Research Assistant - Deployment Script for Windows
REM This script helps you deploy to Vercel quickly

echo.
echo ========================================
echo Research Assistant - Deployment Helper
echo ========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Vercel CLI...
    call npm install -g vercel
    echo Vercel CLI installed
    echo.
)

REM Run pre-deployment check
echo Running pre-deployment checks...
node pre-deploy-check.mjs

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Pre-deployment checks failed!
    echo Please fix the issues above before deploying.
    pause
    exit /b 1
)

echo.
echo All checks passed!
echo.

REM Ask user what they want to do
echo What would you like to do?
echo 1) Deploy to preview (test deployment)
echo 2) Deploy to production
echo 3) Add environment variables
echo 4) View deployment logs
echo 5) Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Deploying to preview...
    call vercel
    goto end
)

if "%choice%"=="2" (
    echo.
    echo Deploying to production...
    call vercel --prod
    echo.
    echo Deployment complete!
    echo.
    echo Don't forget to:
    echo 1. Update Google OAuth redirect URIs with your production URL
    echo 2. Visit /api/auth/create-admin to create admin account
    echo 3. Test all features
    goto end
)

if "%choice%"=="3" (
    echo.
    echo Adding environment variables...
    echo.
    echo Adding MONGODB_URI...
    call vercel env add MONGODB_URI
    echo.
    echo Adding GEMINI_API_KEYS...
    call vercel env add GEMINI_API_KEYS
    echo.
    echo Adding NEXT_PUBLIC_GOOGLE_CLIENT_ID...
    call vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID
    echo.
    echo Adding GOOGLE_CLIENT_SECRET...
    call vercel env add GOOGLE_CLIENT_SECRET
    echo.
    echo Adding SEMANTIC_SCHOLAR_API_KEYS (optional)...
    call vercel env add SEMANTIC_SCHOLAR_API_KEYS
    echo.
    echo Environment variables added!
    echo Redeploy to apply changes: vercel --prod
    goto end
)

if "%choice%"=="4" (
    echo.
    echo Fetching deployment logs...
    call vercel logs
    goto end
)

if "%choice%"=="5" (
    echo.
    echo Goodbye!
    exit /b 0
)

echo.
echo Invalid choice
exit /b 1

:end
echo.
echo ========================================
echo Done!
echo.
pause
