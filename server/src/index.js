const path = require('path');
const http = require('http');
const crypto = require('crypto');

const express = require('express');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const app = express();
app.use(express.json());

const isProd = process.env.NODE_ENV === 'production';

// Serve the React production build from the same backend service.
// IMPORTANT: we add the SPA fallback AFTER API routes to avoid intercepting them.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (isProd) {
  app.use(express.static(clientDist));
}

// -----------------------------
// Message store (Mongo + fallback)
// -----------------------------
let store = null;
let connectedToMongo = false;

async function initStore() {
  const mongodbUri = process.env.MONGODB_URI;

  if (mongodbUri) {
    try {
      mongoose.set('strictQuery', true);
      await mongoose.connect(mongodbUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      connectedToMongo = true;

      const MessageSchema = new mongoose.Schema({
        text: { type: String, required: true, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      });

      // Prevent "Cannot overwrite model once compiled" if hot reload ever re-runs init.
      const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

      store = {
        async listMessages(limit) {
          const messages = await Message.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
          return messages.reverse();
        },
        async createMessage(text) {
          const msg = await Message.create({ text });
          return {
            id: msg._id.toString(),
            text: msg.text,
            createdAt: msg.createdAt,
          };
        },
      };

      return;
    } catch (err) {
      console.error('Mongo connection failed, using in-memory fallback:', err?.message || err);
    }
  }

  // Fallback store so you can run locally without Mongo
  const inMemory = [];
  store = {
    async listMessages(limit) {
      const messages = inMemory
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
      return messages.reverse();
    },
    async createMessage(text) {
      const msg = {
        id: crypto.randomUUID(),
        text,
        createdAt: new Date(),
      };
      inMemory.push(msg);
      return msg;
    },
  };
}

// REST endpoint: initial history
app.get('/api/messages', async (req, res) => {
  if (!store) return res.status(503).json({ error: 'Store not ready' });

  const parsed = parseInt(req.query.limit || '50', 10);
  const limit = Number.isFinite(parsed) ? Math.min(parsed, 200) : 50;

  const messages = await store.listMessages(limit);
  res.json(messages);
});

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// SPA fallback (only in production).
// Use middleware instead of `app.get('*')` to avoid Express route-pattern issues.
if (isProd) {
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api/')) return next();
    if (req.path === '/api/messages') return next();
    if (req.path.startsWith('/ws/')) return next();
    if (req.path === '/ws') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = http.createServer(app);

// WebSocket server mounted on the same HTTP server.
// Render exposes a single public port, so keep WS on the same service.
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastJSON(payload) {
  const payloadStr = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(payloadStr);
    }
  }
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'hello' }));

  ws.on('message', async (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (data.type !== 'chat') return;

    const text = (data.text || '').toString().trim();
    if (!text) return;
    if (text.length > 1000) return;

    const msg = await store.createMessage(text);
    broadcastJSON({ type: 'message', message: msg });
  });
});

const PORT = process.env.PORT || 10000;

(async () => {
  await initStore();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Listening on port ${PORT}. Mongo: ${connectedToMongo ? 'enabled' : 'fallback-in-memory'}.`
    );
  });
})();

