# 📋 Copy & Paste Setup (Easiest Way)

## Just follow these 3 steps. Copy exactly what's shown.

---

## STEP 1: Create Tables in Supabase

1. Open: **https://supabase.com/dashboard**
2. Sign in
3. Click your **Bloom** project
4. Click **"SQL Editor"** on left
5. Click **"New Query"** button
6. **DELETE any existing text**
7. **Copy everything below and paste:**

```sql
CREATE TABLE IF NOT EXISTS event_agenda (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,time TEXT NOT NULL,activity TEXT NOT NULL,created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS event_speakers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,name TEXT NOT NULL,title TEXT,bio TEXT,created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS event_media (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,media_url TEXT NOT NULL,media_type TEXT,description TEXT,created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS content_posts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),content TEXT NOT NULL,platform TEXT NOT NULL,scheduled_at TIMESTAMP NOT NULL,color TEXT DEFAULT 'lavender',status TEXT DEFAULT 'draft',created_by uuid REFERENCES auth.users(id),created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS requirements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,label TEXT NOT NULL,done BOOLEAN DEFAULT FALSE,created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS essentials (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,label TEXT NOT NULL,category TEXT,done BOOLEAN DEFAULT FALSE,created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS notes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,body TEXT NOT NULL,author_id uuid REFERENCES auth.users(id),created_at TIMESTAMP DEFAULT NOW());
ALTER TABLE events ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'lavender';
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE events ADD COLUMN IF NOT EXISTS luma_url TEXT;
CREATE INDEX IF NOT EXISTS idx_event_agenda_event_id ON event_agenda(event_id);
CREATE INDEX IF NOT EXISTS idx_event_speakers_event_id ON event_speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_event_id ON event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled_at ON content_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_requirements_event_id ON requirements(event_id);
CREATE INDEX IF NOT EXISTS idx_essentials_event_id ON essentials(event_id);
CREATE INDEX IF NOT EXISTS idx_notes_event_id ON notes(event_id);
```

8. Click **"RUN"** button (top right)
9. Wait for ✅ green checkmarks
10. You can ignore any warnings

---

## STEP 2: Enable Security (RLS)

1. Still in Supabase, click **"SQL Editor"** 
2. Click **"New Query"** again
3. **Copy and paste this:**

```sql
ALTER TABLE event_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE essentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON event_agenda FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON event_speakers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON event_media FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON content_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON requirements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON essentials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON guests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON ideas FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

4. Click **"RUN"** button
5. Wait for ✅ checkmarks

---

## STEP 3: Test Your App

1. Go to: **http://localhost:3000**
2. Refresh page (Cmd+R or Ctrl+R)
3. Click **"🗓️ Events"** tab
4. Click **"New event"** button
5. Fill in:
   - Title: "My First Event"
   - Date: Pick any date
   - Time: 10:00 AM
   - Click **"Add to calendar"**
6. Click on your new event
7. Look for these tabs:
   - Requirements ✅
   - Essentials ✅
   - Guests ✅
   - Agenda ✅
   - Media ✅
   - Speakers ✅
   - Analytics ✅
   - Notes ✅

---

## ✅ That's It!

If you see all 8 tabs on your event → **SUCCESS!** 🎉

You now have a fully functional event management system with:
- Event checklists
- Guest management
- Event agenda
- Speaker management
- Media gallery
- Event analytics
- Team notes

---

## 🎯 Next: Use the Features!

### Try These:
1. Click **"Requirements"** tab → Add "Book venue"
2. Click **"Guests"** tab → Add guest names
3. Click **"Agenda"** tab → Add "10:00 - Welcome"
4. Click **"Speakers"** tab → Add speaker info
5. Click **"Analytics"** → See event stats
6. Click **"Notes"** → Write team notes

---

## ❌ Troubleshooting

**"Error: Table already exists"**
→ That's fine, it just means the table is already there

**Tabs not showing when I click event?**
→ Refresh browser (Cmd+R or Ctrl+R)
→ Make sure you created the event AFTER running Step 1 SQL

**Still no tabs?**
→ Try creating a NEW event and clicking on that

**Completely broken?**
→ Stop the server (Ctrl+C in terminal)
→ Restart: `npm run dev -- --port 3000`
→ Go to http://localhost:3000
→ Refresh page

---

## 🆘 Need Help?

1. Make sure all SQL ran without errors
2. Make sure you ran BOTH Step 1 AND Step 2
3. Refresh the browser after each step
4. Create a NEW event (don't click old ones)

---

**You're ready! Go build amazing events! 🌸**
