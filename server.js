import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST && !process.env.HOST.includes(' ') ? process.env.HOST : '0.0.0.0';
const distPath = path.join(__dirname, 'dist');

// Middleware CORS Dinamis & Basic Security Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JSON Body Parser untuk API Sync
app.use(express.json({ limit: '10mb' }));

// ==============================================================
// LAPISAN LIVE-SERVER REAL-TIME: SERVER-SENT EVENTS (SSE)
// ==============================================================
let sseClients = [];
const serverStateStore = {};

// 1. Endpoint Stream SSE untuk seluruh klien publik yang terhubung
app.get('/api/live-events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*'
  });

  const clientId = 'sse_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const client = { id: clientId, res };
  sseClients.push(client);

  // Kirim sinyal selamat datang & hitungan koneksi aktif
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId, onlineCount: sseClients.length })}\n\n`);

  // Heartbeat berkala (25 detik) menjaga koneksi HTTP tidak terputus
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// 2. Endpoint Publikasi: Menerima pembaruan dari satu pengguna & menyebarkannya ke semua pengguna
app.post('/api/live-sync', (req, res) => {
  const { key, data, senderId } = req.body || {};
  if (!key) {
    return res.status(400).json({ error: 'Missing key' });
  }

  if (data !== undefined) {
    serverStateStore[key] = data;
  }

  const payload = JSON.stringify({
    type: 'sync',
    key,
    data,
    senderId,
    timestamp: Date.now()
  });

  // Siarkan ke seluruh klien SSE yang sedang terhubung
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {}
  });

  res.status(200).json({ success: true, activeClients: sseClients.length });
});

// 3. Endpoint Snapshot State Server
app.get('/api/live-state', (req, res) => {
  res.json({
    onlineCount: sseClients.length,
    state: serverStateStore,
    timestamp: Date.now()
  });
});

// Serve static files from the build directory
app.use(express.static(distPath, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Health check endpoint untuk load balancer / hosting health probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// SPA catch-all route: serve dist/index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send('Application is building. Please refresh in a few moments.');
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
