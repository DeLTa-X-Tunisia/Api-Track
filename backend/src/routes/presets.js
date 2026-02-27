/**
 * Routes API — Paramètres de Soudure (Presets)
 * Design aligné sur LogiTrack : têtes ID/OD, ampérage/voltage/fil par tête
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// ──────── Validation ────────
const presetValidation = [
  body('diametre_pouce').notEmpty().withMessage('Le diamètre est requis'),
  body('diametre_mm').isFloat({ min: 0 }).withMessage('Le diamètre en mm est requis'),
  body('strip_vitesse_m').isInt({ min: 0 }).withMessage('Strip vitesse (m) invalide'),
  body('strip_vitesse_cm').isInt({ min: 0, max: 99 }).withMessage('Strip vitesse (cm) invalide'),
  body('milling_angle1').isFloat({ min: 0 }).withMessage('Milling Edge Gauche invalide'),
  body('milling_angle2').isFloat({ min: 0 }).withMessage('Milling Edge Droit invalide'),
  body('tack_amperage').isFloat({ min: 0 }).withMessage('Tack ampérage invalide'),
  body('tack_voltage').isFloat({ min: 0 }).withMessage('Tack voltage invalide'),
];

// ──────── Helpers ────────
function normalizePreset(r) {
  return {
    ...r,
    tetes_config: r.tetes_config ? (typeof r.tetes_config === 'string' ? JSON.parse(r.tetes_config) : r.tetes_config) : [],
    lot: r.lot ? Number(r.lot) : null,
    nb_tetes: Number(r.nb_tetes || 5),
    strip_vitesse_m: Number(r.strip_vitesse_m),
    strip_vitesse_cm: Number(r.strip_vitesse_cm),
    milling_angle1: Number(r.milling_angle1),
    milling_angle2: Number(r.milling_angle2),
    pression_rouleaux: r.pression_rouleaux != null ? Number(r.pression_rouleaux) : null,
    tack_amperage: Number(r.tack_amperage),
    tack_voltage: Number(r.tack_voltage),
    tack_vitesse_m: Number(r.tack_vitesse_m || 0),
    tack_vitesse_cm: Number(r.tack_vitesse_cm || 0),
    tack_frequence_hf: r.tack_frequence_hf != null ? Number(r.tack_frequence_hf) : null,
    tack_debit_gaz: r.tack_debit_gaz != null ? Number(r.tack_debit_gaz) : null,
    soudure_vitesse_m: Number(r.soudure_vitesse_m),
    soudure_vitesse_cm: Number(r.soudure_vitesse_cm),
    finale_amperage: Number(r.finale_amperage || 0),
    finale_voltage: Number(r.finale_voltage || 0),
    finale_frequence_hf: r.finale_frequence_hf != null ? Number(r.finale_frequence_hf) : null,
    finale_debit_gaz: r.finale_debit_gaz != null ? Number(r.finale_debit_gaz) : null,
    // heads are attached separately
  };
}

function normalizeHead(h) {
  return {
    ...h,
    actif: !!h.actif,
    amperage: Number(h.amperage || 0),
    voltage: Number(h.voltage || 0),
    type_fil: h.type_fil || '3.2mm',
  };
}

async function generatePresetCode(conn, diametre_pouce) {
  const [rows] = await conn.query(
    `SELECT code FROM presets_soudure WHERE diametre_pouce = ? ORDER BY id DESC LIMIT 1`,
    [diametre_pouce]
  );
  if (rows.length === 0) return `PAR-${diametre_pouce}-1`;
  const parts = rows[0].code.split('-');
  const seq = parseInt(parts[parts.length - 1], 10) || 0;
  return `PAR-${diametre_pouce}-${seq + 1}`;
}

async function insertHeads(conn, presetId, heads) {
  if (!heads || !Array.isArray(heads)) return;
  for (const head of heads) {
    await conn.query(
      `INSERT INTO preset_soudure_heads (preset_id, type, numero, actif, amperage, voltage, type_fil)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [presetId, head.type, head.numero, head.actif ? 1 : 0,
       head.actif ? (head.amperage || 0) : 0,
       head.actif ? (head.voltage || 0) : 0,
       head.type_fil || '3.2mm']
    );
  }
}

async function loadPresetHeads(conn, presetIds) {
  if (!presetIds.length) return {};
  const [allHeads] = await conn.query(
    `SELECT * FROM preset_soudure_heads WHERE preset_id IN (?) ORDER BY FIELD(type,'ID','OD'), numero`,
    [presetIds]
  );
  const map = {};
  for (const h of allHeads) {
    if (!map[h.preset_id]) map[h.preset_id] = [];
    map[h.preset_id].push(normalizeHead(h));
  }
  return map;
}

// ════════════════════════════════════════
// GET /stats
// ════════════════════════════════════════
router.get('/stats', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [totalRows] = await conn.query('SELECT COUNT(*) as total FROM presets_soudure');
      const [diametresRows] = await conn.query('SELECT COUNT(DISTINCT diametre_pouce) as count FROM presets_soudure');
      res.json({
        total: Number(totalRows[0].total),
        diametres_utilises: Number(diametresRows[0].count)
      });
    } finally { conn.release(); }
  } catch (error) {
    console.error('Erreur stats presets:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// ════════════════════════════════════════
// GET /ref/diametres
// ════════════════════════════════════════
router.get('/ref/diametres', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        'SELECT * FROM diametres_tubes WHERE actif = TRUE ORDER BY CAST(pouce AS UNSIGNED) ASC'
      );
      res.json(rows);
    } finally { conn.release(); }
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération diamètres' });
  }
});

// ════════════════════════════════════════
// GET /next-code/:diametre
// ════════════════════════════════════════
router.get('/next-code/:diametre', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const code = await generatePresetCode(conn, req.params.diametre);
      res.json({ code });
    } finally { conn.release(); }
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// ════════════════════════════════════════
// GET / — Liste tous les presets + heads
// ════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT p.*, src.code as copie_de_code
        FROM presets_soudure p
        LEFT JOIN presets_soudure src ON p.copie_de = src.id
        ORDER BY CAST(p.diametre_pouce AS UNSIGNED) ASC, p.code ASC
      `);

      // Batch load heads (fix N+1)
      if (rows.length > 0) {
        const headsMap = await loadPresetHeads(conn, rows.map(r => r.id));
        for (const row of rows) {
          row.heads = headsMap[row.id] || [];
        }
      }

      res.json(rows.map(normalizePreset));
    } finally { conn.release(); }
  } catch (error) {
    console.error('Erreur liste presets:', error);
    res.status(500).json({ error: 'Erreur récupération presets' });
  }
});

// ════════════════════════════════════════
// GET /:id — Détail d'un preset
// ════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT p.*, src.code as copie_de_code
        FROM presets_soudure p
        LEFT JOIN presets_soudure src ON p.copie_de = src.id
        WHERE p.id = ?
      `, [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Preset non trouvé' });

      const [heads] = await conn.query(
        `SELECT * FROM preset_soudure_heads WHERE preset_id = ? ORDER BY FIELD(type,'ID','OD'), numero`,
        [req.params.id]
      );
      rows[0].heads = heads.map(normalizeHead);

      res.json(normalizePreset(rows[0]));
    } finally { conn.release(); }
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération preset' });
  }
});

// ════════════════════════════════════════
// POST / — Créer (admin+)
// ════════════════════════════════════════
router.post('/', requireAdmin, presetValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const b = req.body;
    const code = await generatePresetCode(conn, b.diametre_pouce);
    const heads = b.heads || [];

    const [result] = await conn.query(`
      INSERT INTO presets_soudure (
        code, diametre_pouce, diametre_mm, lot,
        strip_vitesse_m, strip_vitesse_cm,
        milling_angle1, milling_angle2, pression_rouleaux, pression_unite,
        tack_amperage, tack_voltage, tack_vitesse_m, tack_vitesse_cm,
        tack_frequence_hf, tack_type_gaz, tack_debit_gaz,
        soudure_vitesse_m, soudure_vitesse_cm, soudure_type_fil, soudure_type_flux,
        finale_amperage, finale_voltage, finale_frequence_hf, finale_type_gaz, finale_debit_gaz,
        nb_tetes, tetes_config, notes,
        created_by, createur_nom, createur_prenom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code, b.diametre_pouce, b.diametre_mm, b.lot || null,
      b.strip_vitesse_m || 0, b.strip_vitesse_cm || 0,
      b.milling_angle1 || 0, b.milling_angle2 || 0, b.pression_rouleaux || null, b.pression_unite || 'tonnes',
      b.tack_amperage || 0, b.tack_voltage || 0, b.tack_vitesse_m || 0, b.tack_vitesse_cm || 0,
      b.tack_frequence_hf || null, b.tack_type_gaz || 'CO2', b.tack_debit_gaz || null,
      b.soudure_vitesse_m || 0, b.soudure_vitesse_cm || 0, b.soudure_type_fil || '1.6mm', b.soudure_type_flux || 'SAW',
      b.finale_amperage || 0, b.finale_voltage || 0, b.finale_frequence_hf || null, b.finale_type_gaz || 'CO2', b.finale_debit_gaz || null,
      heads.length || 5, JSON.stringify(heads.map(h => !!h.actif)), b.notes || null,
      req.user.id, req.user.nom, req.user.prenom
    ]);

    await insertHeads(conn, result.insertId, heads);
    await conn.commit();

    const [newPreset] = await conn.query('SELECT * FROM presets_soudure WHERE id = ?', [result.insertId]);
    const [newHeads] = await conn.query('SELECT * FROM preset_soudure_heads WHERE preset_id = ? ORDER BY FIELD(type,\'ID\',\'OD\'), numero', [result.insertId]);
    newPreset[0].heads = newHeads.map(normalizeHead);

    res.status(201).json({ message: 'Preset créé avec succès', preset: normalizePreset(newPreset[0]) });
  } catch (error) {
    await conn.rollback();
    console.error('Erreur création preset:', error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Un preset avec ce code existe déjà' });
    res.status(500).json({ error: 'Erreur lors de la création du preset' });
  } finally {
    conn.release();
  }
});

// ════════════════════════════════════════
// POST /:id/copy — Dupliquer (admin+)
// ════════════════════════════════════════
router.post('/:id/copy', requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [source] = await conn.query('SELECT * FROM presets_soudure WHERE id = ?', [req.params.id]);
    if (source.length === 0) return res.status(404).json({ error: 'Preset source non trouvé' });

    const s = source[0];
    const td = req.body.diametre_pouce || s.diametre_pouce;
    const tmm = req.body.diametre_mm || s.diametre_mm;
    const code = await generatePresetCode(conn, td);

    const [result] = await conn.query(`
      INSERT INTO presets_soudure (
        code, diametre_pouce, diametre_mm, lot,
        strip_vitesse_m, strip_vitesse_cm,
        milling_angle1, milling_angle2, pression_rouleaux, pression_unite,
        tack_amperage, tack_voltage, tack_vitesse_m, tack_vitesse_cm,
        tack_frequence_hf, tack_type_gaz, tack_debit_gaz,
        soudure_vitesse_m, soudure_vitesse_cm, soudure_type_fil, soudure_type_flux,
        finale_amperage, finale_voltage, finale_frequence_hf, finale_type_gaz, finale_debit_gaz,
        nb_tetes, tetes_config, copie_de, notes,
        created_by, createur_nom, createur_prenom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code, td, tmm, null,
      s.strip_vitesse_m, s.strip_vitesse_cm,
      s.milling_angle1, s.milling_angle2, s.pression_rouleaux, s.pression_unite,
      s.tack_amperage, s.tack_voltage, s.tack_vitesse_m || 0, s.tack_vitesse_cm || 0,
      s.tack_frequence_hf, s.tack_type_gaz, s.tack_debit_gaz,
      s.soudure_vitesse_m, s.soudure_vitesse_cm, s.soudure_type_fil || '1.6mm', s.soudure_type_flux || 'SAW',
      s.finale_amperage || 0, s.finale_voltage || 0, s.finale_frequence_hf, s.finale_type_gaz, s.finale_debit_gaz,
      s.nb_tetes || 5,
      s.tetes_config ? (typeof s.tetes_config === 'string' ? s.tetes_config : JSON.stringify(s.tetes_config)) : '[]',
      s.id, `Copie de ${s.code}`,
      req.user.id, req.user.nom, req.user.prenom
    ]);

    const newId = result.insertId;

    // Copy heads from source
    const [sourceHeads] = await conn.query('SELECT * FROM preset_soudure_heads WHERE preset_id = ?', [s.id]);
    for (const h of sourceHeads) {
      await conn.query(
        `INSERT INTO preset_soudure_heads (preset_id, type, numero, actif, amperage, voltage, type_fil)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId, h.type, h.numero, h.actif, h.amperage, h.voltage, h.type_fil || '3.2mm']
      );
    }

    await conn.commit();

    const [np] = await conn.query(`
      SELECT p.*, src.code as copie_de_code FROM presets_soudure p
      LEFT JOIN presets_soudure src ON p.copie_de = src.id WHERE p.id = ?
    `, [newId]);
    const [npHeads] = await conn.query('SELECT * FROM preset_soudure_heads WHERE preset_id = ? ORDER BY FIELD(type,\'ID\',\'OD\'), numero', [newId]);
    np[0].heads = npHeads.map(normalizeHead);

    res.status(201).json({ message: 'Preset copié avec succès', preset: normalizePreset(np[0]) });
  } catch (error) {
    await conn.rollback();
    console.error('Erreur copie preset:', error);
    res.status(500).json({ error: 'Erreur lors de la copie du preset' });
  } finally {
    conn.release();
  }
});

// ════════════════════════════════════════
// PUT /:id — Modifier (admin+)
// ════════════════════════════════════════
router.put('/:id', requireAdmin, presetValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT * FROM presets_soudure WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Preset non trouvé' });

    const b = req.body;
    const heads = b.heads || [];
    let newCode = existing[0].code;
    if (b.diametre_pouce !== existing[0].diametre_pouce) {
      newCode = await generatePresetCode(conn, b.diametre_pouce);
    }

    await conn.query(`
      UPDATE presets_soudure SET
        code = ?, diametre_pouce = ?, diametre_mm = ?, lot = ?,
        strip_vitesse_m = ?, strip_vitesse_cm = ?,
        milling_angle1 = ?, milling_angle2 = ?, pression_rouleaux = ?, pression_unite = ?,
        tack_amperage = ?, tack_voltage = ?, tack_vitesse_m = ?, tack_vitesse_cm = ?,
        tack_frequence_hf = ?, tack_type_gaz = ?, tack_debit_gaz = ?,
        soudure_vitesse_m = ?, soudure_vitesse_cm = ?, soudure_type_fil = ?, soudure_type_flux = ?,
        finale_amperage = ?, finale_voltage = ?, finale_frequence_hf = ?, finale_type_gaz = ?, finale_debit_gaz = ?,
        nb_tetes = ?, tetes_config = ?, notes = ?,
        updated_by = ?, modificateur_nom = ?, modificateur_prenom = ?
      WHERE id = ?
    `, [
      newCode, b.diametre_pouce, b.diametre_mm, b.lot || null,
      b.strip_vitesse_m || 0, b.strip_vitesse_cm || 0,
      b.milling_angle1 || 0, b.milling_angle2 || 0, b.pression_rouleaux || null, b.pression_unite || 'tonnes',
      b.tack_amperage || 0, b.tack_voltage || 0, b.tack_vitesse_m || 0, b.tack_vitesse_cm || 0,
      b.tack_frequence_hf || null, b.tack_type_gaz || 'CO2', b.tack_debit_gaz || null,
      b.soudure_vitesse_m || 0, b.soudure_vitesse_cm || 0, b.soudure_type_fil || '1.6mm', b.soudure_type_flux || 'SAW',
      b.finale_amperage || 0, b.finale_voltage || 0, b.finale_frequence_hf || null, b.finale_type_gaz || 'CO2', b.finale_debit_gaz || null,
      heads.length || 5, JSON.stringify(heads.map(h => !!h.actif)), b.notes || null,
      req.user.id, req.user.nom, req.user.prenom,
      req.params.id
    ]);

    // Recreate heads
    if (heads.length > 0) {
      await conn.query('DELETE FROM preset_soudure_heads WHERE preset_id = ?', [req.params.id]);
      await insertHeads(conn, req.params.id, heads);
    }

    await conn.commit();

    const [updated] = await conn.query(`
      SELECT p.*, src.code as copie_de_code FROM presets_soudure p
      LEFT JOIN presets_soudure src ON p.copie_de = src.id WHERE p.id = ?
    `, [req.params.id]);
    const [updatedHeads] = await conn.query('SELECT * FROM preset_soudure_heads WHERE preset_id = ? ORDER BY FIELD(type,\'ID\',\'OD\'), numero', [req.params.id]);
    updated[0].heads = updatedHeads.map(normalizeHead);

    res.json({ message: 'Preset modifié avec succès', preset: normalizePreset(updated[0]) });
  } catch (error) {
    await conn.rollback();
    console.error('Erreur modification preset:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du preset' });
  } finally {
    conn.release();
  }
});

// ════════════════════════════════════════
// DELETE /:id — Supprimer (admin+)
// ════════════════════════════════════════
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query('SELECT * FROM presets_soudure WHERE id = ?', [req.params.id]);
      if (existing.length === 0) return res.status(404).json({ error: 'Preset non trouvé' });
      // heads cascade-deleted via FK
      await conn.query('DELETE FROM presets_soudure WHERE id = ?', [req.params.id]);
      res.json({ message: `Preset ${existing[0].code} supprimé avec succès` });
    } finally { conn.release(); }
  } catch (error) {
    console.error('Erreur suppression preset:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du preset' });
  }
});

module.exports = router;
