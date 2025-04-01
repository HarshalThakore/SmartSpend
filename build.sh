
#!/bin/bash
echo "Running build process for Azure deployment..."

# Install all dependencies including dev dependencies
echo "Installing dependencies..."
npm install --include=dev

# Build the application
echo "Building the application..."
echo "Running vite build..."
./node_modules/.bin/vite build

echo "Building server..."
./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Copying static assets..."
if [ -d "dist" ]; then
  mkdir -p dist/public
  cp -r server/public/* dist/public/
fi

echo "Build completed"
