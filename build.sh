#!/bin/bash
echo "Running build process for Azure deployment..."

# Ensure node_modules/.bin is in the PATH
export PATH=$PATH:./node_modules/.bin

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