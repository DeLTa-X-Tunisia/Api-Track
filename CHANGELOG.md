# Changelog — Api-Track

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [2.9.0] — 2026-03-04

### 🚀 Nouvelles fonctionnalités

#### Page de Maintenance
- **Page de maintenance élégante** avec design moderne et animations
  - Animation de particules flottantes
  - Cercle rotatif avec icône engrenage animée
  - Message personnalisable par l'admin système
  - Design responsive adapté mobile
  - Bouton "Réessayer" avec rechargement
- **Accès admin discret** : Clic sur le footer pour révéler le bouton "Accès administrateur"
- **Toggle maintenance** dans la page Supervision Admin
- Route publique `/api/settings/maintenance/status` pour vérifier le statut
- Routes admin `/api/settings/maintenance` et `/api/settings/maintenance/toggle`

#### Édition des dates inline (Admin Système)
- **Lots (Bobines Production)** : Modification inline des dates du pipeline
  - created_at, date_reception, date_installation, date_equipe_confirmee
  - Recalcul automatique des retards (retard_reception_minutes, retard_installation_minutes)
  - Icône crayon violet visible uniquement pour system_admin
- **Tubes** : Modification inline des dates des étapes
  - started_at et completed_at pour chaque étape du pipeline
  - Modification de la date de création du tube
  - Validation : impossible de mettre une date antérieure à celle du lot
- **Historique réparations tubes** : Modification de created_at

#### Protection des routes
- Composant `SystemAdminRoute` pour protéger les pages admin
- Page "Accès refusé" élégante pour les utilisateurs non autorisés
- Routes `/utilisateurs` et `/supervision` protégées côté frontend

### ✨ Améliorations UI

#### Modal Bobines en Stock
- Suppression du champ "Notes" du formulaire
- Nom de l'opérateur en violet gras
- Repositionnement du modal vers le haut pour meilleur affichage des dropdowns

#### Branding Api-Track
- Nouveau logo sur la page de connexion (`/logologin.png`)
- Nouveau logo dans le layout (`/logo.png`)
- Version affichée : V2.9

### 🗃️ Base de données

#### Nouvelles données
- **17 grades** dans la table `grades` :
  - API 5L : B, X42, X46, X52, X56, X60, X65, X70, X80
  - API 5CT : J55, K55, N80, L80, P110
  - EN 10025 : S235JR, S275JR, S355JR
- **12 motifs de retard** dans la table `motifs_retard` :
  - Problème technique, Panne machine, Pas de Forklift, Problème électrique
  - Défaut sur bobine, Attente de validation, Manque de personnel
  - Problème de sécurité, Attente de matériel, Problème de documentation
  - Conditions météo, Autre
- **Paramètres maintenance** dans `project_settings` :
  - maintenance_mode, maintenance_message

### 🔐 Sécurité
- Validation de date côté backend pour éviter les incohérences chronologiques
- Logs des modifications admin avec identification de l'utilisateur

---

## [Api-Track 1.0.0] — 2026-03-03

### Fork & Renommage
- Fork du projet **Logi-Track V2.5** (DeLTa-X Tunisia)
- Renommage du projet en **Api-Track** pour harmonisation avec la nouvelle identité
- Mise à jour des fichiers `package.json` (backend et frontend)
- Configuration de la connexion MySQL vers la base `apitrack` locale (Laragon)
- Création d'un nouveau README adapté (`README_APITRACK.md`)

### Configuration initiale
- Base de données : `apitrack` (MySQL via Laragon)
- Utilisateur : `root` / Mot de passe : `123456`
- Backend : port 3003
- Frontend : port 5174 (dev)

### À venir
- Modifications des modules selon les besoins métier
- Personnalisation de l'interface
- Ajout de nouvelles fonctionnalités

---

## Historique Logi-Track V2 (référence)

## [2.5.0] — 2026-02-XX

### Ajouté
- **Auto-déconnexion inactivité** : Déconnexion automatique après 15 min d'inactivité
  - Timer côté frontend (mouse, keyboard, touch, scroll avec throttling)
  - Gestion changement de visibilité (onglet caché/visible)
  - Pings d'activité Socket.io (`user:activity`)
  - Nettoyage périodique côté serveur (intervalle 60s)
  - Événement `session:expired` pour notification propre
- **Responsive mobile amélioré** : Modals, boutons, composition de messages optimisés pour mobile
  - Modal admin message adapté (bottom sheet sur mobile)
  - Bouton supprimer message toujours visible sur mobile (pas de hover)
  - Déverrouillage audio au premier toucher (mobile browsers)
- **Son de notification** : `message.mp3` joué à la réception de messages admin et de déconnexion forcée
- **Modal messages admin** : Remplacement des toasts par un vrai dialog modal plein écran
  - Header coloré selon priorité (info/warning/urgent)
  - Bouton supprimer par message dans l'historique
