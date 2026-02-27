/**
 * Migration : Remplacer checklist_validee par equipe_confirmee dans lots
 * Step 4 du pipeline passe de "Checklist Machine" à "Équipe de Production confirmée"
 */
const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'logitrack2',
  });

  const conn = await pool.getConnection();
  try {
    console.log('🚀 Migration: Remplacement Checklist → Équipe confirmée...\n');

    // 1. Ajouter colonne equipe_confirmee
    const [cols] = await conn.query(`SHOW COLUMNS FROM lots LIKE 'equipe_confirmee'`);
    if (cols.length === 0) {
      await conn.query(`ALTER TABLE lots ADD COLUMN equipe_confirmee TINYINT(1) NOT NULL DEFAULT 0 AFTER checklist_source_lot_id`);
      await conn.query(`ALTER TABLE lots ADD COLUMN date_equipe_confirmee DATETIME NULL AFTER equipe_confirmee`);
      console.log('✅ Colonnes equipe_confirmee + date_equipe_confirmee ajoutées');
    } else {
      console.log('ℹ️  Colonnes déjà existantes');
    }

    // 2. Migrer les données : checklist_validee → equipe_confirmee
    const [updated] = await conn.query(`
      UPDATE lots SET 
        equipe_confirmee = checklist_validee,
        date_equipe_confirmee = date_checklist
      WHERE checklist_validee = 1 AND equipe_confirmee = 0
    `);
    console.log(`✅ ${updated.affectedRows} lot(s) migré(s) (checklist → equipe_confirmee)`);

    console.log('\n✅ Migration terminée avec succès!');
    console.log('Step 4 pipeline: "Checklist Machine" → "Équipe de Production confirmée"');
  } catch (error) {
    console.error('❌ Erreur migration:', error.message);
    throw error;
  } finally {
    conn.release();
    await pool.end();
    process.exit(0);
  }
}

migrate();
