/**
 * Script to update package.json with Azure deployment scripts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

try {
  console.log('Reading package.json...');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add the Azure deployment script
  packageJson.scripts = {
    ...packageJson.scripts,
    'azure-deploy': 'npm ci && npm run build && node scripts/deploy.js && npm run start',
    'azure-postdeploy': 'npm run db:push'
  };
  
  // Write the updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✓ Successfully updated package.json with Azure deployment scripts');
  
} catch (error) {
  console.error('❌ Error updating package.json:', error);
  process.exit(1);
}