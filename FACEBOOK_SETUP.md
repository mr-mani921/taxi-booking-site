# Facebook OAuth Setup Guide

This guide explains how to set up Facebook OAuth login for the taxi booking application.

## Prerequisites

1. A Facebook Developer Account
2. A Facebook App created in the Facebook Developer Console

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Consumer" as the app type
4. Fill in your app details (App Name, Contact Email)
5. Click "Create App"

## Step 2: Configure Facebook Login

1. In your app dashboard, go to "Add Products" → Find "Facebook Login" → Click "Set Up"
2. Select "Web" as the platform
3. Add your site URL:
   - Development: `http://localhost:5173`
   - Production: Your production frontend URL
4. Click "Save"

## Step 3: Configure OAuth Settings

1. In Facebook Login → Settings:
   - Add "Valid OAuth Redirect URIs":
     - Development: `http://localhost:5000/api/auth/facebook/callback`
     - Production: `https://your-domain.com/api/auth/facebook/callback`
2. Under "Client OAuth Settings":
   - Enable "Use Strict Mode for Redirect URIs" (recommended)
   - Ensure "Enforce HTTPS" is enabled for production

## Step 4: Get Your App Credentials

1. Go to Settings → Basic in your Facebook App dashboard
2. Copy your:
   - **App ID** (this is your `FACEBOOK_APP_ID`)
   - **App Secret** (this is your `FACEBOOK_APP_SECRET`)

## Step 5: Configure Environment Variables

Add the following to your `.env` file:

```env
# Facebook OAuth Configuration
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# For production, use:
# FACEBOOK_CALLBACK_URL=https://your-domain.com/api/auth/facebook/callback
```

## Step 6: Request Email Permission

Facebook requires explicit permission to access user email. Ensure your app has "email" permission:

1. Go to App Review → Permissions and Features
2. Request "email" permission if not already approved
3. For testing with your own account, you can use "Roles" → "Test Users"

## Important Notes

- **Development Mode**: Facebook apps start in "Development Mode" and can only be used by:
  - App administrators
  - App developers
  - Test users
  
- **Production**: To make your app available to all users, you'll need to submit it for App Review through Facebook

- **Email Permission**: Some Facebook users may not have provided email or may have restricted email access. The code handles this gracefully by creating a placeholder email.

- **HTTPS Required**: In production, Facebook requires HTTPS for OAuth callbacks.

## Testing

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Start your development server:
   ```bash
   npm run dev
   ```

3. Navigate to your login page and click "Continue with Facebook"
4. You should be redirected to Facebook login
5. After successful authentication, you'll be redirected back to your app

## Troubleshooting

### Error: "Invalid OAuth Redirect URI"
- Ensure the callback URL in your `.env` file exactly matches what's configured in Facebook App settings
- Check that you've added both development and production URLs in Facebook settings

### Error: "App Not Setup"
- Make sure Facebook Login product is added to your app
- Verify your App ID and App Secret are correct

### Email Not Available
- Some users may not have email associated with their Facebook account
- The system will create a placeholder email and user can update it later
- Make sure you've requested "email" permission in Facebook App settings

### Development Mode Restrictions
- Only users added as developers/testers can log in
- Add test users in Facebook App → Roles → Test Users
- Or submit your app for review to make it public



