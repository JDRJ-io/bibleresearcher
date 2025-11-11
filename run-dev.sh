#!/bin/bash

# Set environment variables for Replit
export PORT=5000
export HOST=0.0.0.0

# Start Vite with the custom config
npx vite --config vite.config.dev.ts --host 0.0.0.0 --port 5000