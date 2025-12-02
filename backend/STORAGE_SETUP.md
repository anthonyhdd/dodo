# Comment rendre le bucket Supabase Storage public

## Option 1 : Rendre le bucket public (recommandé)

1. Allez sur https://supabase.com et connectez-vous
2. Sélectionnez votre projet DODO
3. Dans le menu de gauche, cliquez sur **Storage**
4. Vous devriez voir votre bucket `dodo-audio` dans la liste
5. Cliquez sur le nom du bucket `dodo-audio`
6. Cliquez sur l'onglet **Settings** (ou **Paramètres**)
7. Cherchez l'option **Public bucket** ou **Bucket public**
8. ✅ **Cochez la case** pour rendre le bucket public
9. Cliquez sur **Save** (ou **Enregistrer**)

⚠️ **Note** : Si vous ne voyez pas l'option "Public bucket", c'est peut-être parce que :
- Le bucket a déjà été créé en privé et vous devez le recréer
- Votre version de Supabase a une interface différente

### Si le bucket est déjà créé en privé :

1. Dans **Storage**, cliquez sur le menu (3 points) à côté de `dodo-audio`
2. Cliquez sur **Delete bucket** (⚠️ Attention : cela supprimera tous les fichiers)
3. Cliquez sur **New bucket**
4. Remplissez :
   - **Name** : `dodo-audio`
   - **Public bucket** : ✅ **Cochez cette case**
5. Cliquez sur **Create bucket**

## Option 2 : Utiliser des signed URLs (déjà implémenté)

Le code backend utilise maintenant des **signed URLs** par défaut, qui fonctionnent même si le bucket est privé. Les signed URLs sont valides pendant 7 jours.

**Avantages** :
- ✅ Fonctionne avec des buckets privés
- ✅ Plus sécurisé (URLs temporaires)
- ✅ Pas besoin de rendre le bucket public

**Inconvénients** :
- ⚠️ Les URLs expirent après 7 jours (mais on peut les régénérer)

## Vérifier que ça fonctionne

1. Créez une nouvelle comptine dans l'app
2. Vérifiez les logs du backend - vous devriez voir :
   ```
   ✅ Generated signed URL (valid for 7 days): https://...
   ```
3. Si vous voyez une erreur, vérifiez que le bucket existe bien dans Supabase Storage

