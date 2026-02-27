/**
 * Script d'initialisation de la base de données Logi-Track V2
 * ⚠️  Ce script recrée les tables — les données existantes seront perdues.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Génère un code unique à 6 chiffres
 */
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function initDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║       📦 INITIALISATION BASE DE DONNÉES LOGI-TRACK V2 📦     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    const dbName = process.env.DB_NAME || 'logitrack2';

    // Créer la base de données
    console.log(`📂 Création de la base de données '${dbName}'...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);
    console.log('✅ Base de données créée/sélectionnée');

    // ========== Table des entreprises ==========
    console.log('📋 Création de la table entreprises...');
    await connection.query(`DROP TABLE IF EXISTS users`);
    await connection.query(`DROP TABLE IF EXISTS entreprises`);
    await connection.query(`
      CREATE TABLE entreprises (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        nom VARCHAR(100) NOT NULL,
        actif BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table entreprises créée');

    // Entreprises par défaut
    await connection.query(`
      INSERT INTO entreprises (code, nom) VALUES
        ('danieli', 'DANIELI'),
        ('altumet', 'ALTUMET')
    `);
    console.log('✅ Entreprises par défaut insérées (DANIELI, ALTUMET)');

    // ========== Table des utilisateurs ==========
    console.log('📋 Création de la table users...');
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        matricule VARCHAR(20) UNIQUE NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        entreprise VARCHAR(50) DEFAULT 'danieli',
        role ENUM('system_admin', 'admin', 'superviseur', 'consultant') DEFAULT 'consultant',
        actif BOOLEAN DEFAULT TRUE,
        derniere_connexion DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table users créée');

    // ========== Insertion de l'admin système par défaut ==========
    const adminCode = generateCode();
    const year = new Date().getFullYear();
    const matricule = `LT2-${year}-0001`;

    await connection.query(`
      INSERT INTO users (code, matricule, nom, prenom, entreprise, role) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [adminCode, matricule, 'Admin', 'Système', 'danieli', 'system_admin']);
    console.log(`✅ Compte System Admin créé`);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Initialisation terminée avec succès !');
    console.log(`  📌 Code de connexion System Admin : ${adminCode}`);
    console.log(`  📌 Matricule : ${matricule}`);
    console.log('  🚀 Lancez le serveur avec: npm run dev');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur d\'initialisation:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

initDatabase();
