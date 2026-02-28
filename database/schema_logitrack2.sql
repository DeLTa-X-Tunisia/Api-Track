-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: logitrack2
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bobine_photos`
--

DROP TABLE IF EXISTS `bobine_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bobine_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bobine_id` int NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mimetype` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` int DEFAULT NULL,
  `path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `bobine_id` (`bobine_id`),
  CONSTRAINT `bobine_photos_ibfk_1` FOREIGN KEY (`bobine_id`) REFERENCES `bobines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bobines`
--

DROP TABLE IF EXISTS `bobines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bobines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Code bobine unique',
  `norme` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'API 5L' COMMENT 'Norme (API 5L, API 5CT, etc.)',
  `grade` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Grade / nuance acier',
  `epaisseur` decimal(10,2) NOT NULL COMMENT '├ëpaisseur en mm',
  `largeur` decimal(10,2) DEFAULT NULL COMMENT 'Largeur en mm',
  `poids` decimal(12,2) DEFAULT NULL COMMENT 'Poids en kg',
  `fournisseur` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_reception` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `statut` enum('en_stock','en_cours','epuisee') COLLATE utf8mb4_unicode_ci DEFAULT 'en_stock',
  `lot_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `createur_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createur_prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `modificateur_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modificateur_prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diametres_tubes`
--

DROP TABLE IF EXISTS `diametres_tubes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diametres_tubes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pouce` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Diam├¿tre en pouces (ex: 36)',
  `mm` decimal(10,1) NOT NULL COMMENT 'Diam├¿tre en mm (ex: 914.4)',
  `actif` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `entreprises`
--

DROP TABLE IF EXISTS `entreprises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entreprises` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipe_membres`
--

DROP TABLE IF EXISTS `equipe_membres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipe_membres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipe_id` int NOT NULL,
  `zone_id` int DEFAULT NULL,
  `personnel_id` int NOT NULL,
  `is_chef` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_membre` (`equipe_id`,`personnel_id`),
  KEY `personnel_id` (`personnel_id`),
  KEY `idx_em_zone` (`zone_id`),
  CONSTRAINT `equipe_membres_ibfk_1` FOREIGN KEY (`equipe_id`) REFERENCES `equipes_production` (`id`) ON DELETE CASCADE,
  CONSTRAINT `equipe_membres_ibfk_2` FOREIGN KEY (`personnel_id`) REFERENCES `personnel_production` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipes_production`
--

DROP TABLE IF EXISTS `equipes_production`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipes_production` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `actif` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `createur_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createur_prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fournisseurs`
--

DROP TABLE IF EXISTS `fournisseurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fournisseurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ex: X42, X52, X65',
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom complet',
  `norme` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'API 5L' COMMENT 'Norme associ├®e',
  `limite_elastique_min` decimal(10,2) DEFAULT NULL COMMENT 'MPa',
  `resistance_traction_min` decimal(10,2) DEFAULT NULL COMMENT 'MPa',
  `actif` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lots`
--

