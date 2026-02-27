/**
 * Configuration Multer pour l'upload de fichiers
 * Logi-Track V2 - Gestion des uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration du stockage générique
const genericStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = req.uploadSubDir || 'general';
    const targetDir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Filtre pour n'accepter que les images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seules les images (JPEG, PNG, GIF, WEBP) sont acceptées.'), false);
  }
};

// Filtre pour images + PDF
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Images et PDF uniquement.'), false);
  }
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

// Upload images (max 5)
const uploadImages = multer({
  storage: genericStorage,
  fileFilter: imageFilter,
  limits: { fileSize: maxSize }
}).array('photos', 5);

// Upload document unique
const uploadDocument = multer({
  storage: genericStorage,
  fileFilter: documentFilter,
  limits: { fileSize: maxSize }
}).single('document');

// Upload générique (1 fichier)
const uploadSingle = multer({
  storage: genericStorage,
  limits: { fileSize: maxSize }
}).single('file');

module.exports = {
  uploadImages,
  uploadDocument,
  uploadSingle,
  uploadsDir
};
