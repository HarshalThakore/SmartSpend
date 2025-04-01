/**
 * Deployment helper script
 * This script handles the copying of the built frontend to the correct location
 * for production deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ensure the public directory exists in server
const serverPublicDir = path.join(rootDir, 'server', 'public');
if (!fs.existsSync(serverPublicDir)) {
  fs.mkdirSync(serverPublicDir, { recursive: true });
  console.log(`✓ Created directory: ${serverPublicDir}`);
}

// Check if the client has been built
const distPublicDir = path.join(rootDir, 'dist', 'public');
if (!fs.existsSync(distPublicDir)) {
  console.error('❌ Could not find the built client at dist/public.');
  console.error('Please run npm run build first.');
  process.exit(1);
}

// Copy files from dist/public to server/public
console.log(`Copying files from ${distPublicDir} to ${serverPublicDir}...`);

// Function to copy directory recursively
function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied: ${entry.name}`);
    }
  });
}

// Execute the copy
try {
  copyDirRecursive(distPublicDir, serverPublicDir);
  console.log('✓ Successfully copied all built files for production!');
} catch (error) {
  console.error('❌ Error during file copy:', error);
  process.exit(1);
}