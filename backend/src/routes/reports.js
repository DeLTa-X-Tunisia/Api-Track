/**
 * Routes Rapports & Export
 * Génération de rapports Excel pour Logi-Track V2
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const ExcelJS = require('exceljs');

// Middleware auth sur toutes les routes
router.use(authenticateToken);

// Étapes de production (identique à tubes.js)
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
  { numero: 12, code: 'CONTROLE_DIM', nom: 'Contrôle dim.' },
];

// ============================================
// HELPER: Styles
// ============================================
const COLORS = {
  headerBg: 'FF1A56DB',     // Blue header
  headerFont: 'FFFFFFFF',   // White
  sectionBg: 'FFF3F4F6',    // Light gray
  greenBg: 'FFD1FAE5',      // Green light
  greenFont: 'FF065F46',
  orangeBg: 'FFFEF3C7',     // Orange light
  orangeFont: 'FF92400E',
  redBg: 'FFFEE2E2',        // Red light
  redFont: 'FF991B1B',
  borderColor: 'FFD1D5DB',
  repairHeaderBg: 'FFEF4444', // Red header for repairs
};

function applyHeaderStyle(cell) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  cell.font = { bold: true, color: { argb: COLORS.headerFont }, size: 10 };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.borderColor } },
    bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
    left: { style: 'thin', color: { argb: COLORS.borderColor } },
    right: { style: 'thin', color: { argb: COLORS.borderColor } },
  };
}

function applyRepairHeaderStyle(cell) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.repairHeaderBg } };
  cell.font = { bold: true, color: { argb: COLORS.headerFont }, size: 10 };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.borderColor } },
    bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
    left: { style: 'thin', color: { argb: COLORS.borderColor } },
    right: { style: 'thin', color: { argb: COLORS.borderColor } },
  };
}

function applyCellStyle(cell, options = {}) {
  cell.alignment = { vertical: 'middle', horizontal: options.align || 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.borderColor } },
    bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
    left: { style: 'thin', color: { argb: COLORS.borderColor } },
    right: { style: 'thin', color: { argb: COLORS.borderColor } },
  };
  cell.font = { size: 9 };
  if (options.bold) cell.font.bold = true;
  if (options.bgColor) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: options.bgColor } };
  }
  if (options.fontColor) {
    cell.font.color = { argb: options.fontColor };
  }
}

function getStatutDisplay(statut) {
  const map = {
    'en_production': 'En production',
    'termine': 'Terminé',
    'rebut': 'Rebut',
    'en_attente': 'En attente',
    'en_reparation': 'En réparation',
    'interrompu': 'Interrompu',
  };
  return map[statut] || statut || '-';
}

function getDecisionDisplay(decision) {
  const map = {
    'en_attente': 'En attente',
    'certifie_api': 'Certifié API',
    'certifie_hydraulique': 'Certifié Hydraulique',
    'declasse': 'Déclassé',
  };
  return map[decision] || decision || '-';
}

function getEtapeStatutDisplay(statut) {
  const map = {
    'valide': '✓',
    'en_cours': '●',
    'en_attente': '-',
    'non_conforme': '✗',
    'saute': '⊘',
    'en_reparation': '⚠',
    'interrompu': '⏸',
  };
  return map[statut] || statut || '-';
}

function getEtapeStatutStyle(statut) {
  switch (statut) {
    case 'valide': return { bgColor: COLORS.greenBg, fontColor: COLORS.greenFont };
    case 'en_cours': return { bgColor: COLORS.orangeBg, fontColor: COLORS.orangeFont };
    case 'non_conforme':
    case 'en_reparation': return { bgColor: COLORS.redBg, fontColor: COLORS.redFont };
    default: return {};
  }
}

function formatDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// GET /api/reports/situation-generale
// Export Excel: Situation Générale (Tubes + Réparations)
// ============================================
router.get('/situation-generale', async (req, res) => {
  try {
    // 1. Fetch all tubes with lot info
    const [tubes] = await pool.query(`
      SELECT t.*, 
             l.numero AS lot_numero,
             b.numero AS bobine_numero, b.grade AS bobine_grade, b.fournisseur AS bobine_fournisseur
      FROM tubes t
      LEFT JOIN lots l ON t.lot_id = l.id
      LEFT JOIN bobines b ON l.bobine_id = b.id
      ORDER BY t.id ASC
    `);

    // 2. Fetch all tube_etapes
    const [etapes] = await pool.query(`
      SELECT te.tube_id, te.etape_numero, te.statut, te.completed_at, te.operateur_nom, te.operateur_prenom
      FROM tube_etapes te
      ORDER BY te.tube_id, te.etape_numero
    `);

    // 3. Fetch all repair defects
    const [repairs] = await pool.query(`
      SELECT rd.*, t.numero AS tube_numero,
             h.type_action, h.created_at AS repair_date, h.operateur_nom AS repair_operateur_nom, h.operateur_prenom AS repair_operateur_prenom
      FROM reparation_defauts rd
      LEFT JOIN tubes t ON rd.tube_id = t.id
      LEFT JOIN tube_etape_historique h ON rd.historique_id = h.id
      ORDER BY rd.tube_id, rd.etape_numero, rd.ordre
    `);

    // Build maps
    const etapesMap = {};
    for (const e of etapes) {
      if (!etapesMap[e.tube_id]) etapesMap[e.tube_id] = {};
      etapesMap[e.tube_id][e.etape_numero] = e;
    }

    const repairsMap = {};
    for (const r of repairs) {
      if (!repairsMap[r.tube_id]) repairsMap[r.tube_id] = [];
      repairsMap[r.tube_id].push(r);
    }

    // ============================================
    // Create workbook
    // ============================================
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Logi-Track V2';
    workbook.created = new Date();

    // ============================================
    // SHEET 1: Situation Générale (Tubes)
    // ============================================
    const wsTubes = workbook.addWorksheet('Situation Générale', {
      views: [{ state: 'frozen', ySplit: 2 }]
    });

    // Build columns
    const tubeColumns = [
      { header: 'N°', key: 'index', width: 5 },
      { header: 'N° Tube', key: 'numero', width: 10 },
      { header: 'Lot', key: 'lot', width: 8 },
      { header: 'Bobine', key: 'bobine', width: 12 },
      { header: 'Grade', key: 'grade', width: 12 },
      { header: 'Ø (mm)', key: 'diametre_mm', width: 10 },
      { header: 'Ø (pouce)', key: 'diametre_pouce', width: 10 },
      { header: 'Ép. (mm)', key: 'epaisseur', width: 9 },
      { header: 'Long. (m)', key: 'longueur', width: 9 },
      { header: 'Poids (kg)', key: 'poids', width: 10 },
      { header: 'Statut', key: 'statut', width: 14 },
      { header: 'Décision', key: 'decision', width: 16 },
      { header: 'Date SAW', key: 'saw_date', width: 12 },
    ];

    // Add etape columns
    for (const etape of ETAPES_PRODUCTION) {
      tubeColumns.push({ header: etape.nom, key: `etape_${etape.numero}`, width: 11 });
    }

    tubeColumns.push(
      { header: 'Date Début', key: 'created_at', width: 12 },
      { header: 'Date Fin', key: 'date_fin', width: 12 },
      { header: 'Réparations', key: 'nb_repairs', width: 11 },
    );

    wsTubes.columns = tubeColumns;

    // Title row (row 1) - merge across all columns
    const totalCols = tubeColumns.length;
    wsTubes.spliceRows(1, 0, []);
    wsTubes.mergeCells(1, 1, 1, totalCols);
    const titleCell = wsTubes.getCell(1, 1);
    titleCell.value = 'SITUATION GÉNÉRALE — TUBES DE PRODUCTION';
    titleCell.font = { bold: true, size: 13, color: { argb: COLORS.headerBg } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsTubes.getRow(1).height = 30;

    // Header row (row 2) - already set by columns, just style it
    const headerRow = wsTubes.getRow(2);
    headerRow.height = 32;
    headerRow.eachCell((cell) => applyHeaderStyle(cell));

    // Data rows
    tubes.forEach((tube, index) => {
      const tubeEtapes = etapesMap[tube.id] || {};
      const tubeRepairs = repairsMap[tube.id] || [];

      const rowData = {
        index: index + 1,
        numero: tube.numero,
        lot: tube.lot_numero || '-',
        bobine: tube.bobine_numero || '-',
        grade: tube.bobine_grade || '-',
        diametre_mm: tube.diametre_mm ? Number(tube.diametre_mm) : '-',
        diametre_pouce: tube.diametre_pouce || '-',
        epaisseur: tube.epaisseur ? Number(tube.epaisseur) : '-',
        longueur: tube.longueur ? Number(tube.longueur) : '-',
        poids: tube.poids ? Number(tube.poids) : '-',
        statut: getStatutDisplay(tube.statut),
        decision: getDecisionDisplay(tube.decision),
        saw_date: formatDate(tube.saw_date),
        created_at: formatDate(tube.created_at),
        date_fin: formatDate(tube.date_fin_production),
        nb_repairs: tubeRepairs.length || 0,
      };

      // Etape statuses
      for (const etape of ETAPES_PRODUCTION) {
        const te = tubeEtapes[etape.numero];
        rowData[`etape_${etape.numero}`] = te ? getEtapeStatutDisplay(te.statut) : '-';
      }

      const row = wsTubes.addRow(rowData);
      row.height = 20;

      // Style each cell
      row.eachCell((cell, colNumber) => {
        const col = tubeColumns[colNumber - 1];
        const opts = { align: 'center' };

        // Color the etape cells based on status
        if (col && col.key && col.key.startsWith('etape_')) {
          const etapeNum = parseInt(col.key.split('_')[1]);
          const te = tubeEtapes[etapeNum];
          if (te) {
            const style = getEtapeStatutStyle(te.statut);
            Object.assign(opts, style);
          }
        }

        // Color statut cell
        if (col && col.key === 'statut') {
          if (tube.statut === 'termine') Object.assign(opts, { bgColor: COLORS.greenBg, fontColor: COLORS.greenFont });
          else if (tube.statut === 'en_reparation') Object.assign(opts, { bgColor: COLORS.redBg, fontColor: COLORS.redFont });
          else if (tube.statut === 'en_production') Object.assign(opts, { bgColor: COLORS.orangeBg, fontColor: COLORS.orangeFont });
        }

        // Color decision cell
        if (col && col.key === 'decision') {
          if (tube.decision === 'certifie_api' || tube.decision === 'certifie_hydraulique') Object.assign(opts, { bgColor: COLORS.greenBg, fontColor: COLORS.greenFont });
          else if (tube.decision === 'declasse') Object.assign(opts, { bgColor: COLORS.redBg, fontColor: COLORS.redFont });
        }

        // Color repairs count
        if (col && col.key === 'nb_repairs' && cell.value > 0) {
          Object.assign(opts, { bgColor: COLORS.redBg, fontColor: COLORS.redFont, bold: true });
        }

        applyCellStyle(cell, opts);
      });
    });

    // Autofilter on header row
    wsTubes.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2 + tubes.length, column: totalCols } };

    // ============================================
    // SHEET 2: Réparations
    // ============================================
    const wsRepairs = workbook.addWorksheet('Réparations', {
      views: [{ state: 'frozen', ySplit: 2 }]
    });

    const repairColumns = [
      { header: 'N°', key: 'index', width: 5 },
      { header: 'N° Tube', key: 'tube_numero', width: 10 },
      { header: 'Étape', key: 'etape', width: 18 },
      { header: 'Défaut', key: 'defaut', width: 30 },
      { header: 'Cause', key: 'cause', width: 30 },
      { header: 'Responsabilité', key: 'responsabilite', width: 18 },
      { header: 'Action prise', key: 'action', width: 30 },
      { header: 'Opérateur', key: 'operateur', width: 18 },
      { header: 'Date', key: 'date', width: 14 },
    ];

    wsRepairs.columns = repairColumns;

    // Title row
    const repairTotalCols = repairColumns.length;
    wsRepairs.spliceRows(1, 0, []);
    wsRepairs.mergeCells(1, 1, 1, repairTotalCols);
    const repairTitleCell = wsRepairs.getCell(1, 1);
    repairTitleCell.value = 'RÉPARATIONS — DÉTAIL DES DÉFAUTS';
    repairTitleCell.font = { bold: true, size: 13, color: { argb: 'FFEF4444' } };
    repairTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsRepairs.getRow(1).height = 30;

    // Header row style
    const repairHeaderRow = wsRepairs.getRow(2);
    repairHeaderRow.height = 32;
    repairHeaderRow.eachCell((cell) => applyRepairHeaderStyle(cell));

    // Data rows
    let repairIndex = 0;
    for (const repair of repairs) {
      repairIndex++;
      const etapeInfo = ETAPES_PRODUCTION.find(e => e.numero === repair.etape_numero);
      const row = wsRepairs.addRow({
        index: repairIndex,
        tube_numero: repair.tube_numero || '-',
        etape: etapeInfo ? `${etapeInfo.numero}. ${etapeInfo.nom}` : `Étape ${repair.etape_numero}`,
        defaut: repair.defaut || '-',
        cause: repair.cause_defaut || '-',
        responsabilite: repair.responsabilite_nom || '-',
        action: repair.action_prise || '-',
        operateur: repair.repair_operateur_nom 
          ? `${repair.repair_operateur_prenom || ''} ${repair.repair_operateur_nom}`.trim()
          : '-',
        date: formatDateTime(repair.repair_date || repair.created_at),
      });
      row.height = 22;
      row.eachCell((cell) => applyCellStyle(cell, { align: 'left' }));
    }

    // If no repairs, add an info row
    if (repairs.length === 0) {
      const emptyRow = wsRepairs.addRow({ index: '-', tube_numero: 'Aucune réparation enregistrée', etape: '', defaut: '', cause: '', responsabilite: '', action: '', operateur: '', date: '' });
      wsRepairs.mergeCells(emptyRow.number, 2, emptyRow.number, repairTotalCols);
      const mergedCell = wsRepairs.getCell(emptyRow.number, 2);
      mergedCell.alignment = { horizontal: 'center', vertical: 'middle' };
      mergedCell.font = { italic: true, size: 10, color: { argb: 'FF9CA3AF' } };
    }

    // Autofilter
    if (repairs.length > 0) {
      wsRepairs.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2 + repairs.length, column: repairTotalCols } };
    }

    // ============================================
    // SHEET 3: Résumé
    // ============================================
    const wsSummary = workbook.addWorksheet('Résumé');

    // Summary data
    const totalTubes = tubes.length;
    const termines = tubes.filter(t => t.statut === 'termine').length;
    const enProd = tubes.filter(t => t.statut === 'en_production').length;
    const enRep = tubes.filter(t => t.statut === 'en_reparation').length;
    const rebuts = tubes.filter(t => t.statut === 'rebut').length;
    const certifApi = tubes.filter(t => t.decision === 'certifie_api').length;
    const certifHydro = tubes.filter(t => t.decision === 'certifie_hydraulique').length;
    const declasses = tubes.filter(t => t.decision === 'declasse').length;

    wsSummary.columns = [
      { header: '', key: 'label', width: 30 },
      { header: '', key: 'value', width: 15 },
    ];

    // Title
    wsSummary.mergeCells('A1:B1');
    const summaryTitle = wsSummary.getCell('A1');
    summaryTitle.value = 'RÉSUMÉ — SITUATION GÉNÉRALE';
    summaryTitle.font = { bold: true, size: 14, color: { argb: COLORS.headerBg } };
    summaryTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    wsSummary.getRow(1).height = 35;

    // Date
    wsSummary.mergeCells('A2:B2');
    const dateCell = wsSummary.getCell('A2');
    dateCell.value = `Exporté le ${formatDateTime(new Date())}`;
    dateCell.font = { size: 9, italic: true, color: { argb: 'FF6B7280' } };
    dateCell.alignment = { horizontal: 'center' };

    const summaryData = [
      { label: '', value: '' },
      { label: 'PRODUCTION', value: '', section: true },
      { label: 'Total tubes', value: totalTubes },
      { label: 'Terminés', value: termines },
      { label: 'En production', value: enProd },
      { label: 'En réparation', value: enRep },
      { label: 'Rebuts', value: rebuts },
      { label: '', value: '' },
      { label: 'DÉCISIONS', value: '', section: true },
      { label: 'Certifié API', value: certifApi },
      { label: 'Certifié Hydraulique', value: certifHydro },
      { label: 'Déclassé', value: declasses },
      { label: 'En attente de décision', value: totalTubes - certifApi - certifHydro - declasses },
      { label: '', value: '' },
      { label: 'RÉPARATIONS', value: '', section: true },
      { label: 'Total défauts réparés', value: repairs.length },
      { label: 'Tubes avec réparations', value: Object.keys(repairsMap).length },
    ];

    let rowNum = 3;
    for (const item of summaryData) {
      rowNum++;
      const row = wsSummary.getRow(rowNum);
      row.getCell(1).value = item.label;
      row.getCell(2).value = item.value;

      if (item.section) {
        row.getCell(1).font = { bold: true, size: 11, color: { argb: COLORS.headerBg } };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
      } else if (item.label) {
        row.getCell(1).font = { size: 10 };
        row.getCell(2).font = { size: 10, bold: true };
        row.getCell(2).alignment = { horizontal: 'center' };
      }
    }

    // ============================================
    // Send response
    // ============================================
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `Situation_Generale_LogiTrack_${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Erreur export Situation Générale:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur génération du rapport Excel' });
    }
  }
});

// ============================================
// GET /api/reports/stats
// Statistiques rapides pour la page rapports
// ============================================
router.get('/stats', async (req, res) => {
  try {
    const [[{ total_tubes }]] = await pool.query('SELECT COUNT(*) as total_tubes FROM tubes');
    const [[{ total_lots }]] = await pool.query('SELECT COUNT(*) as total_lots FROM lots');
    const [[{ total_bobines }]] = await pool.query('SELECT COUNT(*) as total_bobines FROM bobines');
    const [[{ total_repairs }]] = await pool.query('SELECT COUNT(*) as total_repairs FROM reparation_defauts');

    res.json({
      tubes: total_tubes,
      lots: total_lots,
      bobines: total_bobines,
      repairs: total_repairs,
    });
  } catch (error) {
    console.error('Erreur stats rapports:', error);
    res.status(500).json({ error: 'Erreur récupération statistiques' });
  }
});

module.exports = router;
