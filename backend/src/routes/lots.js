/**
 * Routes API Lots (Bobine de Production)
 * Lot = Début de poste/production avec suivi bobine
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireSupervisor, requireSystemAdmin } = require('../middleware/auth');

// Authentification requise pour toutes les routes
router.use(authenticateToken);

// ============================================
// GET /api/lots - Liste des lots
// ============================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, 
             b.numero as bobine_numero,
             b.epaisseur as bobine_epaisseur,
             b.largeur as bobine_largeur,
             b.poids as bobine_poids,
             mr_rec.libelle as motif_reception_libelle,
             mr_inst.libelle as motif_installation_libelle,
             pp.code as parametre_numero,
             eq.code as equipe_code, eq.nom as equipe_nom
      FROM lots l
      LEFT JOIN bobines b ON l.bobine_id = b.id
      LEFT JOIN motifs_retard mr_rec ON l.motif_retard_reception_id = mr_rec.id
      LEFT JOIN motifs_retard mr_inst ON l.motif_retard_installation_id = mr_inst.id
      LEFT JOIN presets_soudure pp ON l.parametre_id = pp.id
      LEFT JOIN equipes_production eq ON l.equipe_id = eq.id
      ORDER BY l.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur GET /lots:', error);
    res.status(500).json({ error: 'Erreur récupération lots' });
  }
});

// ============================================
// GET /api/lots/prochain-numero - Prochain numéro
// ============================================
router.get('/prochain-numero', async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT MAX(CAST(numero AS UNSIGNED)) as max_num FROM lots 
      WHERE numero REGEXP '^[0-9]+$'
    `);
    
    let prochainNumero;
    if (result.length === 0 || result[0].max_num === null) {
      prochainNumero = '1';
    } else {
      prochainNumero = String(result[0].max_num + 1);
    }
    
    res.json({ numero: prochainNumero });
  } catch (error) {
    console.error('Erreur prochain-numero:', error);
    res.status(500).json({ error: 'Erreur génération numéro' });
  }
});

// ============================================
// GET /api/lots/bobines-disponibles - Bobines en stock uniquement
// ============================================
router.get('/bobines-disponibles', async (req, res) => {
  try {
    const [bobines] = await pool.query(`
      SELECT b.id, b.numero, b.epaisseur, b.largeur, b.poids, 
             COALESCE(b.fournisseur, '') as fournisseur, b.statut
      FROM bobines b
      WHERE b.statut = 'en_stock'
      ORDER BY b.numero DESC
    `);
    res.json(bobines);
  } catch (error) {
    console.error('Erreur bobines-disponibles:', error);
    res.status(500).json({ error: 'Erreur récupération bobines' });
  }
});

// ============================================
// GET /api/lots/motifs-retard - Motifs de retard
// ============================================
router.get('/motifs-retard', async (req, res) => {
  try {
    const { etape } = req.query;
    let query = 'SELECT * FROM motifs_retard WHERE actif = TRUE';
    const params = [];
    
    if (etape) {
      query += ' AND (etape = ? OR etape = "general")';
      params.push(etape);
    }
    
    query += ' ORDER BY etape, ordre';
    
    const [motifs] = await pool.query(query, params);
    
    // Grouper par étape
    const grouped = {
      reception: motifs.filter(m => m.etape === 'reception' || m.etape === 'general'),
      installation: motifs.filter(m => m.etape === 'installation' || m.etape === 'general')
    };
    
    res.json({ motifs, grouped });
  } catch (error) {
    console.error('Erreur motifs-retard:', error);
    res.status(500).json({ error: 'Erreur récupération motifs' });
  }
});

// ============================================
// GET /api/lots/stats - Statistiques
// ============================================
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN statut = 'pret_production' THEN 1 ELSE 0 END) as pret_production,
        SUM(CASE WHEN statut = 'en_production' THEN 1 ELSE 0 END) as en_production,
        SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) as termine,
        SUM(retard_reception_minutes) as total_retard_reception,
        SUM(retard_installation_minutes) as total_retard_installation
      FROM lots
    `);
    res.json(stats[0]);
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ error: 'Erreur stats' });
  }
});

// ============================================
// GET /api/lots/:id/pdf - Rapport PDF du lot
// ============================================
router.get('/:id/pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');

    // Récupérer le lot avec toutes les infos
    const [rows] = await pool.query(`
      SELECT l.*, 
             b.numero as bobine_numero,
             b.epaisseur as bobine_epaisseur,
             b.largeur as bobine_largeur,
             b.poids as bobine_poids,
             COALESCE(b.fournisseur, '') as bobine_fournisseur,
             b.norme as bobine_norme,
             mr_rec.libelle as motif_reception_libelle,
             mr_rec.categorie as motif_reception_categorie,
             mr_inst.libelle as motif_installation_libelle,
             mr_inst.categorie as motif_installation_categorie,
             pp.code as parametre_numero,
             pp.strip_vitesse_m, pp.strip_vitesse_cm,
             pp.milling_edge_gauche, pp.milling_edge_droit,
             pp.pression_rouleaux, pp.pression_rouleaux_unite,
             pp.tack_amperage, pp.tack_voltage, pp.tack_vitesse_m, pp.tack_vitesse_cm,
             pp.tack_frequence, pp.tack_type_gaz, pp.tack_debit_gaz,
             pp.soudure_vitesse_m, pp.soudure_vitesse_cm,
             pp.soudure_type_fil, pp.soudure_type_flux,
             src.numero as source_lot_numero,
             eq.code as equipe_code, eq.nom as equipe_nom
      FROM lots l
      LEFT JOIN bobines b ON l.bobine_id = b.id
      LEFT JOIN motifs_retard mr_rec ON l.motif_retard_reception_id = mr_rec.id
      LEFT JOIN motifs_retard mr_inst ON l.motif_retard_installation_id = mr_inst.id
      LEFT JOIN presets_soudure pp ON l.parametre_id = pp.id
      LEFT JOIN lots src ON l.checklist_source_lot_id = src.id
      LEFT JOIN equipes_production eq ON l.equipe_id = eq.id
      WHERE l.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lot non trouvé' });
    }

    const lot = rows[0];

    // Créer le document PDF
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 40,
      info: {
        Title: `Rapport Lot ${lot.numero}`,
        Author: 'Logi-Track V2',
        Subject: 'Rapport de lot'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=lot_${lot.numero}.pdf`);
    doc.pipe(res);

    // Couleurs
    const primary = '#92400e';
    const accent = '#d97706';
    const gray = '#6b7280';
    const lightGray = '#f3f4f6';
    const border = '#e5e7eb';
    const green = '#059669';
    const red = '#dc2626';
    const orange = '#ea580c';
    const blue = '#2563eb';
    const pageWidth = doc.page.width - 80;

    // Helpers
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
    const formatDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const formatDuree = (mins) => {
      if (!mins || mins <= 0) return '0 mn';
      const j = Math.floor(mins / 1440);
      const h = Math.floor((mins % 1440) / 60);
      const m = mins % 60;
      const parts = [];
      if (j > 0) parts.push(`${j}j`);
      if (h > 0) parts.push(`${h}h`);
      parts.push(`${m}mn`);
      return parts.join(' ');
    };

    let yPos = 40;

    // TITRE
    doc.fillColor(primary).fontSize(18).font('Helvetica-Bold')
       .text(`Rapport de Lot N° ${lot.numero}`, 40, yPos, { align: 'center', width: pageWidth });
    yPos += 25;
    doc.fillColor(gray).fontSize(9).font('Helvetica')
       .text(`Logi-Track V2 — Généré le ${formatDate(new Date())} à ${new Date().toLocaleTimeString('fr-FR')}`, 40, yPos, { align: 'center', width: pageWidth });
    yPos += 16;
    doc.strokeColor(primary).lineWidth(1.5)
       .moveTo(40, yPos).lineTo(40 + pageWidth, yPos).stroke();
    yPos += 16;

    // HELPERS
    const sectionTitle = (title, y) => {
      doc.rect(40, y, pageWidth, 20).fill(primary);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
         .text(title, 48, y + 5, { width: pageWidth - 16 });
      return y + 26;
    };

    const infoRow = (label, value, y, col2) => {
      const labelW = 130;
      const baseX = col2 ? 40 + pageWidth / 2 + 5 : 48;
      const valX = baseX + labelW;
      const maxW = col2 ? pageWidth / 2 - 15 - labelW : pageWidth / 2 - 15 - labelW;
      doc.fillColor(gray).fontSize(9).font('Helvetica').text(label, baseX, y, { width: labelW });
      doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text(value || '—', valX, y, { width: Math.max(maxW, 100) });
    };

    const infoRowColored = (label, value, y, col2, color) => {
      const labelW = 130;
      const baseX = col2 ? 40 + pageWidth / 2 + 5 : 48;
      const valX = baseX + labelW;
      const maxW = col2 ? pageWidth / 2 - 15 - labelW : pageWidth / 2 - 15 - labelW;
      doc.fillColor(gray).fontSize(9).font('Helvetica').text(label, baseX, y, { width: labelW });
      doc.fillColor(color).fontSize(9).font('Helvetica-Bold').text(value || '—', valX, y, { width: Math.max(maxW, 100) });
    };

    const checkNewPage = (needed) => {
      if (yPos + needed > doc.page.height - 60) {
        doc.addPage();
        yPos = 40;
      }
    };

    // SECTION 1 — INFORMATIONS GÉNÉRALES
    checkNewPage(90);
    yPos = sectionTitle('INFORMATIONS GÉNÉRALES', yPos);

    const statutLabels = {
      en_cours: 'En cours', pret_production: 'Prêt production',
      en_production: 'En production', termine: 'Terminé', annule: 'Annulé'
    };
    const statutColors = {
      en_cours: blue, pret_production: green,
      en_production: orange, termine: gray, annule: red
    };

    infoRow('N° Lot :', lot.numero, yPos, false);
    infoRowColored('Statut :', statutLabels[lot.statut] || lot.statut, yPos, true, statutColors[lot.statut] || gray);
    yPos += 16;
    infoRow('Démarré le :', formatDateTime(lot.created_at), yPos, false);
    infoRow('Date de fin :', lot.date_fin ? formatDateTime(lot.date_fin) : 'En cours', yPos, true);
    yPos += 16;
    const operateur = lot.operateur_prenom && lot.operateur_nom
      ? `${lot.operateur_prenom} ${lot.operateur_nom}` : '—';
    infoRow('Opérateur :', operateur, yPos, false);
    if (lot.parametre_numero) {
      infoRow('Preset Production :', lot.parametre_numero, yPos, true);
    }
    yPos += 20;

    // SECTION 2 — BOBINE UTILISÉE
    checkNewPage(80);
    yPos = sectionTitle('BOBINE UTILISÉE', yPos);

    if (lot.bobine_numero) {
      infoRow('N° Bobine :', lot.bobine_numero, yPos, false);
      infoRow('Fournisseur :', lot.bobine_fournisseur || '—', yPos, true);
      yPos += 16;
      infoRow('Épaisseur :', lot.bobine_epaisseur ? `${lot.bobine_epaisseur} mm` : '—', yPos, false);
      infoRow('Largeur :', lot.bobine_largeur ? `${lot.bobine_largeur} mm` : '—', yPos, true);
      yPos += 16;
      infoRow('Poids :', lot.bobine_poids ? `${new Intl.NumberFormat('fr-FR').format(lot.bobine_poids)} kg` : '—', yPos, false);
      infoRow('Norme :', lot.bobine_norme || 'API 5L', yPos, true);
    } else {
      doc.fillColor(gray).fontSize(9).font('Helvetica-Oblique')
         .text('Aucune bobine associée', 48, yPos);
    }
    yPos += 20;

    // SECTION 3 — CHRONOLOGIE & RETARDS
    checkNewPage(130);
    yPos = sectionTitle('CHRONOLOGIE & RETARDS', yPos);

    infoRow('Étape 1 — Création :', formatDateTime(lot.created_at), yPos, false);
    yPos += 18;
    doc.strokeColor(border).lineWidth(0.5)
       .moveTo(48, yPos - 4).lineTo(48 + pageWidth - 16, yPos - 4).stroke();

    if (lot.bobine_recue) {
      infoRow('Étape 2 — Réception :', formatDateTime(lot.date_reception), yPos, false);
      const retardRec = lot.retard_reception_minutes || 0;
      const retardRecColor = retardRec >= 10 ? red : retardRec >= 5 ? orange : green;
      infoRowColored('Délai réception :', formatDuree(retardRec), yPos, true, retardRecColor);
      yPos += 16;
      if (retardRec >= 10 && lot.motif_reception_libelle) {
        infoRow('Motif retard :', lot.motif_reception_libelle, yPos, false);
        yPos += 16;
      }
    } else {
      infoRowColored('Étape 2 — Réception :', 'Non effectuée', yPos, false, gray);
      yPos += 16;
    }

    doc.strokeColor(border).lineWidth(0.5)
       .moveTo(48, yPos - 4).lineTo(48 + pageWidth - 16, yPos - 4).stroke();

    if (lot.bobine_installee) {
      infoRow('Étape 3 — Installation :', formatDateTime(lot.date_installation), yPos, false);
      const retardInst = lot.retard_installation_minutes || 0;
      const retardInstColor = retardInst >= 10 ? red : retardInst >= 5 ? orange : green;
      infoRowColored('Délai installation :', formatDuree(retardInst), yPos, true, retardInstColor);
      yPos += 16;
      if (retardInst >= 10 && lot.motif_installation_libelle) {
        infoRow('Motif retard :', lot.motif_installation_libelle, yPos, false);
        yPos += 16;
      }
    } else {
      infoRowColored('Étape 3 — Installation :', 'Non effectuée', yPos, false, gray);
      yPos += 16;
    }

    doc.strokeColor(border).lineWidth(0.5)
       .moveTo(48, yPos - 4).lineTo(48 + pageWidth - 16, yPos - 4).stroke();

    if (lot.equipe_confirmee) {
      infoRowColored('Étape 4 — Équipe :', `Confirmée le ${formatDateTime(lot.date_equipe_confirmee)}`, yPos, false, green);
      if (lot.equipe_nom) infoRow('Équipe :', `${lot.equipe_code} — ${lot.equipe_nom}`, yPos, true);
    } else {
      infoRowColored('Étape 4 — Équipe :', 'Non confirmée', yPos, false, gray);
    }
    yPos += 20;

    // SECTION 4 — BILAN DES RETARDS
    const retardRec = lot.retard_reception_minutes || 0;
    const retardInst = lot.retard_installation_minutes || 0;
    const retardTotal = retardRec + retardInst;

    if (retardTotal > 0) {
      checkNewPage(70);
      yPos = sectionTitle('BILAN DES RETARDS', yPos);

      const tableX = 48;
      const tableW = pageWidth - 16;
      const colW = tableW / 3;

      doc.rect(tableX, yPos, tableW, 18).fill('#fef3c7');
      doc.fillColor(primary).fontSize(8).font('Helvetica-Bold');
      doc.text('TYPE', tableX + 8, yPos + 5, { width: colW - 16 });
      doc.text('DURÉE', tableX + colW + 8, yPos + 5, { width: colW - 16 });
      doc.text('MOTIF', tableX + colW * 2 + 8, yPos + 5, { width: colW - 16 });
      yPos += 18;

      doc.rect(tableX, yPos, tableW, 18).fillAndStroke('#ffffff', border);
      doc.fillColor('#111827').fontSize(8).font('Helvetica');
      doc.text('Réception', tableX + 8, yPos + 5, { width: colW - 16 });
      const recColor = retardRec >= 10 ? red : retardRec >= 5 ? orange : green;
      doc.fillColor(recColor).font('Helvetica-Bold')
         .text(formatDuree(retardRec), tableX + colW + 8, yPos + 5, { width: colW - 16 });
      doc.fillColor('#111827').font('Helvetica')
         .text(lot.motif_reception_libelle || '—', tableX + colW * 2 + 8, yPos + 5, { width: colW - 16 });
      yPos += 18;

      doc.rect(tableX, yPos, tableW, 18).fillAndStroke('#ffffff', border);
      doc.fillColor('#111827').fontSize(8).font('Helvetica');
      doc.text('Installation', tableX + 8, yPos + 5, { width: colW - 16 });
      const instColor = retardInst >= 10 ? red : retardInst >= 5 ? orange : green;
      doc.fillColor(instColor).font('Helvetica-Bold')
         .text(formatDuree(retardInst), tableX + colW + 8, yPos + 5, { width: colW - 16 });
      doc.fillColor('#111827').font('Helvetica')
         .text(lot.motif_installation_libelle || '—', tableX + colW * 2 + 8, yPos + 5, { width: colW - 16 });
      yPos += 18;

      doc.rect(tableX, yPos, tableW, 20).fill('#fef3c7');
      doc.fillColor(primary).fontSize(9).font('Helvetica-Bold');
      doc.text('TOTAL', tableX + 8, yPos + 6, { width: colW - 16 });
      const totalColor = retardTotal >= 10 ? red : retardTotal >= 5 ? orange : green;
      doc.fillColor(totalColor).fontSize(10).font('Helvetica-Bold')
         .text(formatDuree(retardTotal), tableX + colW + 8, yPos + 5, { width: colW - 16 });
      yPos += 26;
    }

    // SECTION 5 — PARAMÈTRES DE PRODUCTION
    if (lot.parametre_numero) {
      checkNewPage(90);
      yPos = sectionTitle(`PARAMÈTRES DE PRODUCTION — ${lot.parametre_numero}`, yPos);

      infoRow('Strip vitesse :', `${lot.strip_vitesse_m || 0} m ${lot.strip_vitesse_cm || 0} cm/min`, yPos, false);
      infoRow('Milling Edge G :', `${lot.milling_edge_gauche || 0}°`, yPos, true);
      yPos += 16;
      infoRow('Pression rouleaux :', lot.pression_rouleaux ? `${lot.pression_rouleaux} ${lot.pression_rouleaux_unite || 'tonnes'}` : '—', yPos, false);
      infoRow('Milling Edge D :', `${lot.milling_edge_droit || 0}°`, yPos, true);
      yPos += 16;
      infoRow('Tack — Ampérage :', `${lot.tack_amperage || 0} A`, yPos, false);
      infoRow('Tack — Voltage :', `${lot.tack_voltage || 0} V`, yPos, true);
      yPos += 16;
      infoRow('Tack — Vitesse :', `${lot.tack_vitesse_m || 0} m ${lot.tack_vitesse_cm || 0} cm/min`, yPos, false);
      infoRow('Tack — Fréquence :', lot.tack_frequence ? `${lot.tack_frequence} Hz` : '—', yPos, true);
      yPos += 16;
      infoRow('Tack — Gaz :', `${lot.tack_type_gaz || 'CO2'} (${lot.tack_debit_gaz || '—'} L/min)`, yPos, false);
      yPos += 16;
      infoRow('Soudure vitesse :', `${lot.soudure_vitesse_m || 0} m ${lot.soudure_vitesse_cm || 0} cm/min`, yPos, false);
      infoRow('Type fil :', lot.soudure_type_fil || '—', yPos, true);
      yPos += 16;
      infoRow('Type flux :', lot.soudure_type_flux || '—', yPos, false);
      yPos += 20;
    }

    doc.end();

  } catch (error) {
    console.error('Erreur GET /lots/:id/pdf:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

// ============================================
// GET /api/lots/:id - Détail d'un lot
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, 
             b.numero as bobine_numero,
             b.epaisseur as bobine_epaisseur,
             b.largeur as bobine_largeur,
             b.poids as bobine_poids,
             COALESCE(b.fournisseur, '') as bobine_fournisseur,
             mr_rec.libelle as motif_reception_libelle,
             mr_rec.categorie as motif_reception_categorie,
             mr_inst.libelle as motif_installation_libelle,
             mr_inst.categorie as motif_installation_categorie,
             pp.code as parametre_numero,
             src.numero as source_lot_numero,
             eq.code as equipe_code, eq.nom as equipe_nom
      FROM lots l
      LEFT JOIN bobines b ON l.bobine_id = b.id
      LEFT JOIN motifs_retard mr_rec ON l.motif_retard_reception_id = mr_rec.id
      LEFT JOIN motifs_retard mr_inst ON l.motif_retard_installation_id = mr_inst.id
      LEFT JOIN presets_soudure pp ON l.parametre_id = pp.id
      LEFT JOIN lots src ON l.checklist_source_lot_id = src.id
      LEFT JOIN equipes_production eq ON l.equipe_id = eq.id
      WHERE l.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lot non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur GET /lots/:id:', error);
    res.status(500).json({ error: 'Erreur récupération lot' });
  }
});

// ============================================
// POST /api/lots - Créer un lot (Début de poste)
// ============================================
router.post('/', async (req, res) => {
  try {
    const { numero, bobine_id, parametre_id, equipe_id } = req.body;

    if (!bobine_id) {
      return res.status(400).json({ error: 'Une bobine est obligatoire pour créer un lot' });
    }

    // Vérifier que la bobine existe et est en stock
    const [bobineCheck] = await pool.query('SELECT id, statut FROM bobines WHERE id = ?', [bobine_id]);
    if (bobineCheck.length === 0) {
      return res.status(404).json({ error: 'Bobine introuvable' });
    }
    if (bobineCheck[0].statut !== 'en_stock') {
      return res.status(400).json({ error: 'Cette bobine n\'est plus disponible (statut: ' + bobineCheck[0].statut + ')' });
    }
    
    const operateur_nom = req.user?.nom || null;
    const operateur_prenom = req.user?.prenom || null;
    const created_by = req.user?.operateurId || req.user?.userId || null;

    // Générer numéro auto si vide
    let numeroFinal = numero;
    if (!numeroFinal) {
      const [last] = await pool.query(`
        SELECT MAX(CAST(numero AS UNSIGNED)) as max_num FROM lots 
        WHERE numero REGEXP '^[0-9]+$'
      `);
      if (last.length === 0 || last[0].max_num === null) {
        numeroFinal = '1';
      } else {
        numeroFinal = String(last[0].max_num + 1);
      }
    }

    const [result] = await pool.query(`
      INSERT INTO lots (numero, bobine_id, parametre_id, equipe_id, created_by, operateur_nom, operateur_prenom)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [numeroFinal, bobine_id || null, parametre_id || null, equipe_id || null, created_by, operateur_nom, operateur_prenom]);

    // Passer la bobine en_cours
    if (bobine_id) {
      await pool.query('UPDATE bobines SET lot_id = ?, statut = ? WHERE id = ?', 
        [result.insertId, 'en_cours', bobine_id]);
    }

    const [newLot] = await pool.query(`
      SELECT l.*, b.numero as bobine_numero
      FROM lots l
      LEFT JOIN bobines b ON l.bobine_id = b.id
      WHERE l.id = ?
    `, [result.insertId]);

    res.status(201).json(newLot[0]);
  } catch (error) {
    console.error('Erreur POST /lots:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ce numéro de lot existe déjà' });
    }
    res.status(500).json({ error: 'Erreur création lot' });
  }
});

// ============================================
// PUT /api/lots/:id/reception - Marquer bobine reçue
// ============================================
router.put('/:id/reception', async (req, res) => {
  try {
    const { id } = req.params;
    const { recue, retard_minutes, motif_retard_id, commentaire } = req.body;

    await pool.query(`
      UPDATE lots SET
        bobine_recue = ?,
        date_reception = NOW(),
        retard_reception_minutes = ?,
        motif_retard_reception_id = ?,
        commentaire_reception = ?
      WHERE id = ?
    `, [recue ? 1 : 0, retard_minutes || 0, motif_retard_id || null, commentaire || null, id]);

    res.json({ message: 'Réception enregistrée' });
  } catch (error) {
    console.error('Erreur réception:', error);
    res.status(500).json({ error: 'Erreur enregistrement réception' });
  }
});

// ============================================
// PUT /api/lots/:id/installation - Marquer bobine installée
// ============================================
router.put('/:id/installation', async (req, res) => {
  try {
    const { id } = req.params;
    const { installee, retard_minutes, motif_retard_id, commentaire } = req.body;

    await pool.query(`
      UPDATE lots SET
        bobine_installee = ?,
        date_installation = NOW(),
        retard_installation_minutes = ?,
        motif_retard_installation_id = ?,
        commentaire_installation = ?
      WHERE id = ?
    `, [installee ? 1 : 0, retard_minutes || 0, motif_retard_id || null, commentaire || null, id]);

    res.json({ message: 'Installation enregistrée' });
  } catch (error) {
    console.error('Erreur installation:', error);
    res.status(500).json({ error: 'Erreur enregistrement installation' });
  }
});

// ============================================
// PUT /api/lots/:id/equipe-confirmee - Confirmer l'équipe de production
// ============================================
router.put('/:id/equipe-confirmee', async (req, res) => {
  try {
    const { id } = req.params;
    const { equipe_id } = req.body;

    // Si equipe_id fourni, mettre à jour aussi l'équipe du lot
    if (equipe_id) {
      await pool.query(`
        UPDATE lots SET
          equipe_id = ?,
          equipe_confirmee = 1,
          date_equipe_confirmee = NOW(),
          statut = 'pret_production'
        WHERE id = ?
      `, [equipe_id, id]);
    } else {
      await pool.query(`
        UPDATE lots SET
          equipe_confirmee = 1,
          date_equipe_confirmee = NOW(),
          statut = 'pret_production'
        WHERE id = ?
      `, [id]);
    }

    res.json({ message: 'Équipe de production confirmée' });
  } catch (error) {
    console.error('Erreur confirmation équipe:', error);
    res.status(500).json({ error: 'Erreur confirmation équipe' });
  }
});

// ============================================
// PUT /api/lots/:id/reinitialiser - Réinitialiser toutes les étapes
// ============================================
router.put('/:id/reinitialiser', requireSupervisor, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE lots SET
        bobine_recue = 0,
        date_reception = NULL,
        retard_reception_minutes = 0,
        motif_retard_reception_id = NULL,
        commentaire_reception = NULL,
        bobine_installee = 0,
        date_installation = NULL,
        retard_installation_minutes = 0,
        motif_retard_installation_id = NULL,
        commentaire_installation = NULL,
        checklist_validee = 0,
        date_checklist = NULL,
        checklist_validation_rapide = 0,
        checklist_source_lot_id = NULL,
        equipe_confirmee = 0,
        date_equipe_confirmee = NULL,
        statut = 'en_cours'
      WHERE id = ? AND statut NOT IN ('en_production', 'termine')
    `, [id]);

    res.json({ message: 'Étapes réinitialisées' });
  } catch (error) {
    console.error('Erreur réinitialisation:', error);
    res.status(500).json({ error: 'Erreur réinitialisation' });
  }
});

// ============================================
// PUT /api/lots/:id/demarrer-production - Démarrer production
// ============================================
router.put('/:id/demarrer-production', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE lots SET statut = 'en_production', date_production = NOW() WHERE id = ?
    `, [id]);

    res.json({ message: 'Production démarrée' });
  } catch (error) {
    console.error('Erreur démarrage:', error);
    res.status(500).json({ error: 'Erreur démarrage production' });
  }
});

// ============================================
// PUT /api/lots/:id/terminer - Terminer le lot
// ============================================
router.put('/:id/terminer', async (req, res) => {
  try {
    const { id } = req.params;

    // Libérer la bobine → epuisée
    const [lot] = await pool.query('SELECT bobine_id FROM lots WHERE id = ?', [id]);
    if (lot.length > 0 && lot[0].bobine_id) {
      await pool.query('UPDATE bobines SET statut = ?, lot_id = NULL WHERE id = ?', 
        ['epuisee', lot[0].bobine_id]);
    }

    await pool.query(`
      UPDATE lots SET statut = 'termine', date_fin = NOW() WHERE id = ?
    `, [id]);

    res.json({ message: 'Lot terminé' });
  } catch (error) {
    console.error('Erreur terminer:', error);
    res.status(500).json({ error: 'Erreur terminer lot' });
  }
});

// ============================================
// PUT /api/lots/:id/parametres - Changer ou créer un preset pour un lot
// ============================================
router.put('/:id/parametres', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { action, parametre_id, parametres } = req.body;

    let finalParametreId;
    if (action === 'select' && parametre_id) {
      finalParametreId = parametre_id;
    } else if (action === 'create' && parametres) {
      // Créer un nouveau preset à partir des paramètres modifiés
      const [last] = await conn.query(`SELECT code FROM presets_soudure ORDER BY id DESC LIMIT 1`);
      let nextCode = 'PAR-001';
      if (last.length > 0 && last[0].code) {
        const match = last[0].code.match(/PAR-(\d+)/);
        if (match) {
          nextCode = `PAR-${String(parseInt(match[1]) + 1).padStart(3, '0')}`;
        }
      }

      const p = parametres;
      const created_by = req.user?.operateurId || req.user?.userId || null;

      const [result] = await conn.query(`
        INSERT INTO presets_soudure (
          code, strip_vitesse_m, strip_vitesse_cm,
          milling_edge_gauche, milling_edge_droit,
          pression_rouleaux, pression_rouleaux_unite,
          tack_amperage, tack_voltage, tack_vitesse_m, tack_vitesse_cm,
          tack_frequence, tack_type_gaz, tack_debit_gaz,
          soudure_vitesse_m, soudure_vitesse_cm,
          soudure_type_fil, soudure_type_flux,
          notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        nextCode,
        p.strip_vitesse_m || 0, p.strip_vitesse_cm || 0,
        p.milling_edge_gauche || 0, p.milling_edge_droit || 0,
        p.pression_rouleaux || null, p.pression_rouleaux_unite || 'tonnes',
        p.tack_amperage || 0, p.tack_voltage || 0,
        p.tack_vitesse_m || 0, p.tack_vitesse_cm || 0,
        p.tack_frequence || null, p.tack_type_gaz || 'CO2', p.tack_debit_gaz || null,
        p.soudure_vitesse_m || 0, p.soudure_vitesse_cm || 0,
        p.soudure_type_fil || '1.6mm', p.soudure_type_flux || 'SAW',
        p.notes || `Modifié depuis lot #${id}`,
        created_by
      ]);

      finalParametreId = result.insertId;

      // Insérer les heads
      if (p.heads && Array.isArray(p.heads)) {
        for (const head of p.heads) {
          await conn.query(`
            INSERT INTO preset_soudure_heads (preset_id, type, numero, actif, amperage, voltage, type_fil)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [finalParametreId, head.type, head.numero, head.actif ? 1 : 0, 
              head.actif ? (head.amperage || 0) : 0, head.actif ? (head.voltage || 0) : 0, 
              head.type_fil || '3.2mm']);
        }
      }
    } else {
      return res.status(400).json({ error: 'Action invalide' });
    }

    // Mettre à jour le lot
    await conn.query('UPDATE lots SET parametre_id = ? WHERE id = ?', [finalParametreId, id]);

    await conn.commit();

    const [updated] = await pool.query(`
      SELECT l.*, pp.code as parametre_numero
      FROM lots l
      LEFT JOIN presets_soudure pp ON l.parametre_id = pp.id
      WHERE l.id = ?
    `, [id]);

    res.json({ message: 'Paramètres mis à jour', lot: updated[0], nouveau_preset_id: finalParametreId });
  } catch (error) {
    await conn.rollback();
    console.error('Erreur PUT /lots/:id/parametres:', error);
    res.status(500).json({ error: 'Erreur mise à jour paramètres' });
  } finally {
    conn.release();
  }
});

// ============================================
// DELETE /api/lots/:id - Supprimer un lot
// ============================================
router.delete('/:id', requireSupervisor, async (req, res) => {
  try {
    const { id } = req.params;

    // Libérer la bobine → retour en stock
    await pool.query('UPDATE bobines SET lot_id = NULL, statut = ? WHERE lot_id = ?', 
      ['en_stock', id]);

    const [result] = await pool.query('DELETE FROM lots WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lot non trouvé' });
    }

    res.json({ message: 'Lot supprimé' });
  } catch (error) {
    console.error('Erreur DELETE:', error);
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

// ============================================
// PUT /api/lots/:id/admin/update-dates - Modifier les dates du pipeline (System Admin uniquement)
// ============================================
router.put('/:id/admin/update-dates', requireSystemAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;
    
    // Champs autorisés à modifier
    const allowedFields = [
      'created_at',           // Date création du lot
      'date_reception',       // Date réception bobine
      'date_installation',    // Date installation bobine
      'date_equipe_confirmee' // Date confirmation équipe
    ];
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Champ non autorisé' });
    }
    
    // Valider le format de la date
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) {
      return res.status(400).json({ error: 'Format de date invalide' });
    }
    
    // Récupérer les dates actuelles du lot pour recalculer les retards
    const [lotRows] = await pool.query(
      `SELECT created_at, date_reception, date_installation, bobine_recue, bobine_installee FROM lots WHERE id = ?`,
      [id]
    );
    
    if (lotRows.length === 0) {
      return res.status(404).json({ error: 'Lot non trouvé' });
    }
    
    const lot = lotRows[0];
    
    // Mise à jour de la date
    await pool.query(
      `UPDATE lots SET ${field} = ? WHERE id = ?`,
      [dateValue, id]
    );
    
    // Recalculer les retards en fonction du champ modifié
    // Les nouvelles valeurs pour le calcul
    const dates = {
      created_at: field === 'created_at' ? dateValue : lot.created_at,
      date_reception: field === 'date_reception' ? dateValue : lot.date_reception,
      date_installation: field === 'date_installation' ? dateValue : lot.date_installation
    };
    
    // Calcul des retards
    let retardReception = 0;
    let retardInstallation = 0;
    
    // Retard réception = temps entre création du lot et réception de la bobine
    if (dates.created_at && dates.date_reception && lot.bobine_recue) {
      const diffReception = new Date(dates.date_reception) - new Date(dates.created_at);
      retardReception = Math.max(0, Math.round(diffReception / 60000)); // en minutes
    }
    
    // Retard installation = temps entre réception et installation
    if (dates.date_reception && dates.date_installation && lot.bobine_installee) {
      const diffInstallation = new Date(dates.date_installation) - new Date(dates.date_reception);
      retardInstallation = Math.max(0, Math.round(diffInstallation / 60000)); // en minutes
    }
    
    // Mettre à jour les retards si besoin
    if (field === 'created_at' || field === 'date_reception') {
      // La modification de created_at ou date_reception affecte retard_reception
      if (lot.bobine_recue) {
        await pool.query(
          `UPDATE lots SET retard_reception_minutes = ? WHERE id = ?`,
          [retardReception, id]
        );
      }
    }
    
    if (field === 'date_reception' || field === 'date_installation') {
      // La modification de date_reception ou date_installation affecte retard_installation
      if (lot.bobine_installee) {
        await pool.query(
          `UPDATE lots SET retard_installation_minutes = ? WHERE id = ?`,
          [retardInstallation, id]
        );
      }
    }
    
    // Log de l'action pour traçabilité
    console.log(`[ADMIN] User ${req.user.id} modified ${field} for lot ${id} to ${value}`);
    console.log(`[ADMIN] Recalculated delays - Reception: ${retardReception}min, Installation: ${retardInstallation}min`);
    
    res.json({ 
      message: 'Date mise à jour et retards recalculés', 
      field, 
      value: dateValue,
      retard_reception_minutes: retardReception,
      retard_installation_minutes: retardInstallation
    });
  } catch (error) {
    console.error('Erreur update-dates:', error);
    res.status(500).json({ error: 'Erreur modification date' });
  }
});

module.exports = router;
