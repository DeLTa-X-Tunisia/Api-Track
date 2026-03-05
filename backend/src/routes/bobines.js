/**
 * Routes API pour la gestion des Bobines en Stock
 * Module Bobines - Api-Track V2
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireSupervisor } = require('../middleware/auth');
const { uploadsDir } = require('../config/upload');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// Configuration Multer pour photos bobines
// ============================================
const bobinesUploadsDir = path.join(uploadsDir, 'bobines');
if (!fs.existsSync(bobinesUploadsDir)) {
  fs.mkdirSync(bobinesUploadsDir, { recursive: true });
}

const bobineStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, bobinesUploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `bobine_${req.params.id}_${uniqueSuffix}${ext}`);
  }
});

const uploadBobinePhotos = multer({
  storage: bobineStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Type de fichier non autorisé. Images uniquement.'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Authentification sur toutes les routes
router.use(authenticateToken);

// Validation des données bobine
const bobineValidation = [
  body('numero').notEmpty().withMessage('Le code bobine est requis'),
  body('epaisseur').isFloat({ min: 0 }).withMessage("L'épaisseur doit être un nombre positif")
];

// ============================================
// ROUTES BOBINES
// ============================================

/**
 * GET /api/bobines/ref/grades - Liste des grades (nuances acier)
 */
router.get('/ref/grades', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM grades WHERE actif = TRUE ORDER BY norme, code');
    res.json(rows);
  } catch (error) {
    console.error('Erreur GET /bobines/ref/grades:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des grades' });
  }
});

/**
 * GET /api/bobines - Liste toutes les bobines
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*,
             (SELECT COUNT(*) FROM bobine_photos bp WHERE bp.bobine_id = b.id) as nombre_photos
      FROM bobines b
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur GET /bobines:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des bobines' });
  }
});

/**
 * GET /api/bobines/stats - Statistiques des bobines
 */
router.get('/stats', async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT 
        CAST(COUNT(*) AS UNSIGNED) as total,
        CAST(SUM(statut = 'en_stock') AS UNSIGNED) as en_stock,
        CAST(SUM(statut = 'en_cours') AS UNSIGNED) as en_cours,
        CAST(SUM(statut = 'epuisee') AS UNSIGNED) as epuisees,
        COALESCE(SUM(poids), 0) as poids_total
      FROM bobines
    `);
    res.json(stats);
  } catch (error) {
    console.error('Erreur GET /bobines/stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

/**
 * GET /api/bobines/:id - Détail d'une bobine
 */
router.get('/:id', async (req, res) => {
  try {
    const [bobines] = await pool.query('SELECT * FROM bobines WHERE id = ?', [req.params.id]);
    if (bobines.length === 0) {
      return res.status(404).json({ error: 'Bobine non trouvée' });
    }
    res.json(bobines[0]);
  } catch (error) {
    console.error('Erreur GET /bobines/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la bobine' });
  }
});

/**
 * POST /api/bobines - Créer une bobine
 */
router.post('/', requireSupervisor, bobineValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { numero, norme, grade, epaisseur, largeur, poids, fournisseur, date_reception, notes } = req.body;
    const created_by = req.user?.userId || null;
    const createur_nom = req.user?.nom || null;
    const createur_prenom = req.user?.prenom || null;

    const [result] = await pool.query(
      `INSERT INTO bobines 
       (numero, norme, grade, epaisseur, largeur, poids, fournisseur, date_reception, notes, created_by, createur_nom, createur_prenom, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_stock')`,
      [numero, norme || 'API 5L', grade || null, epaisseur, largeur || null, poids || null, fournisseur || null, date_reception || null, notes || null, created_by, createur_nom, createur_prenom]
    );

    const [newBobine] = await pool.query('SELECT * FROM bobines WHERE id = ?', [result.insertId]);
    res.status(201).json(newBobine[0]);
  } catch (error) {
    console.error('Erreur POST /bobines:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ce code bobine existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la création de la bobine' });
  }
});

