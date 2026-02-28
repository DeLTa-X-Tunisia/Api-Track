const express = require('express');
const router = express.Router();
const { authenticateToken, requireSystemAdmin } = require('../middleware/auth');

// All admin routes require system_admin role
router.use(authenticateToken, requireSystemAdmin);

// ============================================
// GET /api/admin/connected-users
// Liste des utilisateurs connectés en temps réel
// ============================================
router.get('/connected-users', (req, res) => {
  try {
    const connectedUsers = req.app.get('connectedUsers');
    const users = Array.from(connectedUsers.values()).map(u => ({
      socketId: u.socketId,
      userId: u.userId,
      nom: u.nom,
      prenom: u.prenom,
      role: u.role,
      entreprise: u.entreprise,
      code: u.code,
      connectedAt: u.connectedAt,
      ip: u.ip
    }));
    
    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Erreur connected-users:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// POST /api/admin/disconnect-user
// Déconnecter un utilisateur par socketId
// ============================================
router.post('/disconnect-user', (req, res) => {
  try {
    const { socketId } = req.body;
    if (!socketId) {
      return res.status(400).json({ error: 'socketId requis' });
    }

    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const userInfo = connectedUsers.get(socketId);
    
    if (!userInfo) {
      return res.status(404).json({ error: 'Utilisateur non trouvé ou déjà déconnecté' });
    }

    // Don't allow disconnecting yourself
    if (userInfo.userId === req.user.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous déconnecter vous-même' });
    }

    const targetSocket = io.sockets.sockets.get(socketId);
    if (targetSocket) {
      targetSocket.emit('admin:kicked', { 
        message: 'Vous avez été déconnecté par l\'administrateur système.' 
      });
      setTimeout(() => targetSocket.disconnect(true), 500);
    }

    res.json({ 
      success: true, 
      message: `${userInfo.prenom} ${userInfo.nom} a été déconnecté` 
    });
  } catch (error) {
    console.error('Erreur disconnect-user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// POST /api/admin/disconnect-all
// Déconnecter tous les utilisateurs (sauf l'admin)
// ============================================
router.post('/disconnect-all', (req, res) => {
  try {
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    let count = 0;

    for (const [socketId, userInfo] of connectedUsers.entries()) {
      if (userInfo.userId === req.user.userId) continue; // Skip self
      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket) {
        targetSocket.emit('admin:kicked', { 
          message: 'Vous avez été déconnecté par l\'administrateur système.' 
        });
        setTimeout(() => targetSocket.disconnect(true), 500);
        count++;
      }
    }

    res.json({ 
      success: true, 
      message: `${count} utilisateur(s) déconnecté(s)` 
    });
  } catch (error) {
    console.error('Erreur disconnect-all:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// POST /api/admin/send-message
// Envoyer un message à un utilisateur ou à tous
// ============================================
router.post('/send-message', (req, res) => {
  try {
    const { socketId, message, type = 'info', broadcast = false } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message requis' });
    }

    if (!broadcast && !socketId) {
      return res.status(400).json({ error: 'socketId requis pour un message ciblé' });
    }

    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const sender = `${req.user.nom} ${req.user.prenom || ''}`.trim();
    
    const payload = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      message: message.trim(),
      type, // 'info', 'warning', 'urgent'
      sender,
      senderRole: 'Administrateur Système',
      timestamp: new Date().toISOString(),
      broadcast
    };

    if (broadcast) {
      // Send to all connected users
      io.emit('admin:message', payload);
      res.json({ 
        success: true, 
        message: `Message envoyé à ${connectedUsers.size} utilisateur(s) connecté(s)`,
        payload
      });
    } else {
      // Send to specific user
      const targetSocket = io.sockets.sockets.get(socketId);
      const userInfo = connectedUsers.get(socketId);
      
      if (!targetSocket || !userInfo) {
        return res.status(404).json({ error: 'Utilisateur non trouvé ou déconnecté' });
      }

      targetSocket.emit('admin:message', payload);
      res.json({ 
        success: true, 
        message: `Message envoyé à ${userInfo.prenom} ${userInfo.nom}`,
        payload
      });
    }
  } catch (error) {
    console.error('Erreur send-message:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
