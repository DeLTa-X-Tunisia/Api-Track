/**
 * Routes API — Équipes de Production
 * CRUD: qualifications, zones, personnel, équipes
 * Api-Track V2
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// ════════════════════════════════════════════════════════
// QUALIFICATIONS
// ════════════════════════════════════════════════════════

router.get('/qualifications', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM qualifications ORDER BY nom ASC');
      res.json(rows);
    } finally { conn.release(); }
  } catch (e) {
    console.error('Erreur qualifications:', e);
    res.status(500).json({ error: 'Erreur récupération qualifications' });
  }
});

router.post('/qualifications', requireAdmin, [
  body('nom').trim().notEmpty().withMessage('Le nom est requis')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query('INSERT INTO qualifications (nom) VALUES (?)', [req.body.nom.trim()]);
      const [rows] = await conn.query('SELECT * FROM qualifications WHERE id = ?', [result.insertId]);
      res.status(201).json(rows[0]);
    } finally { conn.release(); }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Cette qualification existe déjà' });
    res.status(500).json({ error: 'Erreur création qualification' });
  }
});

router.put('/qualifications/:id', requireAdmin, [
  body('nom').trim().notEmpty().withMessage('Le nom est requis')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('UPDATE qualifications SET nom = ? WHERE id = ?', [req.body.nom.trim(), req.params.id]);
      const [rows] = await conn.query('SELECT * FROM qualifications WHERE id = ?', [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Qualification non trouvée' });
      res.json(rows[0]);
    } finally { conn.release(); }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Cette qualification existe déjà' });
    res.status(500).json({ error: 'Erreur modification qualification' });
  }
});

router.delete('/qualifications/:id', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      // Soft delete: toggle actif
      const [existing] = await conn.query('SELECT * FROM qualifications WHERE id = ?', [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: 'Qualification non trouvée' });
      const newActif = existing[0].actif ? 0 : 1;
      await conn.query('UPDATE qualifications SET actif = ? WHERE id = ?', [newActif, req.params.id]);
      res.json({ message: newActif ? 'Qualification réactivée' : 'Qualification désactivée' });
    } finally { conn.release(); }
  } catch (e) {
    res.status(500).json({ error: 'Erreur suppression qualification' });
  }
});

// ════════════════════════════════════════════════════════
// ZONES DE TRAVAIL
// ════════════════════════════════════════════════════════

router.get('/zones', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT z.*, 
          (SELECT COUNT(DISTINCT em.equipe_id) FROM equipe_membres em 
           JOIN equipes_production e ON e.id = em.equipe_id AND e.actif = 1 
           WHERE em.zone_id = z.id) as nb_equipes
        FROM zones_travail z ORDER BY z.nom ASC
      `);
      res.json(rows);
    } finally { conn.release(); }
  } catch (e) {
    res.status(500).json({ error: 'Erreur récupération zones' });
  }
});

router.post('/zones', requireAdmin, [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('couleur').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const conn = await pool.getConnection();
    try {
      const { nom, description, couleur } = req.body;
      const [result] = await conn.query(
        'INSERT INTO zones_travail (nom, description, couleur) VALUES (?, ?, ?)',
        [nom.trim(), description || null, couleur || 'blue']
      );
      const [rows] = await conn.query('SELECT * FROM zones_travail WHERE id = ?', [result.insertId]);
      res.status(201).json(rows[0]);
    } finally { conn.release(); }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Cette zone existe déjà' });
    res.status(500).json({ error: 'Erreur création zone' });
  }
});

router.put('/zones/:id', requireAdmin, [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const conn = await pool.getConnection();
    try {
      const { nom, description, couleur } = req.body;
      await conn.query(
        'UPDATE zones_travail SET nom = ?, description = ?, couleur = ? WHERE id = ?',
        [nom.trim(), description || null, couleur || 'blue', req.params.id]
      );
      const [rows] = await conn.query('SELECT * FROM zones_travail WHERE id = ?', [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Zone non trouvée' });
      res.json(rows[0]);
    } finally { conn.release(); }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Cette zone existe déjà' });
    res.status(500).json({ error: 'Erreur modification zone' });
  }
});

router.delete('/zones/:id', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query('SELECT * FROM zones_travail WHERE id = ?', [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: 'Zone non trouvée' });
      const newActif = existing[0].actif ? 0 : 1;
      await conn.query('UPDATE zones_travail SET actif = ? WHERE id = ?', [newActif, req.params.id]);
      res.json({ message: newActif ? 'Zone réactivée' : 'Zone désactivée' });
    } finally { conn.release(); }
  } catch (e) {
    res.status(500).json({ error: 'Erreur suppression zone' });
  }
});

// Hard delete zone — system_admin only
router.delete('/zones/:id/permanent', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query('SELECT * FROM zones_travail WHERE id = ?', [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: 'Zone non trouvée' });
      // Detach equipes from this zone first
      await conn.query('UPDATE equipes_production SET zone_id = NULL WHERE zone_id = ?', [req.params.id]);
      await conn.query('DELETE FROM zones_travail WHERE id = ?', [req.params.id]);
      res.json({ message: `Zone "${existing[0].nom}" supprimée définitivement` });
    } finally { conn.release(); }
  } catch (e) {
    console.error('Erreur suppression définitive zone:', e);
    res.status(500).json({ error: 'Erreur suppression définitive zone' });
  }
});

// ════════════════════════════════════════════════════════
// PERSONNEL DE PRODUCTION
// ════════════════════════════════════════════════════════

const personnelValidation = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
  body('role').isIn(['chef', 'operateur']).withMessage('Rôle invalide'),
];

// Helper: generate next matricule ALT-001, ALT-002, ...
async function generateNextMatricule(conn) {
  const [rows] = await conn.query(
    "SELECT matricule FROM personnel_production WHERE matricule LIKE 'ALT-%' ORDER BY matricule DESC LIMIT 1"
  );
  let nextNum = 1;
  if (rows.length > 0) {
    const parts = rows[0].matricule.split('-');
    const parsed = parseInt(parts[1], 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }
  return `ALT-${String(nextNum).padStart(3, '0')}`;
}

router.get('/personnel', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT p.*, q.nom as qualification_nom
        FROM personnel_production p
        LEFT JOIN qualifications q ON p.qualification_id = q.id
        ORDER BY p.role ASC, p.nom ASC, p.prenom ASC
      `);
      res.json(rows);
    } finally { conn.release(); }
  } catch (e) {
    res.status(500).json({ error: 'Erreur récupération personnel' });
  }
});

// Endpoint to preview the next auto-generated matricule
router.get('/personnel/prochain-matricule', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const matricule = await generateNextMatricule(conn);
      res.json({ matricule });
    } finally { conn.release(); }
  } catch (e) {
    res.status(500).json({ error: 'Erreur génération matricule' });
  }
});

router.post('/personnel', requireAdmin, personnelValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const conn = await pool.getConnection();
    try {
      const { nom, prenom, telephone, role, qualification_id, notes } = req.body;
      const matricule = await generateNextMatricule(conn);
      const [result] = await conn.query(
        `INSERT INTO personnel_production (nom, prenom, matricule, telephone, role, qualification_id, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nom.trim(), prenom.trim(), matricule, telephone || null, role, qualification_id || null, notes || null]
      );
      const [rows] = await conn.query(`
        SELECT p.*, q.nom as qualification_nom
        FROM personnel_production p
        LEFT JOIN qualifications q ON p.qualification_id = q.id
        WHERE p.id = ?
      `, [result.insertId]);
      res.status(201).json(rows[0]);
    } finally { conn.release(); }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ce matricule existe déjà' });
    console.error('Erreur création personnel:', e);
    res.status(500).json({ error: 'Erreur création personnel' });
  }
});

router.put('/personnel/:id', requireAdmin, personnelValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const conn = await pool.getConnection();
    try {
      const { nom, prenom, telephone, role, qualification_id, notes } = req.body;
      await conn.query(
        `UPDATE personnel_production SET nom = ?, prenom = ?, telephone = ?, role = ?, qualification_id = ?, notes = ? WHERE id = ?`,
        [nom.trim(), prenom.trim(), telephone || null, role, qualification_id || null, notes || null, req.params.id]
      );
      const [rows] = await conn.query(`
        SELECT p.*, q.nom as qualification_nom
        FROM personnel_production p
        LEFT JOIN qualifications q ON p.qualification_id = q.id
        WHERE p.id = ?
      `, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Personnel non trouvé' });
      res.json(rows[0]);
    } finally { conn.release(); }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ce matricule existe déjà' });
    res.status(500).json({ error: 'Erreur modification personnel' });
  }
});

router.delete('/personnel/:id', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query('SELECT * FROM personnel_production WHERE id = ?', [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: 'Personnel non trouvé' });
      const newActif = existing[0].actif ? 0 : 1;
      await conn.query('UPDATE personnel_production SET actif = ? WHERE id = ?', [newActif, req.params.id]);
      res.json({ message: newActif ? 'Personnel réactivé' : 'Personnel désactivé' });
    } finally { conn.release(); }
  } catch (e) {
    res.status(500).json({ error: 'Erreur suppression personnel' });
  }
});

// Hard delete — system_admin only
router.delete('/personnel/:id/permanent', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query('SELECT * FROM personnel_production WHERE id = ?', [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: 'Personnel non trouvé' });
      // Remove from equipe_membres first
      await conn.query('DELETE FROM equipe_membres WHERE personnel_id = ?', [req.params.id]);
      await conn.query('DELETE FROM personnel_production WHERE id = ?', [req.params.id]);
      res.json({ message: `Personnel ${existing[0].prenom} ${existing[0].nom} supprimé définitivement` });
    } finally { conn.release(); }
  } catch (e) {
    console.error('Erreur suppression définitive personnel:', e);
    res.status(500).json({ error: 'Erreur suppression définitive personnel' });
  }
});

// ════════════════════════════════════════════════════════
// ÉQUIPES DE PRODUCTION
// ════════════════════════════════════════════════════════

async function generateTeamCode(conn) {
  const [rows] = await conn.query(
    `SELECT code FROM equipes_production ORDER BY id DESC LIMIT 1`
  );
  if (rows.length === 0) return 'TEAM-001';
  const parts = rows[0].code.split('-');
  const seq = parseInt(parts[1], 10) || 0;
  return `TEAM-${String(seq + 1).padStart(3, '0')}`;
}

async function loadEquipeDetails(conn, equipeId) {
  const [rows] = await conn.query(`
    SELECT e.* FROM equipes_production e WHERE e.id = ?
  `, [equipeId]);
  if (!rows.length) return null;

  const equipe = rows[0];

  // Load all members with zone + personnel info
  const [membres] = await conn.query(`
    SELECT em.id, em.zone_id, em.personnel_id, em.is_chef,
      p.nom, p.prenom, p.matricule, p.role, p.telephone,
      q.nom as qualification_nom,
      z.nom as zone_nom, z.couleur as zone_couleur
    FROM equipe_membres em
    JOIN personnel_production p ON em.personnel_id = p.id
    LEFT JOIN qualifications q ON p.qualification_id = q.id
    LEFT JOIN zones_travail z ON em.zone_id = z.id
    WHERE em.equipe_id = ?
    ORDER BY em.is_chef DESC, p.nom, p.prenom
  `, [equipeId]);

  // Group members by zone
  const zonesMap = {};
  for (const m of membres) {
    const zId = m.zone_id || 0;
    if (!zonesMap[zId]) {
      zonesMap[zId] = {
        zone_id: m.zone_id,
        zone_nom: m.zone_nom || 'Sans zone',
        zone_couleur: m.zone_couleur || 'gray',
        chef: null,
        membres: []
      };
    }
    if (m.is_chef) {
      zonesMap[zId].chef = m;
    } else {
      zonesMap[zId].membres.push(m);
    }
  }
  equipe.zones_assignees = Object.values(zonesMap);
  equipe.all_membres = membres;
  return equipe;
}

router.get('/stats', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [total] = await conn.query('SELECT COUNT(*) as cnt FROM equipes_production WHERE actif = 1');
      const [zones] = await conn.query('SELECT COUNT(*) as cnt FROM zones_travail WHERE actif = 1');
      const [personnel] = await conn.query('SELECT COUNT(*) as cnt FROM personnel_production WHERE actif = 1');
      const [chefs] = await conn.query("SELECT COUNT(*) as cnt FROM personnel_production WHERE role = 'chef' AND actif = 1");
      res.json({
        equipes: Number(total[0].cnt),
        zones: Number(zones[0].cnt),
        personnel: Number(personnel[0].cnt),
        chefs: Number(chefs[0].cnt),
      });
    } finally { conn.release(); }
  } catch (e) {
    res.status(500).json({ error: 'Erreur stats' });
  }
});

router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT e.* FROM equipes_production e ORDER BY e.code ASC
      `);

      // Batch load all members with zone info
      if (rows.length > 0) {
        const ids = rows.map(r => r.id);
        const [allMembres] = await conn.query(`
          SELECT em.equipe_id, em.zone_id, em.personnel_id, em.is_chef,
            p.nom, p.prenom, p.matricule, p.role, p.telephone,
            q.nom as qualification_nom,
            z.nom as zone_nom, z.couleur as zone_couleur
          FROM equipe_membres em
          JOIN personnel_production p ON em.personnel_id = p.id
          LEFT JOIN qualifications q ON p.qualification_id = q.id
          LEFT JOIN zones_travail z ON em.zone_id = z.id
          WHERE em.equipe_id IN (?)
          ORDER BY em.is_chef DESC, p.nom, p.prenom
        `, [ids]);

        // Group by equipe, then by zone
        for (const row of rows) {
          const eqMembres = allMembres.filter(m => m.equipe_id === row.id);
          const zonesMap = {};
          for (const m of eqMembres) {
            const zId = m.zone_id || 0;
            if (!zonesMap[zId]) {
              zonesMap[zId] = {
                zone_id: m.zone_id,
                zone_nom: m.zone_nom || 'Sans zone',
                zone_couleur: m.zone_couleur || 'gray',
                chef: null,
                membres: []
              };
            }
            if (m.is_chef) {
              zonesMap[zId].chef = m;
            } else {
              zonesMap[zId].membres.push(m);
            }
          }
          row.zones_assignees = Object.values(zonesMap);
          row.all_membres = eqMembres;
        }
      }

      res.json(rows);
    } finally { conn.release(); }
  } catch (e) {
    console.error('Erreur liste équipes:', e);
    res.status(500).json({ error: 'Erreur récupération équipes' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const equipe = await loadEquipeDetails(conn, req.params.id);
      if (!equipe) return res.status(404).json({ error: 'Équipe non trouvée' });
      res.json(equipe);
    } finally { conn.release(); }
  } catch (e) {
    res.status(500).json({ error: 'Erreur récupération équipe' });
  }
});

const equipeValidation = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
];

router.post('/', requireAdmin, equipeValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { nom, notes, zones_assignees } = req.body;
    const code = await generateTeamCode(conn);

    const [result] = await conn.query(
      `INSERT INTO equipes_production (code, nom, notes, created_by, createur_nom, createur_prenom)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [code, nom.trim(), notes || null, req.user.id, req.user.nom, req.user.prenom]
    );

    // Insert zone assignments (chef + members per zone)
    if (zones_assignees && Array.isArray(zones_assignees)) {
      for (const za of zones_assignees) {
        if (!za.zone_id) continue;
        // Insert chef if set
        if (za.chef_id) {
          await conn.query(
            'INSERT INTO equipe_membres (equipe_id, zone_id, personnel_id, is_chef) VALUES (?, ?, ?, 1)',
            [result.insertId, za.zone_id, za.chef_id]
          );
        }
        // Insert members
        if (za.membres && Array.isArray(za.membres)) {
          for (const personnelId of za.membres) {
            await conn.query(
              'INSERT INTO equipe_membres (equipe_id, zone_id, personnel_id, is_chef) VALUES (?, ?, ?, 0)',
              [result.insertId, za.zone_id, personnelId]
            );
          }
        }
      }
    }

    await conn.commit();
    const equipe = await loadEquipeDetails(conn, result.insertId);
    res.status(201).json({ message: 'Équipe créée avec succès', equipe });
  } catch (e) {
    await conn.rollback();
    console.error('Erreur création équipe:', e);
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ce code d\'équipe existe déjà' });
    res.status(500).json({ error: 'Erreur création équipe' });
  } finally {
    conn.release();
  }
});

router.put('/:id', requireAdmin, equipeValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT * FROM equipes_production WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Équipe non trouvée' });

    const { nom, notes, zones_assignees } = req.body;
    await conn.query(
      `UPDATE equipes_production SET nom = ?, notes = ? WHERE id = ?`,
      [nom.trim(), notes || null, req.params.id]
    );

    // Recreate all zone assignments
    if (zones_assignees && Array.isArray(zones_assignees)) {
      await conn.query('DELETE FROM equipe_membres WHERE equipe_id = ?', [req.params.id]);
      for (const za of zones_assignees) {
        if (!za.zone_id) continue;
        if (za.chef_id) {
          await conn.query(
            'INSERT INTO equipe_membres (equipe_id, zone_id, personnel_id, is_chef) VALUES (?, ?, ?, 1)',
            [req.params.id, za.zone_id, za.chef_id]
          );
        }
        if (za.membres && Array.isArray(za.membres)) {
          for (const personnelId of za.membres) {
            await conn.query(
              'INSERT INTO equipe_membres (equipe_id, zone_id, personnel_id, is_chef) VALUES (?, ?, ?, 0)',
              [req.params.id, za.zone_id, personnelId]
            );
          }
        }
      }
    }

    await conn.commit();
    const equipe = await loadEquipeDetails(conn, req.params.id);
    res.json({ message: 'Équipe modifiée avec succès', equipe });
  } catch (e) {
    await conn.rollback();
    console.error('Erreur modification équipe:', e);
    res.status(500).json({ error: 'Erreur modification équipe' });
  } finally {
    conn.release();
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query('SELECT * FROM equipes_production WHERE id = ?', [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: 'Équipe non trouvée' });
      const newActif = existing[0].actif ? 0 : 1;
      await conn.query('UPDATE equipes_production SET actif = ? WHERE id = ?', [newActif, req.params.id]);
      res.json({ message: newActif ? 'Équipe réactivée' : 'Équipe désactivée' });
    } finally { conn.release(); }
  } catch (e) {
    res.status(500).json({ error: 'Erreur suppression équipe' });
  }
});

// Hard delete équipe — system_admin only
router.delete('/:id/permanent', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query('SELECT * FROM equipes_production WHERE id = ?', [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: 'Équipe non trouvée' });
      // Remove membres first
      await conn.query('DELETE FROM equipe_membres WHERE equipe_id = ?', [req.params.id]);
      // Detach lots referencing this equipe
      await conn.query('UPDATE lots SET equipe_id = NULL WHERE equipe_id = ?', [req.params.id]);
      await conn.query('DELETE FROM equipes_production WHERE id = ?', [req.params.id]);
      res.json({ message: `Équipe ${existing[0].code} supprimée définitivement` });
    } finally { conn.release(); }
  } catch (e) {
    console.error('Erreur suppression définitive équipe:', e);
    res.status(500).json({ error: 'Erreur suppression définitive équipe' });
  }
});

module.exports = router;
