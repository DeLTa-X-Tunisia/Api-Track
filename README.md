# 🏭 Logi-Track V2

**Système de suivi de production de tubes spirale** — Application web complète pour le pilotage en temps réel de la production de tubes spirale selon le pipeline API 5L (12 étapes).

Développée pour **DANIELI** — Projet **ALTUMET Machine Tube Spirale OFF-LINE**.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture technique](#-architecture-technique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Structure du projet](#-structure-du-projet)
- [Base de données](#-base-de-données)
- [API Endpoints](#-api-endpoints)
- [Rôles & Permissions](#-rôles--permissions)
- [Auteur](#-auteur)

---

## ✨ Fonctionnalités

### Modules principaux
| Module | Description |
|--------|-------------|
| **Dashboard** | Vue d'ensemble en temps réel : KPIs, statistiques de production, graphiques |
| **Gestion Tubes** | Pipeline complet 12 étapes API 5L avec validation, interruptions, réparations |
| **Bobines en Stock** | Inventaire des bobines d'acier (import/export, CRUD, photos) |
| **Bobines de Production** | Gestion des lots de production avec assignation d'équipes |
| **Presets Soudure** | Paramétrage des presets de soudure (4 têtes SAW) |
| **Équipes de Production** | Gestion des équipes, membres, zones de travail, qualifications |
| **Gestion Utilisateurs** | CRUD utilisateurs avec rôles et authentification par code 6 chiffres |
| **Paramètres** | Configuration projet (logos, infos client), gestion des responsabilités réparation |

### Caractéristiques techniques
- 🔄 **Temps réel** — Socket.io pour notifications et mises à jour instantanées
- 📱 **Responsive** — Interface adaptée mobile, tablette et desktop
- 🔐 **Sécurisé** — JWT, rate limiting, Helmet, CORS configuré
- 📄 **Export PDF** — Génération de fiches de suivi par tube
- 📊 **Export Excel** — Export des données bobines
- 📸 **Photos** — Upload de photos par étape de production
- 🎨 **UI moderne** — Tailwind CSS avec animations fluides

---

## 🏗 Architecture technique

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│         React 18 + Vite 5 + Tailwind CSS 3.4        │
│              Port: 5174 (dev)                        │
├─────────────────────────────────────────────────────┤
│                      API                             │
│         Node.js + Express 4 + Socket.io              │
│              Port: 3003                              │
├─────────────────────────────────────────────────────┤
│                   Database                           │
│              MySQL 8.0 (InnoDB)                      │
│              Base: logitrack2                         │
└─────────────────────────────────────────────────────┘
```

### Stack

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3.4, Lucide React, Axios, React Router 6 |
| **Backend** | Node.js, Express 4, Socket.io 4, JWT, Multer, PDFKit, ExcelJS |
| **Base de données** | MySQL 8.0 (InnoDB, utf8mb4) |
| **Sécurité** | Helmet, CORS, express-rate-limit, bcryptjs |

---

## 📦 Prérequis

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MySQL** ≥ 8.0
- **Git**

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/DeLTa-X-Tunisia/Logi-Trac_V2.git
cd Logi-Trac_V2
```

### 2. Installer les dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configurer l'environnement

```bash
# Copier le fichier d'exemple et l'adapter
cp backend/.env.example backend/.env
```

Éditer `backend/.env` avec vos paramètres (voir section [Configuration](#-configuration)).

### 4. Initialiser la base de données

**Option A — Restaurer le backup complet (recommandé) :**

```bash
mysql -u root -p < database/backup_logitrack2.sql
```

> Cela crée la base `logitrack2` avec toutes les tables et données existantes.

**Option B — Installation vierge :**

```bash
cd backend
npm run init-db
```

> Crée une base vierge avec uniquement les tables de base et un compte système admin.

### 5. Builder le frontend (production)

```bash
cd frontend
npm run build
```

> Le build est servi automatiquement par le backend Express en production.

---

## ⚙️ Configuration

### Variables d'environnement (`backend/.env`)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DB_HOST` | `localhost` | Hôte MySQL |
| `DB_USER` | `root` | Utilisateur MySQL |
| `DB_PASSWORD` | *(vide)* | Mot de passe MySQL |
| `DB_NAME` | `logitrack2` | Nom de la base |
| `DB_PORT` | `3306` | Port MySQL |
| `PORT` | `3003` | Port du serveur API |
| `NODE_ENV` | `development` | Environnement (`development` / `production`) |
| `JWT_SECRET` | — | **⚠️ À changer en production !** Clé secrète JWT |
| `JWT_EXPIRES_IN` | `24h` | Durée de validité des tokens |
| `CORS_ORIGINS` | `http://localhost:5174` | Origines autorisées (séparées par virgules) |
| `RATE_LIMIT_AUTH` | `20` | Max tentatives d'auth / 15 min |
| `RATE_LIMIT_API` | `1000` | Max requêtes API / 5 min |
| `MAX_FILE_SIZE` | `10485760` | Taille max upload (10 Mo) |

---

## ▶️ Démarrage

### Mode développement

```bash
# Terminal 1 — Backend (avec hot-reload)
cd backend
npm run dev

# Terminal 2 — Frontend (Vite dev server)
cd frontend
npm run dev
```

- Frontend : http://localhost:5174
- API : http://localhost:3003
- Santé API : http://localhost:3003/api/health

### Mode production

```bash
# Builder le frontend
cd frontend && npm run build

# Lancer le serveur (sert API + frontend)
cd ../backend && npm start
```

L'application complète est accessible sur http://localhost:3003.

### Avec PM2 (recommandé en production)

```bash
npm install -g pm2

cd backend
pm2 start src/server.js --name logitrack2
pm2 save
pm2 startup
```

---

## 📁 Structure du projet

```
Logi-Trac_V2/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Pool de connexions MySQL
│   │   │   └── upload.js            # Configuration Multer
│   │   ├── database/
│   │   │   ├── init.js              # Script d'initialisation DB
│   │   │   └── migrate-*.js         # Scripts de migration
│   │   ├── middleware/
│   │   │   └── auth.js              # Middleware JWT + rôles
│   │   ├── routes/
│   │   │   ├── auth.js              # Authentification
│   │   │   ├── bobines.js           # Bobines en stock
│   │   │   ├── dashboard.js         # Dashboard/KPIs
│   │   │   ├── equipes.js           # Équipes de production
│   │   │   ├── lots.js              # Lots/Bobines de production
│   │   │   ├── presets.js           # Presets soudure
│   │   │   ├── settings.js          # Paramètres projet
│   │   │   ├── tubes.js             # Pipeline tubes (12 étapes)
│   │   │   └── users.js             # Gestion utilisateurs
│   │   └── server.js                # Point d'entrée serveur
│   ├── uploads/                     # Fichiers uploadés (runtime)
│   ├── .env                         # Variables d'environnement
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── logo.png                 # Logo application
│   │   └── manifest.json            # PWA manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx     # Modal de confirmation
│   │   │   ├── ErrorBoundary.jsx    # Gestion erreurs React
│   │   │   ├── Layout.jsx           # Layout principal + sidebar
│   │   │   ├── ProtectedRoute.jsx   # Route protégée par auth
│   │   │   └── Toast.jsx            # Système de notifications
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Contexte d'authentification
│   │   ├── pages/
│   │   │   ├── BobineProduction.jsx # Lots de production
│   │   │   ├── BobinesEnStock.jsx   # Inventaire bobines
│   │   │   ├── Dashboard.jsx        # Tableau de bord
│   │   │   ├── EquipesProduction.jsx# Équipes
│   │   │   ├── GestionUtilisateurs.jsx # Utilisateurs
│   │   │   ├── Login.jsx            # Page de connexion
│   │   │   ├── ParametresSoudure.jsx# Presets soudure
│   │   │   ├── Settings.jsx         # Paramètres + Resp. Réparation
│   │   │   └── Tubes.jsx            # Module tubes principal
│   │   ├── services/
│   │   │   ├── api.js               # Client API (Axios)
│   │   │   └── socket.js            # Client Socket.io
│   │   ├── App.jsx                  # Routes React
│   │   ├── index.css                # Styles globaux + Tailwind
│   │   └── main.jsx                 # Point d'entrée React
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── database/
│   ├── backup_logitrack2.sql        # Backup complet (schema + data)
│   └── schema_logitrack2.sql        # Schema uniquement (référence)
├── .gitignore
├── CHANGELOG.md
├── README.md
├── logo.png                         # Logo Logi-Track
└── logov2.png                       # Logo V2
```

---

## 🗄 Base de données

### Tables (23 tables)

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs et rôles |
| `entreprises` | Entreprises (DANIELI, ALTUMET, etc.) |
| `bobines` | Inventaire des bobines d'acier |
| `bobine_photos` | Photos associées aux bobines |
| `grades` | Grades d'acier (API 5L) |
| `fournisseurs` | Fournisseurs de bobines |
| `lots` | Lots de production |
| `tubes` | Tubes en production |
| `tube_etapes` | État des étapes par tube |
| `tube_etape_historique` | Historique des validations |
| `tube_etape_photos` | Photos par étape |
| `reparation_defauts` | Défauts de réparation |
| `responsabilites` | Responsabilités réparation (CRUD) |
| `diametres_tubes` | Diamètres disponibles |
| `motifs_retard` | Motifs d'interruption |
| `equipes_production` | Équipes de production |
| `equipe_membres` | Membres des équipes |
| `personnel_production` | Personnel qualifié |
| `qualifications` | Qualifications du personnel |
| `zones_travail` | Zones de travail |
| `presets_soudure` | Presets de soudure |
| `preset_soudure_heads` | Paramètres par tête de soudure |
| `project_settings` | Paramètres du projet |

---

## 🔌 API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion (code 6 chiffres) |
| GET | `/api/auth/me` | Profil utilisateur courant |

### Santé
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/health` | État du serveur et de la DB |

### Modules principaux
| Préfixe | Module |
|---------|--------|
| `/api/dashboard` | Dashboard & KPIs |
| `/api/users` | Gestion utilisateurs |
| `/api/bobines` | Bobines en stock |
| `/api/lots` | Lots / Bobines de production |
| `/api/tubes` | Tubes & pipeline 12 étapes |
| `/api/presets` | Presets de soudure |
| `/api/equipes` | Équipes de production |
| `/api/settings` | Paramètres du projet |

---

## 👥 Rôles & Permissions

| Rôle | Code | Permissions |
|------|------|-------------|
| **System Admin** | `system_admin` | Accès total, gestion utilisateurs, paramètres |
| **Admin** | `admin` | Gestion production, validations, paramètres |
| **Superviseur** | `superviseur` | Validations d'étapes, suivi production |
| **Consultant** | `consultant` | Lecture seule (visualisation uniquement) |

### Authentification
L'authentification se fait via un **code unique à 6 chiffres** attribué à chaque utilisateur. Pas de mot de passe — le code est généré automatiquement à la création du compte.

---

## 🔒 Sécurité (production)

Avant déploiement, vérifier impérativement :

1. **Changer `JWT_SECRET`** dans `.env` (utiliser une clé longue et aléatoire)
2. **Configurer `CORS_ORIGINS`** avec le domaine réel du VPS
3. **Sécuriser MySQL** avec un mot de passe fort
4. **Activer HTTPS** (reverse proxy Nginx recommandé)
5. **Configurer `NODE_ENV=production`**

---

## 👤 Auteur

**Azizi Mounir** — DeLTa-X Tunisia

---

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés © 2026 DeLTa-X Tunisia.
