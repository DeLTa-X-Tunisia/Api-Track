# 🏭 Logi-Track V2.5

**Système de suivi de production de tubes spirale** — Application web + mobile complète pour le pilotage en temps réel de la production de tubes spirale selon le pipeline API 5L (12 étapes).

Développée pour **DANIELI** — Projet **ALTUMET Machine Tube Spirale OFF-LINE**.

> **Version** : 2.5.0 — Février 2026

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture technique](#-architecture-technique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Déploiement VPS](#-déploiement-vps)
- [Application Mobile](#-application-mobile)
- [Structure du projet](#-structure-du-projet)
- [Base de données](#-base-de-données)
- [API Endpoints](#-api-endpoints)
- [Rôles & Permissions](#-rôles--permissions)
- [Sécurité](#-sécurité-production)
- [Auteur](#-auteur)

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
| **Supervision Admin** | Suivi des connexions en temps réel, messagerie interne, déconnexion à distance |

### Caractéristiques techniques

- 🔄 **Temps réel** — Socket.io pour notifications, messagerie et suivi des connexions
- 📱 **Responsive** — Interface adaptée mobile, tablette et desktop
- 📲 **Application Mobile** — APK Android native (WebView + scanner réseau)
- 🔐 **Sécurisé** — JWT, rate limiting, Helmet, CORS, auto-logout inactivité 15 min
- 📄 **Export PDF** — Fiches de suivi multi-pages avec logos, paramètres soudure, photos, historique
- 📊 **Export Excel** — Export des données bobines et situation générale
- 📸 **Photos** — Upload de photos par étape de production
- 🔔 **Messagerie Admin** — Messages modaux avec son de notification (info/warning/urgent)
- ⏱ **Gestion sessions** — Déconnexion automatique après 15 min d'inactivité (desktop & mobile)
- 🎨 **UI moderne** — Tailwind CSS avec animations fluides et glassmorphism

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
│              Base: logitrack2                          │
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
- **Git**

Pour l'application mobile :
- **Android Studio** (pour compilation APK)
- Ou utiliser l'APK pré-compilé dans `app_down/app-release.apk`

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

**Option A — Restaurer le backup complet (recommandé pour VPS) :**

```bash
mysql -u root -p < database/backup_logitrack2.sql
```

> Crée la base `logitrack2` avec toutes les tables, données et utilisateurs existants.

**Option B — Installation vierge :**

```bash
cd backend
npm run init-db
```

> Crée une base vierge avec les tables de base et un compte système admin (code: `864268`).

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

### Mode production (local)

```bash
# Builder le frontend
cd frontend && npm run build

# Lancer le serveur (sert API + frontend)
cd ../backend && npm start
```

L'application complète est accessible sur http://localhost:3003.

---

## 🌐 Déploiement VPS

### Étapes de déploiement

```bash
# 1. Cloner sur le VPS
git clone https://github.com/DeLTa-X-Tunisia/Logi-Trac_V2.git /opt/logitrack2
cd /opt/logitrack2

# 2. Installer les dépendances
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# 3. Configurer l'environnement
cp backend/.env.example backend/.env
nano backend/.env
# ⚠️ Changer JWT_SECRET, DB_PASSWORD, CORS_ORIGINS, NODE_ENV=production

# 4. Restaurer la base de données
mysql -u root -p < database/backup_logitrack2.sql

# 5. Installer l'APK mobile sur le serveur
mkdir -p backend/uploads/mobile
cp app_down/app-release.apk backend/uploads/mobile/

# 6. Lancer avec PM2
npm install -g pm2
cd backend
pm2 start src/server.js --name logitrack2
pm2 save
pm2 startup
```

### Reverse proxy Nginx (recommandé)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> **Note** : Le `proxy_set_header Upgrade` est essentiel pour Socket.io (WebSocket).

---

## 📲 Application Mobile

L'application mobile Android est dans le dossier `logitrack-mobile_v2/`.

### APK pré-compilé

Un APK prêt à installer est disponible :
- **Fichier** : `app_down/app-release.apk`
- **Téléchargement** : Aussi disponible via le menu **Paramètres > Application Mobile** dans l'interface web

### Fonctionnalités mobile

- **Scanner réseau** : Détection automatique du serveur par scan de sous-réseau
- **Configuration IP** : Configuration manuelle possible si le scan ne trouve pas le serveur
- **WebView** : Accès complet à l'interface web responsive
- **Caméra** : Prise de photos pour les étapes de production
- **Upload fichiers** : Upload de documents depuis le téléphone
- **PDF** : Téléchargement/visualisation des fiches de suivi
- **Notifications sonores** : Son de réception des messages admin
- **Logo V2** : Branding mis à jour avec `logov2.png`

### Compilation depuis les sources

```bash
cd logitrack-mobile_v2
# Ouvrir avec Android Studio ou:
./gradlew assembleRelease
# APK résultant: app/build/outputs/apk/release/app-release.apk
```

---

## 📁 Structure du projet

```
Logi-Trac_V2/
├── backend/
│   ├── src/
│   │   ├── server.js                # Point d'entrée — Express + Socket.io + sessions
│   │   ├── config/
│   │   │   ├── database.js          # Pool de connexions MySQL
│   │   │   └── upload.js            # Configuration Multer (upload fichiers)
│   │   ├── database/
│   │   │   ├── init.js              # Script d'initialisation DB
│   │   │   └── migrate-*.js         # Scripts de migration (12+)
│   │   ├── middleware/
│   │   │   └── auth.js              # Middleware JWT + rôles (4 niveaux)
│   │   └── routes/
│   │       ├── admin.js             # Supervision admin (connexions, messagerie)
│   │       ├── auth.js              # Authentification (login/me)
│   │       ├── bobines.js           # Bobines en stock (CRUD, Excel)
│   │       ├── dashboard.js         # Dashboard & KPIs
│   │       ├── equipes.js           # Équipes de production
│   │       ├── lots.js              # Lots / Bobines de production
│   │       ├── presets.js           # Presets soudure (4 têtes SAW)
│   │       ├── reports.js           # Rapports & exports (Excel, PDF)
│   │       ├── settings.js          # Paramètres projet + APK mobile
│   │       ├── tubes.js             # Pipeline tubes 12 étapes API 5L
│   │       └── users.js             # Gestion utilisateurs (CRUD, rôles)
│   ├── uploads/                     # Fichiers uploadés (runtime, gitignored)
│   ├── .env                         # Variables d'environnement (gitignored)
│   ├── .env.example                 # Exemple de configuration
│   └── package.json                 # v2.5.0
├── frontend/
│   ├── public/
│   │   ├── logo.png                 # Logo application (header)
│   │   ├── manifest.json            # PWA manifest
│   │   └── message.mp3              # Son notification messages admin
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx     # Modal de confirmation réutilisable
│   │   │   ├── ErrorBoundary.jsx    # Gestion erreurs React
│   │   │   ├── Layout.jsx           # Layout principal + sidebar + sessions + notifications
│   │   │   ├── ProtectedRoute.jsx   # Route protégée par auth
│   │   │   └── Toast.jsx            # Système de toast notifications
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Contexte d'authentification (JWT, rôles)
│   │   ├── pages/
│   │   │   ├── AdminSupervision.jsx # Supervision : connexions, messagerie, déconnexion
│   │   │   ├── BobineProduction.jsx # Lots de production
│   │   │   ├── BobinesEnStock.jsx   # Inventaire bobines (Excel import/export)
│   │   │   ├── Dashboard.jsx        # Tableau de bord KPIs
│   │   │   ├── EquipesProduction.jsx# Équipes et membres
│   │   │   ├── GestionUtilisateurs.jsx # Utilisateurs (CRUD, rôles)
│   │   │   ├── Login.jsx            # Page de connexion (code 6 chiffres)
│   │   │   ├── ParametresSoudure.jsx# Presets soudure (4 têtes)
│   │   │   ├── Rapports.jsx         # Rapports & Export Excel/PDF
│   │   │   ├── Settings.jsx         # Paramètres + Resp. Réparation + APK
│   │   │   └── Tubes.jsx            # Module tubes (pipeline 12 étapes)
│   │   ├── services/
│   │   │   ├── api.js               # Client API Axios + intercepteurs JWT
│   │   │   └── socket.js            # Client Socket.io (temps réel)
│   │   ├── App.jsx                  # Routes React (lazy loading)
│   │   ├── index.css                # Styles globaux + Tailwind
│   │   └── main.jsx                 # Point d'entrée React
│   ├── index.html
│   ├── vite.config.js               # Vite config (proxy, port 5174)
│   ├── tailwind.config.js
│   └── package.json                 # v2.5.0
├── logitrack-mobile_v2/             # Application mobile Android
│   ├── app/src/main/
│   │   ├── java/com/deltatx/logitrack/
│   │   │   ├── MainActivity.java    # WebView principal
│   │   │   ├── ConfigActivity.java  # Configuration IP serveur
│   │   │   ├── SplashActivity.java  # Écran de démarrage
│   │   │   └── NsdHelper.java       # Scanner réseau (mDNS/subnet)
│   │   ├── res/                     # Ressources Android (layouts, icons, themes)
│   │   └── AndroidManifest.xml
│   ├── build.gradle
│   └── README.md
├── app_down/
│   └── app-release.apk             # APK Android pré-compilé (téléchargeable)
├── asset/
│   └── message.mp3                  # Fichier son notification (source)
├── database/
│   ├── backup_logitrack2.sql        # Backup complet (schema + data) — prêt pour VPS
│   └── schema_logitrack2.sql        # Schema uniquement (référence)
├── .gitignore
├── CHANGELOG.md                     # Historique des versions
├── README.md                        # Ce fichier
├── logo.png                         # Logo Logi-Track
└── logov2.png                       # Logo V2 (nouveau design)
```

---

## 🗄 Base de données

### Restauration rapide (VPS)

```bash
mysql -u root -p < database/backup_logitrack2.sql
```

### Tables (23+ tables)

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs et rôles (system_admin, admin, superviseur, consultant) |
| `entreprises` | Entreprises (DANIELI, ALTUMET, etc.) |
| `bobines` | Inventaire des bobines d'acier |
| `bobine_photos` | Photos associées aux bobines |
| `grades` | Grades d'acier (API 5L) |
| `fournisseurs` | Fournisseurs de bobines |
| `lots` | Lots de production |
| `tubes` | Tubes en production |
| `tube_etapes` | État des étapes par tube (12 étapes) |
| `tube_etape_historique` | Historique des validations |
| `tube_etape_photos` | Photos par étape de production |
| `reparation_defauts` | Défauts de réparation |
| `responsabilites` | Responsabilités réparation |
| `diametres_tubes` | Diamètres disponibles |
| `motifs_retard` | Motifs d'interruption |
| `equipes_production` | Équipes de production |
| `equipe_membres` | Membres des équipes |
| `personnel_production` | Personnel qualifié |
| `qualifications` | Qualifications du personnel |
| `zones_travail` | Zones de travail |
| `presets_soudure` | Presets de soudure |
| `preset_soudure_heads` | Paramètres par tête de soudure (4 têtes SAW) |
| `project_settings` | Paramètres du projet (logos, infos client) |

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
| `/api/bobines` | Bobines en stock (CRUD, import/export) |
| `/api/lots` | Lots / Bobines de production |
| `/api/tubes` | Tubes & pipeline 12 étapes |
| `/api/presets` | Presets de soudure |
| `/api/equipes` | Équipes de production |
| `/api/settings` | Paramètres du projet |
| `/api/reports` | Rapports & exports (Excel, PDF) |
| `/api/admin` | Supervision admin (connexions, messagerie) |
| `/api/mobile/download` | Téléchargement APK mobile |

### Événements Socket.io

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `admin:message` | Serveur → Client | Message admin (info/warning/urgent) |
| `admin:kicked` | Serveur → Client | Déconnexion forcée par admin |
| `admin:user-connected` | Serveur → Tous | Nouvel utilisateur connecté |
| `admin:user-disconnected` | Serveur → Tous | Utilisateur déconnecté |
| `admin:users-count` | Serveur → Tous | Nombre d'utilisateurs connectés |
| `session:expired` | Serveur → Client | Session expirée (inactivité 15 min) |
| `user:activity` | Client → Serveur | Ping d'activité utilisateur |
| `auth:register` | Client → Serveur | Enregistrement auth Socket.io |

---

## 👥 Rôles & Permissions

| Rôle | Code | Permissions |
|------|------|-------------|
| **System Admin** | `system_admin` | Accès total, supervision, messagerie, gestion utilisateurs, paramètres |
| **Admin** | `admin` | Gestion production, validations, paramètres |
| **Superviseur** | `superviseur` | Validations d'étapes, suivi production |
| **Consultant** | `consultant` | Lecture seule (visualisation uniquement) |

### Authentification
L'authentification se fait via un **code unique à 6 chiffres** attribué à chaque utilisateur. Pas de mot de passe — le code est généré automatiquement à la création du compte.

**Compte admin par défaut** : Code `864268` (system_admin — Azizi Mounir)

---

## 🔒 Sécurité (production)

Avant déploiement, vérifier impérativement :

1. **Changer `JWT_SECRET`** dans `.env` (utiliser une clé longue et aléatoire)
2. **Configurer `CORS_ORIGINS`** avec le domaine réel du VPS
3. **Sécuriser MySQL** avec un mot de passe fort
4. **Activer HTTPS** (reverse proxy Nginx + Let's Encrypt recommandé)
5. **Configurer `NODE_ENV=production`**
6. **Auto-logout** : Les sessions inactives sont automatiquement fermées après 15 minutes (côté client ET serveur)
7. **Monitoring** : Utiliser PM2 pour le redémarrage automatique et le monitoring

---

## 👤 Auteur

**Azizi Mounir** — DeLTa-X Tunisia

---

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés © 2026 DeLTa-X Tunisia.
