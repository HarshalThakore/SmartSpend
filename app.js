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
