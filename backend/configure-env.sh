#!/bin/bash

echo "🔧 Configuration du fichier .env"
echo ""
echo "Entrez votre SUPABASE_URL (ex: https://xxxxx.supabase.co):"
read SUPABASE_URL

echo ""
echo "Entrez votre SUPABASE_SERVICE_ROLE_KEY:"
read SUPABASE_KEY

echo ""
echo "Configuration du bucket (par défaut: dodo-audio):"
read -p "Nom du bucket [dodo-audio]: " BUCKET
BUCKET=${BUCKET:-dodo-audio}

cat > .env << EOF
PORT=4000
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_KEY
SUPABASE_LULLABIES_BUCKET=$BUCKET
EOF

echo ""
echo "✅ Fichier .env configuré !"
echo ""
echo "Vérification du contenu:"
cat .env | sed 's/SUPABASE_SERVICE_ROLE_KEY=.*/SUPABASE_SERVICE_ROLE_KEY=***masqué***/'

