#!/bin/bash
# Fix npm package-lock.json sync issue

echo "🔧 Fixing package-lock.json..."
cd backend
npm install
echo "✅ Package-lock.json updated!"

echo ""
echo "Now rebuild Docker containers:"
echo "docker-compose down"
echo "docker-compose build"
echo "docker-compose up"
