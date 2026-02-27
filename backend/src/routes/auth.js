const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login - Connexion par code (6 chiffres)
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code de connexion requis' });
    }

    const [users] = await pool.query(
      `SELECT u.*, e.nom as entreprise_nom 
       FROM users u 
       LEFT JOIN entreprises e ON u.entreprise = e.code 
       WHERE u.code = ? AND u.actif = 1`,
      [code.trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Code invalide ou compte désactivé' });
    }

    const user = users[0];

    // Mettre à jour la dernière connexion
    await pool.query('UPDATE users SET derniere_connexion = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { 
        userId: user.id, 
        code: user.code, 
        role: user.role, 
        nom: user.nom, 
        prenom: user.prenom,
        entreprise: user.entreprise
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        code: user.code,
        matricule: user.matricule,
        nom: user.nom,
        prenom: user.prenom,
        entreprise: user.entreprise,
        entreprise_nom: user.entreprise_nom,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/me - Récupérer l'utilisateur connecté
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId) {
      const [users] = await pool.query(
        `SELECT u.id, u.code, u.matricule, u.nom, u.prenom, u.entreprise, u.role,
                e.nom as entreprise_nom
         FROM users u
         LEFT JOIN entreprises e ON u.entreprise = e.code
         WHERE u.id = ? AND u.actif = 1`,
        [req.user.userId]
      );
      if (users.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      return res.json({ user: users[0] });
    }

    res.status(401).json({ error: 'Token invalide' });
  } catch (error) {
    console.error('Erreur /me:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
