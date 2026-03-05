const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Étapes de production (même liste que tubes.js)
const ETAPES_PRODUCTION = [
  { numero: 1, code: 'FORMAGE', nom: 'Formage' },
  { numero: 2, code: 'POINTAGE', nom: 'Pointage (GMAW)' },
  { numero: 3, code: 'CV_POINTAGE', nom: 'CV Pointage' },
  { numero: 4, code: 'SAW_ID_OD', nom: 'SAW ID/OD' },
  { numero: 5, code: 'CV_CORDON', nom: 'CV Cordon' },
  { numero: 6, code: 'MACRO', nom: 'Macro' },
  { numero: 7, code: 'CHANFREIN', nom: 'Chanfrein' },
  { numero: 8, code: 'HYDROTEST', nom: 'Hydrotest' },
  { numero: 9, code: 'CV_FUITE', nom: 'CV Fuite' },
  { numero: 10, code: 'UT', nom: 'UT' },
  { numero: 11, code: 'RADIO_SCOPIE', nom: 'Radio Scopie' },
  { numero: 12, code: 'CONTROLE_DIM', nom: 'Contrôle dimensionnel' },
];

// GET /api/dashboard/stats - Statistiques complètes du dashboard
router.get('/stats', async (req, res) => {
  try {
    // 1) Stats tubes
    const [tubeStats] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(statut IN ('en_production','en_reparation','interrompu','en_attente')) as en_cours,
        SUM(statut = 'en_reparation') as reparation,
        SUM(statut = 'interrompu') as interrompu,
        SUM(statut = 'termine') as termines,
        SUM(statut = 'rebut') as rebuts,
        SUM(decision = 'certifie_api') as certifie_api,
        SUM(decision = 'certifie_hydraulique') as certifie_hydraulique,
        SUM(decision = 'declasse') as declasse,
        SUM(DATE(created_at) = CURDATE()) as production_jour,
        SUM(statut = 'termine' AND DATE(date_fin_production) = CURDATE()) as termines_jour
      FROM tubes
    `);

    // 2) Pipeline — nombre de tubes par étape courante (en production uniquement)
    const [pipelineRows] = await pool.query(`
      SELECT etape_courante, COUNT(*) as count
      FROM tubes
      WHERE statut IN ('en_production', 'en_reparation', 'en_attente')
      GROUP BY etape_courante
    `);
    const pipelineMap = {};
    pipelineRows.forEach(r => { pipelineMap[r.etape_courante] = r.count; });

    const etapes = ETAPES_PRODUCTION.map(e => ({
      ...e,
      tubes_count: pipelineMap[e.numero] || 0
    }));

    // 3) Stats bobines
    const [[bobineStats]] = await pool.query(`
      SELECT 
        COALESCE(SUM(statut = 'en_stock'), 0) as en_stock,
        COALESCE(SUM(statut = 'en_cours'), 0) as en_cours,
        COALESCE(SUM(poids), 0) as poids_total
      FROM bobines
    `);

    // 4) Stats lots
    const [[lotStats]] = await pool.query(`
      SELECT
        COALESCE(SUM(statut = 'en_production'), 0) as en_production,
        COALESCE(SUM(statut = 'en_cours'), 0) as en_cours,
        COALESCE(SUM(statut = 'pret_production'), 0) as pret
      FROM lots
    `);

    // 5) Activité récente (dernières validations d'étapes)
    const [activite] = await pool.query(`
      SELECT te.id, te.tube_id, te.etape_numero, te.etape_code, te.completed_at as date_debut,
        t.numero as tube_numero,
        te.operateur_prenom, te.operateur_nom as operateur_nom_famille
      FROM tube_etapes te
      JOIN tubes t ON t.id = te.tube_id
      WHERE te.statut = 'valide' AND te.completed_at IS NOT NULL
      ORDER BY te.completed_at DESC
      LIMIT 10
    `);

    const etapeNomMap = {};
    ETAPES_PRODUCTION.forEach(e => { etapeNomMap[e.code] = e.nom; });

    const activiteFormatted = activite.map(a => ({
      id: a.id,
      tube_numero: a.tube_numero,
      etape_code: a.etape_code,
      etape_nom: etapeNomMap[a.etape_code] || a.etape_code,
      operateur_nom: a.operateur_prenom ? `${a.operateur_prenom} ${a.operateur_nom_famille}` : null,
      date_debut: a.date_debut
    }));

    res.json({
      tubes: {
        total: Number(tubeStats[0].total) || 0,
        en_cours: Number(tubeStats[0].en_cours) || 0,
        reparation: Number(tubeStats[0].reparation) || 0,
        interrompu: Number(tubeStats[0].interrompu) || 0,
        termines: Number(tubeStats[0].termines) || 0,
        rebuts: Number(tubeStats[0].rebuts) || 0,
        certifie_api: Number(tubeStats[0].certifie_api) || 0,
        certifie_hydraulique: Number(tubeStats[0].certifie_hydraulique) || 0,
        declasse: Number(tubeStats[0].declasse) || 0,
        production_jour: Number(tubeStats[0].production_jour) || 0,
        termines_jour: Number(tubeStats[0].termines_jour) || 0,
      },
      etapes,
      bobines: {
        en_stock: Number(bobineStats.en_stock) || 0,
        en_cours: Number(bobineStats.en_cours) || 0,
        poids_total: Number(bobineStats.poids_total) || 0,
      },
      lots: {
        en_production: Number(lotStats.en_production) || 0,
        en_cours: Number(lotStats.en_cours) || 0,
        pret: Number(lotStats.pret) || 0,
      },
      activite_recente: activiteFormatted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur dashboard stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
