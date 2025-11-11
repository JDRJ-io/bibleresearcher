import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startDevServer() {
  try {
    // Create Vite server with custom config
    const server = await createServer({
      configFile: resolve(__dirname, 'vite.config.dev.ts'),
      server: {
        host: '0.0.0.0',
        port: 5000,
        strictPort: true,
        force: true
      }
    });

    // Start the server
    await server.listen();
    
    console.log('Dev server started successfully on port 5000');
    console.log('Server info:', server.config.server);
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      console.log('Shutting down dev server...');
      await server.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Shutting down dev server...');
      await server.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start dev server:', error);
    process.exit(1);
  }
}

startDevServer();