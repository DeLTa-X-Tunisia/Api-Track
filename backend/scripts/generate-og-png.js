const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Image SVG pour Api-Track OG
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="50%" style="stop-color:#1e1b4b"/>
      <stop offset="100%" style="stop-color:#312e81"/>
    </linearGradient>
    
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#a78bfa"/>
      <stop offset="50%" style="stop-color:#c4b5fd"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
    
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(139,92,246,0.08)" stroke-width="1"/>
    </pattern>
  </defs>
  
  <!-- Fond -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Grille de fond -->
  <rect width="1200" height="630" fill="url(#grid)"/>
  
  <!-- Cercles décoratifs -->
  <circle cx="100" cy="530" r="200" fill="rgba(139,92,246,0.15)"/>
  <circle cx="1100" cy="100" r="250" fill="rgba(168,85,247,0.1)"/>
  <circle cx="600" cy="315" r="350" fill="rgba(124,58,237,0.08)"/>
  
  <!-- Lignes décoratives -->
  <line x1="0" y1="580" x2="350" y2="580" stroke="url(#accentGradient)" stroke-width="4" opacity="0.6"/>
  <line x1="850" y1="50" x2="1200" y2="50" stroke="url(#accentGradient)" stroke-width="4" opacity="0.6"/>
  
  <!-- Icône API stylisée - Hexagone -->
  <g transform="translate(490, 120)">
    <polygon points="110,0 200,52 200,156 110,208 20,156 20,52" 
             fill="rgba(124,58,237,0.15)" stroke="#a78bfa" stroke-width="2.5" opacity="0.9"/>
    <polygon points="110,25 175,60 175,148 110,183 45,148 45,60" 
             fill="rgba(139,92,246,0.25)" stroke="#8b5cf6" stroke-width="2"/>
    <text x="110" y="135" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="bold" 
          fill="#c4b5fd" text-anchor="middle" filter="url(#glow)">API</text>
  </g>
  
  <!-- Titre principal -->
  <text x="600" y="400" font-family="Arial, Helvetica, sans-serif" font-size="80" font-weight="bold" 
        fill="#c4b5fd" text-anchor="middle" filter="url(#glow)">Api-Track</text>
  
  <!-- Sous-titre -->
  <text x="600" y="465" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="500" 
        fill="#e2e8f0" text-anchor="middle" opacity="0.95">Système de gestion et suivi de production</text>
  
  <!-- Ligne séparatrice -->
  <rect x="420" y="495" width="360" height="3" rx="2" fill="url(#accentGradient)" opacity="0.8"/>
  
  <!-- Auteur -->
  <text x="600" y="545" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="400" 
        fill="#94a3b8" text-anchor="middle">by Mounir Azizi</text>
  
  <!-- Version badge -->
  <g transform="translate(1040, 555)">
    <rect x="0" y="0" width="110" height="40" rx="20" fill="rgba(139,92,246,0.35)" stroke="#8b5cf6" stroke-width="1.5"/>
    <text x="55" y="27" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600" 
          fill="#c4b5fd" text-anchor="middle">v2.9.0</text>
  </g>
  
  <!-- URL -->
  <text x="50" y="595" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="500" 
        fill="#64748b" text-anchor="start">mounir.vip</text>
        
  <!-- Points décoratifs -->
  <circle cx="200" cy="100" r="4" fill="#8b5cf6" opacity="0.6"/>
  <circle cx="250" cy="150" r="3" fill="#a78bfa" opacity="0.5"/>
  <circle cx="1000" cy="500" r="5" fill="#8b5cf6" opacity="0.5"/>
  <circle cx="950" cy="550" r="3" fill="#a78bfa" opacity="0.4"/>
</svg>`;

async function generateOG() {
  const outputPath = path.join(__dirname, '../../frontend/public/og.png');
  
  try {
    await sharp(Buffer.from(svgContent))
      .resize(1200, 630)
      .png({ quality: 95 })
      .toFile(outputPath);
    
    console.log('✅ Image OG PNG générée avec succès: og.png');
    console.log('📍 Chemin:', outputPath);
    
    const stats = fs.statSync(outputPath);
    console.log('📦 Taille:', (stats.size / 1024).toFixed(1), 'KB');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

generateOG();
