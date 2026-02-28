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
-- Current Database: `logitrack2`
--

/*!40000 DROP DATABASE IF EXISTS `logitrack2`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `logitrack2` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `logitrack2`;

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
-- Dumping data for table `bobine_photos`
--

LOCK TABLES `bobine_photos` WRITE;
/*!40000 ALTER TABLE `bobine_photos` DISABLE KEYS */;
INSERT INTO `bobine_photos` VALUES (1,1,'bobine_1_1772183400684-963949934.jpg','Bobine501.jpg','image/jpeg',381995,'/uploads/bobines/bobine_1_1772183400684-963949934.jpg',1,'2026-02-27 10:10:00');
/*!40000 ALTER TABLE `bobine_photos` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `bobines`
--

LOCK TABLES `bobines` WRITE;
/*!40000 ALTER TABLE `bobines` DISABLE KEYS */;
INSERT INTO `bobines` VALUES (1,'101','API 5L','X52',12.00,1500.00,31200.00,'HAJJAR','2026-02-27','Virtual','en_cours',7,1,'Admin','Syst├¿me',NULL,NULL,NULL,'2026-02-27 10:10:00','2026-02-27 19:13:02'),(2,'102','API 5L','X52',12.00,1500.00,32000.00,'HAJJAR','2026-02-27',NULL,'en_cours',6,1,'Admin','Syst├¿me',NULL,NULL,NULL,'2026-02-27 16:59:59','2026-02-27 17:40:11');
/*!40000 ALTER TABLE `bobines` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `diametres_tubes`
--

LOCK TABLES `diametres_tubes` WRITE;
/*!40000 ALTER TABLE `diametres_tubes` DISABLE KEYS */;
INSERT INTO `diametres_tubes` VALUES (1,'16',406.4,1,'2026-02-27 10:34:51'),(2,'18',457.2,1,'2026-02-27 10:34:51'),(3,'20',508.0,1,'2026-02-27 10:34:51'),(4,'22',558.8,1,'2026-02-27 10:34:51'),(5,'24',609.6,1,'2026-02-27 10:34:51'),(6,'26',660.4,1,'2026-02-27 10:34:51'),(7,'28',711.2,1,'2026-02-27 10:34:51'),(8,'30',762.0,1,'2026-02-27 10:34:51'),(9,'32',812.8,1,'2026-02-27 10:34:51'),(10,'34',863.6,1,'2026-02-27 10:34:51'),(11,'36',914.4,1,'2026-02-27 10:34:51'),(12,'38',965.2,1,'2026-02-27 10:34:51'),(13,'40',1016.0,1,'2026-02-27 10:34:51'),(14,'42',1066.8,1,'2026-02-27 10:34:51'),(15,'44',1117.6,1,'2026-02-27 10:34:51'),(16,'48',1219.2,1,'2026-02-27 10:34:51'),(17,'54',1371.6,1,'2026-02-27 10:34:51'),(18,'56',1422.4,1,'2026-02-27 10:34:51'),(19,'60',1524.0,1,'2026-02-27 10:34:51'),(20,'64',1625.6,1,'2026-02-27 10:34:51'),(21,'8',219.1,1,'2026-02-27 10:55:47'),(22,'10',273.1,1,'2026-02-27 10:55:47'),(23,'12',323.9,1,'2026-02-27 10:55:47'),(24,'14',355.6,1,'2026-02-27 10:55:47'),(25,'46',1168.4,1,'2026-02-27 10:55:47'),(26,'50',1270.0,1,'2026-02-27 11:36:01'),(27,'52',1320.8,1,'2026-02-27 11:36:01'),(28,'58',1473.2,1,'2026-02-27 11:36:01'),(29,'66',1676.4,1,'2026-02-27 11:36:01'),(30,'68',1727.2,1,'2026-02-27 11:36:01'),(31,'72',1828.8,1,'2026-02-27 11:36:01'),(32,'76',1930.4,1,'2026-02-27 11:36:01'),(33,'80',2032.0,1,'2026-02-27 11:36:01'),(34,'82',2082.8,1,'2026-02-27 11:36:01');
/*!40000 ALTER TABLE `diametres_tubes` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `entreprises`
--

LOCK TABLES `entreprises` WRITE;
/*!40000 ALTER TABLE `entreprises` DISABLE KEYS */;
INSERT INTO `entreprises` VALUES (1,'danieli','DANIELI',1,'2026-02-27 09:00:10'),(2,'altumet','ALTUMET',1,'2026-02-27 09:00:10');
/*!40000 ALTER TABLE `entreprises` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `equipe_membres`
--

LOCK TABLES `equipe_membres` WRITE;
/*!40000 ALTER TABLE `equipe_membres` DISABLE KEYS */;
INSERT INTO `equipe_membres` VALUES (3,3,1,7,1),(4,3,1,9,0),(5,3,1,10,0),(6,3,1,11,0),(7,3,2,6,1),(8,3,2,8,0),(9,3,2,5,0),(10,3,3,12,0);
/*!40000 ALTER TABLE `equipe_membres` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `equipes_production`
--

LOCK TABLES `equipes_production` WRITE;
/*!40000 ALTER TABLE `equipes_production` DISABLE KEYS */;
INSERT INTO `equipes_production` VALUES (3,'TEAM-001','Hakim',NULL,1,NULL,'Admin','Syst├¿me','2026-02-27 15:26:37','2026-02-27 15:26:37');
/*!40000 ALTER TABLE `equipes_production` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `fournisseurs`
--

LOCK TABLES `fournisseurs` WRITE;
/*!40000 ALTER TABLE `fournisseurs` DISABLE KEYS */;
INSERT INTO `fournisseurs` VALUES (1,'HAJJAR',1,'2026-02-27 10:09:36');
/*!40000 ALTER TABLE `fournisseurs` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;
/*!40000 ALTER TABLE `grades` DISABLE KEYS */;
INSERT INTO `grades` VALUES (1,'B','Grade B','API 5L',245.00,415.00,1,'2026-02-27 09:56:14'),(2,'X42','Grade X42','API 5L',290.00,415.00,1,'2026-02-27 09:56:14'),(3,'X46','Grade X46','API 5L',317.00,435.00,1,'2026-02-27 09:56:14'),(4,'X52','Grade X52','API 5L',359.00,455.00,1,'2026-02-27 09:56:14'),(5,'X56','Grade X56','API 5L',386.00,490.00,1,'2026-02-27 09:56:14'),(6,'X60','Grade X60','API 5L',415.00,520.00,1,'2026-02-27 09:56:14'),(7,'X65','Grade X65','API 5L',450.00,535.00,1,'2026-02-27 09:56:14'),(8,'X70','Grade X70','API 5L',485.00,570.00,1,'2026-02-27 09:56:14'),(9,'X80','Grade X80','API 5L',555.00,625.00,1,'2026-02-27 09:56:14'),(10,'H40','Grade H40','API 5CT',276.00,414.00,1,'2026-02-27 09:56:14'),(11,'J55','Grade J55','API 5CT',379.00,517.00,1,'2026-02-27 09:56:14'),(12,'K55','Grade K55','API 5CT',379.00,655.00,1,'2026-02-27 09:56:14'),(13,'N80','Grade N80','API 5CT',552.00,689.00,1,'2026-02-27 09:56:14'),(14,'L80','Grade L80','API 5CT',552.00,655.00,1,'2026-02-27 09:56:14'),(15,'P110','Grade P110','API 5CT',758.00,862.00,1,'2026-02-27 09:56:14'),(16,'A53-A','Grade A','ASTM A53',205.00,330.00,1,'2026-02-27 09:56:14'),(17,'A53-B','Grade B','ASTM A53',240.00,415.00,1,'2026-02-27 09:56:14'),(18,'S235','S235JRH','EN 10219',235.00,360.00,1,'2026-02-27 09:56:14'),(19,'S275','S275J0H','EN 10219',275.00,430.00,1,'2026-02-27 09:56:14'),(20,'S355','S355J2H','EN 10219',355.00,510.00,1,'2026-02-27 09:56:14'),(21,'S460','S460NH','EN 10219',460.00,540.00,1,'2026-02-27 09:56:14');
/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `lots`
--

