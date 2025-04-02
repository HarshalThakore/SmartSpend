#!/bin/bash
echo "Running build process for Azure deployment..."

# Ensure node_modules/.bin and the Vite path are in the PATH
export PATH=$PATH:./node_modules/.bin:/home/.nvm/versions/node/v23.10.0/bin

# Install all dependencies including dev dependencies
echo "Installing dependencies..."
npm install --include=dev

# Build the client application
echo "Building the client application..."
npm run build-client

# Build the server application
echo "Building server..."
npm run build-server

echo "Build completed"