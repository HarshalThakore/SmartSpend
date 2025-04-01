#!/bin/bash
echo "Running manual build process..."
cd /home/site/wwwroot

echo "Installing dependencies (ignoring engine requirements)..."
npm install --ignore-engines
npm install --save-dev vite @vitejs/plugin-react esbuild typescript

echo "Building application..."
# Set NODE_ENV to production for the build
export NODE_ENV=production

echo "Building the frontend..."
./node_modules/.bin/vite build

echo "Building the server..."
./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist

echo "Checking build output..."
if [ -d "dist" ]; then
  echo "Build completed successfully"
  ls -la dist
else
  echo "Build failed - dist directory not found"
  exit 1
fi

if [ ! -d "dist/public" ]; then
  echo "Creating public directory..."
  mkdir -p dist/public
  cp -r server/public/* dist/public/
fi