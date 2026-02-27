/**
 * Migration v3 : Têtes de soudure individuelles (ID/OD) + Type fil/flux
 * Alignement sur LogiTrack — Logi-Track V2
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migratePresetsV3() {
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
    console.log('║  ⚙️  MIGRATION V3 — TÊTES ID/OD + FIL/FLUX — LOGI-TRACK V2   ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Helpers
    async function columnExists(table, column) {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      return rows[0].cnt > 0;
    }

    async function tableExists(table) {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as cnt FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [table]
      );
      return rows[0].cnt > 0;
    }

    // ========== 1. Create preset_soudure_heads table ==========
    console.log('📋 1. Table preset_soudure_heads...');
    if (!(await tableExists('preset_soudure_heads'))) {
      await connection.query(`
        CREATE TABLE preset_soudure_heads (
          id INT AUTO_INCREMENT PRIMARY KEY,
          preset_id INT NOT NULL,
          type ENUM('ID','OD') NOT NULL COMMENT 'ID = intérieur, OD = extérieur',
          numero INT NOT NULL COMMENT 'Numéro de tête (1, 2, 3)',
          actif TINYINT(1) DEFAULT 0 COMMENT '1 = active, 0 = inactive',
          amperage DECIMAL(8,1) DEFAULT 0 COMMENT 'Ampérage par tête',
          voltage DECIMAL(8,1) DEFAULT 0 COMMENT 'Voltage par tête',
          type_fil VARCHAR(10) DEFAULT '3.2mm' COMMENT 'Type de fil par tête',
          FOREIGN KEY (preset_id) REFERENCES presets_soudure(id) ON DELETE CASCADE,
          UNIQUE KEY unique_head (preset_id, type, numero)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Table preset_soudure_heads créée');
    } else {
      // Ensure type_fil column exists (may have been created without it)
      if (!(await columnExists('preset_soudure_heads', 'type_fil'))) {
        await connection.query(`ALTER TABLE preset_soudure_heads ADD COLUMN type_fil VARCHAR(10) DEFAULT '3.2mm' AFTER voltage`);
        console.log('  ✅ Colonne type_fil ajoutée à preset_soudure_heads');
      }
      console.log('  ⏭️  Table preset_soudure_heads existe déjà');
    }

    // ========== 2. Add soudure_type_fil & soudure_type_flux to presets_soudure ==========
    console.log('');
    console.log('📋 2. Colonnes soudure_type_fil / soudure_type_flux...');
    if (!(await columnExists('presets_soudure', 'soudure_type_fil'))) {
      await connection.query(
        `ALTER TABLE presets_soudure ADD COLUMN soudure_type_fil VARCHAR(10) DEFAULT '1.6mm' COMMENT 'Type de fil soudure finale' AFTER soudure_vitesse_cm`
      );
      console.log('  ✅ soudure_type_fil ajoutée');
    } else {
      console.log('  ⏭️  soudure_type_fil existe déjà');
    }

    if (!(await columnExists('presets_soudure', 'soudure_type_flux'))) {
      await connection.query(
        `ALTER TABLE presets_soudure ADD COLUMN soudure_type_flux VARCHAR(10) DEFAULT 'SAW' COMMENT 'Type de flux soudure' AFTER soudure_type_fil`
      );
      console.log('  ✅ soudure_type_flux ajoutée');
    } else {
      console.log('  ⏭️  soudure_type_flux existe déjà');
    }

    // ========== 3. Migrate existing presets → create default heads ==========
    console.log('');
    console.log('📋 3. Migration des presets existants → têtes ID/OD...');
    const [existingPresets] = await connection.query('SELECT id, nb_tetes, tetes_config FROM presets_soudure');

    for (const preset of existingPresets) {
      const [existingHeads] = await connection.query(
        'SELECT COUNT(*) as cnt FROM preset_soudure_heads WHERE preset_id = ?', [preset.id]
      );
      if (existingHeads[0].cnt > 0) {
        console.log(`  ⏭️  Preset #${preset.id} a déjà des têtes`);
        continue;
      }

      const config = typeof preset.tetes_config === 'string'
        ? JSON.parse(preset.tetes_config || '[]')
        : (preset.tetes_config || []);

      // Default: ID 1-3 + OD 1-2
      const defaultHeads = [
        { type: 'ID', numero: 1 },
        { type: 'ID', numero: 2 },
        { type: 'ID', numero: 3 },
        { type: 'OD', numero: 1 },
        { type: 'OD', numero: 2 },
      ];

      for (let i = 0; i < defaultHeads.length; i++) {
        const actif = i < config.length ? (config[i] ? 1 : 0) : 0;
        await connection.query(
          'INSERT IGNORE INTO preset_soudure_heads (preset_id, type, numero, actif, amperage, voltage, type_fil) VALUES (?, ?, ?, ?, 0, 0, ?)',
          [preset.id, defaultHeads[i].type, defaultHeads[i].numero, actif, '3.2mm']
        );
      }
      console.log(`  ✅ Preset #${preset.id} : 5 têtes créées`);
    }

    // ========== 4. Add missing diameters (to match LogiTrack's full range) ==========
    console.log('');
    console.log('📋 4. Ajout des diamètres manquants...');
    const extraDiametres = [
      ['50', 1270.0], ['52', 1320.8], ['58', 1473.2],
      ['66', 1676.4], ['68', 1727.2], ['72', 1828.8],
      ['76', 1930.4], ['80', 2032.0], ['82', 2082.8],
    ];

    for (const [pouce, mm] of extraDiametres) {
      const [existing] = await connection.query(
        'SELECT id FROM diametres_tubes WHERE pouce = ?', [pouce]
      );
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO diametres_tubes (pouce, mm) VALUES (?, ?)',
          [pouce, mm]
        );
        console.log(`  ✅ Ø ${pouce}" (${mm} mm) ajouté`);
      } else {
        console.log(`  ⏭️  Ø ${pouce}" existe déjà`);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Migration v3 terminée avec succès !');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur migration v3:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

migratePresetsV3();
