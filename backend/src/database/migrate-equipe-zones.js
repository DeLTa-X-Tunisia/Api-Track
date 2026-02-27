/**
 * Migration: Restructurer les équipes pour supporter multi-zones
 * 
 * Ancien modèle: equipe -> 1 zone, 1 chef, N membres
 * Nouveau modèle: equipe -> N zones, chaque zone a 1 chef + N membres
 * 
 * Changes:
 * - Add zone_id + is_chef to equipe_membres
 * - Migrate existing data (chef_id + zone_id from equipes into equipe_membres)
 * - Drop zone_id + chef_id from equipes_production
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
    console.log('🔄 Migration: restructuration multi-zones des équipes...\n');

    // 1. Add zone_id and is_chef to equipe_membres if not exists
    const [cols] = await conn.query('DESCRIBE equipe_membres');
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('zone_id')) {
      console.log('  ➕ Ajout colonne zone_id à equipe_membres...');
      await conn.query('ALTER TABLE equipe_membres ADD COLUMN zone_id INT NULL AFTER equipe_id');
      await conn.query('ALTER TABLE equipe_membres ADD INDEX idx_em_zone (zone_id)');
    }

    if (!colNames.includes('is_chef')) {
      console.log('  ➕ Ajout colonne is_chef à equipe_membres...');
      await conn.query('ALTER TABLE equipe_membres ADD COLUMN is_chef TINYINT(1) NOT NULL DEFAULT 0 AFTER personnel_id');
    }

    // 2. Migrate existing data: move chef_id + zone_id from equipes into equipe_membres
    const [eqCols] = await conn.query('DESCRIBE equipes_production');
    const eqColNames = eqCols.map(c => c.Field);

    if (eqColNames.includes('chef_id')) {
      console.log('  🔄 Migration des chefs existants vers equipe_membres...');
      
      // Get all equipes with chef_id set
      const [equipes] = await conn.query(
        'SELECT id, zone_id, chef_id FROM equipes_production WHERE chef_id IS NOT NULL'
      );

      for (const eq of equipes) {
        // Check if chef already in equipe_membres
        const [existing] = await conn.query(
          'SELECT id FROM equipe_membres WHERE equipe_id = ? AND personnel_id = ?',
          [eq.id, eq.chef_id]
        );

        if (existing.length > 0) {
          // Update existing entry
          await conn.query(
            'UPDATE equipe_membres SET zone_id = ?, is_chef = 1 WHERE equipe_id = ? AND personnel_id = ?',
            [eq.zone_id, eq.id, eq.chef_id]
          );
        } else {
          // Insert new entry
          await conn.query(
            'INSERT INTO equipe_membres (equipe_id, zone_id, personnel_id, is_chef) VALUES (?, ?, ?, 1)',
            [eq.id, eq.zone_id, eq.chef_id]
          );
        }
      }

      // Update existing members with zone_id from their equipe
      const [allEquipes] = await conn.query('SELECT id, zone_id FROM equipes_production');
      for (const eq of allEquipes) {
        if (eq.zone_id) {
          await conn.query(
            'UPDATE equipe_membres SET zone_id = ? WHERE equipe_id = ? AND zone_id IS NULL',
            [eq.zone_id, eq.id]
          );
        }
      }

      console.log(`  ✅ ${equipes.length} chef(s) migré(s)`);
    }

    // 3. Drop old columns from equipes_production
    if (eqColNames.includes('chef_id')) {
      console.log('  🗑️  Suppression colonne chef_id de equipes_production...');
      // Drop FK if exists
      const [fks] = await conn.query(
        `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = 'logitrack2' AND TABLE_NAME = 'equipes_production' AND COLUMN_NAME = 'chef_id' AND REFERENCED_TABLE_NAME IS NOT NULL`
      );
      for (const fk of fks) {
        await conn.query(`ALTER TABLE equipes_production DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
      }
      // Drop index if exists
      try { await conn.query('ALTER TABLE equipes_production DROP INDEX chef_id'); } catch (e) {}
      try { await conn.query('ALTER TABLE equipes_production DROP INDEX idx_ep_chef'); } catch (e) {}
      await conn.query('ALTER TABLE equipes_production DROP COLUMN chef_id');
    }

    if (eqColNames.includes('zone_id')) {
      console.log('  🗑️  Suppression colonne zone_id de equipes_production...');
      const [fks] = await conn.query(
        `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = 'logitrack2' AND TABLE_NAME = 'equipes_production' AND COLUMN_NAME = 'zone_id' AND REFERENCED_TABLE_NAME IS NOT NULL`
      );
      for (const fk of fks) {
        await conn.query(`ALTER TABLE equipes_production DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
      }
      try { await conn.query('ALTER TABLE equipes_production DROP INDEX zone_id'); } catch (e) {}
      try { await conn.query('ALTER TABLE equipes_production DROP INDEX idx_ep_zone'); } catch (e) {}
      await conn.query('ALTER TABLE equipes_production DROP COLUMN zone_id');
    }

    // 4. Drop old poste column if exists (no longer used)
    if (colNames.includes('poste')) {
      console.log('  🗑️  Suppression colonne poste de equipe_membres...');
      await conn.query('ALTER TABLE equipe_membres DROP COLUMN poste');
    }

    console.log('\n✅ Migration terminée avec succès !');
    console.log('   Nouveau modèle: équipe → N zones, chaque zone → 1 chef + N membres');
  } catch (e) {
    console.error('❌ Erreur migration:', e.message);
    throw e;
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
