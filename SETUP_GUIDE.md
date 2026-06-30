# Shared Life Dashboard - Setup & Deployment Guide

## Overview
This is a real-time collaborative dashboard built with React and Firebase. Both you and your partner will sign in with Google accounts and see all changes instantly. **Completely free forever.**

---

## Step 1: Create a Firebase Project (Free)

### 1a. Go to Firebase Console
1. Visit [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it something like `shared-life-dashboard`
4. Click through and create the project

### 1b. Enable Google Authentication
1. In Firebase, click **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Click the **"Google"** provider
4. Toggle it **ON**
5. Set the project support email (can be your own)
6. Save

### 1c. Create Realtime Database
1. In Firebase, click **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. Choose **Europe** (closest to Paris)
4. Start in **Test Mode** (we'll secure it in a moment)
5. Create

### 1d. Set Database Security Rules
1. In Realtime Database, click the **"Rules"** tab
2. Replace everything with:

```json
{
  "rules": {
    "shared-data": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. Click **"Publish"**

### 1e. Get Your Firebase Credentials
1. In Firebase Console, click the **⚙️ Settings** icon (top-left)
2. Click **"Project Settings"**
3. Scroll to **"Your apps"** section
4. Click **"Web"** (the `</>` icon)
5. Copy these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

**Save these — you'll need them next.**

---

## Step 2: Set Up the Project Locally

### 2a. Create a GitHub Repo (Free)
1. Go to [https://github.com/new](https://github.com/new)
2. Name it `shared-life-dashboard`
3. Make it **Public**
4. Click **"Create repository"**

### 2b. Clone & Add Your Files
In your terminal:

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/shared-life-dashboard.git
cd shared-life-dashboard

# Copy the files I provided:
# - firebaseConfig.js
# - SharedLifeDashboard.jsx
# - package.json
# - .env.example (rename to .env.local)

# Then:
npm install
```

### 2c. Add Firebase Credentials
1. Create a file `.env.local` in your project root
2. Fill in the values you copied from Firebase:

```
REACT_APP_FIREBASE_API_KEY=your_actual_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_actual_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
REACT_APP_FIREBASE_APP_ID=your_actual_app_id
```

### 2d. Test Locally
```bash
npm start
```

The app should open at `http://localhost:3000`. Try signing in with your Google account.

### 2e. Push to GitHub
```bash
git add .
git commit -m "Initial commit: shared life dashboard"
git push origin main
```

---

## Step 3: Deploy to Vercel (Free & Instant)

### 3a. Connect to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"** → sign in with GitHub
3. Click **"Import Project"**
4. Select your `shared-life-dashboard` repository
5. Click **"Import"**

### 3b. Add Environment Variables
1. Vercel will show a form for environment variables
2. Add all six Firebase variables from your `.env.local`:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`

3. Click **"Deploy"**

### 3c. Your App is Live! 🎉
Vercel will give you a URL like: `https://shared-life-dashboard.vercel.app`

Share this URL with your partner.

---

## Step 4: Setup with Your Partner

### How You Both Sign In
1. Both visit the same URL (the Vercel link)
2. Click **"Sign in with Google"**
3. Each of you signs in with your own Google account
4. You're connected! All data is shared in real-time.

### First Time Setup
- One of you adds some plants
- The other refreshes the page
- You'll both see the same plants instantly
- No need to invite or share anything—it just works

---

## Adding Calendar Reminders (Optional Bonus)

To sync plant watering and meal plans to your iPhone calendars:

1. I can add Google Calendar integration to the app
2. When you add a plant, you get an option to **"Add to Calendar"**
3. The calendar event syncs to your iPhone automatically
4. Your partner sees it too

**Want me to add this? Just ask!**

---

## Troubleshooting

### "Blank page after signing in"
- Check your Firebase credentials in `.env.local`
- Make sure Realtime Database is enabled in Firebase

### "Can't sign in with Google"
- Go to Firebase → Authentication → Settings
- Add your Vercel domain to **Authorized domains**

### "Data not saving"
- Check Firebase console → Realtime Database → see if data appears
- Check browser console (F12) for errors

### "My partner can't see my changes"
- Make sure they're on the same URL
- Have them refresh the page
- Check that both of you are signed in

---

## Cost: Always Free

- **Firebase**: Free tier covers unlimited projects, 100GB data, real-time sync
- **Vercel**: Free tier covers unlimited deployments, unlimited users
- **GitHub**: Free for public repos
- **Google Sign-In**: Free

**You will never pay.**

---

## Next Steps

Once deployed, I can add:

1. **Google Calendar integration** — reminders sync to iPhone
2. **Revolut API sync** — auto-import expenses from joint account
3. **Push notifications** — alerts when plants need water
4. **Photo journals** — track plant health over time
5. **Weekly summary emails** — what's coming up
6. **Intimacy insights** — frequency trends, mood tracking

Just let me know what matters most!

---

## Questions?

If anything breaks or isn't clear, share the error and I'll fix it.
