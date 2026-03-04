const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireSystemAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// PUBLIC ROUTES - Maintenance (No auth required)
// ============================================

/**
 * GET /api/settings/maintenance/status - Check maintenance mode (public)
 */
router.get('/maintenance/status', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM project_settings WHERE setting_key IN ('maintenance_mode', 'maintenance_message')"
    );
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    
    const isActive = settings.maintenance_mode === 'true';
    res.json({
      maintenance: isActive,
      message: isActive ? (settings.maintenance_message || 'Maintenance en cours...') : null
    });
  } catch (error) {
    console.error('Erreur GET maintenance status:', error);
    res.json({ maintenance: false, message: null });
  }
});

/**
 * GET /api/mobile/version - Check mobile app version (public, for OTA updates)
 * Returns version info for the mobile app to check for updates
 */
router.get('/mobile/version', async (req, res) => {
  try {
    // Read mobile version from project_settings or return default
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM project_settings WHERE setting_key LIKE 'mobile_%'"
    );
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    
    res.json({
      versionCode: parseInt(settings.mobile_version_code) || 4,
      versionName: settings.mobile_version_name || '2.9.0',
      downloadUrl: settings.mobile_download_url || '',
      releaseNotes: settings.mobile_release_notes || 'Nouvelles fonctionnalités et corrections de bugs.',
      mandatory: settings.mobile_mandatory_update === 'true'
    });
  } catch (error) {
    console.error('Erreur GET mobile version:', error);
    res.json({ 
      versionCode: 4, 
      versionName: '2.9.0',
      downloadUrl: '',
      releaseNotes: '',
      mandatory: false
    });
  }
});

// ============================================
// MIDDLEWARE AUTH (all routes below require auth)
// ============================================
router.use(authenticateToken);

