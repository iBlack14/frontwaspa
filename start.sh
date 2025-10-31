#!/bin/bash
# Script de inicio robusto para producción

# Configurar variables de entorno
export NODE_ENV=production
export PORT=${PORT:-3000}

# Limpiar procesos anteriores
pkill -f "next start" || true

# Esperar un momento
sleep 2

# Iniciar Next.js
echo "🚀 Starting Next.js on port $PORT..."
exec node_modules/.bin/next start -H 0.0.0.0 -p $PORT
