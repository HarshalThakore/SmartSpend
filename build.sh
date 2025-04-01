#!/bin/bash
echo "Running manual build process..."
cd /home/site/wwwroot

echo "Installing dependencies (ignoring engine requirements)..."
npm install --ignore-engines

echo "Installing build tools locally..."
npm install --save-dev vite esbuild typescript

echo "Building application..."
# Use the local vite and esbuild from node_modules
export PATH=$PWD/node_modules/.bin:$PATH
echo "PATH set to: $PATH"

echo "Attempting to build the frontend..."
if [ -f "./node_modules/.bin/vite" ]; then
  echo "Local vite found, running build..."
  ./node_modules/.bin/vite build
else
  echo "Vite not found in node_modules, skipping frontend build"
fi

echo "Building the server part..."
if [ -f "./node_modules/.bin/esbuild" ]; then
  echo "Local esbuild found, running build..."
  ./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist
else
  echo "esbuild not found in node_modules, skipping server build"
fi

echo "Checking for build output..."
if [ -d "dist" ]; then
  echo "Build completed, files in dist directory:"
  ls -la dist
else
  echo "Build may have failed, dist directory not found"
fi

if [ -d "dist/public" ]; then
  echo "Frontend build completed, files in dist/public directory:"
  ls -la dist/public
else
  echo "Frontend build may have failed, dist/public directory not found or empty"
  
  # Create server/public directory if it doesn't exist
  mkdir -p server/public
  
  # Create a simple index.html in server/public as fallback
  cat > server/public/index.html << INNEREOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FinTrack - Finance Manager</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 650px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { color: #3b82f6; }
  </style>
</head>
<body>
  <h1>FinTrack - Finance Manager</h1>
  <p>The application is being set up. Please check back later.</p>
  <p>If you continue to see this page, contact the administrator.</p>
  <script>
    // Attempt to redirect to the auth page
    setTimeout(() => {
      window.location.href = '/auth';
    }, 3000);
  </script>
</body>
</html>
INNEREOF
  
  echo "Created fallback index.html in server/public"
fi

# Create a simple app.js for CommonJS format
cat > app.js << APPEOF
// Enable detailed error logging
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  // We'll keep the process alive for diagnostic purposes
});

console.log('Starting FinTrack application...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Try to load the server application
try {
  console.log('Attempting to load the server application...');
  require('./dist/index.js');
  console.log('Server application loaded successfully');
} catch (error) {
  console.error('Failed to start server application:', error);
  
  // Start a simple HTTP server as fallback
  const http = require('http');
  const fs = require('fs');
  const path = require('path');
  
  const server = http.createServer((req, res) => {
    console.log('Request received:', req.method, req.url);
    
    // Serve the static HTML file from server/public if it exists
    const fallbackPath = path.join(__dirname, 'server/public/index.html');
    if (fs.existsSync(fallbackPath)) {
      fs.readFile(fallbackPath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading the fallback page');
          return;
        }
        
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(content);
      });
    } else {
      // Simple diagnostic page if the fallback doesn't exist
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>FinTrack - Diagnostic</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 650px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
            h1 { color: #3b82f6; }
            pre { background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>FinTrack - Diagnostic Page</h1>
          <p>The application encountered an error during startup.</p>
          <pre>${error ? error.stack : 'No error details available'}</pre>
        </body>
        </html>
      `);
    }
  });
  
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`Fallback server running on port ${PORT}`);
  });
}
APPEOF

echo "Created new app.js with CommonJS compatibility"