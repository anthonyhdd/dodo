# Intégration ElevenLabs + Suno - Notes

## Durée d'enregistrement

**Question :** Est-ce que 20-30 secondes par étape (90 secondes total) sont suffisantes ?

**Réponse :** Oui, c'est suffisant ! 
- ElevenLabs recommande minimum 1 minute d'audio pour un bon clone de voix
- Vous avez 3 x 30 secondes = 90 secondes, ce qui est dans la fourchette recommandée
- Si vous voulez améliorer la qualité, vous pouvez augmenter à 45-60 secondes par étape

## Workflow actuel

1. **Mobile app** : Enregistre 3 fichiers audio (30s chacun) → Envoie via FormData au backend
2. **Backend** : 
   - Reçoit les fichiers audio
   - Upload vers Supabase Storage (`voices/{voiceProfileId}/source-{1,2,3}.m4a`)
   - Clone la voix avec ElevenLabs → Stocke `elevenlabs_voice_id` dans la DB
3. **Génération de comptine** :
   - Récupère `elevenlabs_voice_id` depuis la DB
   - Génère la comptine avec Suno en utilisant cette voix
   - Upload l'audio final vers Supabase Storage

## Prochaines étapes

1. Tester l'API Suno réelle (l'endpoint peut être différent)
2. Ajuster les prompts pour générer des comptines en français
3. Gérer le polling pour Suno (génération asynchrone)

