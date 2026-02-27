/**
 * Migration : Création de la table grades (nuances d'acier)
 * Module "Bobine en Stock" - Logi-Track V2
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateGrades() {
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
    console.log('║      📦 MIGRATION — GRADES (NUANCES ACIER) — LOGI-TRACK V2   ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // ========== Table grades ==========
    console.log('📋 Création de la table grades...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Ex: X42, X52, X65',
        nom VARCHAR(100) NOT NULL COMMENT 'Nom complet',
        norme VARCHAR(50) DEFAULT 'API 5L' COMMENT 'Norme associée',
        limite_elastique_min DECIMAL(10,2) DEFAULT NULL COMMENT 'MPa',
        resistance_traction_min DECIMAL(10,2) DEFAULT NULL COMMENT 'MPa',
        actif BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table grades créée');

    // ========== Seed grades API 5L ==========
    console.log('📋 Insertion des grades API 5L...');
    await connection.query(`
      INSERT IGNORE INTO grades (code, nom, norme, limite_elastique_min, resistance_traction_min) VALUES
      ('B',   'Grade B',   'API 5L', 245, 415),
      ('X42', 'Grade X42', 'API 5L', 290, 415),
      ('X46', 'Grade X46', 'API 5L', 317, 435),
      ('X52', 'Grade X52', 'API 5L', 359, 455),
      ('X56', 'Grade X56', 'API 5L', 386, 490),
      ('X60', 'Grade X60', 'API 5L', 415, 520),
      ('X65', 'Grade X65', 'API 5L', 450, 535),
      ('X70', 'Grade X70', 'API 5L', 485, 570),
      ('X80', 'Grade X80', 'API 5L', 555, 625)
    `);
    console.log('✅ Grades API 5L insérés');

    // ========== Seed grades API 5CT ==========
    console.log('📋 Insertion des grades API 5CT...');
    await connection.query(`
      INSERT IGNORE INTO grades (code, nom, norme, limite_elastique_min, resistance_traction_min) VALUES
      ('H40',  'Grade H40',  'API 5CT', 276, 414),
      ('J55',  'Grade J55',  'API 5CT', 379, 517),
      ('K55',  'Grade K55',  'API 5CT', 379, 655),
      ('N80',  'Grade N80',  'API 5CT', 552, 689),
      ('L80',  'Grade L80',  'API 5CT', 552, 655),
      ('P110', 'Grade P110', 'API 5CT', 758, 862)
    `);
    console.log('✅ Grades API 5CT insérés');

    // ========== Seed grades ASTM A53 ==========
    console.log('📋 Insertion des grades ASTM A53...');
    await connection.query(`
      INSERT IGNORE INTO grades (code, nom, norme, limite_elastique_min, resistance_traction_min) VALUES
      ('A53-A', 'Grade A', 'ASTM A53', 205, 330),
      ('A53-B', 'Grade B', 'ASTM A53', 240, 415)
    `);
    console.log('✅ Grades ASTM A53 insérés');

    // ========== Seed grades EN 10219 ==========
    console.log('📋 Insertion des grades EN 10219...');
    await connection.query(`
      INSERT IGNORE INTO grades (code, nom, norme, limite_elastique_min, resistance_traction_min) VALUES
      ('S235',  'S235JRH',  'EN 10219', 235, 360),
      ('S275',  'S275J0H',  'EN 10219', 275, 430),
      ('S355',  'S355J2H',  'EN 10219', 355, 510),
      ('S460',  'S460NH',   'EN 10219', 460, 540)
    `);
    console.log('✅ Grades EN 10219 insérés');

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Migration Grades terminée avec succès !');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  migrateGrades()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrateGrades;
