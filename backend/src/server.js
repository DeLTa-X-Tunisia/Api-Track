require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

// Import des routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/users');
const bobinesRoutes = require('./routes/bobines');
const presetsRoutes = require('./routes/presets');
const equipesRoutes = require('./routes/equipes');
const lotsRoutes = require('./routes/lots');
const tubesRoutes = require('./routes/tubes');
const settingsRoutes = require('./routes/settings');
const reportsRoutes = require('./routes/reports');

// Import du middleware d'authentification
const { authenticateToken } = require('./middleware/auth');

const PORT = parseInt(process.env.PORT || '3003', 10);
const app = express();
const server = http.createServer(app);

// Configuration Socket.io
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5174', 'http://localhost:3003'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// Sécurité HTTP headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any origin in development mode
    if (process.env.NODE_ENV === 'development') return callback(null, true);
    // Allow local network origins (for mobile WebView)
    if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01]))/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('CORS non autorisé'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_API || '1000'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans quelques minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH || '20'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Servir les fichiers uploadés - protégés par auth
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, '../uploads')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Route de téléchargement APK mobile (publique)
app.get('/api/mobile/download', (req, res) => {
  const apkPath = path.join(__dirname, '../../app_down/app-release.apk');
  if (!fs.existsSync(apkPath)) {
    return res.status(404).json({ error: 'APK non disponible' });
  }
  const stat = fs.statSync(apkPath);
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="LogiTrack-V2.apk"');
  res.setHeader('Content-Length', stat.size);
  const stream = fs.createReadStream(apkPath);
  stream.pipe(res);
});

// Info APK mobile (publique)
app.get('/api/mobile/info', (req, res) => {
  const apkPath = path.join(__dirname, '../../app_down/app-release.apk');
  if (!fs.existsSync(apkPath)) {
    return res.json({ available: false });
  }
  const stat = fs.statSync(apkPath);
  res.json({
    available: true,
    fileName: 'LogiTrack-V2.apk',
    size: stat.size,
    sizeFormatted: (stat.size / (1024 * 1024)).toFixed(1) + ' MB',
    lastModified: stat.mtime.toISOString(),
    version: '2.1.0'
  });
});

// Route de santé (publique)
app.get('/api/health', async (req, res) => {
  let dbOk = false;
  try {
    const pool = require('./config/database');
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    dbOk = true;
  } catch (e) { /* DB down */ }

  const status = dbOk ? 'OK' : 'DEGRADED';
  res.status(dbOk ? 200 : 503).json({ 
    status, 
    message: 'Logi-Track V2 API is running',
    version: '2.0.0',
    database: dbOk ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Routes d'authentification (publiques)
app.use('/api/auth', authRoutes);

// Routes API protégées
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bobines', bobinesRoutes);
app.use('/api/presets', presetsRoutes);
app.use('/api/equipes', equipesRoutes);
app.use('/api/lots', lotsRoutes);
app.use('/api/tubes', tubesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);

// Socket.io - Gestion des connexions temps réel
io.on('connection', (socket) => {
  console.log(`🔌 Client connecté: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`❌ Client déconnecté: ${socket.id}`);
  });
});

// Servir le frontend (build) en production
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return res.status(404).json({ error: 'Route non trouvée' });
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
  });
}

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err.stack);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Démarrage du serveur
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║           🏭  LOGI-TRACK V2 API SERVER  🏭                    ║');
  console.log('║                                                               ║');
  console.log(`║   🚀 http://localhost:${PORT}                                  ║`);
  console.log('║   🔌 Socket.io activé pour notifications temps réel           ║');
  if (fs.existsSync(frontendDist)) {
    console.log('║   📦 Frontend servi depuis /frontend/dist                     ║');
  }
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = { app, io, server };
