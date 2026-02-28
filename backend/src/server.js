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
const adminRoutes = require('./routes/admin');

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
app.use('/api/admin', adminRoutes);

// ============================================
// Socket.io - Gestion des connexions temps réel avec authentification
// ============================================
const connectedUsers = new Map(); // socketId -> { userId, nom, prenom, role, entreprise, code, connectedAt, ip, lastActivity }
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Middleware d'authentification Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    // Allow anonymous connections (they just won't be tracked as users)
    socket.userData = null;
    return next();
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, require('./middleware/auth').JWT_SECRET);
    socket.userData = decoded;
    next();
  } catch (err) {
    socket.userData = null;
    next(); // Still allow connection, just not authenticated
  }
});

io.on('connection', (socket) => {
  const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  
  if (socket.userData) {
    const userInfo = {
      socketId: socket.id,
      userId: socket.userData.userId,
      nom: socket.userData.nom,
      prenom: socket.userData.prenom,
      role: socket.userData.role,
      entreprise: socket.userData.entreprise || '',
      code: socket.userData.code,
      connectedAt: new Date().toISOString(),
      ip: ip
    };
    userInfo.lastActivity = Date.now();
    connectedUsers.set(socket.id, userInfo);
    console.log(`🔌 Utilisateur connecté: ${userInfo.prenom} ${userInfo.nom} (${userInfo.role}) [${socket.id}]`);
    
    // Notify admins about new connection
    io.emit('admin:user-connected', userInfo);
    // Send current connected users count
    io.emit('admin:users-count', connectedUsers.size);
  } else {
    console.log(`🔌 Client anonyme connecté: ${socket.id}`);
  }

  // Handle user re-authentication (e.g. after login)
  socket.on('auth:register', (data) => {
    if (data?.token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(data.token, require('./middleware/auth').JWT_SECRET);
        socket.userData = decoded;
        const userInfo = {
          socketId: socket.id,
          userId: decoded.userId,
          nom: decoded.nom,
          prenom: decoded.prenom,
          role: decoded.role,
          entreprise: decoded.entreprise || '',
          code: decoded.code,
          connectedAt: new Date().toISOString(),
          ip: ip
        };
        userInfo.lastActivity = Date.now();
        connectedUsers.set(socket.id, userInfo);
        io.emit('admin:user-connected', userInfo);
        io.emit('admin:users-count', connectedUsers.size);
      } catch (err) {
        // Invalid token, ignore
      }
    }
  });

  // Handle user activity ping (reset inactivity timer)
  socket.on('user:activity', () => {
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      userInfo.lastActivity = Date.now();
    }
  });

  // Handle admin force-disconnect
  socket.on('admin:force-disconnect', (targetSocketId) => {
    if (!socket.userData || socket.userData.role !== 'system_admin') return;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit('admin:kicked', { message: 'Vous avez été déconnecté par l\'administrateur système.' });
      targetSocket.disconnect(true);
    }
  });

  socket.on('disconnect', () => {
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      console.log(`❌ Utilisateur déconnecté: ${userInfo.prenom} ${userInfo.nom} [${socket.id}]`);
      connectedUsers.delete(socket.id);
      io.emit('admin:user-disconnected', { socketId: socket.id, userId: userInfo.userId });
      io.emit('admin:users-count', connectedUsers.size);
    } else {
      console.log(`❌ Client anonyme déconnecté: ${socket.id}`);
    }
  });
});

// Expose connectedUsers map for admin routes
app.set('connectedUsers', connectedUsers);

// ============================================
// Vérification périodique d'inactivité (toutes les 60 secondes)
// ============================================
setInterval(() => {
  const now = Date.now();
  let disconnectedCount = 0;
  for (const [socketId, userInfo] of connectedUsers.entries()) {
    const inactiveDuration = now - (userInfo.lastActivity || now);
    if (inactiveDuration >= INACTIVITY_TIMEOUT) {
      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket) {
        console.log(`⏰ Auto-déconnexion pour inactivité: ${userInfo.prenom} ${userInfo.nom} (${Math.round(inactiveDuration / 60000)} min)`);
        targetSocket.emit('session:expired', { reason: 'inactivity', timeout: INACTIVITY_TIMEOUT });
        targetSocket.disconnect(true);
        disconnectedCount++;
      } else {
        // Socket no longer exists, clean up
        connectedUsers.delete(socketId);
      }
    }
  }
  if (disconnectedCount > 0) {
    io.emit('admin:users-count', connectedUsers.size);
  }
}, 60 * 1000); // Check every 60 seconds

// Servir le frontend (build) en production
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  // Route spéciale pour og.png - permet aux crawlers de récupérer l'image
  app.get('/og.png', (req, res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(path.join(frontendDist, 'og.png'));
  });
  
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
