const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireSystemAdmin } = require('../middleware/auth');

// Middleware: toutes les routes nécessitent System Admin
router.use(authenticateToken, requireSystemAdmin);

// ==================== RECHERCHE GLOBALE ====================

// Rechercher dans toutes les tables par numéro
router.get('/search', async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Paramètre query requis' });
    }

    let results = { bobines: [], lots: [], tubes: [] };
    const searchTerm = `%${query}%`;

    if (!type || type === 'bobines') {
      const [bobines] = await pool.execute(
        `SELECT id, numero, date_reception, statut 
         FROM bobines WHERE numero LIKE ? ORDER BY id DESC LIMIT 50`,
        [searchTerm]
      );
      results.bobines = bobines;
    }

    if (!type || type === 'lots') {
      const [lots] = await pool.execute(
        `SELECT l.id, l.numero, l.created_at as date_creation, l.date_fin, l.statut,
                b.numero as bobine_numero
         FROM lots l
         LEFT JOIN bobines b ON l.bobine_id = b.id
         WHERE l.numero LIKE ? ORDER BY l.id DESC LIMIT 50`,
        [searchTerm]
      );
      results.lots = lots;
    }

    if (!type || type === 'tubes') {
      const [tubes] = await pool.execute(
        `SELECT t.id, t.numero, t.created_at as date_creation, t.date_fin_production as date_fin, t.statut, t.decision,
                l.numero as lot_numero, b.numero as bobine_numero
         FROM tubes t
         LEFT JOIN lots l ON t.lot_id = l.id
         LEFT JOIN bobines b ON l.bobine_id = b.id
         WHERE t.numero LIKE ? ORDER BY t.id DESC LIMIT 100`,
        [searchTerm]
      );
      results.tubes = tubes;
    }

    res.json(results);
  } catch (error) {
    console.error('Erreur recherche admin:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== BOBINES ====================

// Obtenir une bobine avec détails complets
router.get('/bobines/:id', async (req, res) => {
  try {
    const [bobines] = await pool.execute(
      `SELECT * FROM bobines WHERE id = ?`,
      [req.params.id]
    );
    
    if (bobines.length === 0) {
      return res.status(404).json({ error: 'Bobine non trouvée' });
    }

    res.json(bobines[0]);
  } catch (error) {
    console.error('Erreur get bobine:', error);
    res.status(500).json({ error: error.message });
  }
});

// Modifier les dates d'une bobine
router.put('/bobines/:id/dates', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { date_reception, motif } = req.body;
    const bobineId = req.params.id;

    // Récupérer l'ancienne valeur
    const [oldData] = await connection.execute(
      'SELECT numero, date_reception FROM bobines WHERE id = ?',
      [bobineId]
    );

    if (oldData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Bobine non trouvée' });
    }

    const oldBobine = oldData[0];

    // Mettre à jour
    await connection.execute(
      'UPDATE bobines SET date_reception = ? WHERE id = ?',
      [date_reception, bobineId]
    );

    // Logger la correction
    await connection.execute(
      `INSERT INTO admin_corrections_log 
       (table_modifiee, enregistrement_id, enregistrement_ref, champ_modifie, ancienne_valeur, nouvelle_valeur, motif, admin_id, admin_nom, admin_prenom)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['bobines', bobineId, oldBobine.numero, 'date_reception', 
       oldBobine.date_reception ? oldBobine.date_reception.toISOString() : null,
       date_reception, motif, req.user.id, req.user.nom, req.user.prenom]
    );

    await connection.commit();
    res.json({ success: true, message: 'Date de bobine modifiée' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur update bobine:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ==================== LOTS ====================

// Obtenir un lot avec détails complets
router.get('/lots/:id', async (req, res) => {
  try {
    const [lots] = await pool.execute(
      `SELECT l.*, b.numero as bobine_numero 
       FROM lots l 
       LEFT JOIN bobines b ON l.bobine_id = b.id
       WHERE l.id = ?`,
      [req.params.id]
    );
    
    if (lots.length === 0) {
      return res.status(404).json({ error: 'Lot non trouvé' });
    }

    res.json(lots[0]);
  } catch (error) {
    console.error('Erreur get lot:', error);
    res.status(500).json({ error: error.message });
  }
});

// Modifier les dates d'un lot
router.put('/lots/:id/dates', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { date_creation, date_fin, motif } = req.body;
    const lotId = req.params.id;

    // Récupérer l'ancienne valeur
    const [oldData] = await connection.execute(
      'SELECT numero, created_at, date_fin FROM lots WHERE id = ?',
      [lotId]
    );

    if (oldData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Lot non trouvé' });
    }

    const oldLot = oldData[0];

    // Mettre à jour
    await connection.execute(
      'UPDATE lots SET created_at = ?, date_fin = ? WHERE id = ?',
      [date_creation, date_fin || null, lotId]
    );

    // Logger les corrections
    if (date_creation !== (oldLot.created_at ? oldLot.created_at.toISOString().slice(0,19).replace('T',' ') : null)) {
      await connection.execute(
        `INSERT INTO admin_corrections_log 
         (table_modifiee, enregistrement_id, enregistrement_ref, champ_modifie, ancienne_valeur, nouvelle_valeur, motif, admin_id, admin_nom, admin_prenom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['lots', lotId, oldLot.numero, 'created_at',
         oldLot.created_at ? oldLot.created_at.toISOString() : null,
         date_creation, motif, req.user.id, req.user.nom, req.user.prenom]
      );
    }

    if (date_fin !== (oldLot.date_fin ? oldLot.date_fin.toISOString().slice(0,19).replace('T',' ') : null)) {
      await connection.execute(
        `INSERT INTO admin_corrections_log 
         (table_modifiee, enregistrement_id, enregistrement_ref, champ_modifie, ancienne_valeur, nouvelle_valeur, motif, admin_id, admin_nom, admin_prenom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['lots', lotId, oldLot.numero, 'date_fin',
         oldLot.date_fin ? oldLot.date_fin.toISOString() : null,
         date_fin || null, motif, req.user.id, req.user.nom, req.user.prenom]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Dates du lot modifiées' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur update lot:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ==================== TUBES ====================

// Obtenir un tube avec détails complets
router.get('/tubes/:id', async (req, res) => {
  try {
    const [tubes] = await pool.execute(
      `SELECT t.*, l.numero as lot_numero, b.numero as bobine_numero 
       FROM tubes t 
       LEFT JOIN lots l ON t.lot_id = l.id
       LEFT JOIN bobines b ON l.bobine_id = b.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    
    if (tubes.length === 0) {
      return res.status(404).json({ error: 'Tube non trouvé' });
    }

    // Récupérer les étapes du tube
    const [etapes] = await pool.execute(
      `SELECT te.id, te.tube_id, te.etape_numero, te.etape_code, te.etape_code as etape_nom,
              te.statut, te.operateur_nom, te.operateur_prenom,
              te.started_at as date_debut, te.completed_at as date_fin,
              te.created_at
       FROM tube_etapes te
       WHERE te.tube_id = ?
       ORDER BY te.etape_numero`,
      [req.params.id]
    );

    // Récupérer l'historique
    const [historique] = await pool.execute(
      `SELECT teh.id, teh.tube_id, teh.etape_numero, teh.etape_code, teh.etape_code as etape_nom,
              teh.type_action, teh.operateur_nom, teh.operateur_prenom,
              teh.created_at as date_entree, teh.created_at as date_sortie
       FROM tube_etape_historique teh
       WHERE teh.tube_id = ?
       ORDER BY teh.created_at`,
      [req.params.id]
    );

    res.json({
      ...tubes[0],
      etapes,
      historique
    });
  } catch (error) {
    console.error('Erreur get tube:', error);
    res.status(500).json({ error: error.message });
  }
});

// Modifier les dates d'un tube
router.put('/tubes/:id/dates', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { date_creation, date_fin, motif } = req.body;
    const tubeId = req.params.id;

    // Récupérer l'ancienne valeur
    const [oldData] = await connection.execute(
      'SELECT numero, created_at, date_fin_production FROM tubes WHERE id = ?',
      [tubeId]
    );

    if (oldData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Tube non trouvé' });
    }

    const oldTube = oldData[0];

    // Mettre à jour
    await connection.execute(
      'UPDATE tubes SET created_at = ?, date_fin_production = ? WHERE id = ?',
      [date_creation, date_fin || null, tubeId]
    );

    // Logger les corrections
    const formatDate = (d) => d ? d.toISOString() : null;

    if (date_creation && formatDate(oldTube.created_at) !== date_creation) {
      await connection.execute(
        `INSERT INTO admin_corrections_log 
         (table_modifiee, enregistrement_id, enregistrement_ref, champ_modifie, ancienne_valeur, nouvelle_valeur, motif, admin_id, admin_nom, admin_prenom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['tubes', tubeId, oldTube.numero, 'created_at',
         formatDate(oldTube.created_at), date_creation, motif, req.user.id, req.user.nom, req.user.prenom]
      );
    }

    if (formatDate(oldTube.date_fin_production) !== (date_fin || null)) {
      await connection.execute(
        `INSERT INTO admin_corrections_log 
         (table_modifiee, enregistrement_id, enregistrement_ref, champ_modifie, ancienne_valeur, nouvelle_valeur, motif, admin_id, admin_nom, admin_prenom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['tubes', tubeId, oldTube.numero, 'date_fin_production',
         formatDate(oldTube.date_fin_production), date_fin || null, motif, req.user.id, req.user.nom, req.user.prenom]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Dates du tube modifiées' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur update tube:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ==================== TUBE ETAPES ====================

// Modifier les dates d'une étape de tube
router.put('/tube-etapes/:id/dates', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { date_debut, date_fin, motif } = req.body;
    const etapeId = req.params.id;

    // Récupérer l'ancienne valeur avec infos tube
    const [oldData] = await connection.execute(
      `SELECT te.*, t.numero as tube_numero, te.etape_code as etape_nom
       FROM tube_etapes te
       JOIN tubes t ON te.tube_id = t.id
       WHERE te.id = ?`,
      [etapeId]
    );

    if (oldData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Étape non trouvée' });
    }

    const oldEtape = oldData[0];
    const ref = `${oldEtape.tube_numero} - ${oldEtape.etape_nom}`;

    // Mettre à jour
    await connection.execute(
      'UPDATE tube_etapes SET started_at = ?, completed_at = ? WHERE id = ?',
      [date_debut, date_fin || null, etapeId]
    );

    // Logger les corrections
    const formatDate = (d) => d ? d.toISOString() : null;

    if (date_debut && formatDate(oldEtape.started_at) !== date_debut) {
      await connection.execute(
        `INSERT INTO admin_corrections_log 
         (table_modifiee, enregistrement_id, enregistrement_ref, champ_modifie, ancienne_valeur, nouvelle_valeur, motif, admin_id, admin_nom, admin_prenom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['tube_etapes', etapeId, ref, 'started_at',
         formatDate(oldEtape.started_at), date_debut, motif, req.user.id, req.user.nom, req.user.prenom]
      );
    }

    if (formatDate(oldEtape.completed_at) !== (date_fin || null)) {
      await connection.execute(
        `INSERT INTO admin_corrections_log 
         (table_modifiee, enregistrement_id, enregistrement_ref, champ_modifie, ancienne_valeur, nouvelle_valeur, motif, admin_id, admin_nom, admin_prenom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['tube_etapes', etapeId, ref, 'completed_at',
         formatDate(oldEtape.completed_at), date_fin || null, motif, req.user.id, req.user.nom, req.user.prenom]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Dates de l\'étape modifiées' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur update tube_etapes:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ==================== TUBE ETAPE HISTORIQUE ====================

// Modifier les dates d'un historique
router.put('/tube-historique/:id/dates', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { date_entree, date_sortie, motif } = req.body;
    const histId = req.params.id;

    // Récupérer l'ancienne valeur
    const [oldData] = await connection.execute(
      `SELECT teh.*, t.numero as tube_numero, teh.etape_code as etape_nom
       FROM tube_etape_historique teh
       JOIN tubes t ON teh.tube_id = t.id
       WHERE teh.id = ?`,
      [histId]
    );

    if (oldData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Historique non trouvé' });
    }

    const oldHist = oldData[0];
    const ref = `${oldHist.tube_numero} - ${oldHist.etape_nom}`;

    // Mettre à jour (seul created_at est modifiable dans l'historique)
    await connection.execute(
      'UPDATE tube_etape_historique SET created_at = ? WHERE id = ?',
      [date_entree, histId]
    );

    // Logger les corrections
    const formatDate = (d) => d ? d.toISOString() : null;

    if (date_entree && formatDate(oldHist.created_at) !== date_entree) {
      await connection.execute(
        `INSERT INTO admin_corrections_log 
         (table_modifiee, enregistrement_id, enregistrement_ref, champ_modifie, ancienne_valeur, nouvelle_valeur, motif, admin_id, admin_nom, admin_prenom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['tube_etape_historique', histId, ref, 'created_at',
         formatDate(oldHist.created_at), date_entree, motif, req.user.id, req.user.nom, req.user.prenom]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Dates de l\'historique modifiées' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur update historique:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ==================== JOURNAL DES CORRECTIONS ====================

// Obtenir le journal des corrections
router.get('/corrections-log', async (req, res) => {
  try {
    const { page = 1, limit = 50, table_modifiee } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM admin_corrections_log 
      WHERE 1=1
    `;
    const params = [];

    if (table_modifiee) {
      query += ' AND table_modifiee = ?';
      params.push(table_modifiee);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await pool.execute(query, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM admin_corrections_log WHERE 1=1';
    const countParams = [];
    if (table_modifiee) {
      countQuery += ' AND table_modifiee = ?';
      countParams.push(table_modifiee);
    }
    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      logs,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (error) {
    console.error('Erreur get corrections log:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
