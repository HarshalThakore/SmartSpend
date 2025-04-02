
#!/bin/bash
echo "Running build process for Azure deployment..."

# Install all dependencies including dev dependencies
echo "Installing dependencies..."
npm install --include=dev

# Build the client application
echo "Building the client application..."
echo "Running vite build..."
./node_modules/.bin/vite build

# Build the server application
echo "Building server..."
./node_modules/.bin/esbuild server/index.ts --bundle --platform=node --outdir=dist --format=esm

echo "Build completed"