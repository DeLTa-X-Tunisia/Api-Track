/**
 * Migration : Création des tables bobines + bobine_photos + fournisseurs
 * Module "Bobine en Stock" - Logi-Track V2
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateBobines() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'logitrack2',
      port: process.env.DB_PORT || 3306
    });

    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        📦 MIGRATION — BOBINES EN STOCK — LOGI-TRACK V2 📦    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // ========== Table fournisseurs ==========
    console.log('📋 Création de la table fournisseurs...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fournisseurs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(150) NOT NULL,
        actif BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table fournisseurs créée');

    // ========== Table bobines ==========
    console.log('📋 Création de la table bobines...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bobines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero VARCHAR(100) UNIQUE NOT NULL COMMENT 'Code bobine unique',
        norme VARCHAR(50) DEFAULT 'API 5L' COMMENT 'Norme (API 5L, API 5CT, etc.)',
        grade VARCHAR(100) DEFAULT NULL COMMENT 'Grade / nuance acier',
        epaisseur DECIMAL(10,2) NOT NULL COMMENT 'Épaisseur en mm',
        largeur DECIMAL(10,2) DEFAULT NULL COMMENT 'Largeur en mm',
        poids DECIMAL(12,2) DEFAULT NULL COMMENT 'Poids en kg',
        fournisseur VARCHAR(150) DEFAULT NULL,
        date_reception DATE DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        statut ENUM('en_stock','en_cours','epuisee') DEFAULT 'en_stock',
        created_by INT DEFAULT NULL,
        createur_nom VARCHAR(100) DEFAULT NULL,
        createur_prenom VARCHAR(100) DEFAULT NULL,
        updated_by INT DEFAULT NULL,
        modificateur_nom VARCHAR(100) DEFAULT NULL,
        modificateur_prenom VARCHAR(100) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table bobines créée');

    // ========== Table bobine_photos ==========
    console.log('📋 Création de la table bobine_photos...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bobine_photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bobine_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) DEFAULT NULL,
        mimetype VARCHAR(100) DEFAULT NULL,
        size INT DEFAULT NULL,
        path VARCHAR(500) NOT NULL,
        uploaded_by INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bobine_id) REFERENCES bobines(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table bobine_photos créée');

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Migration Bobines en Stock terminée avec succès !');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

// Exécuter si lancé directement
if (require.main === module) {
  migrateBobines()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrateBobines;
