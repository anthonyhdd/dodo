require('dotenv').config();
const axios = require('axios');

async function testElevenLabs() {
  console.log('\n🧪 Test ElevenLabs API...');
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.log('❌ ELEVENLABS_API_KEY non définie');
    return false;
  }
  
  try {
    // Test simple : récupérer la liste des voix (endpoint qui nécessite juste l'API key)
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
      timeout: 10000,
    });
    
    console.log('✅ ElevenLabs : Connexion réussie');
    console.log(`   Nombre de voix disponibles : ${response.data.voices?.length || 0}`);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ ElevenLabs : Erreur ${error.response.status}`);
      console.log(`   Message : ${error.response.data?.detail?.message || JSON.stringify(error.response.data)}`);
    } else {
      console.log(`❌ ElevenLabs : Erreur réseau - ${error.message}`);
    }
    return false;
  }
}

async function testSuno() {
  console.log('\n🧪 Test Suno API...');
  const apiKey = process.env.SUNO_API_KEY;
  const apiUrl = process.env.SUNO_API_URL || 'https://api.sunoapi.com/v1';
  
  if (!apiKey) {
    console.log('❌ SUNO_API_KEY non définie');
    return false;
  }
  
  try {
    // Test simple : vérifier que l'endpoint répond (même si on ne crée pas de chanson)
    // On peut tester avec un endpoint de statut ou de liste
    const response = await axios.get(`${apiUrl}/suno/get/`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000,
      validateStatus: (status) => status < 500, // Accepter 4xx mais pas 5xx
    });
    
    // Si on obtient une réponse (même 404), l'API est accessible
    if (response.status < 500) {
      console.log('✅ Suno : API accessible');
      console.log(`   Endpoint : ${apiUrl}`);
      return true;
    }
    
    return false;
  } catch (error) {
    if (error.response) {
      // 404 ou autre erreur client = API accessible mais endpoint invalide (normal pour un test)
      if (error.response.status < 500) {
        console.log('✅ Suno : API accessible (endpoint de test invalide, mais connexion OK)');
        console.log(`   Endpoint : ${apiUrl}`);
        return true;
      }
      console.log(`❌ Suno : Erreur ${error.response.status}`);
      console.log(`   Message : ${error.response.data?.message || JSON.stringify(error.response.data)}`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log(`❌ Suno : Impossible de se connecter à ${apiUrl}`);
      console.log(`   Vérifiez l'URL de l'API`);
    } else {
      console.log(`❌ Suno : Erreur - ${error.message}`);
    }
    return false;
  }
}

async function testSupabase() {
  console.log('\n🧪 Test Supabase...');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.log('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non définies');
    return false;
  }
  
  try {
    // Test simple : vérifier que Supabase répond
    const response = await axios.get(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      timeout: 10000,
    });
    
    console.log('✅ Supabase : Connexion réussie');
    return true;
  } catch (error) {
    if (error.response) {
      // Même une erreur 404 signifie que Supabase répond
      if (error.response.status === 404) {
        console.log('✅ Supabase : Connexion réussie (endpoint de test invalide, mais API accessible)');
        return true;
      }
      console.log(`❌ Supabase : Erreur ${error.response.status}`);
    } else {
      console.log(`❌ Supabase : Erreur réseau - ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🔍 Vérification des intégrations...\n');
  
  const results = {
    elevenlabs: await testElevenLabs(),
    suno: await testSuno(),
    supabase: await testSupabase(),
  };
  
  console.log('\n📊 Résumé :');
  console.log(`   ElevenLabs : ${results.elevenlabs ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`   Suno       : ${results.suno ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`   Supabase   : ${results.supabase ? '✅ OK' : '❌ ÉCHEC'}`);
  
  const allOk = results.elevenlabs && results.suno && results.supabase;
  console.log(`\n${allOk ? '✅' : '⚠️'} ${allOk ? 'Toutes les intégrations sont OK !' : 'Certaines intégrations ont des problèmes'}`);
  
  process.exit(allOk ? 0 : 1);
}

runTests().catch(console.error);


