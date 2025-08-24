#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variables for port and host
process.env.PORT = '5000';
process.env.HOST = '0.0.0.0';

// Start Vite with the custom config that includes port 5000 and allowedHosts
const viteProcess = spawn('npx', ['vite', '--config', 'vite.config.dev.ts', '--host', '0.0.0.0', '--port', '5000'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '5000',
    HOST: '0.0.0.0'
  }
});

viteProcess.on('exit', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});

viteProcess.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  viteProcess.kill('SIGTERM');
});