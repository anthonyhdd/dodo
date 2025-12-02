-- First, check if the column exists
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'voice_profiles' 
AND column_name = 'elevenlabs_voice_id';