/**
 * PUT /api/bobines/:id - Modifier une bobine
 */
router.put('/:id', requireSupervisor, bobineValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { numero, norme, grade, epaisseur, largeur, poids, fournisseur, date_reception, notes } = req.body;
    const updated_by = req.user?.userId || null;
    const modificateur_nom = req.user?.nom || null;
    const modificateur_prenom = req.user?.prenom || null;

    const [result] = await pool.query(
      `UPDATE bobines SET
       numero = ?, norme = ?, grade = ?,
       epaisseur = ?, largeur = ?, poids = ?, fournisseur = ?,
       date_reception = ?, notes = ?, updated_by = ?,
       modificateur_nom = ?, modificateur_prenom = ?
       WHERE id = ?`,
      [numero, norme || 'API 5L', grade || null, epaisseur, largeur || null, poids || null, fournisseur || null, date_reception || null, notes || null, updated_by, modificateur_nom, modificateur_prenom, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bobine non trouvée' });
    }

    const [updatedBobine] = await pool.query('SELECT * FROM bobines WHERE id = ?', [id]);
    res.json(updatedBobine[0]);
  } catch (error) {
    console.error('Erreur PUT /bobines/:id:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ce code bobine existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la modification de la bobine' });
  }
});

/**
 * DELETE /api/bobines/:id - Supprimer une bobine
 * ⚠️ Interdit si la bobine est en production ou épuisée (traçabilité)
 */
router.delete('/:id', requireSupervisor, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier le statut de la bobine avant suppression
    const [bobine] = await pool.query('SELECT numero, statut FROM bobines WHERE id = ?', [id]);
    if (bobine.length === 0) {
      return res.status(404).json({ error: 'Bobine non trouvée' });
    }

    const { numero, statut } = bobine[0];

    // Bloquer la suppression si en production ou épuisée
    if (statut === 'en_cours') {
      return res.status(403).json({ 
        error: `Suppression interdite : la bobine ${numero} est actuellement en production`,
        code: 'BOBINE_EN_PRODUCTION'
      });
    }

    if (statut === 'epuisee') {
      return res.status(403).json({ 
        error: `Suppression interdite : la bobine ${numero} est épuisée et fait partie de l'historique de production`,
        code: 'BOBINE_EPUISEE'
      });
    }

    // Supprimer les photos physiques
    const [photos] = await pool.query('SELECT filename FROM bobine_photos WHERE bobine_id = ?', [id]);
    photos.forEach(p => {
      const filePath = path.join(bobinesUploadsDir, p.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    const [result] = await pool.query('DELETE FROM bobines WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bobine non trouvée' });
    }

    res.json({ message: 'Bobine supprimée avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /bobines/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la bobine' });
  }
});

/**
 * PUT /api/bobines/:id/statut - Changer le statut d'une bobine
 */
