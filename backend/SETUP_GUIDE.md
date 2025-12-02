# Guide de Setup Supabase - Étape par Étape

Ce guide vous accompagne pour configurer Supabase et faire fonctionner le backend DODO.

## Étape 1 : Créer un projet Supabase

1. Allez sur https://supabase.com
2. Cliquez sur "Start your project" ou "New Project"
3. Connectez-vous avec GitHub, Google, ou créez un compte
4. Créez une nouvelle organisation si nécessaire
5. Cliquez sur "New Project"
6. Remplissez :
   - **Name** : `dodo` (ou le nom de votre choix)
   - **Database Password** : Choisissez un mot de passe fort (⚠️ **SAVEZ-LE**, vous en aurez besoin)
   - **Region** : Choisissez la région la plus proche (ex: `West US` pour les USA)
7. Cliquez sur "Create new project"
8. ⏳ Attendez 2-3 minutes que le projet soit créé

## Étape 2 : Récupérer les credentials Supabase

Une fois le projet créé :

1. Dans le menu de gauche, cliquez sur **Settings** (⚙️)
2. Cliquez sur **API**
3. Vous verrez deux informations importantes :
   - **Project URL** : `https://xxxxx.supabase.co` → C'est votre `SUPABASE_URL`
   - **service_role key** : Cliquez sur "Reveal" pour voir la clé → C'est votre `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **IMPORTANT** : Ne partagez JAMAIS la `service_role` key publiquement !

## Étape 3 : Créer les tables dans Supabase

1. Dans le menu de gauche, cliquez sur **SQL Editor**
2. Cliquez sur **New query**
3. Ouvrez le fichier `schema.sql` dans votre éditeur
4. Copiez TOUT le contenu du fichier `schema.sql`
5. Collez-le dans l'éditeur SQL de Supabase
6. Cliquez sur **Run** (ou appuyez sur Cmd+Enter / Ctrl+Enter)
7. ✅ Vous devriez voir "Success. No rows returned"

## Étape 4 : Créer le bucket Storage

1. Dans le menu de gauche, cliquez sur **Storage**
2. Cliquez sur **New bucket**
3. Remplissez :
   - **Name** : `dodo-audio`
   - **Public bucket** : ✅ Cochez cette case (pour que les URLs audio soient accessibles)
4. Cliquez sur **Create bucket**
5. ✅ Le bucket est créé !

## Étape 5 : Configurer le backend

1. Dans le terminal, allez dans le dossier backend :
   ```bash
   cd /Users/anthonyhaddad/DODO/backend
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Créez le fichier `.env` :
   ```bash
   cp .env.example .env
   ```

4. Ouvrez le fichier `.env` dans votre éditeur et remplissez-le :
   ```
   PORT=4000
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
   SUPABASE_LULLABIES_BUCKET=dodo-audio
   ```

   ⚠️ Remplacez :
   - `https://xxxxx.supabase.co` par votre Project URL de l'Étape 2
   - `votre_service_role_key_ici` par votre service_role key de l'Étape 2

## Étape 6 : Tester le backend

1. Démarrez le serveur :
   ```bash
   npm run dev
   ```

2. Vous devriez voir :
   ```
   DODO backend listening on port 4000
   ```

3. Testez que le serveur répond :
   - Ouvrez votre navigateur sur `http://localhost:4000`
   - Vous devriez voir : `{"ok":true,"service":"DODO backend"}`

## Étape 7 : Tester avec l'app mobile

1. Assurez-vous que le backend tourne (Étape 6)
2. Dans l'app mobile, vérifiez que `USE_HTTP = true` dans `src/state/AppStateContext.tsx`
3. Pour Expo, vous devrez peut-être changer `localhost` par l'IP de votre machine :
   - Trouvez votre IP locale : `ifconfig | grep "inet "` (Mac/Linux) ou `ipconfig` (Windows)
   - Dans `src/api/apiClient.ts`, changez `http://localhost:4000` par `http://VOTRE_IP:4000`
   - Ou mieux : utilisez `EXPO_PUBLIC_BACKEND_URL` dans votre `.env` mobile

## Étape 8 : Vérifier que ça fonctionne

1. Dans l'app mobile, créez un enfant
2. Créez une comptine
3. Vérifiez dans Supabase :
   - **Table Editor** → `children` : Vous devriez voir votre enfant
   - **Table Editor** → `lullabies` : Vous devriez voir votre comptine
   - **Storage** → `dodo-audio` → `lullabies/` : Vous devriez voir un fichier `.mp3`

## Problèmes courants

### Erreur "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
- Vérifiez que votre `.env` est bien rempli
- Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs

### Erreur "Failed to fetch" dans l'app mobile
- Vérifiez que le backend tourne (`npm run dev`)
- Vérifiez que l'URL dans `apiClient.ts` est correcte
- Pour Expo, utilisez l'IP locale au lieu de `localhost`

### Erreur "relation does not exist"
- Vérifiez que vous avez bien exécuté `schema.sql` dans Supabase SQL Editor

### Erreur "bucket not found"
- Vérifiez que le bucket `dodo-audio` existe dans Supabase Storage
- Vérifiez que le nom dans `.env` correspond exactement

## Prochaine étape

Une fois que tout fonctionne, vous pouvez passer à **Step 13 : Build & App Store Connect** ! 🚀

