#!/bin/sh
set -e

echo "🚀 Starting Laravel application..."

cat > /var/www/html/.env << EOF
APP_NAME=Laravel
APP_ENV=production
APP_KEY=${APP_KEY}
APP_DEBUG=false
APP_URL=http://localhost:8000

DB_CONNECTION=${DB_CONNECTION}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

GROQ_API_KEY=${GROQ_API_KEY}

MAIL_MAILER=smtp
MAIL_HOST=mailpitService
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=petMatchTeam@petmatch.test
MAIL_FROM_NAME="PetMatch"

CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:3000

EOF

echo "📋 .env generated with GROQ_API_KEY"

# wait for DB
echo "⏳ Waiting for database..."
until php artisan db:show > /dev/null 2>&1; do
  sleep 2
done

echo "✅ Database ready"

php artisan migrate --force
php artisan storage:link || true

php artisan config:clear
php artisan config:cache
php artisan route:cache

echo "✨ Laravel ready"

exec php-fpm