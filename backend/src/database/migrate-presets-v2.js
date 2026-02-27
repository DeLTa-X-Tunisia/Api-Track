/**
 * Migration v2 : Ajout des champs avancés aux presets + diamètres manquants
 * Module "Paramètres de Soudure" - Logi-Track V2
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migratePresetsV2() {
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
    console.log('║   ⚙️  MIGRATION V2 — PARAMÈTRES DE SOUDURE — LOGI-TRACK V2   ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Helper: vérifier si une colonne existe
    async function columnExists(table, column) {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      return rows[0].cnt > 0;
    }

    // ========== Nouveaux champs presets_soudure ==========
    const newColumns = [
      // Milling / Forming
      { name: 'pression_rouleaux', def: 'DECIMAL(10,2) DEFAULT NULL COMMENT "Pression rouleaux"', after: 'milling_angle2' },
      { name: 'pression_unite', def: "VARCHAR(20) DEFAULT 'Tonnes' COMMENT 'Unité pression'", after: 'pression_rouleaux' },
      // Tackwelding vitesse
      { name: 'tack_vitesse_m', def: "INT NOT NULL DEFAULT 0 COMMENT 'Tack: vitesse mètres'", after: 'tack_voltage' },
      { name: 'tack_vitesse_cm', def: "INT NOT NULL DEFAULT 0 COMMENT 'Tack: vitesse cm'", after: 'tack_vitesse_m' },
      // Tackwelding extras
      { name: 'tack_frequence_hf', def: "DECIMAL(10,2) DEFAULT NULL COMMENT 'Tack: fréquence HF (Hz)'", after: 'tack_vitesse_cm' },
      { name: 'tack_type_gaz', def: "VARCHAR(30) DEFAULT 'CO₂' COMMENT 'Tack: type de gaz'", after: 'tack_frequence_hf' },
      { name: 'tack_debit_gaz', def: "DECIMAL(10,2) DEFAULT NULL COMMENT 'Tack: débit gaz (L/min)'", after: 'tack_type_gaz' },
      // Soudure Finale
      { name: 'finale_amperage', def: "DECIMAL(6,1) NOT NULL DEFAULT 0.0 COMMENT 'Soudure finale: ampérage'", after: 'soudure_vitesse_cm' },
      { name: 'finale_voltage', def: "DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT 'Soudure finale: voltage'", after: 'finale_amperage' },
      { name: 'finale_frequence_hf', def: "DECIMAL(10,2) DEFAULT NULL COMMENT 'Soudure finale: fréquence HF'", after: 'finale_voltage' },
      { name: 'finale_type_gaz', def: "VARCHAR(30) DEFAULT 'CO₂' COMMENT 'Soudure finale: type gaz'", after: 'finale_frequence_hf' },
      { name: 'finale_debit_gaz', def: "DECIMAL(10,2) DEFAULT NULL COMMENT 'Soudure finale: débit gaz'", after: 'finale_type_gaz' },
    ];

    for (const col of newColumns) {
      if (!(await columnExists('presets_soudure', col.name))) {
        console.log(`  📋 Ajout colonne ${col.name}...`);
        await connection.query(
          `ALTER TABLE presets_soudure ADD COLUMN ${col.name} ${col.def} AFTER ${col.after}`
        );
        console.log(`  ✅ ${col.name} ajoutée`);
      } else {
        console.log(`  ⏭️  ${col.name} existe déjà`);
      }
    }

    // ========== Diamètres manquants ==========
    console.log('');
    console.log('📋 Ajout des diamètres manquants...');
    const extraDiametres = [
      ['8', 219.1],
      ['10', 273.1],
      ['12', 323.9],
      ['14', 355.6],
      ['46', 1168.4],
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
    console.log('  ✅ Migration v2 Paramètres de Soudure terminée !');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur migration v2:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  migratePresetsV2()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migratePresetsV2;
