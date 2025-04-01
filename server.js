// Simple Express server for Azure App Service
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Log startup information
console.log('Starting simple Express server...');
console.log('Node.js version:', process.version);
console.log('Current directory:', __dirname);

// Serve static files
app.use(express.static(path.join(__dirname, 'server/public')));

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', time: new Date().toISOString() });
});

// For all other routes, serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'server/public/test.html'));
});

// Create test HTML file
const testDir = path.join(__dirname, 'server/public');
if (!fs.existsSync(testDir)) {
  console.log('Creating public directory:', testDir);
  fs.mkdirSync(testDir, { recursive: true });
}

const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #0066cc; }
  </style>
</head>
<body>
  <h1>Azure Express Server Test Page</h1>
  <p>If you can see this page, the server is working correctly.</p>
  <p id="time">Current time: Loading...</p>
  <p><a href="/api/test">Test API Endpoint</a></p>
  
  <script>
    document.getElementById('time').textContent = 'Current time: ' + new Date().toLocaleString();
    
    // Fetch API test
    fetch('/api/test')
      .then(response => response.json())
      .then(data => {
        const div = document.createElement('div');
        div.innerHTML = '<p>API Response: ' + JSON.stringify(data) + '</p>';
        document.body.appendChild(div);
      })
      .catch(error => {
        const div = document.createElement('div');
        div.innerHTML = '<p style="color: red;">API Error: ' + error.message + '</p>';
        document.body.appendChild(div);
      });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(testDir, 'test.html'), testHtml);
console.log('Created test.html page');

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
