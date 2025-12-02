-- Very simple: just add the column (will fail if it exists, but that's OK)
ALTER TABLE voice_profiles ADD COLUMN elevenlabs_voice_id TEXT;

