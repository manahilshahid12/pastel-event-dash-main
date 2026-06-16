# How to Run the App

## Prerequisites
- Node.js installed (v18 or higher)
- .env.local file configured with Supabase credentials

## Quick Start

### 1. Install Dependencies
```bash
cd /Users/manahil/Downloads/pastel-event-dash-main
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 3. Open in Browser
- Click the link: **http://localhost:5173/**
- Or manually open: `http://localhost:5173`

### 4. Sign In
- You should see a login page
- Sign in with your email/password (or create account if needed)
- You'll be redirected to the dashboard

---

## Troubleshooting

### Issue: "Cannot find module @rollup/rollup-linux-arm64-gnu"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: Port 5173 already in use

**Solution:** The app will automatically try the next available port (5174, 5175, etc.)

Or kill the process using port 5173:
```bash
# Mac/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Then run:
```bash
npm run dev
```

### Issue: "VITE_SUPABASE_URL is not defined"

**Solution:** Check your `.env.local` file exists with:
```
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
LUMA_API_KEY=your_luma_key_here
```

### Issue: Files won't upload to Supabase

1. Run the SQL queries from `SUPABASE_RLS_SETUP.txt` in Supabase
2. Check browser console (F12) for upload errors
3. Verify bucket exists: Supabase Dashboard → Storage → content-files

---

## Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
```

## App Structure

- **Events** (`/events`) - Create and manage events
- **Guests** (`/guests`) - View and import guest lists
- **Content** (`/content`) - Schedule social media posts with file uploads
- **Dashboard** - Overview of all activities

---

## Next Steps

1. ✅ Run `npm run dev`
2. ✅ Open http://localhost:5173
3. ✅ Sign in
4. ✅ Upload files to test the storage
5. ✅ Push to GitHub and deploy to Vercel when ready
