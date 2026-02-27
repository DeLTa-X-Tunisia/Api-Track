/**
 * Migration — Équipes de Production
 * Tables : qualifications, zones_travail, personnel_production,
 *          equipes_production, equipe_membres
 * Logi-Track V2
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateEquipes() {
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
    console.log('║  👷  MIGRATION — ÉQUIPES DE PRODUCTION — LOGI-TRACK V2       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Helpers
    async function tableExists(table) {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as cnt FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, [table]
      );
      return rows[0].cnt > 0;
    }

    // ════════════════════════════════════════
    // 1. qualifications
    // ════════════════════════════════════════
    console.log('📋 1. Table qualifications...');
    if (!(await tableExists('qualifications'))) {
      await connection.query(`
        CREATE TABLE qualifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nom VARCHAR(100) NOT NULL,
          actif TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_nom (nom)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table qualifications créée');

      // Seed default qualifications
      const defaultQualifs = [
        'Soudeur', 'Formeur', 'Opérateur', 'Manœuvre',
        'Conducteur Machine', 'Conducteur Grenailleuse Extérieur',
        'Opérateur sur MAS NLAT', 'CND UT Specialist',
        'Soudeur Homologué Tuberie', 'Opérateur Machine NLAT',
        'Conducteur Brosse', 'Contremaître Principal (Parachèvement)',
        'Ouvrier'
      ];
      for (const nom of defaultQualifs) {
        await connection.query('INSERT IGNORE INTO qualifications (nom) VALUES (?)', [nom]);
      }
      console.log(`  ✅ ${defaultQualifs.length} qualifications pré-chargées`);
    } else {
      console.log('  ⏭️  Table qualifications existe déjà');
    }

    // ════════════════════════════════════════
    // 2. zones_travail
    // ════════════════════════════════════════
    console.log('');
    console.log('📋 2. Table zones_travail...');
    if (!(await tableExists('zones_travail'))) {
      await connection.query(`
        CREATE TABLE zones_travail (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nom VARCHAR(100) NOT NULL,
          description TEXT,
          couleur VARCHAR(20) DEFAULT 'blue' COMMENT 'Clé couleur Tailwind: red, blue, green, orange, violet, cyan, rose, amber, indigo, emerald',
          actif TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_nom (nom)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table zones_travail créée');
    } else {
      console.log('  ⏭️  Table zones_travail existe déjà');
    }

    // ════════════════════════════════════════
    // 3. personnel_production
    // ════════════════════════════════════════
    console.log('');
    console.log('📋 3. Table personnel_production...');
    if (!(await tableExists('personnel_production'))) {
      await connection.query(`
        CREATE TABLE personnel_production (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nom VARCHAR(100) NOT NULL,
          prenom VARCHAR(100) NOT NULL,
          matricule VARCHAR(50) NOT NULL,
          telephone VARCHAR(30),
          role ENUM('chef','operateur') NOT NULL DEFAULT 'operateur',
          qualification_id INT,
          actif TINYINT(1) DEFAULT 1,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_matricule (matricule),
          FOREIGN KEY (qualification_id) REFERENCES qualifications(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table personnel_production créée');
    } else {
      console.log('  ⏭️  Table personnel_production existe déjà');
    }

    // ════════════════════════════════════════
    // 4. equipes_production
    // ════════════════════════════════════════
    console.log('');
    console.log('📋 4. Table equipes_production...');
    if (!(await tableExists('equipes_production'))) {
      await connection.query(`
        CREATE TABLE equipes_production (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(20) NOT NULL,
          nom VARCHAR(150) NOT NULL,
          zone_id INT,
          chef_id INT,
          notes TEXT,
          actif TINYINT(1) DEFAULT 1,
          created_by INT,
          createur_nom VARCHAR(100),
          createur_prenom VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_code (code),
          FOREIGN KEY (zone_id) REFERENCES zones_travail(id) ON DELETE SET NULL,
          FOREIGN KEY (chef_id) REFERENCES personnel_production(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table equipes_production créée');
    } else {
      console.log('  ⏭️  Table equipes_production existe déjà');
    }

    // ════════════════════════════════════════
    // 5. equipe_membres
    // ════════════════════════════════════════
    console.log('');
    console.log('📋 5. Table equipe_membres...');
    if (!(await tableExists('equipe_membres'))) {
      await connection.query(`
        CREATE TABLE equipe_membres (
          id INT AUTO_INCREMENT PRIMARY KEY,
          equipe_id INT NOT NULL,
          personnel_id INT NOT NULL,
          poste VARCHAR(100),
          FOREIGN KEY (equipe_id) REFERENCES equipes_production(id) ON DELETE CASCADE,
          FOREIGN KEY (personnel_id) REFERENCES personnel_production(id) ON DELETE CASCADE,
          UNIQUE KEY unique_membre (equipe_id, personnel_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table equipe_membres créée');
    } else {
      console.log('  ⏭️  Table equipe_membres existe déjà');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Migration Équipes de Production terminée avec succès !');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur migration équipes:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

migrateEquipes();
