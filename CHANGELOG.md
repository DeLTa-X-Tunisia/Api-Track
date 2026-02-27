# 📋 Changelog — Logi-Track V2

Toutes les modifications notables du projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Versionnement Sémantique](https://semver.org/lang/fr/).

---

## [2.0.0] — 2026-02-27

### 🎉 Version initiale complète

Réécriture complète de Logi-Track V1 avec une architecture moderne et toutes les fonctionnalités de production.

### Ajouté

#### Infrastructure
- Backend Node.js / Express 4 sur port 3003
- Frontend React 18 / Vite 5 / Tailwind CSS 3.4 sur port 5174
- Base de données MySQL 8.0 (23 tables, InnoDB, utf8mb4)
- Socket.io pour les notifications temps réel
- Authentification JWT par code unique 6 chiffres
- Sécurité : Helmet, CORS, rate limiting, bcryptjs
- Serveur frontend intégré en mode production (Express sert le build Vite)
- Script d'initialisation DB (`npm run init-db`)
- Scripts de migration incrémentaux

#### Module Dashboard
- Vue d'ensemble KPIs de production en temps réel
- Statistiques : tubes produits, rendement, taux de réparation
- Graphiques et indicateurs visuels
- Responsive mobile (`text-xl sm:text-3xl` pour les valeurs)

#### Module Gestion Tubes (Pipeline 12 étapes API 5L)
- Pipeline complet : Formage → Pointage → CV Pointage → Soudage SAW → CV Int → CV Ext → UST → Chanfreinage AP → Hydro → Pesée/Mesure → Chanfreinage AR → CV Final
- Validation / annulation d'étapes selon les rôles
- Système d'interruptions avec motifs et reprise
- Modal de réparation avec défauts multiples, responsabilités, actions
- Résolution de réparations
- Timeline visuelle du pipeline par tube
- Photos par étape (upload, visualisation)
- Export PDF de la fiche de suivi par tube
- Filtrage par étape, statut, SAW date range
- Bouton « Annuler » pour annuler la dernière validation
- Tooltips natifs (title) pour les données de la timeline

#### Module Bobines en Stock
- CRUD complet des bobines d'acier
- Import/export Excel (ExcelJS)
- Upload de photos par bobine
- Recherche, tri, filtrage avancé
- Informations : numéro, grade, épaisseur, largeur, poids, fournisseur

#### Module Bobines de Production (Lots)
- Création de lots de production à partir des bobines en stock
- Assignation d'équipes de production aux lots
- Suivi de l'état de production des lots

#### Module Presets Soudure
- CRUD des presets de soudure
- 4 têtes SAW configurables par preset
- Paramètres : courant, tension, vitesse, offset, etc.
- Formulaire responsive (`grid-cols-1 sm:grid-cols-2`)

#### Module Équipes de Production
- CRUD des équipes avec membres
- Zones de travail et qualifications
- Confirmation d'équipe
- Interface responsive avec labels adaptés (`hidden sm:inline`)

#### Module Gestion Utilisateurs
- CRUD complet des utilisateurs
- 4 rôles : system_admin, admin, superviseur, consultant
- Génération automatique de codes 6 chiffres et matricules
- Entreprises multiples (DANIELI, ALTUMET)
- Menu de rôle responsive (centré sur mobile)

#### Module Paramètres du Projet
- Logos : upload / suppression de logo entreprise et logo client
- Informations client : nom, adresse
- Informations projet : nom, code, adresse
- Aperçu en direct du header avec les logos et infos configurées
- Header de l'application affiche dynamiquement les logos et identité projet

#### Module Resp. Réparation (sous-menu Paramètres)
- CRUD des responsabilités de réparation (ex: ALTUMET, DANIELI, U&S)
- Liste alimentant le dropdown du modal de réparation des tubes
- Ajout inline avec nom + description optionnelle
- Édition inline, suppression avec confirmation
- Accès réservé aux administrateurs

#### Interface utilisateur
- Design moderne avec Tailwind CSS et composants card
- Sidebar de navigation avec icônes Lucide React
- Système de toast notifications
- Modal de confirmation réutilisable
- Error Boundary React
- Routes protégées par authentification
- 100% responsive (mobile / tablette / desktop)

### Sécurité
- JWT avec expiration configurable
- Rate limiting sur authentification (20/15min) et API (1000/5min)
- Helmet pour les headers HTTP
- CORS configurable par variable d'environnement
- Uploads protégés par authentification
- Validation des inputs (express-validator)

---

## Notes de migration depuis V1

Logi-Track V2 est une réécriture complète. La migration depuis V1 nécessite :
1. Export des données V1
2. Initialisation de la base V2 (`npm run init-db` ou restauration du backup)
3. Import des données via les API V2 ou directement en SQL
4. Configuration des variables d'environnement (`.env`)

---

*Maintenu par Azizi Mounir — DeLTa-X Tunisia*