LOCK TABLES `lots` WRITE;
/*!40000 ALTER TABLE `lots` DISABLE KEYS */;
INSERT INTO `lots` VALUES (6,'1',2,1,3,'termine',1,'2026-02-27 17:40:12',0,NULL,NULL,1,'2026-02-27 17:40:13',0,NULL,NULL,0,NULL,0,NULL,1,'2026-02-27 17:40:14','2026-02-27 17:44:30',NULL,1,'Admin','Syst├¿me','2026-02-27 16:40:11','2026-02-27 18:15:44'),(7,'2',1,1,3,'en_production',1,'2026-02-27 19:13:03',0,NULL,NULL,1,'2026-02-27 19:13:04',0,NULL,NULL,0,NULL,0,NULL,1,'2026-02-27 19:13:05','2026-02-27 19:13:07',NULL,1,'Admin','Syst├¿me','2026-02-27 18:13:02','2026-02-27 18:13:07');
/*!40000 ALTER TABLE `lots` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `motifs_retard`
--

LOCK TABLES `motifs_retard` WRITE;
/*!40000 ALTER TABLE `motifs_retard` DISABLE KEYS */;
INSERT INTO `motifs_retard` VALUES (1,'Bobine en attente au quai','Logistique','reception',1,1,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(2,'Retard livraison fournisseur','Fournisseur','reception',1,2,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(3,'Probl├¿me de transport interne','Logistique','reception',1,3,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(4,'V├®rification qualit├® en cours','Qualit├®','reception',1,4,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(5,'Attente chariot ├®l├®vateur','Logistique','reception',1,5,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(6,'Machine occup├®e (lot pr├®c├®dent)','Production','installation',1,1,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(7,'Maintenance en cours','Maintenance','installation',1,2,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(8,'Changement outillage','Production','installation',1,3,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(9,'Probl├¿me m├®canique','Maintenance','installation',1,4,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(10,'Attente op├®rateur','Personnel','installation',1,5,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(11,'Pause ├®quipe','Personnel','general',1,1,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(12,'Coupure ├®lectrique','Infrastructure','general',1,2,'2026-02-27 13:05:15','2026-02-27 13:05:15'),(13,'Autre','Divers','general',1,10,'2026-02-27 13:05:15','2026-02-27 13:05:15');
/*!40000 ALTER TABLE `motifs_retard` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `personnel_production`
--

LOCK TABLES `personnel_production` WRITE;
/*!40000 ALTER TABLE `personnel_production` DISABLE KEYS */;
INSERT INTO `personnel_production` VALUES (5,'Meziani','Omar','ALT-001',NULL,'chef',5,1,NULL,'2026-02-27 14:30:04','2026-02-27 14:30:04'),(6,'Boukabous','Hakim','ALT-002',NULL,'chef',5,1,NULL,'2026-02-27 14:30:21','2026-02-27 14:30:21'),(7,'Ahmed','Khedim','ALT-003',NULL,'chef',5,1,NULL,'2026-02-27 14:30:45','2026-02-27 14:30:45'),(8,'Bouti','Aissa','ALT-004',NULL,'chef',5,1,NULL,'2026-02-27 14:31:06','2026-02-27 14:31:06'),(9,'Kirdioui','Nassim','ALT-005',NULL,'operateur',13,1,NULL,'2026-02-27 14:40:45','2026-02-27 14:40:45'),(10,'Mansour','Aziz','ALT-006',NULL,'operateur',13,1,NULL,'2026-02-27 14:41:05','2026-02-27 14:41:05'),(11,'Mohamed','Belkhir','ALT-007',NULL,'operateur',13,1,NULL,'2026-02-27 14:41:32','2026-02-27 14:41:32'),(12,'Mokhtar','Fekir','ALT-008',NULL,'operateur',13,1,NULL,'2026-02-27 14:41:49','2026-02-27 14:41:49');
/*!40000 ALTER TABLE `personnel_production` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `preset_soudure_heads`
--

LOCK TABLES `preset_soudure_heads` WRITE;
/*!40000 ALTER TABLE `preset_soudure_heads` DISABLE KEYS */;
INSERT INTO `preset_soudure_heads` VALUES (11,1,'ID',1,1,750.0,35.0,'3.2mm'),(12,1,'ID',2,1,550.0,35.0,'3.2mm'),(13,1,'ID',3,0,0.0,0.0,'3.2mm'),(14,1,'OD',1,1,800.0,36.0,'4.0mm'),(15,1,'OD',2,1,600.0,34.0,'3.2mm');
/*!40000 ALTER TABLE `preset_soudure_heads` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `presets_soudure`
--

LOCK TABLES `presets_soudure` WRITE;
/*!40000 ALTER TABLE `presets_soudure` DISABLE KEYS */;
INSERT INTO `presets_soudure` VALUES (1,'PAR-36-1','36',914.4,NULL,2,0,40.0,40.0,10.00,'tonnes',350.0,28.0,2,50,50.00,'CO2',15.00,1,40,'1.6mm','SAW',0.0,0.0,NULL,'CO2',NULL,5,'[true, true, false, true, true]',NULL,'Test preset v3',NULL,'Admin','Syst├¿me',NULL,'Admin','Syst├¿me','2026-02-27 11:37:47','2026-02-27 14:22:53');
/*!40000 ALTER TABLE `presets_soudure` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `project_settings`
--

LOCK TABLES `project_settings` WRITE;
/*!40000 ALTER TABLE `project_settings` DISABLE KEYS */;
INSERT INTO `project_settings` VALUES (1,'project_name','ALTUMET','text','project','Nom du projet',1,'2026-02-27 20:30:22','2026-02-27 21:06:19'),(2,'client_name','ALTUMET','text','project','Nom du client',2,'2026-02-27 20:30:22','2026-02-27 20:45:33'),(3,'client_logo','/uploads/logos/client_logo-1772225159331.jpg','image','project','Logo du client',3,'2026-02-27 20:30:22','2026-02-27 20:45:59'),(4,'project_number','','text','project','Num├®ro du projet',4,'2026-02-27 20:30:22','2026-02-27 20:30:22'),(5,'project_location','','text','project','Lieu / Site',5,'2026-02-27 20:30:22','2026-02-27 20:30:22'),(6,'project_description','','textarea','project','Description du projet',6,'2026-02-27 20:30:22','2026-02-27 20:30:22'),(7,'pipe_specification','','text','project','Sp├®cification tubes',7,'2026-02-27 20:30:22','2026-02-27 20:30:22'),(8,'norm_reference','','text','project','Norme de r├®f├®rence',8,'2026-02-27 20:30:22','2026-02-27 20:30:22'),(9,'contractor_name','','text','project','Entrepreneur / Contracteur',9,'2026-02-27 20:30:22','2026-02-27 20:30:22'),(10,'project_start_date','','date','project','Date d├®but projet',10,'2026-02-27 20:30:22','2026-02-27 20:30:22'),(11,'project_end_date','','date','project','Date fin projet (pr├®vue)',11,'2026-02-27 20:30:22','2026-02-27 20:30:22'),(12,'project_manager','','text','project','Chef de projet',12,'2026-02-27 20:30:22','2026-02-27 20:30:22'),(13,'quality_manager','','text','project','Responsable qualit├®',13,'2026-02-27 20:30:22','2026-02-27 20:30:22'),(14,'enterprise_logo','/uploads/logos/enterprise_logo-1772225155137.jpeg','image','project','Logo Entreprise',1,'2026-02-27 20:41:08','2026-02-27 20:45:55'),(17,'client_address','Alger Raghaya','text','project','Adresse du Client',4,'2026-02-27 20:41:08','2026-02-27 20:45:33'),(19,'project_code','DP0HYXF1','text','project','Code du Projet',6,'2026-02-27 20:41:08','2026-02-27 20:45:33'),(20,'project_address','ZI Rouiba Alger','text','project','Adresse du Projet',7,'2026-02-27 20:41:08','2026-02-27 20:45:33');
/*!40000 ALTER TABLE `project_settings` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `qualifications`
--

LOCK TABLES `qualifications` WRITE;
/*!40000 ALTER TABLE `qualifications` DISABLE KEYS */;
INSERT INTO `qualifications` VALUES (1,'Soudeur',1,'2026-02-27 12:13:34'),(2,'Formeur',1,'2026-02-27 12:13:34'),(3,'Op├®rateur',1,'2026-02-27 12:13:34'),(4,'Man┼ôuvre',1,'2026-02-27 12:13:34'),(5,'Conducteur Machine',1,'2026-02-27 12:13:34'),(6,'Conducteur Grenailleuse Ext├®rieur',1,'2026-02-27 12:13:34'),(7,'Op├®rateur sur MAS NLAT',1,'2026-02-27 12:13:34'),(8,'CND UT Specialist',1,'2026-02-27 12:13:34'),(9,'Soudeur Homologu├® Tuberie',1,'2026-02-27 12:13:34'),(10,'Op├®rateur Machine NLAT',1,'2026-02-27 12:13:34'),(11,'Conducteur Brosse',1,'2026-02-27 12:13:34'),(12,'Contrema├«tre Principal (Parach├¿vement)',1,'2026-02-27 12:13:34'),(13,'Ouvrier',1,'2026-02-27 12:13:34');
/*!40000 ALTER TABLE `qualifications` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `reparation_defauts`
--

LOCK TABLES `reparation_defauts` WRITE;
/*!40000 ALTER TABLE `reparation_defauts` DISABLE KEYS */;
/*!40000 ALTER TABLE `reparation_defauts` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `responsabilites`
--

LOCK TABLES `responsabilites` WRITE;
/*!40000 ALTER TABLE `responsabilites` DISABLE KEYS */;
INSERT INTO `responsabilites` VALUES (1,'Op├®rateur Altumet',NULL,0,1,'2026-02-27 16:29:10','2026-02-27 21:51:51'),(2,'Machine',NULL,0,2,'2026-02-27 16:29:10','2026-02-27 21:51:52'),(3,'Mat├®riau / Mati├¿re premi├¿re',NULL,0,3,'2026-02-27 16:29:10','2026-02-27 21:51:54'),(4,'M├®thode / Proc├®dure',NULL,0,4,'2026-02-27 16:29:10','2026-02-27 21:51:55'),(5,'Environnement',NULL,0,5,'2026-02-27 16:29:10','2026-02-27 21:51:56'),(6,'Maintenance',NULL,0,6,'2026-02-27 16:29:10','2026-02-27 21:51:57'),(7,'Qualit├®',NULL,0,7,'2026-02-27 16:29:10','2026-02-27 21:51:58'),(8,'Sous-traitant',NULL,0,8,'2026-02-27 16:29:10','2026-02-27 21:52:00'),(9,'ALTUMET','Client',1,9,'2026-02-27 21:51:41','2026-02-27 21:51:41'),(10,'DANIELI','DAN Germany',1,10,'2026-02-27 21:52:26','2026-02-27 21:52:26'),(11,'Uhrhan & Schwill','Welding Equip Supplier',1,11,'2026-02-27 21:54:25','2026-02-27 21:54:25');
/*!40000 ALTER TABLE `responsabilites` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tube_etape_historique`
--

LOCK TABLES `tube_etape_historique` WRITE;
/*!40000 ALTER TABLE `tube_etape_historique` DISABLE KEYS */;
INSERT INTO `tube_etape_historique` VALUES (6,4,1,'FORMAGE','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:14:20'),(7,4,2,'POINTAGE','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:14:23'),(8,4,3,'CV_POINTAGE','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:32:47'),(9,4,4,'SAW_ID_OD','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:32:49'),(10,4,5,'CV_CORDON','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:33:17'),(11,4,6,'MACRO','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:33:19'),(12,4,7,'CHANFREIN','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:33:22'),(13,4,8,'HYDROTEST','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:33:24'),(14,4,9,'CV_FUITE','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:33:25'),(15,4,10,'UT','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:33:27'),(16,4,11,'RADIO_SCOPIE','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:33:29'),(17,4,12,'CONTROLE_DIM','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:33:32'),(18,5,1,'FORMAGE','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 19:07:09'),(19,5,2,'POINTAGE','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 19:07:11'),(20,5,3,'CV_POINTAGE','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 19:35:07'),(21,5,4,'SAW_ID_OD','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 20:03:27'),(22,5,4,'SAW_ID_OD','annulation','Annulation validation par Admin Syst├¿me',1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 20:11:51'),(23,5,3,'CV_POINTAGE','annulation','Annulation validation par Admin Syst├¿me',1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-27 20:12:00'),(24,5,3,'CV_POINTAGE','validation',NULL,1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-28 08:16:53'),(25,5,4,'SAW_ID_OD','nc','sss',1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-28 08:17:45'),(26,5,4,'SAW_ID_OD','reprise','Reprise apr├¿s NC',1,'Admin','Syst├¿me',NULL,NULL,NULL,NULL,NULL,'2026-02-28 08:19:20');
/*!40000 ALTER TABLE `tube_etape_historique` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tube_etape_photos`
--

LOCK TABLES `tube_etape_photos` WRITE;
/*!40000 ALTER TABLE `tube_etape_photos` DISABLE KEYS */;
INSERT INTO `tube_etape_photos` VALUES (1,5,3,'tube-5-etape-3-1772266613754-135489243.jpg','Bobine501.jpg','image/jpeg',381995,'/uploads/tubes/tube-5-etape-3-1772266613754-135489243.jpg',NULL,1,'2026-02-28 08:16:53'),(2,5,4,'tube-5-etape-4-1772266665733-383658926.jpg','Bobine501.jpg','image/jpeg',381995,'/uploads/tubes/tube-5-etape-4-1772266665733-383658926.jpg',NULL,1,'2026-02-28 08:17:45');
/*!40000 ALTER TABLE `tube_etape_photos` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tube_etapes`
--

LOCK TABLES `tube_etapes` WRITE;
/*!40000 ALTER TABLE `tube_etapes` DISABLE KEYS */;
INSERT INTO `tube_etapes` VALUES (37,4,1,'FORMAGE','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:12:44','2026-02-27 19:14:20',0,'2026-02-27 18:12:44','2026-02-27 18:14:20'),(38,4,2,'POINTAGE','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:14:20','2026-02-27 19:14:23',0,'2026-02-27 18:12:44','2026-02-27 18:14:23'),(39,4,3,'CV_POINTAGE','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:14:23','2026-02-27 19:32:47',0,'2026-02-27 18:12:44','2026-02-27 18:32:47'),(40,4,4,'SAW_ID_OD','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:32:47','2026-02-27 19:32:49',1,'2026-02-27 18:12:44','2026-02-27 18:32:49'),(41,4,5,'CV_CORDON','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:32:49','2026-02-27 19:33:17',0,'2026-02-27 18:12:44','2026-02-27 18:33:17'),(42,4,6,'MACRO','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:33:17','2026-02-27 19:33:19',0,'2026-02-27 18:12:44','2026-02-27 18:33:19'),(43,4,7,'CHANFREIN','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:33:19','2026-02-27 19:33:22',0,'2026-02-27 18:12:44','2026-02-27 18:33:22'),(44,4,8,'HYDROTEST','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:33:22','2026-02-27 19:33:24',0,'2026-02-27 18:12:44','2026-02-27 18:33:24'),(45,4,9,'CV_FUITE','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:33:24','2026-02-27 19:33:25',0,'2026-02-27 18:12:44','2026-02-27 18:33:25'),(46,4,10,'UT','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:33:25','2026-02-27 19:33:27',0,'2026-02-27 18:12:44','2026-02-27 18:33:27'),(47,4,11,'RADIO_SCOPIE','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:33:27','2026-02-27 19:33:29',0,'2026-02-27 18:12:44','2026-02-27 18:33:29'),(48,4,12,'CONTROLE_DIM','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:33:29','2026-02-27 19:33:32',0,'2026-02-27 18:12:44','2026-02-27 18:33:32'),(49,5,1,'FORMAGE','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 19:15:44','2026-02-27 20:07:09',0,'2026-02-27 18:15:44','2026-02-27 19:07:09'),(50,5,2,'POINTAGE','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 20:07:09','2026-02-27 20:07:11',0,'2026-02-27 18:15:44','2026-02-27 19:07:11'),(51,5,3,'CV_POINTAGE','valide',1,'Admin','Syst├¿me',NULL,'2026-02-27 20:07:11','2026-02-28 09:16:53',0,'2026-02-27 18:15:44','2026-02-28 08:16:53'),(52,5,4,'SAW_ID_OD','en_cours',1,'Admin','Syst├¿me','sss | REPRISE: Reprise apr├¿s NC','2026-02-28 09:16:53',NULL,1,'2026-02-27 18:15:44','2026-02-28 08:19:20'),(53,5,5,'CV_CORDON','en_attente',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-27 18:15:44','2026-02-27 20:11:51'),(54,5,6,'MACRO','en_attente',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-27 18:15:44','2026-02-27 18:15:44'),(55,5,7,'CHANFREIN','en_attente',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-27 18:15:44','2026-02-27 18:15:44'),(56,5,8,'HYDROTEST','en_attente',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-27 18:15:44','2026-02-27 18:15:44'),(57,5,9,'CV_FUITE','en_attente',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-27 18:15:44','2026-02-27 18:15:44'),(58,5,10,'UT','en_attente',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-27 18:15:44','2026-02-27 18:15:44'),(59,5,11,'RADIO_SCOPIE','en_attente',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-27 18:15:44','2026-02-27 18:15:44'),(60,5,12,'CONTROLE_DIM','en_attente',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-27 18:15:44','2026-02-27 18:15:44');
/*!40000 ALTER TABLE `tube_etapes` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tubes`
--

LOCK TABLES `tubes` WRITE;
/*!40000 ALTER TABLE `tubes` DISABLE KEYS */;
INSERT INTO `tubes` VALUES (4,6,NULL,'1','normal',914.40,'36\"',12.00,12.000,NULL,12,'termine',1,'Admin','Syst├¿me',1,'certifie_api','2026-02-27 19:47:15','Syst├¿me Admin',NULL,'2026-02-27 19:41:45','2026-02-27 19:47:15','2026-02-27 19:33:32','2026-02-27 19:32:49',NULL,'2026-02-27 18:12:44','2026-02-27 18:47:15'),(5,6,7,'2','cross_welding',914.40,'36\"',12.00,12.000,NULL,4,'en_production',1,'Admin','Syst├¿me',1,'en_attente',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-27 18:15:44','2026-02-28 08:19:20');
/*!40000 ALTER TABLE `tubes` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'864268','LT2-2026-0001','Admin','Syst├¿me','danieli','system_admin',1,'2026-02-28 11:27:18','2026-02-27 09:00:10','2026-02-28 11:27:18');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `zones_travail`
--

LOCK TABLES `zones_travail` WRITE;
/*!40000 ALTER TABLE `zones_travail` DISABLE KEYS */;
INSERT INTO `zones_travail` VALUES (1,'Zone 1','Zone Machine','blue',1,'2026-02-27 12:17:15'),(2,'Zone 5 - 1','Zone soudure 1','rose',1,'2026-02-27 14:03:02'),(3,'Zone 5 - 2','Zone soudure 2','orange',1,'2026-02-27 14:31:55');
/*!40000 ALTER TABLE `zones_travail` ENABLE KEYS */;
UNLOCK TABLES;

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

-- Dump completed on 2026-02-28 11:54:49