router.put('/:id/statut', requireSupervisor, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['en_stock', 'en_cours', 'epuisee'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const [result] = await pool.query(
      'UPDATE bobines SET statut = ?, updated_by = ? WHERE id = ?',
      [statut, req.user?.userId || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bobine non trouvée' });
    }

    res.json({ message: 'Statut mis à jour', statut });
  } catch (error) {
    console.error('Erreur PUT /bobines/:id/statut:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

// ============================================
// ROUTES PHOTOS
// ============================================

/**
 * GET /api/bobines/:id/photos - Liste des photos d'une bobine
 */
router.get('/:id/photos', async (req, res) => {
  try {
    const [photos] = await pool.query(`
      SELECT bp.*, u.nom as uploader_nom, u.prenom as uploader_prenom
      FROM bobine_photos bp
      LEFT JOIN users u ON bp.uploaded_by = u.id
      WHERE bp.bobine_id = ?
      ORDER BY bp.created_at DESC
    `, [req.params.id]);
    res.json(photos);
  } catch (error) {
    console.error('Erreur GET /bobines/:id/photos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des photos' });
  }
});

/**
 * POST /api/bobines/:id/photos - Upload de photos (max 5)
 */
router.post('/:id/photos', requireSupervisor, uploadBobinePhotos.array('photos', 5), async (req, res) => {
  try {
    const bobineId = req.params.id;
    const uploaded_by = req.user?.userId || null;

    // Vérifier que la bobine existe
    const [bobine] = await pool.query('SELECT id FROM bobines WHERE id = ?', [bobineId]);
    if (bobine.length === 0) {
      if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
      return res.status(404).json({ error: 'Bobine non trouvée' });
    }

    // Vérifier le nombre total de photos (max 5)
    const [existing] = await pool.query('SELECT COUNT(*) as count FROM bobine_photos WHERE bobine_id = ?', [bobineId]);
    const currentCount = existing[0].count;
    const newCount = req.files ? req.files.length : 0;

    if (currentCount + newCount > 5) {
      if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
      return res.status(400).json({ error: `Maximum 5 photos par bobine. Actuellement: ${currentCount}, tentative d'ajout: ${newCount}` });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const insertedPhotos = [];
    for (const file of req.files) {
      const [result] = await pool.query(
        `INSERT INTO bobine_photos (bobine_id, filename, original_name, mimetype, size, path, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bobineId, file.filename, file.originalname, file.mimetype, file.size, `/uploads/bobines/${file.filename}`, uploaded_by]
      );
      insertedPhotos.push({ id: result.insertId, filename: file.filename, original_name: file.originalname, path: `/uploads/bobines/${file.filename}` });
    }

    res.status(201).json({ message: `${insertedPhotos.length} photo(s) uploadée(s) avec succès`, photos: insertedPhotos });
  } catch (error) {
    console.error('Erreur POST /bobines/:id/photos:', error);
    if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
    res.status(500).json({ error: "Erreur lors de l'upload des photos" });
  }
});

/**
 * DELETE /api/bobines/:id/photos/:photoId - Supprimer une photo
 */
router.delete('/:id/photos/:photoId', requireSupervisor, async (req, res) => {
  try {
    const { id, photoId } = req.params;

    const [photos] = await pool.query('SELECT * FROM bobine_photos WHERE id = ? AND bobine_id = ?', [photoId, id]);
    if (photos.length === 0) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    const photo = photos[0];
    const filePath = path.join(bobinesUploadsDir, photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM bobine_photos WHERE id = ?', [photoId]);
    res.json({ message: 'Photo supprimée avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /bobines/:id/photos/:photoId:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la photo' });
  }
});

// ============================================
// ROUTES FOURNISSEURS
// ============================================

/**
 * GET /api/bobines/fournisseurs - Liste des fournisseurs
 */
router.get('/ref/fournisseurs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM fournisseurs WHERE actif = TRUE ORDER BY nom');
    res.json(rows);
  } catch (error) {
    console.error('Erreur GET /bobines/ref/fournisseurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fournisseurs' });
  }
});

/**
 * POST /api/bobines/fournisseurs - Créer un fournisseur
 */
router.post('/ref/fournisseurs', requireSupervisor, async (req, res) => {
  try {
    const { nom } = req.body;
    if (!nom || !nom.trim()) {
      return res.status(400).json({ error: 'Le nom du fournisseur est requis' });
    }

    const [result] = await pool.query('INSERT INTO fournisseurs (nom) VALUES (?)', [nom.trim()]);
    res.status(201).json({ id: result.insertId, nom: nom.trim() });
  } catch (error) {
    console.error('Erreur POST /bobines/ref/fournisseurs:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ce fournisseur existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la création du fournisseur' });
  }
});

/**
 * DELETE /api/bobines/fournisseurs/:id - Supprimer un fournisseur
 */
router.delete('/ref/fournisseurs/:id', requireSupervisor, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM fournisseurs WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }
    res.json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /bobines/ref/fournisseurs/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du fournisseur' });
  }
});

module.exports = router;
