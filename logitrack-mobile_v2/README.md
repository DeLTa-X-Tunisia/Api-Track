# Logi-Track V2 Mobile — Android App

Application Android native qui charge Logi-Track V2 en WebView plein écran, avec découverte automatique du serveur via mDNS, support caméra/upload photos, et téléchargement de rapports PDF/Excel.

## Fonctionnalités

- 🏭 **WebView plein écran** — Interface Logi-Track V2 sans barre de navigateur
- 📸 **Caméra & Upload photos** — Prise de photo directe pour les étapes tube
- 📥 **Téléchargement rapports** — PDF et Excel via DownloadManager natif
- 📡 **mDNS auto-discovery** — Trouve automatiquement le serveur sur le réseau local
- ⚙️ **Config manuelle** — Saisie IP/port (défaut 3003) en secours
- 🔔 **Notifications temps réel** — Via WebSocket (Socket.io dans l'app web)
- 🎨 **Splash screen V2** — Logo Logi-Track animé avec badge V2
- 📱 **Icône adaptative** — Logo usine/tube sur fond bleu
- 🔒 **Réseau local uniquement** — Config réseau sécurisée pour LAN
- 🔄 **Swipe-to-refresh** — Pull-to-refresh intelligent
- 🌐 **Page d'erreur avancée** — Diagnostic réseau avec retry automatique
- 📲 **JS Bridge** — Communication bidirectionnelle Android ↔ Frontend
- 🔋 **Mode industriel** — Écran toujours allumé, mode immersif

## Modules supportés

L'app mobile donne accès à tous les modules Logi-Track V2 :

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
keytool -genkey -v -keystore logitrack.keystore -alias logitrack -keyalg RSA -keysize 2048 -validity 10000

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
Le serveur Logi-Track V2 écoute sur le port **3003** par défaut.
L'IP du serveur est affichée dans la console au démarrage.

### Côté Android
L'app utilise `NsdManager` (Network Service Discovery, natif Android) pour détecter le service `_logitrack._tcp` sur le réseau local.

### Si mDNS ne fonctionne pas
1. L'utilisateur peut saisir manuellement l'IP du serveur
2. L'IP est affichée dans la console de démarrage du backend
3. Le port par défaut est **3003**

## Nouveautés V2.1

- **Upload photos** — `onShowFileChooser` avec chooser combiné (caméra + galerie)
- **FileProvider** — Pour partage URI sécurisé des photos capturées
- **Téléchargement PDF/Excel** — Via `DownloadManager` avec token JWT
- **CORS mobile** — Backend accepte les origines réseau local
- **JS Bridge enrichi** — `vibrate()`, `showToast()`, `getAppVersion()`, `isConnected()`
- **Swipe-to-refresh intelligent** — Désactivé quand la page est scrollée
- **Diagnostic réseau avancé** — Test serveur en arrière-plan sur la page d'erreur
- **CSS mobile optimisé** — Touch targets, smooth scrolling, inputs sélectionnables
- **Port mis à jour** — 3002 → 3003 (cohérent avec V2 backend)

## Architecture

```
logitrack-mobile_v2/
├── app/
│   ├── build.gradle                    # Dépendances & config (v2.1.0)
│   ├── src/main/
│   │   ├── AndroidManifest.xml         # Permissions, FileProvider, activités
│   │   ├── assets/
│   │   │   └── error.html              # Page d'erreur offline animée
│   │   ├── java/.../
│   │   │   ├── SplashActivity.java     # Écran d'accueil animé V2
│   │   │   ├── ConfigActivity.java     # Config serveur (auto + manuelle)
│   │   │   ├── MainActivity.java       # WebView + camera + downloads
│   │   │   └── NsdHelper.java          # Découverte mDNS
│   │   └── res/
│   │       ├── layout/                 # Layouts XML (splash, config, main)
│   │       ├── drawable/               # Icônes, boutons, fonds
│   │       ├── mipmap-anydpi-v26/      # Icône adaptative
│   │       ├── values/                 # Couleurs, strings, thèmes
│   │       └── xml/
│   │           ├── file_paths.xml      # FileProvider paths (caméra)
│   │           └── network_security_config.xml
├── build.gradle                        # Config Gradle racine
├── settings.gradle                     # Modules
└── README.md                           # Ce fichier
```

## Compatibilité

- **Android minimum** : API 24 (Android 7.0 Nougat)
- **Android cible** : API 34 (Android 14)
- **Testé sur** : Tablettes et smartphones Android
- **Backend requis** : Logi-Track V2 sur port 3003

## Auteur

DeLTa-X Tunisia — Azizi Mounir