- **Supervision Admin** : Nouvelle page complète de supervision en temps réel
  - Liste des utilisateurs connectés (rôle, IP, durée connexion)
  - Déconnexion individuelle ou globale à distance
  - Messagerie interne (envoi ciblé ou broadcast, 3 niveaux de priorité)
  - Historique des messages envoyés
  - Badge live dans la sidebar (nombre d'utilisateurs connectés)
  - Routes API : `/api/admin/connected-users`, `/disconnect-user`, `/disconnect-all`, `/send-message`
- **Middleware Socket.io auth** : Authentification JWT obligatoire sur les connexions socket
  - Map `connectedUsers` avec tracking `lastActivity`

### Modifié
- Version bumped à `2.5.0` (backend + frontend)
- Layout.jsx : Intégration complète de la messagerie admin, du son, du timer d'inactivité
- Sidebar : Ajout lien "Supervision" avec indicateur live (system_admin uniquement)

---

## [2.4.0] — 2026-01-XX

### Ajouté
- **Scanner sous-réseau mobile** : Détection automatique du serveur par scan réseau (ConfigActivity.java)
- **NsdHelper** : Service mDNS/NSD pour découverte réseau automatique
- Scan de toutes les IP du sous-réseau local sur le port du serveur

### Modifié
- Application mobile V2.1 — mise à jour WebView, rotation, nouveaux logos `logov2.png`
- ConfigActivity : Interface de configuration IP avec scan automatique et configuration manuelle

---

## [2.3.0] — 2026-01-XX

### Ajouté
- **Téléchargement APK** : Route `/api/mobile/download` pour télécharger l'APK mobile depuis l'interface web
- Page Paramètres : Section "Application Mobile" avec bouton de téléchargement APK
- APK pré-compilé livré dans `app_down/app-release.apk`

---

## [2.2.0] — 2025-12-XX

### Ajouté
- **Fiches de suivi PDF professionnelles** : Rapports PDF multi-pages complets
  - Page de garde avec logos client/projet
  - Informations lot, bobine, paramètres soudure (4 têtes)
  - Photos d'étapes intégrées
  - Historique des validations et interruptions
  - Mise en page professionnelle avec en-têtes/pieds de page
- **Module Rapports & Export** : Nouvelle page `Rapports.jsx`
  - Export situation générale en Excel
  - Génération de fiches de suivi PDF par tube
- **Route API reports** : `/api/reports` pour les exports Excel et PDF

### Corrigé
- Fix pages vides dans les PDF de suivi de tube
- Fix pipeline photos : affichage correct des photos dans le détail des étapes
- Fix export Excel rapports : correction de la situation générale

---

## [2.1.0] — 2025-12-XX

### Ajouté
- **Application Mobile V2** : Application Android Java complète
  - `MainActivity.java` : WebView avec accès caméra, upload fichiers, téléchargement PDF
  - `ConfigActivity.java` : Configuration de l'adresse IP du serveur
  - `SplashActivity.java` : Écran de démarrage avec branding
  - Support rotation écran, gestion permissions (caméra, stockage, réseau)
  - Branding custom (icônes, couleurs, splash screen)
- Correctif CORS pour accès mobile multi-appareils

---

## [2.0.0] — 2025-11-XX

### Version initiale complète

#### Backend
- **Serveur** : Node.js + Express 4 sur port 3003
- **Base de données** : MySQL 8.0 avec 23+ tables (InnoDB, utf8mb4)
- **Authentification** : JWT avec code unique 6 chiffres, 4 niveaux de rôles
- **Sécurité** : Helmet, CORS, rate limiting, bcryptjs
- **Upload** : Multer avec validation et limite de taille (10 Mo)
- **Temps réel** : Socket.io 4 pour notifications
- **Export** : PDFKit pour PDF, ExcelJS pour Excel

#### Frontend
- **Framework** : React 18 + Vite 5
- **UI** : Tailwind CSS 3.4 avec glassmorphism et animations
- **Routing** : React Router 6 avec lazy loading
- **HTTP** : Axios avec intercepteurs JWT

#### Modules
- **Dashboard** : KPIs temps réel, statistiques, graphiques
- **Tubes** : Pipeline 12 étapes API 5L (validation, interruption, réparation, photos)
- **Bobines en Stock** : CRUD complet, import/export Excel, photos, filtres avancés
- **Bobines de Production** : Gestion des lots avec assignation d'équipes
- **Presets Soudure** : Paramétrage 4 têtes SAW (courant, tension, vitesse)
- **Équipes** : Gestion membres, zones de travail, qualifications
- **Utilisateurs** : CRUD avec 4 rôles (system_admin, admin, superviseur, consultant)
- **Paramètres** : Configuration projet (logos, infos), responsabilités réparation

#### Base de données (23 tables)
- `users`, `entreprises`, `bobines`, `bobine_photos`
- `grades`, `fournisseurs`, `lots`, `tubes`
- `tube_etapes`, `tube_etape_historique`, `tube_etape_photos`
- `reparation_defauts`, `responsabilites`, `diametres_tubes`, `motifs_retard`
- `equipes_production`, `equipe_membres`, `personnel_production`
- `qualifications`, `zones_travail`
- `presets_soudure`, `preset_soudure_heads`, `project_settings`

#### Scripts de migration
- 9+ scripts de migration pour l'évolution du schéma

---

## Commit History

| Hash | Description |
|------|-------------|
| `0026be0` | Auto-déconnexion pour inactivité (15 min) |
| `36f5593` | Responsive mobile (modals, audio, delete button) |
| `710ea67` | Son de notification messages admin |
| `e11538e` | Modal messages admin + suppression par message |
| `f299967` | Supervision admin (connexions, messagerie, déconnexion) |
| `3c95eaa` | Scanner sous-réseau mobile (subnet scanner) |
| `7c0b3fa` | Téléchargement APK depuis interface web |
| `cbddf54` | Application mobile V2.1 (mise à jour) |
| `3964820` | Rapport PDF professionnel multi-pages |
| `ecbb135` | Fix pipeline photos |
| `807992f` | Fix PDF pages vides |
| `81c38fa` | Rapports & Export Excel |
| `98a7e05` | V2.0.0 — Version initiale complète |
