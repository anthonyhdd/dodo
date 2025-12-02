-- DODO Database Schema for Supabase
-- Run this in your Supabase SQL editor to create the tables

-- Table: children
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age_months INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: voice_profiles
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('recording', 'processing', 'ready', 'error')),
  elevenlabs_voice_id TEXT, -- Store the cloned voice ID from ElevenLabs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: lullabies
CREATE TABLE IF NOT EXISTS lullabies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  style TEXT NOT NULL CHECK (style IN ('soft', 'joyful', 'spoken', 'melodic')),
  duration_minutes INTEGER NOT NULL,
  language_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('generating', 'ready', 'failed')),
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lullabies_child_id ON lullabies(child_id);
CREATE INDEX IF NOT EXISTS idx_lullabies_voice_profile_id ON lullabies(voice_profile_id);
CREATE INDEX IF NOT EXISTS idx_lullabies_created_at ON lullabies(created_at DESC);

-- Enable Row Level Security (RLS) - adjust policies as needed for your auth setup
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lullabies ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (adjust based on your auth requirements)
-- In production, you'll want to add proper RLS policies
CREATE POLICY "Allow all operations on children" ON children FOR ALL USING (true);
CREATE POLICY "Allow all operations on voice_profiles" ON voice_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on lullabies" ON lullabies FOR ALL USING (true);
