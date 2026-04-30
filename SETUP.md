# Life of Hamxa — Setup Guide

Your app is now a proper project with Google login + cloud sync.
Follow these steps IN ORDER.

---

## STEP 1 — Install Node.js (if you don't have it)

1. Go to https://nodejs.org
2. Download the **LTS** version and install it
3. Restart your PC after installing

---

## STEP 2 — Set up Firebase (free, takes ~5 minutes)

### 2a. Create a Firebase project
1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it anything (e.g. `life-of-hamxa`)
4. Disable Google Analytics (not needed) → **Create project**

### 2b. Add a Web App
1. Inside your project, click the **</>** (web) icon
2. Name it anything → click **Register app**
3. You'll see a code block with `firebaseConfig`. **Copy those values.**

### 2c. Paste config into the app
Open `src/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "paste your apiKey here",
  authDomain:        "paste your authDomain here",
  projectId:         "paste your projectId here",
  storageBucket:     "paste your storageBucket here",
  messagingSenderId: "paste your messagingSenderId here",
  appId:             "paste your appId here",
};
```

### 2d. Enable Google Sign-In
1. In Firebase console → **Authentication** → **Get started**
2. Click **Google** → **Enable** → Save

### 2e. Enable Firestore database
1. In Firebase console → **Firestore Database** → **Create database**
2. Choose **Start in test mode** → pick any region → **Enable**

---

## STEP 3 — Run the app locally

Open a terminal (Command Prompt or PowerShell) in this folder and run:

```bash
npm install
npm run dev
```

Open your browser to http://localhost:5173
You should see the Google login screen. Sign in and your data will sync!

---

## STEP 4 — Deploy to Vercel (free hosting = iPhone access via Safari)

1. Go to https://vercel.com and sign up (free)
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. In this folder, run:
   ```bash
   vercel
   ```
4. Follow the prompts → your app gets a public URL like `https://life-of-hamxa.vercel.app`

### iPhone setup (PWA):
1. Open that URL in Safari on your iPhone
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Done — it works like a real app with your Google account synced!

---

## STEP 5 — Desktop installer with Tauri

After your app is running with `npm run dev`, you can wrap it as a proper .exe installer.

### 5a. Install Rust (required by Tauri, one-time)
Go to https://rustup.rs and follow the installer

### 5b. Add Tauri to the project
```bash
npm install --save-dev @tauri-apps/cli
npm run tauri init
```
Follow the prompts (app name: Life of Hamxa, window title: Life of Hamxa)

### 5c. Build the installer
```bash
npm run tauri build
```

Your `.msi` installer will appear in:
`src-tauri/target/release/bundle/msi/`

Double-click it to install like any Windows app.

---

## Summary

| What          | How                          | Cost  |
|---------------|------------------------------|-------|
| Google login  | Firebase Auth                | Free  |
| Cloud sync    | Firestore                    | Free  |
| iPhone access | Vercel + PWA (Safari)        | Free  |
| Desktop app   | Tauri `.msi` installer       | Free  |

---

## Troubleshooting

**"Popup blocked"** when signing in?
→ Allow popups for localhost in your browser settings.

**Data not syncing?**
→ Make sure Firestore is in "test mode" (Step 2e). In test mode it allows all reads/writes for 30 days. After 30 days, go to Firestore → Rules and paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
This locks each user's data to only their own account.

**Tauri build fails?**
→ Make sure Rust is installed and your `npm run dev` is working first.
