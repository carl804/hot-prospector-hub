// Standalone API server for local development
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

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

// Health check endpoint
app.get('/api/health', async (req, res) => {
  console.log('✅ Health check endpoint');
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
  console.log(`✅ GHL endpoint: ${req.method}`, req.body?.action || '');
  try {
    const { default: handler } = await import('./api/ghl/index.ts');
    const { mockReq, mockRes } = createVercelMockObjects(req, res);
    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('❌ Error in /api/ghl:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Activity logs endpoint
app.all('/api/activity/log', async (req, res) => {
  console.log(`✅ Activity log: ${req.method}`);
  try {
    const { default: handler } = await import('./api/activity/log.ts');
    const { mockReq, mockRes } = createVercelMockObjects(req, res);
    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('❌ Error in /api/activity/log:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 API Server running on http://localhost:${PORT}\n`);
  console.log(`   ❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`   📊 GHL: http://localhost:${PORT}/api/ghl\n`);
});
