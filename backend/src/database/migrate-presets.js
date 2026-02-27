/**
 * Migration : Création des tables presets_soudure + diametres_tubes
 * Module "Paramètres de Soudure (Preset)" - Logi-Track V2
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migratePresets() {
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
    console.log('║    ⚙️  MIGRATION — PARAMÈTRES DE SOUDURE — LOGI-TRACK V2 ⚙️   ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // ========== Table diametres_tubes ==========
    console.log('📋 Création de la table diametres_tubes...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS diametres_tubes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pouce VARCHAR(10) NOT NULL COMMENT 'Diamètre en pouces (ex: 36)',
        mm DECIMAL(10,1) NOT NULL COMMENT 'Diamètre en mm (ex: 914.4)',
        actif BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table diametres_tubes créée');

    // Seed des diamètres standards spirale
    console.log('📋 Insertion des diamètres standards...');
    const diametres = [
      ['16', 406.4],
      ['18', 457.2],
      ['20', 508.0],
      ['22', 558.8],
      ['24', 609.6],
      ['26', 660.4],
      ['28', 711.2],
      ['30', 762.0],
      ['32', 812.8],
      ['34', 863.6],
      ['36', 914.4],
      ['38', 965.2],
      ['40', 1016.0],
      ['42', 1066.8],
      ['44', 1117.6],
      ['48', 1219.2],
      ['54', 1371.6],
      ['56', 1422.4],
      ['60', 1524.0],
      ['64', 1625.6],
    ];

    for (const [pouce, mm] of diametres) {
      const [existing] = await connection.query(
        'SELECT id FROM diametres_tubes WHERE pouce = ?', [pouce]
      );
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO diametres_tubes (pouce, mm) VALUES (?, ?)',
          [pouce, mm]
        );
      }
    }
    console.log(`✅ ${diametres.length} diamètres standards insérés`);

    // ========== Table presets_soudure ==========
    console.log('📋 Création de la table presets_soudure...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS presets_soudure (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Code preset auto-généré (PAR-36-1)',
        diametre_pouce VARCHAR(10) NOT NULL COMMENT 'Diamètre en pouces',
        diametre_mm DECIMAL(10,1) NOT NULL COMMENT 'Diamètre en mm',
        lot INT DEFAULT NULL COMMENT 'Numéro de lot (optionnel)',

        strip_vitesse_m INT NOT NULL DEFAULT 0 COMMENT 'Strip: vitesse mètres',
        strip_vitesse_cm INT NOT NULL DEFAULT 0 COMMENT 'Strip: vitesse centimètres',

        milling_angle1 DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT 'Milling: angle 1 en degrés',
        milling_angle2 DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT 'Milling: angle 2 en degrés',

        tack_amperage DECIMAL(6,1) NOT NULL DEFAULT 0.0 COMMENT 'Tack: ampérage (A)',
        tack_voltage DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT 'Tack: voltage (V)',

        soudure_vitesse_m INT NOT NULL DEFAULT 0 COMMENT 'Soudure: vitesse mètres',
        soudure_vitesse_cm INT NOT NULL DEFAULT 0 COMMENT 'Soudure: vitesse centimètres',

        nb_tetes INT NOT NULL DEFAULT 5 COMMENT 'Nombre total de têtes',
        tetes_config JSON DEFAULT NULL COMMENT 'Config têtes [true,true,true,true,false]',

        copie_de INT DEFAULT NULL COMMENT 'ID du preset source si copié',
        notes TEXT DEFAULT NULL,

        created_by INT DEFAULT NULL,
        createur_nom VARCHAR(100) DEFAULT NULL,
        createur_prenom VARCHAR(100) DEFAULT NULL,
        updated_by INT DEFAULT NULL,
        modificateur_nom VARCHAR(100) DEFAULT NULL,
        modificateur_prenom VARCHAR(100) DEFAULT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_diametre (diametre_pouce),
        INDEX idx_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table presets_soudure créée');

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Migration Paramètres de Soudure terminée avec succès !');
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
  migratePresets()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migratePresets;
