// Local development server to run Vercel API routes
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { register } from 'tsx/esm/api';

// Register tsx to handle TypeScript imports
register();

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Helper function to create mock Vercel request/response
function createVercelMockObjects(req, res) {
  const mockReq = {
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    url: req.url,
  };

  const mockRes = {
    status: (code) => {
      const chain = {
        json: (data) => {
          res.status(code).json(data);
          return chain;
        },
        end: () => {
          res.status(code).end();
          return chain;
        },
        send: (data) => {
          res.status(code).send(data);
          return chain;
        },
      };
      return chain;
    },
    setHeader: (key, value) => {
      res.setHeader(key, value);
      return mockRes;
    },
    json: (data) => {
      res.json(data);
      return mockRes;
    },
  };

  return { mockReq, mockRes };
}

// Start server
async function startServer() {
  try {
    console.log('\n🔧 Starting local development server...\n');

    // API routes MUST be defined BEFORE Vite middleware
    // Health check endpoint
    app.get('/api/health', async (req, res) => {
      console.log('✅ Health check endpoint hit!');
      try {
        const { default: handler } = await import('./api/health/index.ts');
        const { mockReq, mockRes } = createVercelMockObjects(req, res);
        await handler(mockReq, mockRes);
      } catch (error) {
        console.error('❌ Error in /api/health:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
      }
    });

    // Main GHL API endpoint - handles all GHL operations
    app.all('/api/ghl', async (req, res) => {
      console.log('✅ GHL endpoint hit!', req.method);
      try {
        const { default: handler } = await import('./api/ghl/index.ts');
        const { mockReq, mockRes } = createVercelMockObjects(req, res);
        await handler(mockReq, mockRes);
      } catch (error) {
        console.error('❌ Error in /api/ghl:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
      }
    });

    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    // IMPORTANT: Add Vite middleware AFTER API routes
    // This ensures API routes are handled first
    app.use(vite.middlewares);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Local development server running!\n`);
      console.log(`   🌐 Frontend: http://localhost:${PORT}`);
      console.log(`   🔌 API: http://localhost:${PORT}/api`);
      console.log(`   ❤️  Health: http://localhost:${PORT}/api/health`);
      console.log(`   📊 GHL: http://localhost:${PORT}/api/ghl\n`);
      console.log(`📝 Environment variables loaded from .env\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
