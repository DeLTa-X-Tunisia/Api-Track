const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'logitrack2_secret_key_change_in_production_2026';

/**
 * Middleware pour vérifier le token JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN
    || req.query.token; // Support token via query param (pour <img src>, PDF, etc.)

  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'authentification requis',
      code: 'TOKEN_REQUIRED'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Session expirée, veuillez vous reconnecter',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({ 
        error: 'Token invalide',
        code: 'TOKEN_INVALID'
      });
    }

    req.user = decoded;
    next();
  });
};

/**
 * Middleware pour vérifier le rôle
 * Hiérarchie : system_admin > admin > superviseur > consultant
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Accès non autorisé pour ce rôle',
        code: 'FORBIDDEN'
      });
    }
    next();
  };
};

const requireSystemAdmin = requireRole('system_admin');
const requireAdmin = requireRole('system_admin', 'admin');
const requireSupervisor = requireRole('system_admin', 'admin', 'superviseur');

module.exports = { 
  authenticateToken, 
  requireRole, 
  requireSystemAdmin,
  requireAdmin, 
  requireSupervisor,
  JWT_SECRET
};
