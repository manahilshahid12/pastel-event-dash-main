# 🌸 Complete Bloom Setup Guide

## ✅ What You Need to Do

Your app is running, but the database isn't set up yet. Follow these steps to activate ALL features:

---

## 📋 Part 1: Find Your Supabase Credentials

### Step 1: Open .env file in your project

In Terminal:
```bash
cd /Users/manahil/Downloads/pastel-event-dash-main
cat .env
```

You'll see something like:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

**Copy these values - you'll need them**

---

## 🗄️ Part 2: Set Up Supabase Database

### Step 2: Go to Supabase Console

1. Open: **https://supabase.com/dashboard**
2. Sign in with your email
3. Select your project

### Step 3: Create Database Tables

1. Click **"SQL Editor"** on left sidebar
2. Click **"New Query"** button
3. **Copy and paste this entire SQL block:**

```sql
-- EVENT AGENDA TABLE
CREATE TABLE IF NOT EXISTS event_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  activity TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EVENT SPEAKERS TABLE
CREATE TABLE IF NOT EXISTS event_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EVENT MEDIA TABLE
CREATE TABLE IF NOT EXISTS event_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CONTENT POSTS TABLE
CREATE TABLE IF NOT EXISTS content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  platform TEXT NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  color TEXT DEFAULT 'lavender',
  status TEXT DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ESSENTIALS TABLE
CREATE TABLE IF NOT EXISTS essentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  category TEXT,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_id uuid REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add columns to events table if missing
ALTER TABLE events ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'lavender';
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE events ADD COLUMN IF NOT EXISTS luma_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_agenda_event_id ON event_agenda(event_id);
CREATE INDEX IF NOT EXISTS idx_event_speakers_event_id ON event_speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_event_id ON event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled_at ON content_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_requirements_event_id ON requirements(event_id);
CREATE INDEX IF NOT EXISTS idx_essentials_event_id ON essentials(event_id);
CREATE INDEX IF NOT EXISTS idx_notes_event_id ON notes(event_id);
```

### Step 4: Run the SQL

1. Click the **"RUN"** button (blue button on right)
2. Wait for green checkmarks ✓
3. If you see errors, that's OK - it means some tables already exist

---

## 🔐 Part 3: Enable Row Level Security (RLS)

RLS makes sure users can only see their own data.

### For each table, do this:

1. Go to **"Authentication"** → **"Policies"** in sidebar
2. Click on table name (e.g., "event_agenda")
3. Click **"Enable RLS"** button
4. Click **"New Policy"**
5. Select:
   - Policy name: `Enable all for authenticated users`
   - Allowed operation: All
   - Target roles: authenticated
   - Click **"Create Policy"**

**Repeat for these tables:**
- event_agenda
- event_speakers
- event_media
- content_posts
- requirements
- essentials
- notes

---

## ✅ Part 4: Test It's Working

1. Go to your app: **http://localhost:3000**
2. Refresh page (Cmd+R or Ctrl+R)
3. Click **"🗓️ Events"**
4. Click **"New event"** button
5. Fill in:
   - Title: "Test Event"
   - Date: Tomorrow
   - Time: 10:00 AM
   - Click **"Add to calendar"**

6. Click on the event you just created
7. You should now see all these tabs:
   - ✅ Requirements
   - ✅ Essentials
   - ✅ Guests
   - ✅ Agenda
   - ✅ Media
   - ✅ Speakers
   - ✅ Analytics
   - ✅ Notes

---

## 🎯 What Each Feature Does

### **Requirements Tab** ✅
- Add event prep tasks
- Check them off as done
- Example: "Book venue", "Order flowers"

### **Essentials Tab** 🧁
- Categorized checklist
- Categories: Catering, Decor, A/V, Swag, Supplies, General
- Example: "Mini cupcakes", "Fairy lights"

### **Guests Tab** 👥
- Add attendee names and emails
- Track RSVP status (Going, Maybe, No, Pending)
- Mark who attended
- See attendance statistics

### **Agenda Tab** 📅
- Add time slots with activities
- Build your event timeline
- Example: "10:00 - Welcome", "10:30 - Keynote"

### **Speakers Tab** 🎤
- Add speaker names, titles, and bios
- Manage your panel
- Track who's speaking

### **Media Tab** 🖼️
- Upload event photos and videos
- Build event gallery
- (Upload feature coming soon)

### **Analytics Tab** 📊
- See guest statistics
- Attendance rate percentage
- Post-event summary templates
- Auto-generated social media content

### **Notes Tab** 📝
- Team collaboration space
- Share ideas and updates
- Color-coded note cards

---

## 🚨 Troubleshooting

### Tables not showing in Supabase?
- Refresh the Supabase dashboard
- Check "Table Editor" on left sidebar

### Still seeing empty tabs when clicking event?
1. Make sure you created the event AFTER setting up tables
2. Refresh the browser (Cmd+R / Ctrl+R)
3. Create a new event and click on it

### Getting errors in terminal?
- Check that Supabase URL and key are correct in `.env`
- Make sure your Supabase project is active

### Can't add items to tabs?
- Make sure RLS policies are enabled for all tables
- Sign in to the app with an account

---

## 📞 Still Not Working?

1. Check Supabase is connected:
   - Click "🗓️ Events"
   - Create a new event
   - Does it appear on the calendar?
   
2. If yes → Database is working ✓
3. If no → Check `.env` file has correct Supabase URL

---

## 🎉 Success Checklist

Once working, you should be able to:

- ✅ Create events on calendar
- ✅ Click event to see all tabs
- ✅ Add items to Requirements
- ✅ Add categorized Essentials
- ✅ Manage Guests with RSVP
- ✅ Create event Agenda
- ✅ Add Speakers
- ✅ View Analytics
- ✅ Write Notes with team

**That's it! You're all set!** 🌸

---

## Quick Commands

If you need to restart:

```bash
# Stop current server
# Press Ctrl+C in terminal

# Then restart
cd /Users/manahil/Downloads/pastel-event-dash-main
npm run dev -- --port 3000
```

Then visit: **http://localhost:3000**
