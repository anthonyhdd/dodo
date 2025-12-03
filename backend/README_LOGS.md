# 📋 Où trouver les logs du backend

## Emplacement des logs

Les logs du backend s'affichent dans le **terminal où vous avez lancé le serveur**.

### Si vous avez lancé le backend avec :
```bash
cd backend
npm run dev
```

Les logs apparaissent **directement dans ce terminal**.

## Types de logs à surveiller

### 1. Démarrage du serveur
```
DODO backend listening on port 4000
Accessible at http://localhost:4000 or http://192.168.1.155:4000
```

### 2. Création d'un profil vocal
```
🎤 Starting ElevenLabs voice cloning with X files
✅ ElevenLabs voice cloned successfully: [voice_id]
```

### 3. Création d'une berceuse
```
🎵 [Background] Starting generation for lullaby [id]
🎤 [Background] ElevenLabs voice ID: [id] ou not available
🎵 [generateAndUploadLullaby] Checking Suno availability:
   SUNO_API_KEY: ✅ Set ou ❌ Missing
   elevenLabsVoiceId: [id] ou ❌ Missing
```

### 4. Génération avec Suno
```
✅ [generateAndUploadLullaby] Using Suno for generation
🎵 [generateAndUploadLullaby] Calling Suno with prompt: "..."
✅ [generateAndUploadLullaby] Suno song created: [id]
```

### 5. Ou utilisation du Dummy Provider
```
⚠️ [generateAndUploadLullaby] Skipping Suno - using Dummy Provider instead
   Reason: [SUNO_API_KEY missing ou elevenLabsVoiceId missing]
```

## Comment voir les logs en temps réel

### Option 1 : Terminal où le backend tourne
- Ouvrez le terminal où vous avez lancé `npm run dev`
- Les logs s'affichent en temps réel

### Option 2 : Redémarrer le backend dans un terminal visible
```bash
# Arrêter le backend actuel
pkill -f "ts-node-dev.*backend"

# Relancer dans un nouveau terminal
cd /Users/anthonyhaddad/DODO/backend
npm run dev
```

### Option 3 : Rediriger les logs vers un fichier
```bash
cd /Users/anthonyhaddad/DODO/backend
npm run dev > backend.log 2>&1 &
tail -f backend.log
```

## Logs importants pour déboguer Suno

Quand vous créez une berceuse, cherchez ces lignes dans les logs :

1. **Vérification de Suno** :
   ```
   🎵 [generateAndUploadLullaby] Checking Suno availability:
   ```

2. **Raison du fallback** (si Dummy Provider est utilisé) :
   ```
   ⚠️ [generateAndUploadLullaby] Skipping Suno - using Dummy Provider instead
   ```

3. **Erreurs Suno** (si Suno échoue) :
   ```
   ❌ [generateAndUploadLullaby] Suno generation failed
   ```

## Astuce : Filtrer les logs

Pour voir uniquement les logs liés à la génération :
```bash
# Dans le terminal du backend, utilisez grep (si vous redirigez vers un fichier)
tail -f backend.log | grep -E "generateAndUploadLullaby|Suno|Background"
```


