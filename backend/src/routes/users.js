/**
 * Routes de gestion des utilisateurs — Api-Track V2
 * CRUD complet, statistiques, gestion des entreprises, régénération de code
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireSystemAdmin, requireAdmin } = require('../middleware/auth');

// ============================================
// Helpers
// ============================================

/**
 * Génère un code unique à 6 chiffres
 */
async function generateUniqueCode() {
  let code;
  let exists = true;
  while (exists) {
    code = String(Math.floor(100000 + Math.random() * 900000));
    const [rows] = await pool.query('SELECT id FROM users WHERE code = ?', [code]);
    exists = rows.length > 0;
  }
  return code;
}

/**
 * Génère un matricule au format LT2-YYYY-NNNN
 */
async function generateMatricule() {
  const year = new Date().getFullYear();
  const prefix = `LT2-${year}-`;

  const [rows] = await pool.query(
    'SELECT matricule FROM users WHERE matricule LIKE ? ORDER BY matricule DESC LIMIT 1',
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const lastNum = parseInt(rows[0].matricule.split('-').pop(), 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

// ============================================
// Statistiques
// ============================================

/**
 * GET /api/users/stats - Statistiques des utilisateurs
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        CAST(COUNT(*) AS UNSIGNED) as total,
        CAST(SUM(actif = 1) AS UNSIGNED) as actifs,
        CAST(SUM(actif = 0) AS UNSIGNED) as inactifs,
        CAST(SUM(role = 'system_admin') AS UNSIGNED) as system_admins,
        CAST(SUM(role = 'admin') AS UNSIGNED) as admins,
        CAST(SUM(role = 'superviseur') AS UNSIGNED) as superviseurs,
        CAST(SUM(role = 'consultant') AS UNSIGNED) as consultants
      FROM users
    `);

    const [byEntreprise] = await pool.query(`
      SELECT 
        u.entreprise,
        e.nom as entreprise_nom,
        COUNT(*) as count
      FROM users u
      LEFT JOIN entreprises e ON u.entreprise = e.code
      GROUP BY u.entreprise, e.nom
      ORDER BY count DESC
    `);

    res.json({ ...stats, byEntreprise });
  } catch (error) {
    console.error('Erreur GET /users/stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// Entreprises CRUD
// ============================================

/**
 * GET /api/users/entreprises - Liste des entreprises
 */
router.get('/entreprises', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM entreprises WHERE actif = 1 ORDER BY nom ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erreur GET /users/entreprises:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/users/entreprises - Ajouter une entreprise
 */
router.post('/entreprises', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { code, nom } = req.body;
    if (!code?.trim() || !nom?.trim()) {
      return res.status(400).json({ error: 'Code et nom requis' });
    }

    const cleanCode = code.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanNom = nom.trim();

    // Vérifier l'unicité
    const [existing] = await pool.query(
      'SELECT id FROM entreprises WHERE code = ?',
      [cleanCode]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ce code d\'entreprise existe déjà' });
    }

    const [result] = await pool.query(
      'INSERT INTO entreprises (code, nom) VALUES (?, ?)',
      [cleanCode, cleanNom]
    );

    res.status(201).json({ id: result.insertId, code: cleanCode, nom: cleanNom });
  } catch (error) {
    console.error('Erreur POST /users/entreprises:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/users/entreprises/:id - Supprimer une entreprise
 */
router.delete('/entreprises/:id', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier qu'aucun utilisateur n'utilise cette entreprise
    const [entreprise] = await pool.query('SELECT code FROM entreprises WHERE id = ?', [id]);
    if (entreprise.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const [usersUsingIt] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE entreprise = ?',
      [entreprise[0].code]
    );

    if (usersUsingIt[0].count > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer : ${usersUsingIt[0].count} utilisateur(s) rattaché(s)` 
      });
    }

    await pool.query('DELETE FROM entreprises WHERE id = ?', [id]);
    res.json({ message: 'Entreprise supprimée' });
  } catch (error) {
    console.error('Erreur DELETE /users/entreprises/:id:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// Utilisateurs CRUD
// ============================================

/**
 * GET /api/users - Liste des utilisateurs (avec recherche/filtres)
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, entreprise, role, actif } = req.query;

    let query = `
      SELECT 
        u.*,
        e.nom as entreprise_nom
      FROM users u
      LEFT JOIN entreprises e ON u.entreprise = e.code
      WHERE 1=1
    `;
    const params = [];

    // Filtre recherche texte
    if (search) {
      query += ` AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.code LIKE ? OR u.matricule LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    // Filtre entreprise
    if (entreprise) {
      query += ` AND u.entreprise = ?`;
      params.push(entreprise);
    }

    // Filtre rôle
    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    // Filtre statut
    if (actif !== undefined && actif !== '') {
      query += ` AND u.actif = ?`;
      params.push(actif === 'true' || actif === '1' ? 1 : 0);
    }

    // Protection : un admin ne voit pas les system_admin (seul system_admin les voit)
    // Ce filtrage est fait côté requêteur
    query += ` ORDER BY u.created_at DESC`;

    const [users] = await pool.query(query, params);
    res.json(users);
  } catch (error) {
    console.error('Erreur GET /users:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/users/:id - Détail d'un utilisateur
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.*, e.nom as entreprise_nom
      FROM users u
      LEFT JOIN entreprises e ON u.entreprise = e.code
      WHERE u.id = ?
    `, [req.params.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erreur GET /users/:id:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/users - Créer un nouvel utilisateur
 */
router.post('/', [
  authenticateToken,
  requireSystemAdmin,
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { nom, prenom, entreprise, role } = req.body;

    // Générer code unique et matricule
    const code = await generateUniqueCode();
    const matricule = await generateMatricule();

    // Valider le rôle
    const validRoles = ['system_admin', 'admin', 'superviseur', 'consultant'];
    const finalRole = validRoles.includes(role) ? role : 'consultant';

    const [result] = await pool.query(`
      INSERT INTO users (code, matricule, nom, prenom, entreprise, role, actif, created_at)
      VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW())
    `, [code, matricule, nom, prenom, entreprise || 'danieli', finalRole]);

    // Récupérer le compte créé
    const [newUser] = await pool.query(
      `SELECT u.*, e.nom as entreprise_nom 
       FROM users u 
       LEFT JOIN entreprises e ON u.entreprise = e.code 
       WHERE u.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: newUser[0],
      codeConnexion: code
    });
  } catch (error) {
    console.error('Erreur POST /users:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
  }
});

/**
 * PUT /api/users/:id - Modifier un utilisateur
 */
router.put('/:id', [
  authenticateToken,
  requireSystemAdmin,
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { nom, prenom, entreprise, role, actif } = req.body;

    // Vérifier que l'utilisateur existe
    const [existing] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Un admin ne peut pas modifier un system_admin
    if (existing[0].role === 'system_admin' && req.user.role !== 'system_admin') {
      return res.status(403).json({ error: 'Impossible de modifier un Admin Système' });
    }

    const validRoles = ['system_admin', 'admin', 'superviseur', 'consultant'];
    const finalRole = validRoles.includes(role) ? role : existing[0].role;

    await pool.query(`
      UPDATE users SET
        nom = ?,
        prenom = ?,
        entreprise = ?,
        role = ?,
        actif = ?
      WHERE id = ?
    `, [nom, prenom, entreprise || 'danieli', finalRole, actif !== undefined ? actif : true, id]);

    // Récupérer l'utilisateur mis à jour
    const [updated] = await pool.query(
      `SELECT u.*, e.nom as entreprise_nom 
       FROM users u 
       LEFT JOIN entreprises e ON u.entreprise = e.code 
       WHERE u.id = ?`,
      [id]
    );

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updated[0]
    });
  } catch (error) {
    console.error('Erreur PUT /users/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

/**
 * PUT /api/users/:id/role - Changer le rôle d'un utilisateur
 */
router.put('/:id/role', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['system_admin', 'admin', 'superviseur', 'consultant'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    // Vérifier que l'utilisateur existe
    const [existing] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    const roleLabels = {
      system_admin: 'Admin Système',
      admin: 'Administrateur',
      superviseur: 'Superviseur',
      consultant: 'Consultant'
    };

    res.json({ message: `Rôle changé en ${roleLabels[role]}` });
  } catch (error) {
    console.error('Erreur PUT /users/:id/role:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/users/:id/regenerate-code - Régénérer le code de connexion
 */
router.put('/:id/regenerate-code', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const newCode = await generateUniqueCode();

    const [result] = await pool.query(
      'UPDATE users SET code = ? WHERE id = ?',
      [newCode, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Code de connexion régénéré',
      nouveauCode: newCode
    });
  } catch (error) {
    console.error('Erreur PUT /users/:id/regenerate-code:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/users/:id - Supprimer un utilisateur (soft delete ou permanent)
 */
router.delete('/:id', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    // Vérifier que l'utilisateur existe
    const [existing] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher la suppression de soi-même
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    }

    if (permanent === 'true') {
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      res.json({ message: 'Utilisateur supprimé définitivement' });
    } else {
      await pool.query('UPDATE users SET actif = FALSE WHERE id = ?', [id]);
      res.json({ message: 'Utilisateur désactivé' });
    }
  } catch (error) {
    console.error('Erreur DELETE /users/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

/**
 * PUT /api/users/:id/activate - Réactiver un utilisateur
 */
router.put('/:id/activate', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'UPDATE users SET actif = TRUE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur réactivé' });
  } catch (error) {
    console.error('Erreur PUT /users/:id/activate:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
