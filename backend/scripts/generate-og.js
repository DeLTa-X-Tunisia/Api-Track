const fs = require('fs');
const path = require('path');

// Créer une image SVG pour Api-Track OG
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradient de fond moderne -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="50%" style="stop-color:#1e1b4b"/>
      <stop offset="100%" style="stop-color:#312e81"/>
    </linearGradient>
    
    <!-- Gradient violet pour le texte -->
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#a78bfa"/>
      <stop offset="50%" style="stop-color:#c4b5fd"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    
    <!-- Gradient pour l'accent -->
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
    
    <!-- Glow effect -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Pattern de grille -->
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(139,92,246,0.08)" stroke-width="1"/>
    </pattern>
  </defs>
  
  <!-- Fond -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Grille de fond -->
  <rect width="1200" height="630" fill="url(#grid)"/>
  
  <!-- Cercles décoratifs -->
  <circle cx="100" cy="530" r="200" fill="rgba(139,92,246,0.1)"/>
  <circle cx="1100" cy="100" r="250" fill="rgba(168,85,247,0.08)"/>
  <circle cx="600" cy="315" r="350" fill="rgba(124,58,237,0.05)"/>
  
  <!-- Lignes décoratives -->
  <line x1="0" y1="580" x2="400" y2="580" stroke="url(#accentGradient)" stroke-width="4" opacity="0.6"/>
  <line x1="800" y1="50" x2="1200" y2="50" stroke="url(#accentGradient)" stroke-width="4" opacity="0.6"/>
  
  <!-- Icône API stylisée -->
  <g transform="translate(490, 140)">
    <!-- Hexagone externe -->
    <polygon points="110,0 200,52 200,156 110,208 20,156 20,52" 
             fill="none" stroke="url(#textGradient)" stroke-width="3" opacity="0.8"/>
    <!-- Hexagone interne -->
    <polygon points="110,30 170,62 170,146 110,178 50,146 50,62" 
             fill="rgba(139,92,246,0.2)" stroke="url(#accentGradient)" stroke-width="2"/>
    <!-- Symbole API -->
    <text x="110" y="135" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
          fill="url(#textGradient)" text-anchor="middle" filter="url(#glow)">API</text>
  </g>
  
  <!-- Titre principal -->
  <text x="600" y="400" font-family="Arial, sans-serif" font-size="72" font-weight="bold" 
        fill="url(#textGradient)" text-anchor="middle" filter="url(#glow)">Api-Track</text>
  
  <!-- Sous-titre -->
  <text x="600" y="460" font-family="Arial, sans-serif" font-size="28" font-weight="500" 
        fill="#e2e8f0" text-anchor="middle" opacity="0.9">Système de gestion et suivi de production</text>
  
  <!-- Ligne séparatrice -->
  <rect x="450" y="490" width="300" height="3" rx="2" fill="url(#accentGradient)" opacity="0.7"/>
  
  <!-- Auteur -->
  <text x="600" y="540" font-family="Arial, sans-serif" font-size="20" font-weight="400" 
        fill="#94a3b8" text-anchor="middle">by Mounir Azizi</text>
  
  <!-- Version badge -->
  <g transform="translate(1050, 560)">
    <rect x="0" y="0" width="100" height="36" rx="18" fill="rgba(139,92,246,0.3)" stroke="url(#accentGradient)" stroke-width="1"/>
    <text x="50" y="24" font-family="Arial, sans-serif" font-size="16" font-weight="600" 
          fill="#c4b5fd" text-anchor="middle">v2.9.0</text>
  </g>
  
  <!-- URL -->
  <text x="100" y="590" font-family="Arial, sans-serif" font-size="18" font-weight="400" 
        fill="#64748b" text-anchor="start">mounir.vip</text>
</svg>`;

// Sauvegarder le fichier SVG
const svgPath = path.join(__dirname, '../../frontend/public/og.svg');
fs.writeFileSync(svgPath, svgContent, 'utf8');
console.log('✅ Image OG SVG créée: og.svg');

// Note: Pour convertir en PNG, nous utiliserons une autre méthode
console.log('ℹ️  Pour une compatibilité maximale, convertir en PNG via un outil externe');
