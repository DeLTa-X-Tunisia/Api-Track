# 🏭 Api-Track

**Système de suivi de production de tubes spirale** — Application web + mobile complète pour le pilotage en temps réel de la production de tubes spirale selon le pipeline API 5L (12 étapes).

Basé sur **Logi-Track V2** — Adapté et personnalisé pour nos besoins internes.

> **Version** : 2.9.0 — Mars 2026

---

## 📋 Table des matières

- [Installation rapide](#-installation-rapide)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture technique](#-architecture-technique)
- [Prérequis](#-prérequis)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Structure du projet](#-structure-du-projet)
- [Base de données](#-base-de-données)
- [API Endpoints](#-api-endpoints)
- [Changelog](#-changelog)

---

## ⚡ Installation rapide

### Sous Laragon (Windows)

1. **Cloner le projet** dans `C:\laragon\www\apitrack`
2. **Créer la base de données** `apitrack` dans MySQL (via phpMyAdmin ou HeidiSQL)
3. **Importer le schéma** :
   ```powershell
   Get-Content "C:\laragon\www\apitrack\database\schema_logitrack2.sql" | mysql -u root -p123456 apitrack
   ```
4. **Installer les dépendances** :
   ```powershell
   cd C:\laragon\www\apitrack\backend
   npm install
   
   cd ..\frontend
   npm install
   ```
5. **Configurer l'environnement** : Le fichier `backend/.env` est déjà configuré avec :
   - `DB_HOST=localhost`
   - `DB_USER=root`
   - `DB_PASSWORD=123456`
   - `DB_NAME=apitrack`
6. **Démarrer l'application** :
   ```powershell
   # Terminal 1 - Backend
   cd C:\laragon\www\apitrack\backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd C:\laragon\www\apitrack\frontend
   npm run dev
   ```
7. **Accéder à l'application** :
   - Frontend : http://localhost:5174
   - Backend API : http://localhost:3003

---

## ✨ Fonctionnalités

### Modules principaux

| Module | Description |
|--------|-------------|
| **Dashboard** | Vue d'ensemble en temps réel : KPIs, statistiques de production, graphiques |
| **Gestion Tubes** | Pipeline complet 12 étapes API 5L avec validation, interruptions, réparations |
| **Bobines en Stock** | Inventaire des bobines d'acier (import/export Excel, CRUD, photos) |
| **Bobines de Production** | Gestion des lots de production avec assignation d'équipes |
| **Presets Soudure** | Paramétrage des presets de soudure (4 têtes SAW) |
| **Équipes de Production** | Gestion des équipes, membres, zones de travail, qualifications |
| **Gestion Utilisateurs** | CRUD utilisateurs avec rôles et authentification par code 6 chiffres |
| **Paramètres** | Configuration projet (logos, infos client), gestion des responsabilités réparation |
| **Rapports & Export** | Situation générale Excel, fiches de suivi PDF multi-pages professionnelles |
| **Supervision Admin** | Suivi des connexions en temps réel, messagerie interne, déconnexion à distance, **mode maintenance** |
| **Édition Admin** | Modification inline des dates (lots, tubes, étapes) avec recalcul automatique des retards |
| **Page Maintenance** | Page de maintenance élégante avec accès admin discret et animation moderne |

### Caractéristiques techniques

- 🔄 **Temps réel** — Socket.io pour notifications, messagerie et suivi des connexions
- 📱 **Responsive** — Interface adaptée mobile, tablette et desktop
- 📲 **Application Mobile** — APK Android native (WebView + scanner réseau)
- 🔐 **Sécurisé** — JWT, rate limiting, Helmet, CORS, auto-logout inactivité 15 min
- 📄 **Export PDF** — Fiches de suivi multi-pages avec logos, paramètres soudure, photos, historique
- 📊 **Export Excel** — Export des données bobines et situation générale
- 📸 **Photos** — Upload de photos par étape de production
- 🎨 **UI moderne** — Tailwind CSS avec animations fluides

---

## 🏗 Architecture technique

```
┌──────────────────────────────────────────────────────┐
│              Application Mobile (Android)             │
│         Java WebView + mDNS/Subnet Scanner           │
│                   APK standalone                      │
├──────────────────────────────────────────────────────┤
│                     Frontend                          │
│         React 18 + Vite 5 + Tailwind CSS 3.4         │
│              Port: 5174 (dev)                         │
├──────────────────────────────────────────────────────┤
│                       API                             │
│    Node.js + Express 4 + Socket.io 4 (temps réel)    │
│              Port: 3003                               │
├──────────────────────────────────────────────────────┤
│                    Database                            │
│              MySQL 8.0 (InnoDB, utf8mb4)              │
│              Base: apitrack                            │
└──────────────────────────────────────────────────────┘
```

### Stack

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3.4, Lucide React, Axios, React Router 6, Socket.io Client |
| **Backend** | Node.js, Express 4, Socket.io 4, JWT, Multer, PDFKit, ExcelJS |
| **Base de données** | MySQL 8.0 (InnoDB, utf8mb4) |
| **Sécurité** | Helmet, CORS, express-rate-limit, bcryptjs, auto-logout inactivité |
| **Mobile** | Java, Android SDK, WebView, mDNS/NSD, Subnet Scanner |

---

## 📦 Prérequis

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MySQL** ≥ 8.0
- **Laragon** (recommandé pour Windows)

---

## ⚙️ Configuration

### Variables d'environnement (backend/.env)

```env
# Base de données MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=apitrack
DB_PORT=3306

# Serveur
PORT=3003
NODE_ENV=development

# JWT
JWT_SECRET=api-track-secret-key-2026-change-in-production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGINS=http://localhost:5174,http://localhost:3003
```

---

## 🚀 Démarrage

### Mode développement

```powershell
# Backend (dans un terminal)
cd backend
npm run dev

# Frontend (dans un autre terminal)
cd frontend
npm run dev
```

### Mode production

```powershell
# Build du frontend
cd frontend
npm run build

# Démarrage du backend en production
cd backend
npm start
```

---

## 📁 Structure du projet

```
apitrack/
├── backend/               # API Node.js/Express
│   ├── src/
│   │   ├── routes/       # Routes API
│   │   ├── middleware/   # Middlewares (auth, validation)
│   │   └── server.js     # Point d'entrée
│   ├── uploads/          # Fichiers uploadés
│   ├── .env              # Configuration environnement
│   └── package.json
│
├── frontend/             # Application React
│   ├── src/
│   │   ├── components/   # Composants réutilisables
│   │   ├── pages/        # Pages de l'application
│   │   └── App.jsx       # Point d'entrée React
│   ├── public/           # Assets statiques
│   └── package.json
│
├── database/             # Scripts SQL
│   ├── schema_logitrack2.sql   # Structure des tables
│   └── backup_logitrack2.sql   # Backup complet avec données
│
├── logitrack-mobile_v2/  # Application Android (Java)
├── app_down/             # APK compilé
├── asset/                # Ressources diverses
└── README.md             # Ce fichier
```

---

## 🗃️ Base de données

### Tables principales

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs et authentification |
| `tubes` | Tubes en production |
| `tube_etapes` | Étapes de production par tube |
| `bobines` | Stock de bobines d'acier |
| `lots` | Lots de production |
| `equipes_production` | Équipes de travail |
| `presets_soudure` | Paramètres de soudure |
| `project_settings` | Configuration du projet |

---

## 📡 API Endpoints

### Authentification
- `POST /api/auth/login` — Connexion utilisateur
- `POST /api/auth/logout` — Déconnexion

### Tubes
- `GET /api/tubes` — Liste des tubes
- `POST /api/tubes` — Créer un tube
- `PUT /api/tubes/:id` — Modifier un tube
- `DELETE /api/tubes/:id` — Supprimer un tube

### Bobines
- `GET /api/bobines` — Liste des bobines
- `POST /api/bobines` — Créer une bobine
- `POST /api/bobines/import` — Import Excel

### Exports
- `GET /api/reports/situation` — Export Excel situation générale
- `GET /api/reports/fiche-suivi/:tubeId` — Fiche de suivi PDF

---

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet des modifications.

---

## 👥 Équipe

Projet initialement développé par **DeLTa-X Tunisia** (Logi-Track V2).
Adapté et personnalisé sous le nom **Api-Track**.

---

## 📄 Licence

Ce projet est sous licence MIT.
