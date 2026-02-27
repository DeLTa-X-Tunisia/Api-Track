/**
 * Migration : Création des tables pour le module Lots (Bobine de Production)
 * Tables : lots, motifs_retard + ajout colonne lot_id sur bobines
 * 
 * Usage: node src/database/migrate-lots.js
 */

const pool = require('../config/database');

async function migrate() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🚀 Migration Lots - Bobine de Production...\n');

    // Helper pour vérifier si une colonne existe
    const columnExists = async (table, column) => {
      const [rows] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      return rows.length > 0;
    };

    // ========== Table motifs_retard ==========
    console.log('📋 Création de la table motifs_retard...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS motifs_retard (
        id INT AUTO_INCREMENT PRIMARY KEY,
        libelle VARCHAR(255) NOT NULL,
        categorie VARCHAR(100) DEFAULT NULL,
        etape ENUM('reception', 'installation', 'general') DEFAULT 'general',
        actif TINYINT(1) DEFAULT 1,
        ordre INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table motifs_retard créée');

    // Insérer des motifs par défaut
    const [existingMotifs] = await connection.query('SELECT COUNT(*) as count FROM motifs_retard');
    if (existingMotifs[0].count === 0) {
      console.log('📝 Insertion des motifs de retard par défaut...');
      await connection.query(`
        INSERT INTO motifs_retard (libelle, categorie, etape, ordre) VALUES
        ('Bobine en attente au quai', 'Logistique', 'reception', 1),
        ('Retard livraison fournisseur', 'Fournisseur', 'reception', 2),
        ('Problème de transport interne', 'Logistique', 'reception', 3),
        ('Vérification qualité en cours', 'Qualité', 'reception', 4),
        ('Attente chariot élévateur', 'Logistique', 'reception', 5),
        ('Machine occupée (lot précédent)', 'Production', 'installation', 1),
        ('Maintenance en cours', 'Maintenance', 'installation', 2),
        ('Changement outillage', 'Production', 'installation', 3),
        ('Problème mécanique', 'Maintenance', 'installation', 4),
        ('Attente opérateur', 'Personnel', 'installation', 5),
        ('Pause équipe', 'Personnel', 'general', 1),
        ('Coupure électrique', 'Infrastructure', 'general', 2),
        ('Autre', 'Divers', 'general', 10)
      `);
      console.log('✅ Motifs de retard par défaut insérés');
    }

    // ========== Table lots ==========
    console.log('📋 Création de la table lots...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero VARCHAR(50) NOT NULL UNIQUE,
        bobine_id INT DEFAULT NULL,
        parametre_id INT DEFAULT NULL COMMENT 'Référence vers presets_soudure',
        statut ENUM('en_cours', 'pret_production', 'en_production', 'termine', 'annule') DEFAULT 'en_cours',
        
        -- Workflow steps
        bobine_recue TINYINT(1) DEFAULT 0,
        date_reception DATETIME DEFAULT NULL,
        retard_reception_minutes INT DEFAULT 0,
        motif_retard_reception_id INT DEFAULT NULL,
        commentaire_reception TEXT DEFAULT NULL,
        
        bobine_installee TINYINT(1) DEFAULT 0,
        date_installation DATETIME DEFAULT NULL,
        retard_installation_minutes INT DEFAULT 0,
        motif_retard_installation_id INT DEFAULT NULL,
        commentaire_installation TEXT DEFAULT NULL,
        
        checklist_validee TINYINT(1) DEFAULT 0,
        date_checklist DATETIME DEFAULT NULL,
        checklist_validation_rapide TINYINT(1) DEFAULT 0,
        checklist_source_lot_id INT DEFAULT NULL,
        
        date_production DATETIME DEFAULT NULL,
        date_fin DATETIME DEFAULT NULL,
        
        -- Opérateur
        created_by INT DEFAULT NULL,
        operateur_nom VARCHAR(100) DEFAULT NULL,
        operateur_prenom VARCHAR(100) DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_lots_statut (statut),
        INDEX idx_lots_bobine (bobine_id),
        INDEX idx_lots_parametre (parametre_id),
        FOREIGN KEY (bobine_id) REFERENCES bobines(id) ON DELETE SET NULL,
        FOREIGN KEY (parametre_id) REFERENCES presets_soudure(id) ON DELETE SET NULL,
        FOREIGN KEY (motif_retard_reception_id) REFERENCES motifs_retard(id) ON DELETE SET NULL,
        FOREIGN KEY (motif_retard_installation_id) REFERENCES motifs_retard(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table lots créée');

    // ========== Ajouter lot_id à bobines ==========
    if (!(await columnExists('bobines', 'lot_id'))) {
      console.log('📋 Ajout colonne lot_id sur bobines...');
      await connection.query(`
        ALTER TABLE bobines ADD COLUMN lot_id INT DEFAULT NULL AFTER statut
      `);
      console.log('✅ Colonne lot_id ajoutée à bobines');
    }

    console.log('\n🎉 Migration Lots terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
