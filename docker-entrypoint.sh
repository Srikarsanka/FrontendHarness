#!/bin/sh
set -e

# Set defaults for environment variables
export API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
export API_URL="${API_URL:-/api}"
export APP_ENV="${APP_ENV:-dev}"
export APP_NAME="${APP_NAME:-D&B Task Manager}"

# Generate env.js from template — injects runtime config into the Angular app
envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js

echo "Runtime environment injected:"
echo "  API_BASE_URL = ${API_BASE_URL}"
echo "  API_URL      = ${API_URL}"
echo "  APP_ENV      = ${APP_ENV}"
echo "  APP_NAME     = ${APP_NAME}"

# Nginx templates in /etc/nginx/templates/ are auto-processed by the
# official nginx docker image via envsubst → /etc/nginx/conf.d/

exec "$@"
