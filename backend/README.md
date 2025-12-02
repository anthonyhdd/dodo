# DODO Backend

Node.js + Express + TypeScript backend API for DODO mobile app, powered by Supabase.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up Supabase:
   - Create a Supabase project at https://supabase.com
   - Run the SQL schema from `schema.sql` in your Supabase SQL editor
   - Create a Storage bucket named `dodo-audio` (or update `SUPABASE_LULLABIES_BUCKET` in `.env`)
   - Make the bucket public or configure signed URLs as needed

3. Create `.env` file:
```bash
cp .env.example .env
```

Fill in your Supabase credentials:
```
PORT=4000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_LULLABIES_BUCKET=dodo-audio
```

4. Run in development mode:
```bash
npm run dev
```

The server will start on `http://localhost:4000`

## Database Schema

See `schema.sql` for the complete database schema. The backend uses three main tables:
- `children` - Stores child information
- `voice_profiles` - Stores voice profile data
- `lullabies` - Stores generated lullabies with audio URLs

## Storage

Audio files are stored in Supabase Storage:
- Lullabies: `lullabies/{lullabyId}.mp3`
- Voice samples (future): `voices/{voiceProfileId}/source-*.m4a`

## API Endpoints

### Voice Profiles
- `POST /api/voice/profile` - Create a voice profile
  - Body: `{ audioUris: string[] }`
- `GET /api/voice/profile/:id` - Get a voice profile

### Children
- `GET /api/children` - List all children
- `POST /api/children` - Create a child
  - Body: `{ name: string, ageMonths?: number }`

### Lullabies
- `GET /api/lullabies` - List all lullabies
- `POST /api/lullabies` - Create a lullaby
  - Body: `{ childId, voiceProfileId, style, durationMinutes, languageCode }`
- `GET /api/lullabies/:id` - Get a specific lullaby

## Architecture

The backend is structured to support future AI integration:
- `MusicGenerationProvider` interface for AI music generation (Suno, etc.)
- `VoiceCloneProvider` interface for voice cloning (ElevenLabs, etc.)
- Currently uses placeholder audio generation
- Ready to swap in real AI providers without changing routes

## Notes

- Uses Supabase for persistent storage (data survives server restarts)
- CORS enabled for Expo app development
- Audio files are uploaded to Supabase Storage and URLs are stored in the database
