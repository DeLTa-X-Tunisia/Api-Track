/**
 * Migration : Ajout colonne equipe_id sur la table lots
 * Usage: node src/database/add-equipe-to-lots.js
 */
const pool = require('../config/database');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('🚀 Migration: Ajout equipe_id à lots...\n');

    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lots' AND COLUMN_NAME = 'equipe_id'`
    );

    if (cols.length === 0) {
      await conn.query('ALTER TABLE lots ADD COLUMN equipe_id INT DEFAULT NULL AFTER parametre_id');
      console.log('✅ Colonne equipe_id ajoutée');

      await conn.query('ALTER TABLE lots ADD INDEX idx_lots_equipe (equipe_id)');
      console.log('✅ Index idx_lots_equipe créé');

      await conn.query(
        'ALTER TABLE lots ADD CONSTRAINT fk_lots_equipe FOREIGN KEY (equipe_id) REFERENCES equipes_production(id) ON DELETE SET NULL'
      );
      console.log('✅ FK fk_lots_equipe créée');
    } else {
      console.log('⏭️  Colonne equipe_id existe déjà');
    }

    console.log('\n🎉 Migration terminée !');
  } catch (error) {
    console.error('❌ Erreur migration:', error.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
