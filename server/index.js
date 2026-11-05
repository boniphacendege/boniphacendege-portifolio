/**
 * Production Web Server for Boniphace Ndege Portfolio
 * Optimized for Google Cloud Run, Docker containers, and Cloudflare custom-domain deployments.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Enable trust proxy for Cloudflare CDN and Google Cloud Run load balancers
app.enable('trust proxy');

// Basic security and header configuration
app.disable('x-powered-by');

// Cloud Run & Container Health Check Endpoints
app.get(['/healthz', '/health', '/_health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Resolve path to built frontend assets
const distPath = path.resolve(__dirname, '../dist');

// Serve static assets with tuned caching strategies
if (fs.existsSync(distPath)) {
  app.use(
    express.static(distPath, {
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        // Hashed assets in assets/ folder can be cached immutably for 1 year
        if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        // HTML, service workers, and PWA manifests must revalidate immediately to ensure fresh updates
        if (
          filePath.endsWith('.html') ||
          filePath.endsWith('sw.js') ||
          filePath.endsWith('.webmanifest')
        ) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
      }
    })
  );

  // SPA Fallback: Route all unmatched navigation requests to index.html
  app.get('*', (req, res, next) => {
    // Only handle GET requests expecting HTML or general navigation
    if (req.method !== 'GET') {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      return res.sendFile(indexPath);
    }
    next();
  });
} else {
  // Helpful fallback message if dist/ has not been built yet
  app.get('*', (req, res) => {
    res.status(503).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Build Required</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #041c10; color: #f4fff8;">
          <h2>Production Assets Not Built Yet</h2>
          <p>Please run <code>npm run build</code> to generate the <code>dist/</code> directory before starting the production server.</p>
        </body>
      </html>
    `);
  });
}

// Start HTTP server
const server = app.listen(PORT, HOST, () => {
  console.log(`[Production Server] Boniphace Ndege Portfolio listening on http://${HOST}:${PORT}`);
  console.log(`[Production Server] Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`[Production Server] Health check available at http://${HOST}:${PORT}/healthz`);
});

// Graceful shutdown handling for container runtimes (Cloud Run, Kubernetes, Docker)
const handleShutdown = (signal) => {
  console.log(`[Production Server] Received ${signal}. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('[Production Server] HTTP server closed. Process terminating.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if connections refuse to close
  setTimeout(() => {
    console.error('[Production Server] Forceful shutdown initiated after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
