# ApiTrack Mobile — Android App

Application Android native qui charge ApiTrack en WebView plein écran, avec découverte automatique du serveur via mDNS, support caméra/upload photos, téléchargement de rapports PDF/Excel, et mises à jour automatiques.

## Fonctionnalités

- 🏭 **WebView plein écran** — Interface ApiTrack sans barre de navigateur
- 📸 **Caméra & Upload photos** — Prise de photo directe pour les étapes tube
- 📥 **Téléchargement rapports** — PDF et Excel via DownloadManager natif
- 📡 **mDNS auto-discovery** — Trouve automatiquement le serveur sur le réseau local
- ⚙️ **Config manuelle** — Saisie IP/port (défaut 3003) en secours
- 🔔 **Notifications temps réel** — Via WebSocket (Socket.io dans l'app web)
- 🎨 **Splash screen V2.9** — Logo ApiTrack animé avec badge V2.9
- 📱 **Icône adaptative** — Logo ApiTrack sur fond bleu
- 🔒 **Réseau local uniquement** — Config réseau sécurisée pour LAN
- 🔄 **Swipe-to-refresh** — Pull-to-refresh intelligent
- 🌐 **Page d'erreur avancée** — Diagnostic réseau avec retry automatique
- 📲 **JS Bridge** — Communication bidirectionnelle Android ↔ Frontend
- 🔋 **Mode industriel** — Écran toujours allumé, mode immersif
- 🆕 **Mises à jour OTA** — Vérification automatique des nouvelles versions

## Modules supportés

L'app mobile donne accès à tous les modules ApiTrack :

| Module | Description |
|--------|-------------|
| **Dashboard** | Vue d'ensemble production en temps réel |
| **Tubes** | Pipeline 12 étapes API 5L avec photos |
| **Bobines de Production** | Gestion des lots et bobines |
| **Bobines en Stock** | Inventaire bobines |
| **Grades** | Gestion des grades acier |
| **Presets Soudure** | Paramètres de soudage (ID/OD heads) |
| **Équipes** | Gestion équipes production |
| **Rapports** | Export PDF tube + Excel situation |
| **Utilisateurs** | Gestion des accès |
| **Paramètres** | Logos, infos client/projet |

## Prérequis pour compiler

1. **Android Studio** (Hedgehog 2023.1.1 ou plus récent)
2. **JDK 17** (inclus dans Android Studio)
3. **Android SDK 34** (API 34)

## Comment compiler l'APK

### Via Android Studio (recommandé)

1. Ouvrir Android Studio
2. **File** → **Open** → Sélectionner le dossier `logitrack-mobile_v2/`
3. Attendre la synchronisation Gradle
4. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
5. L'APK sera dans `app/build/outputs/apk/debug/app-debug.apk`

### Via ligne de commande

```bash
cd logitrack-mobile_v2
./gradlew assembleDebug
```

### APK Release (signée)

```bash
# Créer un keystore (une seule fois)
keytool -genkey -v -keystore apitrack.keystore -alias apitrack -keyalg RSA -keysize 2048 -validity 10000

# Compiler en release
./gradlew assembleRelease
```

## Installation sur un appareil Android

### Via USB
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Via partage fichier
1. Copier l'APK sur le téléphone (USB, partage réseau, etc.)
2. Ouvrir le fichier APK sur le téléphone
3. Autoriser l'installation depuis cette source si demandé
4. Installer

## Configuration réseau

### Côté serveur (backend)
Le serveur ApiTrack écoute sur le port **3003** par défaut.
L'IP du serveur est affichée dans la console au démarrage.

### Côté Android
L'app utilise `NsdManager` (Network Service Discovery, natif Android) pour détecter le service `_logitrack._tcp` ou `_apitrack._tcp` sur le réseau local.

### Si mDNS ne fonctionne pas
1. L'utilisateur peut saisir manuellement l'IP du serveur
2. L'IP est affichée dans la console de démarrage du backend
3. Le port par défaut est **3003**

## Nouveautés V2.9

- **Renommage ApiTrack** — Nouveau nom et branding officiel
- **Nouvelle icône** — Logo ApiTrack moderne
- **Package renommé** — `com.deltatx.apitrack` (package officiel)
- **Mises à jour OTA** — Vérification automatique des nouvelles versions au démarrage
- **Version V2.9.0** — Synchronisée avec le backend/frontend

## Fonctionnalités héritées V2.1

- **Upload photos** — `onShowFileChooser` avec chooser combiné (caméra + galerie)
- **FileProvider** — Pour partage URI sécurisé des photos capturées
- **Téléchargement PDF/Excel** — Via `DownloadManager` avec token JWT
- **CORS mobile** — Backend accepte les origines réseau local
- **JS Bridge enrichi** — `vibrate()`, `showToast()`, `getAppVersion()`, `isConnected()`
- **Swipe-to-refresh intelligent** — Désactivé quand la page est scrollée
- **Diagnostic réseau avancé** — Test serveur en arrière-plan sur la page d'erreur
- **CSS mobile optimisé** — Touch targets, smooth scrolling, inputs sélectionnables

## Architecture

```
logitrack-mobile_v2/
├── app/
│   ├── build.gradle                    # Dépendances & config (v2.9.0)
│   ├── src/main/
│   │   ├── AndroidManifest.xml         # Permissions, FileProvider, activités
│   │   ├── assets/
│   │   │   └── error.html              # Page d'erreur offline animée
│   │   ├── java/com/deltatx/apitrack/
│   │   │   ├── SplashActivity.java     # Écran d'accueil animé V2.9
│   │   │   ├── ConfigActivity.java     # Config serveur (auto + manuelle)
│   │   │   ├── MainActivity.java       # WebView + camera + downloads
│   │   │   ├── NsdHelper.java          # Découverte mDNS
│   │   │   └── UpdateChecker.java      # Vérification mises à jour OTA
│   │   └── res/
│   │       ├── layout/                 # Layouts XML (splash, config, main)
│   │       ├── drawable/               # Icônes, boutons, fonds, logo ApiTrack
│   │       ├── mipmap-anydpi-v26/      # Icône adaptative ApiTrack
│   │       ├── values/                 # Couleurs, strings, thèmes
│   │       └── xml/
│   │           ├── file_paths.xml      # FileProvider paths (caméra)
│   │           └── network_security_config.xml
├── build.gradle                        # Config Gradle racine
├── settings.gradle                     # Modules
└── README.md                           # Ce fichier
```

## Mises à jour OTA (Over-The-Air)

L'application vérifie automatiquement les mises à jour au démarrage via l'endpoint `/api/settings/mobile/version`.

### Configuration côté serveur

Ajouter les paramètres dans `project_settings` :

| Clé | Description |
|-----|-------------|
| `mobile_version_code` | Numéro de version (ex: 4) |
| `mobile_version_name` | Nom de version (ex: "2.9.0") |
| `mobile_download_url` | URL de téléchargement de l'APK |
| `mobile_release_notes` | Notes de version |
| `mobile_mandatory_update` | "true" pour forcer la mise à jour |

### Note importante

Étant donné que l'application est un wrapper WebView, les mises à jour de l'interface utilisateur sont automatiques (via le frontend web). Seules les modifications du code natif Android nécessitent une mise à jour de l'APK.

## Compatibilité

- **Android minimum** : API 24 (Android 7.0 Nougat)
- **Android cible** : API 34 (Android 14)
- **Testé sur** : Tablettes et smartphones Android
- **Backend requis** : ApiTrack sur port 3003
- **iOS** : Non supporté nativement (utiliser l'application web en PWA)

## Notes iOS

Pour les utilisateurs iOS, l'application web ApiTrack est accessible via le navigateur Safari en mode plein écran (PWA). Pour ajouter l'app à l'écran d'accueil :
1. Ouvrir ApiTrack dans Safari
2. Appuyer sur le bouton "Partager"
3. Sélectionner "Sur l'écran d'accueil"

## Auteur

DeLTa-X Tunisia — Azizi Mounir
