require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVoiceProfile(voiceProfileId) {
  console.log(`\n🔍 Checking voice profile: ${voiceProfileId}\n`);
  
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('id', voiceProfileId)
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (!data) {
    console.error('❌ Voice profile not found');
    return;
  }
  
  console.log('📋 Voice Profile Details:');
  console.log(`   ID: ${data.id}`);
  console.log(`   Status: ${data.status}`);
  console.log(`   Created: ${data.created_at}`);
  console.log(`   ElevenLabs Voice ID: ${data.elevenlabs_voice_id || '❌ MISSING'}`);
  
  if (!data.elevenlabs_voice_id) {
    console.log('\n⚠️  PROBLEM: This voice profile has no elevenlabs_voice_id!');
    console.log('   This means:');
    console.log('   1. ElevenLabs voice cloning failed when creating this profile');
    console.log('   2. Suno will NOT be used for lullabies with this voice profile');
    console.log('   3. The Dummy Provider (fallback MP3) will be used instead');
    console.log('\n💡 Solution: Recreate the voice profile to retry ElevenLabs cloning');
  } else {
    console.log('\n✅ Voice profile has ElevenLabs voice ID - Suno should work!');
  }
}

// Get voice profile ID from command line or use the one from logs
const voiceProfileId = process.argv[2] || '9bc9a3e2-37c8-43b2-a793-12d1ea735a36';

checkVoiceProfile(voiceProfileId).then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});


