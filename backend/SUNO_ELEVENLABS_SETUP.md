# Configuration Suno & ElevenLabs

## ✅ Intégration complète

Le backend est maintenant configuré pour utiliser **Suno** (génération de musique) et **ElevenLabs** (clonage de voix).

## 🔑 Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` du backend :

```env
# Suno API (pour générer la musique)
SUNO_API_KEY=your_suno_api_key_here
SUNO_API_URL=https://api.sunoapi.com/v1  # Optionnel, valeur par défaut

# ElevenLabs API (pour cloner la voix)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

## 📋 Flux d'intégration

### 1. **Création d'un profil vocal (ElevenLabs)**
- Quand l'utilisateur enregistre des échantillons vocaux
- Le backend clone la voix avec ElevenLabs
- Le `elevenlabs_voice_id` est stocké dans `voice_profiles.elevenlabs_voice_id`

### 2. **Génération d'une berceuse (Suno + ElevenLabs)**
- Le backend récupère le `elevenlabs_voice_id` depuis le profil vocal
- Si `SUNO_API_KEY` ET `elevenLabsVoiceId` sont présents :
  - ✅ Génère la musique avec **Suno** en utilisant la voix clonée
  - ✅ Télécharge l'audio généré
  - ✅ Upload vers Supabase Storage
- Sinon :
  - ⚠️ Utilise le Dummy Provider (fichier local ou URL de fallback)

## 🔧 Configuration des services

### Suno API

**Endpoint mis à jour :** `https://api.sunoapi.com/v1`

**Endpoints utilisés :**
- `POST /v1/suno/create` - Créer une chanson
- `GET /v1/suno/get/{songId}` - Vérifier le statut

**Structure de la requête :**
```json
{
  "custom_mode": true,
  "gpt_description_prompt": "Une comptine douce et lente pour endormir un enfant, en français",
  "make_instrumental": false,
  "mv": "chirp-v4",
  "voice_id": "elevenlabs_voice_id" // Optionnel
}
```

**Authentification :**
```
Authorization: Bearer {SUNO_API_KEY}
```

### ElevenLabs API

**Endpoint :** `https://api.elevenlabs.io/v1`

**Endpoints utilisés :**
- `POST /v1/voices/add` - Cloner une voix depuis des échantillons audio
- `POST /v1/text-to-speech/{voiceId}` - Générer de la parole (pour usage futur)

**Authentification :**
```
xi-api-key: {ELEVENLABS_API_KEY}
```

## 🧪 Test de l'intégration

### Test 1 : Vérifier les clés API

```bash
# Dans le terminal backend
cd backend
node -e "console.log('SUNO:', process.env.SUNO_API_KEY ? '✅ Set' : '❌ Missing'); console.log('ELEVENLABS:', process.env.ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing');"
```

### Test 2 : Créer un profil vocal

1. Depuis l'app, enregistrez des échantillons vocaux
2. Vérifiez les logs backend :
   - `🎤 Starting ElevenLabs voice cloning...`
   - `✅ ElevenLabs voice cloned successfully: {voice_id}`
3. Vérifiez dans Supabase que `voice_profiles.elevenlabs_voice_id` est rempli

### Test 3 : Générer une berceuse

1. Créez une berceuse depuis l'app avec un profil vocal qui a un `elevenlabs_voice_id`
2. Vérifiez les logs backend :
   - `🎵 [Background] Starting generation for lullaby {id}`
   - `🎤 [Background] ElevenLabs voice ID: {voice_id}`
   - Si Suno est configuré : génération via Suno
   - Sinon : fallback vers Dummy Provider

## ⚠️ Notes importantes

1. **Suno nécessite les deux clés** : Pour utiliser Suno, il faut à la fois `SUNO_API_KEY` ET un `elevenlabs_voice_id` dans le profil vocal.

2. **Fallback automatique** : Si Suno échoue ou n'est pas configuré, le système utilise automatiquement le Dummy Provider (fichier local ou URL de fallback).

3. **Génération asynchrone** : La génération de berceuse se fait en arrière-plan. Le statut initial est `generating`, puis passe à `ready` une fois l'audio généré.

4. **Polling Suno** : Le backend fait du polling toutes les 5 secondes pendant maximum 5 minutes pour vérifier si la génération Suno est terminée.

## 🔍 Dépannage

### Suno ne génère pas
- Vérifiez que `SUNO_API_KEY` est défini dans `.env`
- Vérifiez que le profil vocal a un `elevenlabs_voice_id`
- Consultez les logs backend pour les erreurs détaillées

### ElevenLabs ne clone pas la voix
- Vérifiez que `ELEVENLABS_API_KEY` est défini dans `.env`
- Vérifiez que les fichiers audio sont valides (format M4A recommandé)
- Consultez les logs backend pour les erreurs détaillées

### Les berceuses utilisent toujours le Dummy Provider
- Vérifiez que `SUNO_API_KEY` est défini
- Vérifiez que le profil vocal a un `elevenlabs_voice_id` dans la base de données
- Vérifiez les logs pour voir pourquoi Suno n'est pas utilisé