// Middleware admin uniquement
const requireAdmin = (req, res, next) => {
  if (!['system_admin', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ============================================
// UPLOAD CONFIG - Logos
// ============================================
const logosDir = path.join(__dirname, '../../uploads/logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const uploadLogo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, logosDir),
    filename: (req, file, cb) => {
      const type = req.params.type || 'logo';
      const ext = path.extname(file.originalname);
      cb(null, `${type}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont autorisées'), false);
  }
});

// ============================================
// INIT TABLE - Auto-create if not exists
// ============================================
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        setting_type ENUM('text', 'textarea', 'image', 'date', 'number') DEFAULT 'text',
        category VARCHAR(50) DEFAULT 'project',
        label VARCHAR(200),
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Ensure required keys exist (INSERT IGNORE won't duplicate)
    const required = [
      ['enterprise_logo', '', 'image', 'project', 'Logo Entreprise', 1],
      ['client_logo', '', 'image', 'project', 'Logo Client', 2],
      ['client_name', '', 'text', 'project', 'Nom du Client', 3],
      ['client_address', '', 'text', 'project', 'Adresse du Client', 4],
      ['project_name', '', 'text', 'project', 'Nom du Projet', 5],
      ['project_code', '', 'text', 'project', 'Code du Projet', 6],
      ['project_address', '', 'text', 'project', 'Adresse du Projet', 7],
      ['maintenance_mode', 'false', 'text', 'system', 'Mode Maintenance', 100],
      ['maintenance_message', 'Api-Track est actuellement en maintenance. Nous serons de retour très bientôt !', 'textarea', 'system', 'Message Maintenance', 101],
    ];
    for (const [key, value, type, category, label, order] of required) {
      await pool.query(
        'INSERT IGNORE INTO project_settings (setting_key, setting_value, setting_type, category, label, display_order) VALUES (?, ?, ?, ?, ?, ?)',
        [key, value, type, category, label, order]
      );
    }
    console.log('✅ Project settings table ready');
  } catch (err) {
    console.error('⚠️ Error initializing project_settings table:', err.message);
  }
})();

// ============================================
// GET /api/settings - Get all settings
// ============================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM project_settings ORDER BY category, display_order'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erreur GET settings:', error);
    res.status(500).json({ error: 'Erreur récupération paramètres' });
  }
});

// ============================================
// GET /api/settings/by-category/:category
// ============================================
router.get('/by-category/:category', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM project_settings WHERE category = ? ORDER BY display_order',
      [req.params.category]
    );
    res.json(rows);
  } catch (error) {
    console.error('Erreur GET settings by category:', error);
    res.status(500).json({ error: 'Erreur récupération paramètres' });
  }
});

// ============================================
// PUT /api/settings/bulk - Update multiple settings at once
// ============================================
router.put('/bulk', requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body; // Array of { key, value }
    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Format invalide' });
    }

    for (const { key, value } of settings) {
      await pool.query(
        'UPDATE project_settings SET setting_value = ? WHERE setting_key = ?',
        [value || '', key]
      );
    }

    const [rows] = await pool.query(
      'SELECT * FROM project_settings ORDER BY category, display_order'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erreur PUT settings/bulk:', error);
    res.status(500).json({ error: 'Erreur mise à jour paramètres' });
  }
});

// ============================================
// PUT /api/settings/:key - Update single setting
// ============================================
router.put('/:key', requireAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    const [result] = await pool.query(
      'UPDATE project_settings SET setting_value = ? WHERE setting_key = ?',
      [value || '', req.params.key]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paramètre non trouvé' });
    }
    const [rows] = await pool.query(
      'SELECT * FROM project_settings WHERE setting_key = ?',
      [req.params.key]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur PUT settings:', error);
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

// ============================================
// POST /api/settings/upload-logo/:type - Upload logo (enterprise or client)
// ============================================
router.post('/upload-logo/:type', requireAdmin, uploadLogo.single('logo'), async (req, res) => {
  try {
    const { type } = req.params; // 'enterprise_logo' or 'client_logo'
    if (!['enterprise_logo', 'client_logo'].includes(type)) {
      return res.status(400).json({ error: 'Type de logo invalide' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }

    const logoPath = `/uploads/logos/${req.file.filename}`;

    // Delete old logo file if exists
    const [oldSetting] = await pool.query(
      'SELECT setting_value FROM project_settings WHERE setting_key = ?', [type]
    );
    if (oldSetting.length > 0 && oldSetting[0].setting_value) {
      const oldFile = path.join(__dirname, '../../', oldSetting[0].setting_value);
      if (fs.existsSync(oldFile)) {
        try { fs.unlinkSync(oldFile); } catch {}
      }
    }

    // Update setting
    await pool.query(
      'UPDATE project_settings SET setting_value = ? WHERE setting_key = ?',
      [logoPath, type]
    );

    res.json({ path: logoPath, message: 'Logo uploadé avec succès' });
  } catch (error) {
    console.error('Erreur upload logo:', error);
    res.status(500).json({ error: 'Erreur upload logo' });
  }
});

// ============================================
// DELETE /api/settings/delete-logo/:type - Remove logo
// ============================================
router.delete('/delete-logo/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    if (!['enterprise_logo', 'client_logo'].includes(type)) {
      return res.status(400).json({ error: 'Type de logo invalide' });
    }

    const [setting] = await pool.query(
      'SELECT setting_value FROM project_settings WHERE setting_key = ?', [type]
    );
    if (setting.length > 0 && setting[0].setting_value) {
      const filePath = path.join(__dirname, '../../', setting[0].setting_value);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }

    await pool.query(
      "UPDATE project_settings SET setting_value = '' WHERE setting_key = ?", [type]
    );

    res.json({ message: 'Logo supprimé' });
  } catch (error) {
    console.error('Erreur delete logo:', error);
    res.status(500).json({ error: 'Erreur suppression logo' });
  }
});

// ============================================
// MAINTENANCE MODE - System Admin Only
// ============================================

/**
 * PUT /api/settings/maintenance/toggle - Toggle maintenance mode (system_admin only)
 */
router.put('/maintenance/toggle', requireSystemAdmin, async (req, res) => {
  try {
    const { enabled, message } = req.body;
    
    // Update maintenance_mode
    await pool.query(
      "UPDATE project_settings SET setting_value = ? WHERE setting_key = 'maintenance_mode'",
      [enabled ? 'true' : 'false']
    );
    
    // Update message if provided
    if (message !== undefined) {
      await pool.query(
        "UPDATE project_settings SET setting_value = ? WHERE setting_key = 'maintenance_message'",
        [message]
      );
    }
    
    console.log(`[ADMIN] ${req.user.nom} ${req.user.prenom} a ${enabled ? 'activé' : 'désactivé'} le mode maintenance`);
    
    res.json({ 
      success: true, 
      maintenance: enabled,
      message: enabled ? message : null 
    });
  } catch (error) {
    console.error('Erreur toggle maintenance:', error);
    res.status(500).json({ error: 'Erreur changement mode maintenance' });
  }
});

/**
 * GET /api/settings/maintenance - Get maintenance settings (system_admin only)
 */
router.get('/maintenance', requireSystemAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM project_settings WHERE setting_key IN ('maintenance_mode', 'maintenance_message')"
    );
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    
    res.json({
      enabled: settings.maintenance_mode === 'true',
      message: settings.maintenance_message || ''
    });
  } catch (error) {
    console.error('Erreur GET maintenance settings:', error);
    res.status(500).json({ error: 'Erreur récupération paramètres maintenance' });
  }
});

module.exports = router;
