-- Row Level Security (RLS) Policies for Bloom

-- Enable RLS on all tables
ALTER TABLE event_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE essentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- EVENT AGENDA POLICIES
CREATE POLICY "Allow all for authenticated users" ON event_agenda
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- EVENT SPEAKERS POLICIES
CREATE POLICY "Allow all for authenticated users" ON event_speakers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- EVENT MEDIA POLICIES
CREATE POLICY "Allow all for authenticated users" ON event_media
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- CONTENT POSTS POLICIES
CREATE POLICY "Allow all for authenticated users" ON content_posts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- REQUIREMENTS POLICIES
CREATE POLICY "Allow all for authenticated users" ON requirements
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ESSENTIALS POLICIES
CREATE POLICY "Allow all for authenticated users" ON essentials
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- NOTES POLICIES
CREATE POLICY "Allow all for authenticated users" ON notes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- If your events, guests, ideas tables don't have RLS, enable them too:
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Add policies for events table if needed
CREATE POLICY "Allow all for authenticated users" ON events
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add policies for guests table if needed
CREATE POLICY "Allow all for authenticated users" ON guests
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add policies for ideas table if needed
CREATE POLICY "Allow all for authenticated users" ON ideas
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
