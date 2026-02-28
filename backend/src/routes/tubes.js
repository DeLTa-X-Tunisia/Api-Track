/**
 * Routes Tubes - Module de production tubes spirale
 * Pipeline 12 étapes API 5L
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireSupervisor } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware auth sur toutes les routes
router.use(authenticateToken);

// Middleware canAct (admin, system_admin, superviseur)
const canAct = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
  const role = req.user.role;
  if (['system_admin', 'admin', 'superviseur'].includes(role)) return next();
  return res.status(403).json({ error: 'Accès non autorisé' });
};

// ============================================
// CONSTANTES
// ============================================
const ETAPES_PRODUCTION = [
  { numero: 1, code: 'FORMAGE', nom: 'Formage', icon: 'Cylinder', color: 'blue', offline: false },
  { numero: 2, code: 'POINTAGE', nom: 'Pointage (GMAW)', icon: 'Zap', color: 'amber', offline: false },
  { numero: 3, code: 'CV_POINTAGE', nom: 'CV Pointage', icon: 'Search', color: 'teal', offline: false },
  { numero: 4, code: 'SAW_ID_OD', nom: 'SAW ID/OD', icon: 'Flame', color: 'orange', offline: true },
  { numero: 5, code: 'CV_CORDON', nom: 'CV Cordon', icon: 'Search', color: 'teal', offline: false },
  { numero: 6, code: 'MACRO', nom: 'Macro', icon: 'Microscope', color: 'purple', offline: false },
  { numero: 7, code: 'CHANFREIN', nom: 'Chanfrein', icon: 'Scissors', color: 'gray', offline: false },
  { numero: 8, code: 'HYDROTEST', nom: 'Hydrotest', icon: 'Droplet', color: 'cyan', offline: false },
  { numero: 9, code: 'CV_FUITE', nom: 'CV Fuite', icon: 'Search', color: 'teal', offline: false },
  { numero: 10, code: 'UT', nom: 'UT', icon: 'Scan', color: 'indigo', offline: false },
  { numero: 11, code: 'RADIO_SCOPIE', nom: 'Radio Scopie', icon: 'Radio', color: 'rose', offline: false },
  { numero: 12, code: 'CONTROLE_DIM', nom: 'Contrôle dimensionnel', icon: 'Ruler', color: 'emerald', offline: false },
];
const TOTAL_ETAPES = ETAPES_PRODUCTION.length;

const DIAMETRES = [
  { pouce: '8"', mm: 219.1 }, { pouce: '10"', mm: 273.1 }, { pouce: '12"', mm: 323.9 },
  { pouce: '14"', mm: 355.6 }, { pouce: '16"', mm: 406.4 }, { pouce: '18"', mm: 457.2 },
  { pouce: '20"', mm: 508 }, { pouce: '22"', mm: 558.8 }, { pouce: '24"', mm: 609.6 },
  { pouce: '26"', mm: 660.4 }, { pouce: '28"', mm: 711.2 }, { pouce: '30"', mm: 762 },
  { pouce: '32"', mm: 812.8 }, { pouce: '34"', mm: 863.6 }, { pouce: '36"', mm: 914.4 },
  { pouce: '38"', mm: 965.2 }, { pouce: '40"', mm: 1016 }, { pouce: '42"', mm: 1066.8 },
  { pouce: '44"', mm: 1117.6 }, { pouce: '46"', mm: 1168.4 }, { pouce: '48"', mm: 1219.2 },
  { pouce: '52"', mm: 1320.8 }, { pouce: '56"', mm: 1422.4 }, { pouce: '60"', mm: 1524 },
  { pouce: '64"', mm: 1625.6 }, { pouce: '72"', mm: 1828.8 }, { pouce: '80"', mm: 2032 },
  { pouce: '82"', mm: 2082.8 },
];

// ============================================
// HELPERS
// ============================================
async function logEtapeHistorique(tubeId, etapeNumero, typeAction, commentaire, req, repairData = null) {
  const etapeInfo = ETAPES_PRODUCTION.find(e => e.numero === etapeNumero);
  await pool.query(`
    INSERT INTO tube_etape_historique
    (tube_id, etape_numero, etape_code, type_action, commentaire,
     operateur_id, operateur_nom, operateur_prenom,
     defaut, cause_defaut, responsabilite_id, responsabilite_nom, action_prise)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    tubeId, etapeNumero, etapeInfo?.code || '', typeAction, commentaire || null,
    req.user?.operateurId || req.user?.userId || null,
    req.user?.nom || null, req.user?.prenom || null,
    repairData?.defaut || null, repairData?.cause_defaut || null,
    repairData?.responsabilite_id || null, repairData?.responsabilite_nom || null,
    repairData?.action_prise || null
  ]);
}

// Audit trail (log to console, can be extended)
function logAudit({ action, entite, entiteId, req, details }) {
  const user = req.user ? `${req.user.prenom || ''} ${req.user.nom || ''}`.trim() : 'Système';
  console.log(`[AUDIT] ${action} ${entite}#${entiteId} par ${user} — ${JSON.stringify(details || {})}`);
}

// ============================================
// UPLOAD CONFIG
// ============================================
const tubesUploadsDir = path.join(__dirname, '../../uploads/tubes');
if (!fs.existsSync(tubesUploadsDir)) {
  fs.mkdirSync(tubesUploadsDir, { recursive: true });
}

const uploadTubeEtapePhotos = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, tubesUploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `tube-${req.params.id}-etape-${req.params.etape}-${uniqueSuffix}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont autorisées'), false);
  }
});

// ============================================
// GET /api/tubes/etapes - Liste des étapes
// ============================================
router.get('/etapes', (req, res) => {
  res.json(ETAPES_PRODUCTION);
});

// ============================================
// GET /api/tubes/diametres - Liste des diamètres
// ============================================
router.get('/diametres', (req, res) => {
  res.json(DIAMETRES);
});

// ============================================
// GET /api/tubes/stats - Statistiques
// ============================================
router.get('/stats', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(statut = 'en_production') as en_production,
        SUM(statut = 'en_reparation') as en_reparation,
        SUM(statut = 'interrompu') as interrompu,
        SUM(statut = 'termine') as termines,
        SUM(statut = 'en_attente') as non_conformes,
        SUM(statut = 'rebut') as rebuts,
        SUM(statut = 'termine' AND (decision IS NULL OR decision = 'en_attente')) as decision_en_attente,
        SUM(decision = 'certifie_api') as certifie_api,
        SUM(decision = 'certifie_hydraulique') as certifie_hydraulique,
        SUM(decision = 'declasse') as declasse
      FROM tubes
    `);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur GET /tubes/stats:', error);
    res.status(500).json({ error: 'Erreur statistiques' });
  }
});

// ============================================
// GET /api/tubes/prochain-numero - Prochain numéro de tube
// ============================================
router.get('/prochain-numero', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT MAX(CAST(numero AS UNSIGNED)) as max_num FROM tubes WHERE numero REGEXP '^[0-9]+$'"
    );
    const next = (rows[0].max_num || 0) + 1;
    res.json({ numero: next });
  } catch (error) {
    console.error('Erreur prochain-numero:', error);
    res.status(500).json({ error: 'Erreur récupération numéro' });
  }
});

// ============================================
// GET /api/tubes - Liste des tubes (avec filtres)
// ============================================
router.get('/', async (req, res) => {
  try {
    const { statut, etape, lot_id, search, decision, date_from, date_to, saw_date_from, saw_date_to } = req.query;

    let where = [];
    let params = [];

    if (statut) { where.push('t.statut = ?'); params.push(statut); }
    if (etape) { where.push('t.etape_courante = ?'); params.push(etape); }
    if (lot_id) { where.push('(t.lot_id = ? OR t.lot_id_2 = ?)'); params.push(lot_id, lot_id); }
    if (decision) { 
      if (decision === 'en_attente') {
        where.push("(t.decision IS NULL OR t.decision = 'en_attente')");
      } else {
        where.push('t.decision = ?'); params.push(decision); 
      }
    }
    if (search) {
      where.push('(t.numero LIKE ? OR l.numero LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (date_from) { where.push('DATE(t.created_at) >= ?'); params.push(date_from); }
    if (date_to) { where.push('DATE(t.created_at) <= ?'); params.push(date_to); }
    if (saw_date_from) { where.push('DATE(t.saw_date) >= ?'); params.push(saw_date_from); }
    if (saw_date_to) { where.push('DATE(t.saw_date) <= ?'); params.push(saw_date_to); }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [tubes] = await pool.query(`
      SELECT t.*, 
        l.numero as lot_numero, l2.numero as lot_numero_2,
        b.numero as bobine_numero, b.epaisseur as bobine_epaisseur,
        pp.code as parametre_numero
      FROM tubes t
      LEFT JOIN lots l ON t.lot_id = l.id
      LEFT JOIN lots l2 ON t.lot_id_2 = l2.id
      LEFT JOIN bobines b ON l.bobine_id = b.id
      LEFT JOIN presets_soudure pp ON t.parametre_id = pp.id
      ${whereClause}
      ORDER BY t.created_at DESC
    `, params);

    // Charger les étapes pour chaque tube
    if (tubes.length > 0) {
      const tubeIds = tubes.map(t => t.id);
      const [allEtapes] = await pool.query(
        'SELECT * FROM tube_etapes WHERE tube_id IN (?) ORDER BY etape_numero',
        [tubeIds]
      );
      const etapesMap = {};
      for (const e of allEtapes) {
        if (!etapesMap[e.tube_id]) etapesMap[e.tube_id] = [];
        etapesMap[e.tube_id].push(e);
      }
      for (const tube of tubes) {
        tube.etapes = etapesMap[tube.id] || [];
      }
    }

    res.json(tubes);
  } catch (error) {
    console.error('Erreur GET /tubes:', error);
    res.status(500).json({ error: 'Erreur récupération tubes' });
  }
});

// ============================================
// GET /api/tubes/:id - Détail d'un tube
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const [tubes] = await pool.query(`
      SELECT t.*,
        l.numero as lot_numero, l2.numero as lot_numero_2,
        b.numero as bobine_numero, b.epaisseur as bobine_epaisseur,
        pp.code as parametre_numero
      FROM tubes t
      LEFT JOIN lots l ON t.lot_id = l.id
      LEFT JOIN lots l2 ON t.lot_id_2 = l2.id
      LEFT JOIN bobines b ON l.bobine_id = b.id
      LEFT JOIN presets_soudure pp ON t.parametre_id = pp.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (tubes.length === 0) return res.status(404).json({ error: 'Tube non trouvé' });

    const [etapes] = await pool.query(
      'SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [req.params.id]
    );
    tubes[0].etapes = etapes;
    res.json(tubes[0]);
  } catch (error) {
    console.error('Erreur GET /tubes/:id:', error);
    res.status(500).json({ error: 'Erreur récupération tube' });
  }
});

// ============================================
// POST /api/tubes - Créer un nouveau tube
// ============================================
router.post('/', canAct, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      lot_id, type_tube, numero, diametre_mm, diametre_pouce,
      longueur, epaisseur, notes, parametre_id, parametres
    } = req.body;

    if (!lot_id || !numero || !diametre_mm) {
      return res.status(400).json({ error: 'lot_id, numero et diametre_mm sont requis' });
    }

    const operateur_id = req.user?.operateurId || req.user?.userId || null;
    const operateur_nom = req.user?.nom || null;
    const operateur_prenom = req.user?.prenom || null;

    // Vérifier que le lot existe
    const [lot] = await conn.query('SELECT * FROM lots WHERE id = ?', [lot_id]);
    if (lot.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Lot non trouvé' });
    }

    let usedParametreId = parametre_id || lot[0].parametre_id || null;

    // Si des paramètres personnalisés sont envoyés, créer un nouveau preset
    if (parametres) {
      const presetNumero = `T-${numero}-${Date.now().toString(36)}`;
      const [presetResult] = await conn.query(`
        INSERT INTO presets_soudure (
          numero, diametre_pouce,
          strip_vitesse_m, strip_vitesse_cm,
          milling_edge_gauche, milling_edge_droit,
          pression_rouleaux, pression_rouleaux_unite,
          tack_amperage, tack_voltage,
          tack_vitesse_m, tack_vitesse_cm,
          tack_frequence, tack_type_gaz, tack_debit_gaz,
          soudure_vitesse_m, soudure_vitesse_cm,
          soudure_type_fil, soudure_type_flux,
          createur_id, createur_nom, createur_prenom, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        presetNumero, diametre_pouce || null,
        parametres.strip_vitesse_m || 0, parametres.strip_vitesse_cm || 0,
        parametres.milling_edge_gauche || 0, parametres.milling_edge_droit || 0,
        parametres.pression_rouleaux || null, parametres.pression_rouleaux_unite || 'tonnes',
        parametres.tack_amperage || 0, parametres.tack_voltage || 0,
        parametres.tack_vitesse_m || 0, parametres.tack_vitesse_cm || 0,
        parametres.tack_frequence || null, parametres.tack_type_gaz || 'CO2', parametres.tack_debit_gaz || null,
        parametres.soudure_vitesse_m || 0, parametres.soudure_vitesse_cm || 0,
        parametres.soudure_type_fil || '1.6mm', parametres.soudure_type_flux || 'SAW',
        operateur_id, operateur_nom, operateur_prenom,
        parametres.notes || `Paramètres personnalisés pour tube ${numero}`
      ]);
      usedParametreId = presetResult.insertId;

      // Insérer les têtes si fournies
      if (parametres.heads && parametres.heads.length > 0) {
        for (const head of parametres.heads) {
          await conn.query(`
            INSERT INTO preset_soudure_heads (preset_id, type, numero, actif, amperage, voltage, type_fil)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [usedParametreId, head.type, head.numero, head.actif ? 1 : 0, head.amperage || 0, head.voltage || 0, head.type_fil || '3.2mm']);
        }
      }
    }

    // Gérer cross welding
    let lot_id_2 = null;
    if (type_tube === 'cross_welding') {
      const [lots] = await conn.query(
        "SELECT id FROM lots WHERE statut = 'en_production' AND id != ? ORDER BY created_at ASC LIMIT 1",
        [lot_id]
      );
      if (lots.length > 0) {
        lot_id_2 = lots[0].id;
        // Clôturer le premier lot
        await conn.query("UPDATE lots SET statut = 'termine' WHERE id = ?", [lot_id]);
      }
    }

    // Créer le tube
    const [result] = await conn.query(`
      INSERT INTO tubes (lot_id, lot_id_2, type_tube, numero, diametre_mm, diametre_pouce,
        longueur, epaisseur, operateur_id, operateur_nom, operateur_prenom,
        parametre_id, notes, statut, etape_courante)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_production', 1)
    `, [
      lot_id, lot_id_2, type_tube || 'normal', numero,
      diametre_mm, diametre_pouce || null,
      longueur || null, epaisseur || null,
      operateur_id, operateur_nom, operateur_prenom,
      usedParametreId, notes || null
    ]);

    const tubeId = result.insertId;

    // Créer les 12 étapes
    for (const etape of ETAPES_PRODUCTION) {
      const statut = etape.numero === 1 ? 'en_cours' : 'en_attente';
      const started = etape.numero === 1 ? 'NOW()' : 'NULL';
      await conn.query(`
        INSERT INTO tube_etapes (tube_id, etape_numero, etape_code, statut, offline, started_at)
        VALUES (?, ?, ?, ?, ?, ${started})
      `, [tubeId, etape.numero, etape.code, statut, etape.offline ? 1 : 0]);
    }

    await conn.commit();

    // Récupérer le tube créé
    const [newTube] = await pool.query(`
      SELECT t.*, l.numero as lot_numero, l2.numero as lot_numero_2,
             b.numero as bobine_numero, b.epaisseur as bobine_epaisseur,
             pp.code as parametre_numero
      FROM tubes t
      LEFT JOIN lots l ON t.lot_id = l.id
      LEFT JOIN lots l2 ON t.lot_id_2 = l2.id
      LEFT JOIN bobines b ON l.bobine_id = b.id
      LEFT JOIN presets_soudure pp ON t.parametre_id = pp.id
      WHERE t.id = ?
    `, [tubeId]);

    const [etapes] = await pool.query(
      'SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [tubeId]
    );
    newTube[0].etapes = etapes;

    logAudit({ action: 'CREATE', entite: 'tube', entiteId: tubeId, req, details: { numero, diametre_mm, lot_id } });

    res.status(201).json(newTube[0]);
  } catch (error) {
    await conn.rollback();
    console.error('Erreur POST /tubes:', error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ce numéro de tube existe déjà' });
    res.status(500).json({ error: 'Erreur création tube' });
  } finally {
    conn.release();
  }
});

// ============================================
// PUT /api/tubes/:id/valider-etape
// ============================================
router.put('/:id/valider-etape', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { etape_numero, commentaire } = req.body;
    const operateur_id = req.user?.operateurId || req.user?.userId || null;
    const operateur_nom = req.user?.nom || null;
    const operateur_prenom = req.user?.prenom || null;

    const [tube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    if (tube.length === 0) return res.status(404).json({ error: 'Tube non trouvé' });
    if (tube[0].statut === 'en_attente') {
      return res.status(400).json({ error: 'Tube bloqué (non-conformité). Résolvez-la d\'abord.' });
    }

    await pool.query(`
      UPDATE tube_etapes SET statut = 'valide',
        operateur_id = ?, operateur_nom = ?, operateur_prenom = ?,
        commentaire = ?, completed_at = NOW()
      WHERE tube_id = ? AND etape_numero = ?
    `, [operateur_id, operateur_nom, operateur_prenom, commentaire || null, id, etape_numero]);

    // Enregistrer saw_date si étape SAW (étape 4)
    if (etape_numero === 4) {
      await pool.query('UPDATE tubes SET saw_date = NOW() WHERE id = ?', [id]);
    }

    const nextEtape = etape_numero + 1;
    if (nextEtape <= TOTAL_ETAPES) {
      await pool.query(`
        UPDATE tube_etapes SET statut = 'en_cours', started_at = NOW()
        WHERE tube_id = ? AND etape_numero = ? AND statut = 'en_attente'
      `, [id, nextEtape]);
      await pool.query('UPDATE tubes SET etape_courante = ? WHERE id = ?', [nextEtape, id]);
    } else {
      const [remaining] = await pool.query(
        "SELECT COUNT(*) as cnt FROM tube_etapes WHERE tube_id = ? AND statut NOT IN ('valide','saute')", [id]
      );
      if (remaining[0].cnt === 0) {
        await pool.query("UPDATE tubes SET statut = 'termine', etape_courante = ?, date_fin_production = NOW() WHERE id = ?", [TOTAL_ETAPES, id]);
      }
    }

    await logEtapeHistorique(id, etape_numero, 'validation', commentaire, req);
    logAudit({ action: 'VALIDATE', entite: 'tube', entiteId: id, req, details: { etape_numero, commentaire } });

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur valider-etape:', error);
    res.status(500).json({ error: 'Erreur validation étape' });
  }
});

// ============================================
// PUT /api/tubes/:id/non-conforme
// ============================================
router.put('/:id/non-conforme', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { etape_numero, commentaire } = req.body;
    const operateur_id = req.user?.operateurId || req.user?.userId || null;
    const operateur_nom = req.user?.nom || null;
    const operateur_prenom = req.user?.prenom || null;

    await pool.query(`
      UPDATE tube_etapes SET statut = 'non_conforme',
        operateur_id = ?, operateur_nom = ?, operateur_prenom = ?,
        commentaire = ?, completed_at = NOW()
      WHERE tube_id = ? AND etape_numero = ?
    `, [operateur_id, operateur_nom, operateur_prenom, commentaire || 'Non conformité détectée', id, etape_numero]);

    await pool.query("UPDATE tubes SET statut = 'en_attente' WHERE id = ?", [id]);
    await logEtapeHistorique(id, etape_numero, 'nc', commentaire || 'Non conformité détectée', req);

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur non-conforme:', error);
    res.status(500).json({ error: 'Erreur marquage non-conforme' });
  }
});

// ============================================
// PUT /api/tubes/:id/resoudre-nc
// ============================================
router.put('/:id/resoudre-nc', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { etape_numero, action, commentaire } = req.body;

    if (action === 'rebut') {
      await pool.query("UPDATE tubes SET statut = 'rebut' WHERE id = ?", [id]);
      await pool.query(`UPDATE tube_etapes SET commentaire = CONCAT(IFNULL(commentaire,''), ' | REBUT: ', ?) WHERE tube_id = ? AND etape_numero = ?`, [commentaire || 'Décision rebut', id, etape_numero]);
      await logEtapeHistorique(id, etape_numero, 'rebut', commentaire || 'Décision rebut', req);

    } else if (action === 'reprise') {
      await pool.query(`UPDATE tube_etapes SET statut = 'en_cours', completed_at = NULL, commentaire = CONCAT(IFNULL(commentaire,''), ' | REPRISE: ', ?) WHERE tube_id = ? AND etape_numero = ?`, [commentaire || 'Reprise après NC', id, etape_numero]);
      await pool.query("UPDATE tubes SET statut = 'en_production', etape_courante = ? WHERE id = ?", [etape_numero, id]);
      await logEtapeHistorique(id, etape_numero, 'reprise', commentaire || 'Reprise après NC', req);

    } else if (action === 'derogation') {
      await pool.query(`UPDATE tube_etapes SET statut = 'valide', commentaire = CONCAT(IFNULL(commentaire,''), ' | DÉROGATION: ', ?) WHERE tube_id = ? AND etape_numero = ?`, [commentaire || 'Dérogation accordée', id, etape_numero]);
      await logEtapeHistorique(id, etape_numero, 'derogation', commentaire || 'Dérogation accordée', req);

      const nextEtape = etape_numero + 1;
      if (nextEtape <= TOTAL_ETAPES) {
        await pool.query(`UPDATE tube_etapes SET statut = 'en_cours', started_at = NOW() WHERE tube_id = ? AND etape_numero = ? AND statut = 'en_attente'`, [id, nextEtape]);
        await pool.query("UPDATE tubes SET statut = 'en_production', etape_courante = ? WHERE id = ?", [nextEtape, id]);
      } else {
        await pool.query("UPDATE tubes SET statut = 'termine', etape_courante = ?, date_fin_production = NOW() WHERE id = ?", [TOTAL_ETAPES, id]);
      }
    }

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur résoudre NC:', error);
    res.status(500).json({ error: 'Erreur résolution non-conformité' });
  }
});

// ============================================
// PUT /api/tubes/:id/reparer-etape - Multi-défauts
// ============================================
router.put('/:id/reparer-etape', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { etape_numero, commentaire, defauts } = req.body;
    let defautsList = defauts || [];
    if (!defauts && req.body.defaut) {
      defautsList = [{ defaut: req.body.defaut, cause_defaut: req.body.cause_defaut, responsabilite_id: req.body.responsabilite_id, action_prise: req.body.action_prise }];
    }

    const operateur_id = req.user?.operateurId || req.user?.userId || null;
    const operateur_nom = req.user?.nom || null;
    const operateur_prenom = req.user?.prenom || null;

    const [tube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    if (tube.length === 0) return res.status(404).json({ error: 'Tube non trouvé' });

    const [etape] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? AND etape_numero = ?', [id, etape_numero]);
    if (etape.length === 0) return res.status(404).json({ error: 'Étape non trouvée' });
    if (etape[0].statut !== 'en_cours') return res.status(400).json({ error: 'Seules les étapes en cours peuvent être mises en réparation' });
    if (defautsList.length === 0 || !defautsList[0].defaut) return res.status(400).json({ error: 'Au moins un défaut doit être renseigné' });

    // Enrichir avec noms de responsabilité
    for (const d of defautsList) {
      if (d.responsabilite_id) {
        const [resp] = await pool.query('SELECT nom FROM responsabilites WHERE id = ?', [d.responsabilite_id]);
        d.responsabilite_nom = resp.length > 0 ? resp[0].nom : null;
      } else { d.responsabilite_nom = null; }
    }

    let commentaireDetaille = defautsList.map((d, i) => {
      let parts = [];
      if (d.defaut) parts.push(`DÉFAUT${defautsList.length > 1 ? ` ${i+1}` : ''}: ${d.defaut}`);
      if (d.cause_defaut) parts.push(`CAUSE: ${d.cause_defaut}`);
      if (d.responsabilite_nom) parts.push(`RESP: ${d.responsabilite_nom}`);
      if (d.action_prise) parts.push(`ACTION: ${d.action_prise}`);
      return parts.join(' | ');
    }).join(' || ');
    if (commentaire) commentaireDetaille += ` | NOTE: ${commentaire}`;

    await pool.query(`UPDATE tube_etapes SET statut = 'en_reparation', operateur_id = ?, operateur_nom = ?, operateur_prenom = ?, commentaire = CONCAT(IFNULL(commentaire,''), ' | RÉPARATION: ', ?) WHERE tube_id = ? AND etape_numero = ?`, [operateur_id, operateur_nom, operateur_prenom, commentaireDetaille, id, etape_numero]);
    await pool.query("UPDATE tubes SET statut = 'en_reparation' WHERE id = ?", [id]);

    const firstDefaut = defautsList[0];
    const repairData = { defaut: firstDefaut.defaut, cause_defaut: firstDefaut.cause_defaut, responsabilite_id: firstDefaut.responsabilite_id, responsabilite_nom: firstDefaut.responsabilite_nom, action_prise: firstDefaut.action_prise };
    await logEtapeHistorique(id, etape_numero, 'reparation', commentaire || 'Réparation initiée', req, repairData);

    const [lastHistorique] = await pool.query(`SELECT id FROM tube_etape_historique WHERE tube_id = ? AND etape_numero = ? AND type_action = 'reparation' ORDER BY id DESC LIMIT 1`, [id, etape_numero]);
    const historiqueId = lastHistorique[0]?.id;

    if (historiqueId) {
      for (let i = 0; i < defautsList.length; i++) {
        const d = defautsList[i];
        await pool.query(`INSERT INTO reparation_defauts (historique_id, tube_id, etape_numero, defaut, cause_defaut, responsabilite_id, responsabilite_nom, action_prise, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [historiqueId, id, etape_numero, d.defaut, d.cause_defaut || null, d.responsabilite_id || null, d.responsabilite_nom || null, d.action_prise || null, i + 1]);
      }
    }

    logAudit({ action: 'REPAIR', entite: 'tube', entiteId: id, req, details: { etape_numero, nb_defauts: defautsList.length } });

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur reparer-etape:', error);
    res.status(500).json({ error: 'Erreur mise en réparation' });
  }
});

// ============================================
// PUT /api/tubes/:id/resoudre-reparation
// ============================================
router.put('/:id/resoudre-reparation', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { etape_numero, action, commentaire } = req.body;
    const operateur_id = req.user?.operateurId || req.user?.userId || null;
    const operateur_nom = req.user?.nom || null;
    const operateur_prenom = req.user?.prenom || null;

    const [tube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    if (tube.length === 0) return res.status(404).json({ error: 'Tube non trouvé' });

    if (action === 'accepter') {
      await pool.query(`UPDATE tube_etapes SET statut = 'valide', operateur_id = ?, operateur_nom = ?, operateur_prenom = ?, commentaire = CONCAT(IFNULL(commentaire,''), ' | ACCEPTÉ APRÈS RÉPARATION: ', ?), completed_at = NOW() WHERE tube_id = ? AND etape_numero = ?`, [operateur_id, operateur_nom, operateur_prenom, commentaire || 'Accepté après réparation', id, etape_numero]);
      await logEtapeHistorique(id, etape_numero, 'reparation_accepte', commentaire || 'Accepté après réparation', req);

      const nextEtape = etape_numero + 1;
      if (nextEtape <= TOTAL_ETAPES) {
        await pool.query(`UPDATE tube_etapes SET statut = 'en_cours', started_at = NOW() WHERE tube_id = ? AND etape_numero = ? AND statut = 'en_attente'`, [id, nextEtape]);
        await pool.query("UPDATE tubes SET statut = 'en_production', etape_courante = ? WHERE id = ?", [nextEtape, id]);
      } else {
        const [remaining] = await pool.query("SELECT COUNT(*) as cnt FROM tube_etapes WHERE tube_id = ? AND statut NOT IN ('valide','saute')", [id]);
        if (remaining[0].cnt === 0) {
          await pool.query("UPDATE tubes SET statut = 'termine', etape_courante = ?, date_fin_production = NOW() WHERE id = ?", [TOTAL_ETAPES, id]);
        } else {
          await pool.query("UPDATE tubes SET statut = 'en_production' WHERE id = ?", [id]);
        }
      }

    } else if (action === 'derogation') {
      await pool.query(`UPDATE tube_etapes SET statut = 'valide', operateur_id = ?, operateur_nom = ?, operateur_prenom = ?, commentaire = CONCAT(IFNULL(commentaire,''), ' | DÉROGATION RÉPARATION: ', ?), completed_at = NOW() WHERE tube_id = ? AND etape_numero = ?`, [operateur_id, operateur_nom, operateur_prenom, commentaire || 'Dérogation accordée', id, etape_numero]);
      await logEtapeHistorique(id, etape_numero, 'reparation_derogation', commentaire || 'Dérogation après réparation', req);
      const nextEtape = etape_numero + 1;
      if (nextEtape <= TOTAL_ETAPES) {
        await pool.query(`UPDATE tube_etapes SET statut = 'en_cours', started_at = NOW() WHERE tube_id = ? AND etape_numero = ? AND statut = 'en_attente'`, [id, nextEtape]);
        await pool.query("UPDATE tubes SET statut = 'en_production', etape_courante = ? WHERE id = ?", [nextEtape, id]);
      } else {
        const [remaining] = await pool.query("SELECT COUNT(*) as cnt FROM tube_etapes WHERE tube_id = ? AND statut NOT IN ('valide','saute')", [id]);
        if (remaining[0].cnt === 0) {
          await pool.query("UPDATE tubes SET statut = 'termine', etape_courante = ?, date_fin_production = NOW() WHERE id = ?", [TOTAL_ETAPES, id]);
        } else {
          await pool.query("UPDATE tubes SET statut = 'en_production' WHERE id = ?", [id]);
        }
      }

    } else if (action === 'rebut') {
      await pool.query("UPDATE tubes SET statut = 'rebut' WHERE id = ?", [id]);
      await pool.query(`UPDATE tube_etapes SET commentaire = CONCAT(IFNULL(commentaire,''), ' | REBUT RÉPARATION: ', ?) WHERE tube_id = ? AND etape_numero = ?`, [commentaire || 'Rebuté après réparation', id, etape_numero]);
      await logEtapeHistorique(id, etape_numero, 'reparation_rebut', commentaire || 'Rebuté après réparation', req);

    } else if (action === 'encore_reparation') {
      await pool.query(`UPDATE tube_etapes SET commentaire = CONCAT(IFNULL(commentaire,''), ' | RÉPARATION SUPPLÉMENTAIRE: ', ?) WHERE tube_id = ? AND etape_numero = ?`, [commentaire || 'Réparation supplémentaire', id, etape_numero]);
      await logEtapeHistorique(id, etape_numero, 'reparation', commentaire || 'Réparation supplémentaire', req);
    }

    logAudit({ action: 'REPAIR_RESOLVE', entite: 'tube', entiteId: id, req, details: { etape_numero, action, commentaire } });

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur résoudre-reparation:', error);
    res.status(500).json({ error: 'Erreur résolution réparation' });
  }
});

// ============================================
// PUT /api/tubes/:id/interrompre-etape
// ============================================
router.put('/:id/interrompre-etape', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { etape_numero, motif, commentaire } = req.body;
    const operateur_id = req.user?.operateurId || req.user?.userId || null;
    const operateur_nom = req.user?.nom || null;
    const operateur_prenom = req.user?.prenom || null;

    const [etape] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? AND etape_numero = ?', [id, etape_numero]);
    if (etape.length === 0) return res.status(404).json({ error: 'Étape non trouvée' });
    if (etape[0].statut !== 'en_cours') return res.status(400).json({ error: 'Seules les étapes en cours peuvent être interrompues' });

    const fullComment = commentaire ? `${motif || 'Interruption'}: ${commentaire}` : (motif || 'Interruption');

    await pool.query(`UPDATE tube_etapes SET statut = 'interrompu', operateur_id = ?, operateur_nom = ?, operateur_prenom = ?, commentaire = CONCAT(IFNULL(commentaire,''), ' | INTERRUPTION: ', ?) WHERE tube_id = ? AND etape_numero = ?`, [operateur_id, operateur_nom, operateur_prenom, fullComment, id, etape_numero]);
    await pool.query("UPDATE tubes SET statut = 'interrompu' WHERE id = ?", [id]);
    await logEtapeHistorique(id, etape_numero, 'interruption', fullComment, req);

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur interrompre-etape:', error);
    res.status(500).json({ error: 'Erreur interruption' });
  }
});

// ============================================
// PUT /api/tubes/:id/reprendre-etape
// ============================================
router.put('/:id/reprendre-etape', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { etape_numero, commentaire } = req.body;
    const operateur_id = req.user?.operateurId || req.user?.userId || null;
    const operateur_nom = req.user?.nom || null;
    const operateur_prenom = req.user?.prenom || null;

    const [etape] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? AND etape_numero = ?', [id, etape_numero]);
    if (etape.length === 0) return res.status(404).json({ error: 'Étape non trouvée' });
    if (etape[0].statut !== 'interrompu') return res.status(400).json({ error: 'Seules les étapes interrompues peuvent être reprises' });

    await pool.query(`UPDATE tube_etapes SET statut = 'en_cours', operateur_id = ?, operateur_nom = ?, operateur_prenom = ?, commentaire = CONCAT(IFNULL(commentaire,''), ' | REPRISE: ', ?) WHERE tube_id = ? AND etape_numero = ?`, [operateur_id, operateur_nom, operateur_prenom, commentaire || 'Reprise après interruption', id, etape_numero]);
    await pool.query("UPDATE tubes SET statut = 'en_production' WHERE id = ?", [id]);
    await logEtapeHistorique(id, etape_numero, 'reprise_interruption', commentaire || 'Reprise après interruption', req);

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur reprendre-etape:', error);
    res.status(500).json({ error: 'Erreur reprise' });
  }
});

// ============================================
// PUT /api/tubes/:id/annuler-etape
// Annuler (undo) validation - System Admin only
// ============================================
router.put('/:id/annuler-etape', canAct, async (req, res) => {
  try {
    // System Admin only
    if (req.user.role !== 'system_admin') {
      return res.status(403).json({ error: 'Seul l\'Admin Système peut annuler une étape' });
    }

    const { id } = req.params;
    const { etape_numero, commentaire } = req.body;
    // etape_numero = l'étape courante (en_cours). On annule la précédente (etape_numero - 1).

    if (!etape_numero || etape_numero <= 1) {
      return res.status(400).json({ error: 'Impossible d\'annuler : pas d\'étape précédente' });
    }

    const prevEtapeNum = etape_numero - 1;

    // Vérifier que l'étape courante est en_cours
    const [currentEtape] = await pool.query(
      'SELECT * FROM tube_etapes WHERE tube_id = ? AND etape_numero = ?', [id, etape_numero]
    );
    if (currentEtape.length === 0) return res.status(404).json({ error: 'Étape courante non trouvée' });
    if (currentEtape[0].statut !== 'en_cours') {
      return res.status(400).json({ error: 'L\'étape courante doit être en cours pour annuler la précédente' });
    }

    // Vérifier que l'étape précédente est validée
    const [prevEtape] = await pool.query(
      'SELECT * FROM tube_etapes WHERE tube_id = ? AND etape_numero = ?', [id, prevEtapeNum]
    );
    if (prevEtape.length === 0) return res.status(404).json({ error: 'Étape précédente non trouvée' });
    if (prevEtape[0].statut !== 'valide') {
      return res.status(400).json({ error: 'L\'étape précédente n\'est pas validée' });
    }

    // Réinitialiser l'étape courante : en_cours -> en_attente
    await pool.query(`
      UPDATE tube_etapes SET statut = 'en_attente', started_at = NULL
      WHERE tube_id = ? AND etape_numero = ?
    `, [id, etape_numero]);

    // Rétablir l'étape précédente : valide -> en_cours
    await pool.query(`
      UPDATE tube_etapes SET statut = 'en_cours', completed_at = NULL,
        operateur_id = NULL, operateur_nom = NULL, operateur_prenom = NULL,
        commentaire = CONCAT(IFNULL(commentaire,''), ' | ANNULATION: ', ?)
      WHERE tube_id = ? AND etape_numero = ?
    `, [commentaire || 'Annulation validation', id, prevEtapeNum]);

    // Mettre à jour etape_courante du tube
    await pool.query('UPDATE tubes SET etape_courante = ? WHERE id = ?', [prevEtapeNum, id]);

    // Si on annule l'étape 4 (SAW), effacer saw_date
    if (prevEtapeNum === 4) {
      await pool.query('UPDATE tubes SET saw_date = NULL WHERE id = ?', [id]);
    }

    // Si le tube était terminé, le remettre en_production
    const [tubeCheck] = await pool.query('SELECT statut FROM tubes WHERE id = ?', [id]);
    if (tubeCheck[0]?.statut === 'termine') {
      await pool.query("UPDATE tubes SET statut = 'en_production', date_fin_production = NULL WHERE id = ?", [id]);
    }

    await logEtapeHistorique(id, prevEtapeNum, 'annulation', commentaire || 'Annulation validation par Admin Système', req);
    logAudit({ action: 'ANNULER', entite: 'tube', entiteId: id, req, details: { etape_annulee: prevEtapeNum, commentaire } });

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur annuler-etape:', error);
    res.status(500).json({ error: 'Erreur annulation étape' });
  }
});

// ============================================
// PUT /api/tubes/:id/reviser-rebut
// ============================================
router.put('/:id/reviser-rebut', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;

    const [tube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    if (tube.length === 0) return res.status(404).json({ error: 'Tube non trouvé' });
    if (tube[0].statut !== 'rebut') return res.status(400).json({ error: 'Seuls les tubes en rebut peuvent être révisés' });

    const [rebutHistory] = await pool.query(`SELECT etape_numero FROM tube_etape_historique WHERE tube_id = ? AND type_action IN ('rebut', 'reparation_rebut') ORDER BY created_at DESC LIMIT 1`, [id]);
    const etapeNumero = rebutHistory.length > 0 ? rebutHistory[0].etape_numero : tube[0].etape_courante;

    await pool.query(`UPDATE tube_etapes SET statut = 'non_conforme', commentaire = CONCAT(IFNULL(commentaire,''), ' | RÉVISION REBUT: ', ?) WHERE tube_id = ? AND etape_numero = ?`, [commentaire || 'Décision de rebut révisée', id, etapeNumero]);
    await pool.query("UPDATE tubes SET statut = 'en_attente', etape_courante = ? WHERE id = ?", [etapeNumero, id]);
    await logEtapeHistorique(id, etapeNumero, 'revision_rebut', commentaire || 'Décision de rebut révisée', req);

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur reviser-rebut:', error);
    res.status(500).json({ error: 'Erreur révision rebut' });
  }
});

// ============================================
// PUT /api/tubes/:id/sauter-etape
// ============================================
router.put('/:id/sauter-etape', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { etape_numero, motif } = req.body;
    const operateur_id = req.user?.operateurId || req.user?.userId || null;
    const operateur_nom = req.user?.nom || 'Système';
    const operateur_prenom = req.user?.prenom || '';

    const [etape] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? AND etape_numero = ?', [id, etape_numero]);
    if (etape.length === 0) return res.status(404).json({ error: 'Étape non trouvée' });
    if (etape[0].statut !== 'en_cours') return res.status(400).json({ error: 'Seules les étapes en cours peuvent être passées' });

    await pool.query(`UPDATE tube_etapes SET statut = 'saute', completed_at = NOW(), operateur_id = ?, operateur_nom = ?, operateur_prenom = ?, commentaire = ? WHERE tube_id = ? AND etape_numero = ?`, [operateur_id, operateur_nom, operateur_prenom, motif ? `PASSÉE: ${motif}` : 'PASSÉE (sans motif)', id, etape_numero]);
    await logEtapeHistorique(id, etape_numero, 'passer', motif || 'Passée sans motif', req);

    const nextEtape = etape_numero + 1;
    if (nextEtape <= TOTAL_ETAPES) {
      await pool.query(`UPDATE tube_etapes SET statut = 'en_cours', started_at = NOW() WHERE tube_id = ? AND etape_numero = ? AND statut = 'en_attente'`, [id, nextEtape]);
      await pool.query('UPDATE tubes SET etape_courante = ? WHERE id = ?', [nextEtape, id]);
    }

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur sauter-etape:', error);
    res.status(500).json({ error: 'Erreur saut étape' });
  }
});

// ============================================
// PUT /api/tubes/:id/valider-offline
// ============================================
router.put('/:id/valider-offline', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { etape_numero, commentaire } = req.body;
    const operateur_id = req.user?.operateurId || req.user?.userId || null;
    const operateur_nom = req.user?.nom || null;
    const operateur_prenom = req.user?.prenom || null;

    await pool.query(`UPDATE tube_etapes SET statut = 'valide', operateur_id = ?, operateur_nom = ?, operateur_prenom = ?, commentaire = ?, completed_at = NOW() WHERE tube_id = ? AND etape_numero = ? AND statut = 'saute'`, [operateur_id, operateur_nom, operateur_prenom, commentaire || null, id, etape_numero]);
    await logEtapeHistorique(id, etape_numero, 'validation_offline', commentaire, req);

    const [remaining] = await pool.query("SELECT COUNT(*) as cnt FROM tube_etapes WHERE tube_id = ? AND statut NOT IN ('valide','saute')", [id]);
    if (remaining[0].cnt === 0) {
      await pool.query("UPDATE tubes SET statut = 'termine', date_fin_production = NOW() WHERE id = ?", [id]);
    }

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur valider-offline:', error);
    res.status(500).json({ error: 'Erreur validation offline' });
  }
});

// ============================================
// PUT /api/tubes/:id/debut-decision
// ============================================
router.put('/:id/debut-decision', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const [tube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    if (tube.length === 0) return res.status(404).json({ error: 'Tube non trouvé' });
    if (tube[0].statut !== 'termine') return res.status(400).json({ error: 'Le tube doit être terminé' });

    if (!tube[0].date_debut_decision) {
      await pool.query('UPDATE tubes SET date_debut_decision = NOW() WHERE id = ?', [id]);
    }

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur debut-decision:', error);
    res.status(500).json({ error: 'Erreur début décision' });
  }
});

// ============================================
// PUT /api/tubes/:id/decision
// ============================================
router.put('/:id/decision', canAct, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, commentaire } = req.body;
    const decision_par = req.user ? `${req.user.prenom || ''} ${req.user.nom || ''}`.trim() : 'Système';

    const validDecisions = ['certifie_api', 'certifie_hydraulique', 'declasse'];
    if (!validDecisions.includes(decision)) return res.status(400).json({ error: 'Décision invalide' });

    const [tube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    if (tube.length === 0) return res.status(404).json({ error: 'Tube non trouvé' });
    if (tube[0].statut !== 'termine') return res.status(400).json({ error: 'Le tube doit être terminé' });

    await pool.query(`UPDATE tubes SET decision = ?, decision_date = NOW(), decision_par = ?, decision_commentaire = ?, date_fin_decision = NOW() WHERE id = ?`, [decision, decision_par, commentaire || null, id]);

    logAudit({ action: 'DECISION', entite: 'tube', entiteId: id, req, details: { decision, commentaire, decision_par } });

    const [updatedTube] = await pool.query('SELECT * FROM tubes WHERE id = ?', [id]);
    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [id]);
    updatedTube[0].etapes = etapes;
    res.json(updatedTube[0]);
  } catch (error) {
    console.error('Erreur decision:', error);
    res.status(500).json({ error: 'Erreur enregistrement décision' });
  }
});

// ============================================
// ROUTES PHOTOS
// ============================================
router.get('/:id/etape/:etape/photos', async (req, res) => {
  try {
    const [photos] = await pool.query(`SELECT * FROM tube_etape_photos WHERE tube_id = ? AND etape_numero = ? ORDER BY created_at ASC`, [req.params.id, req.params.etape]);
    res.json(photos);
  } catch (error) {
    console.error('Erreur GET photos étape:', error);
    res.status(500).json({ error: 'Erreur récupération photos' });
  }
});

router.get('/:id/photos', async (req, res) => {
  try {
    const [photos] = await pool.query(`SELECT * FROM tube_etape_photos WHERE tube_id = ? ORDER BY etape_numero ASC, created_at ASC`, [req.params.id]);
    res.json(photos);
  } catch (error) {
    console.error('Erreur GET all photos:', error);
    res.status(500).json({ error: 'Erreur récupération photos' });
  }
});

router.post('/:id/etape/:etape/photos', uploadTubeEtapePhotos.array('photos', 5), async (req, res) => {
  try {
    const tubeId = req.params.id;
    const etapeNumero = parseInt(req.params.etape);
    const uploaded_by = req.user?.operateurId || req.user?.userId || null;
    const description = req.body.description || null;

    const [existing] = await pool.query('SELECT COUNT(*) as count FROM tube_etape_photos WHERE tube_id = ? AND etape_numero = ?', [tubeId, etapeNumero]);
    const newCount = req.files ? req.files.length : 0;
    if (existing[0].count + newCount > 10) {
      if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
      return res.status(400).json({ error: `Maximum 10 photos par étape. Actuellement: ${existing[0].count}` });
    }

    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Aucun fichier fourni' });

    const insertedPhotos = [];
    for (const file of req.files) {
      const [result] = await pool.query(
        `INSERT INTO tube_etape_photos (tube_id, etape_numero, filename, original_name, mimetype, size, path, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tubeId, etapeNumero, file.filename, file.originalname, file.mimetype, file.size, `/uploads/tubes/${file.filename}`, description, uploaded_by]
      );
      insertedPhotos.push({ id: result.insertId, filename: file.filename, path: `/uploads/tubes/${file.filename}`, etape_numero: etapeNumero });
    }
    res.json({ message: `${insertedPhotos.length} photo(s) ajoutée(s)`, photos: insertedPhotos });
  } catch (error) {
    console.error('Erreur POST photos:', error);
    res.status(500).json({ error: 'Erreur upload photos' });
  }
});

router.delete('/:id/photos/:photoId', canAct, async (req, res) => {
  try {
    const [photo] = await pool.query('SELECT * FROM tube_etape_photos WHERE id = ? AND tube_id = ?', [req.params.photoId, req.params.id]);
    if (photo.length === 0) return res.status(404).json({ error: 'Photo non trouvée' });

    const filePath = path.join(tubesUploadsDir, photo[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await pool.query('DELETE FROM tube_etape_photos WHERE id = ?', [req.params.photoId]);
    res.json({ message: 'Photo supprimée' });
  } catch (error) {
    console.error('Erreur DELETE photo:', error);
    res.status(500).json({ error: 'Erreur suppression photo' });
  }
});

// ============================================
// GET /api/tubes/:id/etape-historique
// ============================================
router.get('/:id/etape-historique', async (req, res) => {
  try {
    const [historique] = await pool.query(`SELECT * FROM tube_etape_historique WHERE tube_id = ? ORDER BY etape_numero ASC, created_at ASC`, [req.params.id]);

    for (const entry of historique) {
      if (entry.type_action === 'reparation') {
        const [defauts] = await pool.query(`SELECT * FROM reparation_defauts WHERE historique_id = ? ORDER BY ordre ASC`, [entry.id]);
        entry.defauts = defauts;
      }
    }

    res.json(historique);
  } catch (error) {
    console.error('Erreur GET etape-historique:', error);
    res.status(500).json({ error: 'Erreur récupération historique' });
  }
});

// ============================================
// GET /api/tubes/:id/pdf - Rapport PDF
// ============================================
router.get('/:id/pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');

    const [tubes] = await pool.query(`
      SELECT t.*, l.numero as lot_numero, l2.numero as lot_numero_2,
             b.numero as bobine_numero, b.epaisseur as bobine_epaisseur,
             b.largeur as bobine_largeur, b.poids as bobine_poids,
             b.grade as grade_code,
             pp.code as parametre_numero
      FROM tubes t
      LEFT JOIN lots l ON t.lot_id = l.id
      LEFT JOIN lots l2 ON t.lot_id_2 = l2.id
      LEFT JOIN bobines b ON l.bobine_id = b.id
      LEFT JOIN presets_soudure pp ON t.parametre_id = pp.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (tubes.length === 0) return res.status(404).json({ error: 'Tube non trouvé' });
    const tube = tubes[0];

    const [etapes] = await pool.query('SELECT * FROM tube_etapes WHERE tube_id = ? ORDER BY etape_numero', [tube.id]);

    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Rapport Tube N°${tube.numero}`, Author: 'LogiTrack V2' } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tube_${tube.numero}.pdf`);
    doc.pipe(res);

    const primary = '#1e40af';
    const gray = '#6b7280';
    const green = '#16a34a';
    const red = '#dc2626';
    const amber = '#d97706';
    const pageWidth = doc.page.width - 80;

    // Title
    doc.fillColor(primary).fontSize(18).font('Helvetica-Bold').text(`Rapport Tube N°${tube.numero}`, 40, 40, { align: 'center', width: pageWidth });
    doc.moveDown(0.3);
    doc.fillColor(gray).fontSize(9).font('Helvetica').text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center', width: pageWidth });
    doc.moveDown(1);

    // Info
    doc.fillColor(primary).fontSize(12).font('Helvetica-Bold').text('INFORMATIONS GÉNÉRALES');
    doc.moveDown(0.5);

    const infos = [
      `Numéro: ${tube.numero}`,
      `Diamètre: ${tube.diametre_mm} mm ${tube.diametre_pouce ? `(${tube.diametre_pouce})` : ''}`,
      `Type: ${tube.type_tube === 'cross_welding' ? 'Cross Welding' : 'Normal'}`,
      `Lot: ${tube.lot_numero || '-'}${tube.lot_numero_2 ? ` → ${tube.lot_numero_2}` : ''}`,
      `Bobine: ${tube.bobine_numero || '-'}`,
      `Épaisseur: ${tube.epaisseur || tube.bobine_epaisseur || '-'} mm`,
      `Statut: ${tube.statut}`,
      `Décision: ${tube.decision || 'en_attente'}`,
    ];
    for (const info of infos) {
      doc.fillColor('#374151').fontSize(9).font('Helvetica').text(info);
    }
    doc.moveDown(1);

    // Steps
    doc.fillColor(primary).fontSize(12).font('Helvetica-Bold').text('ÉTAPES DE PRODUCTION');
    doc.moveDown(0.5);

    const ETAPE_NOMS = {};
    ETAPES_PRODUCTION.forEach(e => { ETAPE_NOMS[e.numero] = e.nom; });
    const statutLabels = { valide: 'Validé', non_conforme: 'Non Conforme', saute: 'Passée', en_cours: 'En cours', en_attente: 'En attente', en_reparation: 'En réparation', interrompu: 'Interrompu' };

    for (const etape of etapes) {
      const label = `${etape.etape_numero}. ${ETAPE_NOMS[etape.etape_numero] || etape.etape_code}`;
      const statut = statutLabels[etape.statut] || etape.statut;
      const sColor = etape.statut === 'valide' ? green : etape.statut === 'non_conforme' ? red : gray;

      doc.fillColor(sColor).fontSize(9).font('Helvetica-Bold').text(`${label} — ${statut}`, { continued: false });
      if (etape.operateur_prenom) {
        doc.fillColor(gray).fontSize(8).font('Helvetica').text(`  Par ${etape.operateur_prenom} ${(etape.operateur_nom || '')[0] || ''}. ${etape.completed_at ? 'le ' + new Date(etape.completed_at).toLocaleString('fr-FR') : ''}`);
      }
      if (etape.commentaire) {
        doc.fillColor('#6b7280').fontSize(8).font('Helvetica-Oblique').text(`  ${etape.commentaire}`);
      }
      doc.moveDown(0.3);
    }

    doc.end();
  } catch (error) {
    console.error('Erreur PDF:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Erreur génération PDF' });
  }
});

// ============================================
// DELETE /api/tubes/:id
// ============================================
router.delete('/:id', canAct, async (req, res) => {
  try {
    const [tube] = await pool.query('SELECT id FROM tubes WHERE id = ?', [req.params.id]);
    if (tube.length === 0) return res.status(404).json({ error: 'Tube non trouvé' });

    const [photos] = await pool.query('SELECT filename FROM tube_etape_photos WHERE tube_id = ?', [req.params.id]);
    for (const photo of photos) {
      const filePath = path.join(tubesUploadsDir, photo.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM tubes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Tube supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /tubes:', error);
    res.status(500).json({ error: 'Erreur suppression tube' });
  }
});

// ============================================
// ROUTES RESPONSABILITES
// ============================================
router.get('/responsabilites/list', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM responsabilites WHERE actif = 1 ORDER BY ordre, nom');
    res.json(rows);
  } catch (error) {
    console.error('Erreur GET responsabilites:', error);
    res.status(500).json({ error: 'Erreur récupération responsabilités' });
  }
});

router.post('/responsabilites', canAct, async (req, res) => {
  try {
    const { nom, description } = req.body;
    if (!nom) return res.status(400).json({ error: 'Nom requis' });
    const [maxOrdre] = await pool.query('SELECT MAX(ordre) as max FROM responsabilites');
    const ordre = (maxOrdre[0].max || 0) + 1;
    const [result] = await pool.query('INSERT INTO responsabilites (nom, description, ordre) VALUES (?, ?, ?)', [nom, description || null, ordre]);
    const [newRow] = await pool.query('SELECT * FROM responsabilites WHERE id = ?', [result.insertId]);
    res.status(201).json(newRow[0]);
  } catch (error) {
    console.error('Erreur POST responsabilites:', error);
    res.status(500).json({ error: 'Erreur ajout responsabilité' });
  }
});

router.put('/responsabilites/:id', canAct, async (req, res) => {
  try {
    const { nom, description, ordre } = req.body;
    if (!nom) return res.status(400).json({ error: 'Nom requis' });
    await pool.query('UPDATE responsabilites SET nom = ?, description = ?, ordre = ? WHERE id = ?', [nom, description || null, ordre ?? 0, req.params.id]);
    const [row] = await pool.query('SELECT * FROM responsabilites WHERE id = ?', [req.params.id]);
    if (!row.length) return res.status(404).json({ error: 'Responsabilité non trouvée' });
    res.json(row[0]);
  } catch (error) {
    console.error('Erreur PUT responsabilites:', error);
    res.status(500).json({ error: 'Erreur modification responsabilité' });
  }
});

router.delete('/responsabilites/:id', canAct, async (req, res) => {
  try {
    const [row] = await pool.query('SELECT * FROM responsabilites WHERE id = ?', [req.params.id]);
    if (!row.length) return res.status(404).json({ error: 'Responsabilité non trouvée' });
    await pool.query('UPDATE responsabilites SET actif = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Responsabilité supprimée' });
  } catch (error) {
    console.error('Erreur DELETE responsabilites:', error);
    res.status(500).json({ error: 'Erreur suppression responsabilité' });
  }
});

module.exports = router;
