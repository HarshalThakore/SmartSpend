
#!/bin/bash
echo "Running build process for Azure deployment..."

# Install all dependencies including dev dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
echo "Running vite build..."
npm run build

echo "Building server..."
npm run dev

echo "Build completed"