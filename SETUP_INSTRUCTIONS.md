# 🌸 Bloom Platform - Setup Instructions

## Step 1: Open Terminal/Command Prompt

### On Mac:
- Press `Cmd + Space` to open Spotlight Search
- Type "Terminal" and press Enter

### On Windows:
- Press `Win + R` 
- Type `cmd` and press Enter

### On Linux:
- Open your terminal application

---

## Step 2: Navigate to the Project Directory

Copy and paste this command:

```bash
cd /Users/manahil/Downloads/pastel-event-dash-main
```

Press Enter.

---

## Step 3: Install Dependencies (First Time Only)

Run this command:

```bash
npm install
```

This will install all required packages. It may take 2-3 minutes. Wait for it to complete.

---

## Step 4: Start the Development Server

Run this command:

```bash
npm run dev
```

You should see output like:

```
  VITE v7.3.5  ready in xxx ms

  ➜  Local:   http://localhost:8080/
```

---

## Step 5: Open in Browser

Once you see the message above, open your web browser and go to:

**http://localhost:8080/**

---

## Troubleshooting

### Port 8080 is already in use?

If you get an error that port 8080 is already in use, try:

```bash
npm run dev -- --port 3000
```

Then visit: **http://localhost:3000/**

### Terminal shows errors?

Make sure you're in the correct directory by running:

```bash
pwd
```

It should show: `/Users/manahil/Downloads/pastel-event-dash-main`

### Nothing loads in the browser?

1. Wait 10-15 seconds for Vite to fully compile
2. Try refreshing the page (Cmd+R or Ctrl+R)
3. Check the terminal for any error messages
4. Close and reopen the browser tab

### Still having issues?

Check if Node.js is installed:

```bash
node --version
npm --version
```

Both should show version numbers. If not, install Node.js from https://nodejs.org/

---

## Features to Try

Once loaded, you can:

1. **🗓️ Create an Event**: Click "New event" button
2. **📝 Schedule Content**: Go to "Content" tab and schedule social posts
3. **👥 Add Guests**: Go to "Guests" tab to build your community database
4. **💡 Add Ideas**: Click "New idea" in the Ideas section
5. **📊 View Analytics**: Click on an event to see detailed analytics

---

## Keep Terminal Running

**Important**: Keep the terminal window open while using the app. The dev server must be running for the site to work.

---

## To Stop the Server

When you're done:

1. Go back to the terminal
2. Press `Ctrl + C`
3. Type `y` if prompted

---

Good luck with Bloom! 🌸
