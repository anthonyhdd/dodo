-- Simple migration: Add elevenlabs_voice_id column only
-- This won't fail if the column already exists or if policies already exist

-- Add column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'voice_profiles' 
        AND column_name = 'elevenlabs_voice_id'
    ) THEN
        ALTER TABLE voice_profiles ADD COLUMN elevenlabs_voice_id TEXT;
        RAISE NOTICE 'Column elevenlabs_voice_id added successfully';
    ELSE
        RAISE NOTICE 'Column elevenlabs_voice_id already exists';
    END IF;
END $$;