DROP TABLE IF EXISTS `lots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bobine_id` int DEFAULT NULL,
  `parametre_id` int DEFAULT NULL COMMENT 'R├®f├®rence vers presets_soudure',
  `equipe_id` int DEFAULT NULL,
  `statut` enum('en_cours','pret_production','en_production','termine','annule') COLLATE utf8mb4_unicode_ci DEFAULT 'en_cours',
  `bobine_recue` tinyint(1) DEFAULT '0',
  `date_reception` datetime DEFAULT NULL,
  `retard_reception_minutes` int DEFAULT '0',
  `motif_retard_reception_id` int DEFAULT NULL,
  `commentaire_reception` text COLLATE utf8mb4_unicode_ci,
  `bobine_installee` tinyint(1) DEFAULT '0',
  `date_installation` datetime DEFAULT NULL,
  `retard_installation_minutes` int DEFAULT '0',
  `motif_retard_installation_id` int DEFAULT NULL,
  `commentaire_installation` text COLLATE utf8mb4_unicode_ci,
  `checklist_validee` tinyint(1) DEFAULT '0',
  `date_checklist` datetime DEFAULT NULL,
  `checklist_validation_rapide` tinyint(1) DEFAULT '0',
  `checklist_source_lot_id` int DEFAULT NULL,
  `equipe_confirmee` tinyint(1) NOT NULL DEFAULT '0',
  `date_equipe_confirmee` datetime DEFAULT NULL,
  `date_production` datetime DEFAULT NULL,
  `date_fin` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `operateur_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operateur_prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `idx_lots_statut` (`statut`),
  KEY `idx_lots_bobine` (`bobine_id`),
  KEY `idx_lots_parametre` (`parametre_id`),
  KEY `motif_retard_reception_id` (`motif_retard_reception_id`),
  KEY `motif_retard_installation_id` (`motif_retard_installation_id`),
  KEY `idx_lots_equipe` (`equipe_id`),
  CONSTRAINT `fk_lots_equipe` FOREIGN KEY (`equipe_id`) REFERENCES `equipes_production` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lots_ibfk_1` FOREIGN KEY (`bobine_id`) REFERENCES `bobines` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lots_ibfk_2` FOREIGN KEY (`parametre_id`) REFERENCES `presets_soudure` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lots_ibfk_3` FOREIGN KEY (`motif_retard_reception_id`) REFERENCES `motifs_retard` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lots_ibfk_4` FOREIGN KEY (`motif_retard_installation_id`) REFERENCES `motifs_retard` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `motifs_retard`
--

DROP TABLE IF EXISTS `motifs_retard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `motifs_retard` (
  `id` int NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `etape` enum('reception','installation','general') COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `actif` tinyint(1) DEFAULT '1',
  `ordre` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personnel_production`
--

DROP TABLE IF EXISTS `personnel_production`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_production` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `matricule` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('chef','operateur') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operateur',
  `qualification_id` int DEFAULT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_matricule` (`matricule`),
  KEY `qualification_id` (`qualification_id`),
  CONSTRAINT `personnel_production_ibfk_1` FOREIGN KEY (`qualification_id`) REFERENCES `qualifications` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `preset_soudure_heads`
--

DROP TABLE IF EXISTS `preset_soudure_heads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preset_soudure_heads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `preset_id` int NOT NULL,
  `type` enum('ID','OD') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID = int├®rieur, OD = ext├®rieur',
  `numero` int NOT NULL COMMENT 'Num├®ro de t├¬te (1, 2, 3)',
  `actif` tinyint(1) DEFAULT '0' COMMENT '1 = active, 0 = inactive',
  `amperage` decimal(8,1) DEFAULT '0.0' COMMENT 'Amp├®rage par t├¬te',
  `voltage` decimal(8,1) DEFAULT '0.0' COMMENT 'Voltage par t├¬te',
  `type_fil` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '3.2mm' COMMENT 'Type de fil par t├¬te',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_head` (`preset_id`,`type`,`numero`),
  CONSTRAINT `preset_soudure_heads_ibfk_1` FOREIGN KEY (`preset_id`) REFERENCES `presets_soudure` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `presets_soudure`
--

DROP TABLE IF EXISTS `presets_soudure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `presets_soudure` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Code preset auto-g├®n├®r├® (PAR-36-1)',
  `diametre_pouce` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Diam├¿tre en pouces',
  `diametre_mm` decimal(10,1) NOT NULL COMMENT 'Diam├¿tre en mm',
  `lot` int DEFAULT NULL COMMENT 'Num├®ro de lot (optionnel)',
  `strip_vitesse_m` int NOT NULL DEFAULT '0' COMMENT 'Strip: vitesse m├¿tres',
  `strip_vitesse_cm` int NOT NULL DEFAULT '0' COMMENT 'Strip: vitesse centim├¿tres',
  `milling_angle1` decimal(5,1) NOT NULL DEFAULT '0.0' COMMENT 'Milling: angle 1 en degr├®s',
  `milling_angle2` decimal(5,1) NOT NULL DEFAULT '0.0' COMMENT 'Milling: angle 2 en degr├®s',
  `pression_rouleaux` decimal(10,2) DEFAULT NULL COMMENT 'Pression rouleaux',
  `pression_unite` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'Tonnes' COMMENT 'Unit├® pression',
  `tack_amperage` decimal(6,1) NOT NULL DEFAULT '0.0' COMMENT 'Tack: amp├®rage (A)',
  `tack_voltage` decimal(5,1) NOT NULL DEFAULT '0.0' COMMENT 'Tack: voltage (V)',
  `tack_vitesse_m` int NOT NULL DEFAULT '0' COMMENT 'Tack: vitesse m├¿tres',
  `tack_vitesse_cm` int NOT NULL DEFAULT '0' COMMENT 'Tack: vitesse cm',
  `tack_frequence_hf` decimal(10,2) DEFAULT NULL COMMENT 'Tack: fr├®quence HF (Hz)',
  `tack_type_gaz` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'COÔéé' COMMENT 'Tack: type de gaz',
  `tack_debit_gaz` decimal(10,2) DEFAULT NULL COMMENT 'Tack: d├®bit gaz (L/min)',
  `soudure_vitesse_m` int NOT NULL DEFAULT '0' COMMENT 'Soudure: vitesse m├¿tres',
  `soudure_vitesse_cm` int NOT NULL DEFAULT '0' COMMENT 'Soudure: vitesse centim├¿tres',
  `soudure_type_fil` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '1.6mm' COMMENT 'Type de fil soudure finale',
  `soudure_type_flux` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'SAW' COMMENT 'Type de flux soudure',
  `finale_amperage` decimal(6,1) NOT NULL DEFAULT '0.0' COMMENT 'Soudure finale: amp├®rage',
  `finale_voltage` decimal(5,1) NOT NULL DEFAULT '0.0' COMMENT 'Soudure finale: voltage',
  `finale_frequence_hf` decimal(10,2) DEFAULT NULL COMMENT 'Soudure finale: fr├®quence HF',
  `finale_type_gaz` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'COÔéé' COMMENT 'Soudure finale: type gaz',
  `finale_debit_gaz` decimal(10,2) DEFAULT NULL COMMENT 'Soudure finale: d├®bit gaz',
  `nb_tetes` int NOT NULL DEFAULT '5' COMMENT 'Nombre total de t├¬tes',
  `tetes_config` json DEFAULT NULL COMMENT 'Config t├¬tes [true,true,true,true,false]',
  `copie_de` int DEFAULT NULL COMMENT 'ID du preset source si copi├®',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `createur_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createur_prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `modificateur_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modificateur_prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_diametre` (`diametre_pouce`),
  KEY `idx_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_settings`
--

DROP TABLE IF EXISTS `project_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `setting_type` enum('text','textarea','image','date','number') DEFAULT 'text',
  `category` varchar(50) DEFAULT 'project',
  `label` varchar(200) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=119 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qualifications`
--

DROP TABLE IF EXISTS `qualifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qualifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_nom` (`nom`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reparation_defauts`
--

DROP TABLE IF EXISTS `reparation_defauts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reparation_defauts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `historique_id` int NOT NULL,
  `tube_id` int NOT NULL,
  `etape_numero` smallint NOT NULL,
  `defaut` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `cause_defaut` text COLLATE utf8mb4_unicode_ci,
  `responsabilite_id` int DEFAULT NULL,
  `responsabilite_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_prise` text COLLATE utf8mb4_unicode_ci,
  `ordre` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `historique_id` (`historique_id`),
  KEY `tube_id` (`tube_id`),
  CONSTRAINT `reparation_defauts_ibfk_1` FOREIGN KEY (`historique_id`) REFERENCES `tube_etape_historique` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reparation_defauts_ibfk_2` FOREIGN KEY (`tube_id`) REFERENCES `tubes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `responsabilites`
--

DROP TABLE IF EXISTS `responsabilites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responsabilites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `actif` tinyint(1) DEFAULT '1',
  `ordre` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tube_etape_historique`
--

DROP TABLE IF EXISTS `tube_etape_historique`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tube_etape_historique` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tube_id` int NOT NULL,
  `etape_numero` smallint NOT NULL,
  `etape_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `operateur_id` int DEFAULT NULL,
  `operateur_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operateur_prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `defaut` text COLLATE utf8mb4_unicode_ci,
  `cause_defaut` text COLLATE utf8mb4_unicode_ci,
  `responsabilite_id` int DEFAULT NULL,
  `responsabilite_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_prise` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tube_historique_tube` (`tube_id`),
  KEY `idx_tube_historique_etape` (`tube_id`,`etape_numero`),
  CONSTRAINT `tube_etape_historique_ibfk_1` FOREIGN KEY (`tube_id`) REFERENCES `tubes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tube_etape_photos`
--

DROP TABLE IF EXISTS `tube_etape_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tube_etape_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tube_id` int NOT NULL,
  `etape_numero` smallint NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mimetype` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` int DEFAULT NULL,
  `path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tube_id` (`tube_id`),
  CONSTRAINT `tube_etape_photos_ibfk_1` FOREIGN KEY (`tube_id`) REFERENCES `tubes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tube_etapes`
--

DROP TABLE IF EXISTS `tube_etapes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tube_etapes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tube_id` int NOT NULL,
  `etape_numero` smallint NOT NULL,
  `etape_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('en_attente','en_cours','valide','non_conforme','saute','en_reparation','interrompu') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `operateur_id` int DEFAULT NULL,
  `operateur_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operateur_prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `offline` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tube_etape` (`tube_id`,`etape_numero`),
  CONSTRAINT `tube_etapes_ibfk_1` FOREIGN KEY (`tube_id`) REFERENCES `tubes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tubes`
--

DROP TABLE IF EXISTS `tubes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tubes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lot_id` int NOT NULL,
  `lot_id_2` int DEFAULT NULL,
  `numero` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_tube` enum('normal','cross_welding') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `diametre_mm` decimal(10,2) NOT NULL,
  `diametre_pouce` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longueur` decimal(10,2) DEFAULT NULL,
  `epaisseur` decimal(10,3) DEFAULT NULL,
  `poids` decimal(10,2) DEFAULT NULL,
  `etape_courante` smallint DEFAULT '1',
  `statut` enum('en_production','termine','rebut','en_attente','en_reparation','interrompu') COLLATE utf8mb4_unicode_ci DEFAULT 'en_production',
  `operateur_id` int DEFAULT NULL,
  `operateur_nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operateur_prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parametre_id` int DEFAULT NULL,
  `decision` enum('en_attente','certifie_api','certifie_hydraulique','declasse') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `decision_date` datetime DEFAULT NULL,
  `decision_par` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `decision_commentaire` text COLLATE utf8mb4_unicode_ci,
  `date_debut_decision` datetime DEFAULT NULL,
  `date_fin_decision` datetime DEFAULT NULL,
  `date_fin_production` datetime DEFAULT NULL,
  `saw_date` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_numero` (`numero`),
  KEY `idx_tubes_lot_id` (`lot_id`),
  KEY `idx_tubes_statut` (`statut`),
  KEY `idx_tubes_etape` (`etape_courante`),
  KEY `idx_tubes_decision` (`decision`),
  CONSTRAINT `tubes_ibfk_1` FOREIGN KEY (`lot_id`) REFERENCES `lots` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `matricule` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entreprise` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'danieli',
  `role` enum('system_admin','admin','superviseur','consultant') COLLATE utf8mb4_unicode_ci DEFAULT 'consultant',
  `actif` tinyint(1) DEFAULT '1',
  `derniere_connexion` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `matricule` (`matricule`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `zones_travail`
--

DROP TABLE IF EXISTS `zones_travail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zones_travail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `couleur` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'blue' COMMENT 'Cl├® couleur Tailwind: red, blue, green, orange, violet, cyan, rose, amber, indigo, emerald',
  `actif` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_nom` (`nom`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'logitrack2'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-28 11:54:55
