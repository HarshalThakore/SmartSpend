#!/bin/bash
echo "Running build process for Azure deployment..."

echo "Installing dependencies..."
npm install --production=false

echo "Building the application..."
npm run build

echo "Copying static assets..."
if [ -d "dist" ]; then
  mkdir -p dist/public
  cp -r server/public/* dist/public/
fi

echo "Build completed"
