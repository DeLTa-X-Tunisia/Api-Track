/**
 * Migration: Création des tables pour le module Tubes
 * Tables: tubes, tube_etapes, tube_etape_photos, tube_etape_historique, responsabilites, reparation_defauts
 */
const pool = require('../config/database');

async function migrateTubes() {
  const conn = await pool.getConnection();
  try {
    console.log('🔧 Début migration Tubes...\n');

    // ============================================
    // Table RESPONSABILITES (pour les défauts de réparation)
    // ============================================
    await conn.query(`
      CREATE TABLE IF NOT EXISTS responsabilites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        description TEXT,
        actif TINYINT(1) DEFAULT 1,
        ordre INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table responsabilites créée/vérifiée');

    // ============================================
    // Table TUBES
    // ============================================
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tubes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lot_id INT NOT NULL,
        lot_id_2 INT DEFAULT NULL,
        numero VARCHAR(20) NOT NULL,
        type_tube ENUM('normal', 'cross_welding') DEFAULT 'normal',
        diametre_mm DECIMAL(10,2) NOT NULL,
        diametre_pouce VARCHAR(20),
        longueur DECIMAL(10,2),
        epaisseur DECIMAL(10,3),
        poids DECIMAL(10,2),
        etape_courante SMALLINT DEFAULT 1,
        statut ENUM('en_production', 'termine', 'rebut', 'en_attente', 'en_reparation', 'interrompu') DEFAULT 'en_production',
        operateur_id INT,
        operateur_nom VARCHAR(100),
        operateur_prenom VARCHAR(100),
        parametre_id INT DEFAULT NULL,
        decision ENUM('en_attente', 'certifie_api', 'certifie_hydraulique', 'declasse') DEFAULT 'en_attente',
        decision_date DATETIME DEFAULT NULL,
        decision_par VARCHAR(200) DEFAULT NULL,
        decision_commentaire TEXT DEFAULT NULL,
        date_debut_decision DATETIME DEFAULT NULL,
        date_fin_decision DATETIME DEFAULT NULL,
        date_fin_production DATETIME DEFAULT NULL,
        saw_date DATETIME DEFAULT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE RESTRICT,
        UNIQUE KEY unique_numero (numero)
      )
    `);
    console.log('✅ Table tubes créée/vérifiée');

    // Index pour performance
    try { await conn.query('CREATE INDEX idx_tubes_lot_id ON tubes(lot_id)'); } catch(e) {}
    try { await conn.query('CREATE INDEX idx_tubes_statut ON tubes(statut)'); } catch(e) {}
    try { await conn.query('CREATE INDEX idx_tubes_etape ON tubes(etape_courante)'); } catch(e) {}
    try { await conn.query('CREATE INDEX idx_tubes_decision ON tubes(decision)'); } catch(e) {}

    // ============================================
    // Table TUBE_ETAPES
    // ============================================
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tube_etapes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tube_id INT NOT NULL,
        etape_numero SMALLINT NOT NULL,
        etape_code VARCHAR(50) NOT NULL,
        statut ENUM('en_attente', 'en_cours', 'valide', 'non_conforme', 'saute', 'en_reparation', 'interrompu') DEFAULT 'en_attente',
        operateur_id INT,
        operateur_nom VARCHAR(100),
        operateur_prenom VARCHAR(100),
        commentaire TEXT,
        started_at DATETIME,
        completed_at DATETIME,
        offline TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tube_id) REFERENCES tubes(id) ON DELETE CASCADE,
        UNIQUE KEY unique_tube_etape (tube_id, etape_numero)
      )
    `);
    console.log('✅ Table tube_etapes créée/vérifiée');

    // ============================================
    // Table TUBE_ETAPE_PHOTOS
    // ============================================
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tube_etape_photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tube_id INT NOT NULL,
        etape_numero SMALLINT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        mimetype VARCHAR(100),
        size INT,
        path VARCHAR(500),
        description TEXT,
        uploaded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tube_id) REFERENCES tubes(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table tube_etape_photos créée/vérifiée');

    // ============================================
    // Table TUBE_ETAPE_HISTORIQUE (audit trail par étape)
    // ============================================
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tube_etape_historique (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tube_id INT NOT NULL,
        etape_numero SMALLINT NOT NULL,
        etape_code VARCHAR(50),
        type_action VARCHAR(50) NOT NULL,
        commentaire TEXT,
        operateur_id INT,
        operateur_nom VARCHAR(100),
        operateur_prenom VARCHAR(100),
        defaut TEXT,
        cause_defaut TEXT,
        responsabilite_id INT,
        responsabilite_nom VARCHAR(100),
        action_prise TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tube_id) REFERENCES tubes(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table tube_etape_historique créée/vérifiée');

    try { await conn.query('CREATE INDEX idx_tube_historique_tube ON tube_etape_historique(tube_id)'); } catch(e) {}
    try { await conn.query('CREATE INDEX idx_tube_historique_etape ON tube_etape_historique(tube_id, etape_numero)'); } catch(e) {}

    // ============================================
    // Table REPARATION_DEFAUTS (multi-défauts par réparation)
    // ============================================
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reparation_defauts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        historique_id INT NOT NULL,
        tube_id INT NOT NULL,
        etape_numero SMALLINT NOT NULL,
        defaut TEXT NOT NULL,
        cause_defaut TEXT,
        responsabilite_id INT,
        responsabilite_nom VARCHAR(100),
        action_prise TEXT,
        ordre INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (historique_id) REFERENCES tube_etape_historique(id) ON DELETE CASCADE,
        FOREIGN KEY (tube_id) REFERENCES tubes(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table reparation_defauts créée/vérifiée');

    // ============================================
    // Insérer responsabilités par défaut
    // ============================================
    const [existingResp] = await conn.query('SELECT COUNT(*) as cnt FROM responsabilites');
    if (existingResp[0].cnt === 0) {
      const resps = [
        'Opérateur',
        'Machine',
        'Matériau / Matière première',
        'Méthode / Procédure',
        'Environnement',
        'Maintenance',
        'Qualité',
        'Sous-traitant'
      ];
      for (let i = 0; i < resps.length; i++) {
        await conn.query('INSERT INTO responsabilites (nom, ordre) VALUES (?, ?)', [resps[i], i + 1]);
      }
      console.log(`✅ ${resps.length} responsabilités par défaut insérées`);
    }

    console.log('\n🎉 Migration Tubes terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur migration Tubes:', error);
    throw error;
  } finally {
    conn.release();
  }
}

migrateTubes()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
