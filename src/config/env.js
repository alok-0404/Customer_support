import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const cwd = process.cwd();

const enqueueIfExists = (files, relativePath) => {
  if (!relativePath) return;
  const fullPath = path.resolve(cwd, relativePath);
  if (fs.existsSync(fullPath)) {
    files.push(fullPath);
  }
};

const envFilesToLoad = [];

enqueueIfExists(envFilesToLoad, '.env');
enqueueIfExists(envFilesToLoad, '.env.local');

const nodeEnv = process.env.NODE_ENV || '';
if (nodeEnv) {
  enqueueIfExists(envFilesToLoad, `.env.${nodeEnv}`);
  enqueueIfExists(envFilesToLoad, `.env.${nodeEnv}.local`);
  enqueueIfExists(envFilesToLoad, `${nodeEnv}.env`);
}

enqueueIfExists(envFilesToLoad, 'production.env');

// Load environment files (root .env takes priority)
envFilesToLoad.forEach((filePath) => {
  dotenv.config({ path: filePath, override: true });
});

// Log which env files were loaded (for debugging)
if (envFilesToLoad.length > 0) {
  console.log('📁 Loaded environment files:', envFilesToLoad.map(f => path.basename(f)).join(', '));
} else {
  console.log('⚠️ No .env files found in root directory');
}

export default process.env;

