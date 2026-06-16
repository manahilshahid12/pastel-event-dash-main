# 🗄️ Bloom Database Setup Guide

## Step 1: Log into Supabase

1. Go to: **https://supabase.com**
2. Sign in with your account
3. Select your project (the one you're using for Bloom)

## Step 2: Open SQL Editor

1. In Supabase dashboard, click **"SQL Editor"** on the left sidebar
2. Click **"New Query"** button
3. A blank SQL editor will open

## Step 3: Copy and Paste SQL

Copy ALL the SQL code below and paste it into the SQL editor:

```sql
-- Create Event Agenda Table
CREATE TABLE IF NOT EXISTS event_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  activity TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Event Speakers Table
CREATE TABLE IF NOT EXISTS event_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Event Media Table
CREATE TABLE IF NOT EXISTS event_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Content Posts Table
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

-- Create Requirements Table
CREATE TABLE IF NOT EXISTS requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Essentials Table
CREATE TABLE IF NOT EXISTS essentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  category TEXT,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_id uuid REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to events table if they don't exist
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

## Step 4: Run the Query

1. Click the blue **"RUN"** button (or press Cmd+Enter on Mac, Ctrl+Enter on Windows)
2. Wait for it to complete (should take a few seconds)
3. You should see green checkmarks ✓ - this means success!

## Step 5: Set Up Row Level Security (RLS)

For each table created, enable RLS:

1. Go to **"Authentication"** → **"Policies"** in Supabase
2. For each table (event_agenda, event_speakers, event_media, etc.):
   - Click on the table name
   - Click **"Enable RLS"**
   - Click **"New Policy"** → **"For all users"** → **"All operations"** → **Create**

This allows authenticated users to access the data.

## Step 6: Refresh Your App

1. Go back to your app at **http://localhost:3000**
2. Refresh the page (Cmd+R or Ctrl+R)
3. Create a new event and check all tabs!

---

## ✅ All Features Now Available

Once the database is set up, these features will work:

- ✅ **Requirements Checklist** - Add/check event prep items
- ✅ **Essentials** - Categorized shopping/planning list
- ✅ **Guests** - Full guest management with RSVP tracking
- ✅ **Agenda** - Event timeline and schedule
- ✅ **Speakers** - Panel and speaker management
- ✅ **Media** - Gallery for event photos and documents
- ✅ **Analytics** - Event performance metrics and summaries
- ✅ **Notes** - Team collaboration notes

---

## Troubleshooting

**If you get an error:**
- Make sure you're connected to the right Supabase project
- Check that the SQL is copied correctly
- Try running it again

**Tables not showing up?**
- Refresh the Supabase page
- Check under **"Table Editor"** on the left sidebar

---

Need help? Let me know! 🌸
