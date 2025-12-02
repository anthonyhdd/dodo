-- Migration: Add elevenlabs_voice_id column to voice_profiles table
-- Run this in your Supabase SQL editor

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'voice_profiles' 
        AND column_name = 'elevenlabs_voice_id'
    ) THEN
        ALTER TABLE voice_profiles ADD COLUMN elevenlabs_voice_id TEXT;
    END IF;
END $$;

