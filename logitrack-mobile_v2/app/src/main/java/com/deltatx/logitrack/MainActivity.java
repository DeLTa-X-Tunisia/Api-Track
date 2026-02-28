package com.deltatx.logitrack;

import android.Manifest;
import android.app.DownloadManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * MainActivity — Affiche Logi-Track V2 en WebView plein écran
 *
 * Fonctionnalités V2 :
 * - File upload & Camera support pour photos étapes tube
 * - Téléchargement PDF/Excel des rapports
 * - Injection CSS mobile optimisée
 * - Mode immersif industriel (écran toujours allumé)
 * - JS bridge pour error page ↔ Android
 * - Gestion connectivité, retry auto, reconfiguration
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "LogiTrack";
    private static final int CAMERA_PERMISSION_REQUEST = 100;

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar loadingBar;

    private String serverUrl;
    private boolean isPageLoaded = false;
    private boolean isShowingError = false;
    private String lastErrorMessage = "";
    private NsdHelper nsdHelper;
    private Handler retryHandler;

    // File upload support
    private ValueCallback<Uri[]> fileUploadCallback;
    private Uri cameraPhotoUri;

    // Activity result launcher for file chooser (gallery + camera combined)
    private final ActivityResultLauncher<Intent> fileChooserLauncher = registerForActivityResult(
        new ActivityResultContracts.StartActivityForResult(),
        result -> {
            if (fileUploadCallback == null) return;

            Uri[] results = null;
            if (result.getResultCode() == RESULT_OK) {
                if (result.getData() != null && result.getData().getData() != null) {
                    // File chosen from gallery/file manager
                    results = new Uri[]{result.getData().getData()};
                } else if (cameraPhotoUri != null) {
                    // Photo taken with camera
                    results = new Uri[]{cameraPhotoUri};
                }
            }

            fileUploadCallback.onReceiveValue(results);
            fileUploadCallback = null;
        }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Plein écran immersif
        enableImmersiveMode();

        // Garder l'écran allumé (usage industriel)
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        retryHandler = new Handler(Looper.getMainLooper());

        initViews();
        setupWebView();

        // Charger l'URL du serveur
        SharedPreferences prefs = getSharedPreferences("logitrack_config", MODE_PRIVATE);
        serverUrl = prefs.getString("server_url", null);

        if (serverUrl == null || serverUrl.isEmpty()) {
            goToConfig();
            return;
        }

        loadApp();

        // Swipe-to-refresh
        swipeRefresh.setOnRefreshListener(() -> {
            if (isShowingError) {
                loadApp();
            } else {
                webView.reload();
            }
        });
    }

    private void initViews() {
        webView = findViewById(R.id.webview);
        swipeRefresh = findViewById(R.id.swipe_refresh);
        loadingBar = findViewById(R.id.loading_bar);

        swipeRefresh.setColorSchemeColors(
            getResources().getColor(R.color.primary_500, getTheme()),
            getResources().getColor(R.color.primary_700, getTheme())
        );

        // Désactiver le swipe-to-refresh quand on scrolle dans la page
        swipeRefresh.setOnChildScrollUpCallback((parent, child) -> {
            if (webView != null) {
                return webView.getScrollY() > 0;
            }
            return false;
        });
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // Activer JavaScript (obligatoire pour React)
        settings.setJavaScriptEnabled(true);

        // Stockage local (localStorage, sessionStorage)
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // Cache
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(true);

        // Responsive
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // Zoom
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(true);

        // Performance
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);

        // Autoriser le contenu mixte (HTTP local)
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Autoriser l'accès aux fichiers
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);

        // Media
        settings.setMediaPlaybackRequiresUserGesture(false);

        // User-Agent personnalisé pour détecter l'app Android côté frontend
        String ua = settings.getUserAgentString();
        settings.setUserAgentString(ua + " LogiTrack-Android/2.1.0");

        // Cookies
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // JavaScript bridge pour communication error page ↔ Android
        webView.addJavascriptInterface(new LogiTrackBridge(), "LogiTrackBridge");

        // WebViewClient pour gérer la navigation
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (!url.startsWith("file:///android_asset/")) {
                    loadingBar.setVisibility(View.VISIBLE);
                }
                isPageLoaded = false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                loadingBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);

                if (url.startsWith("file:///android_asset/error.html")) {
                    isShowingError = true;
                    updateErrorPageChecks();
                } else {
                    isShowingError = false;
                    isPageLoaded = true;
                    injectMobileOptimizations();
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    lastErrorMessage = error.getDescription().toString();
                    Log.w(TAG, "WebView error: " + lastErrorMessage);
                    showCustomErrorPage(lastErrorMessage);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // Garder les URLs de l'app dans le WebView
                if (serverUrl != null && url.startsWith(serverUrl)) {
                    return false;
                }
                if (url.startsWith("file:///")) {
                    return false;
                }

                // Ouvrir les liens externes dans le navigateur système
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                } catch (Exception e) {
                    Log.w(TAG, "Cannot open external URL: " + url);
                }
                return true;
            }
        });

        // WebChromeClient pour dialogues JS, console, et FILE UPLOAD
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                try {
                    new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Logi-Track")
                        .setMessage(message)
                        .setPositiveButton("OK", (dialog, which) -> result.confirm())
                        .setCancelable(false)
                        .show();
                } catch (Exception e) {
                    result.confirm();
                }
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                try {
                    new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Logi-Track")
                        .setMessage(message)
                        .setPositiveButton("Oui", (dialog, which) -> result.confirm())
                        .setNegativeButton("Non", (dialog, which) -> result.cancel())
                        .setCancelable(false)
                        .show();
                } catch (Exception e) {
                    result.cancel();
                }
                return true;
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d(TAG, "[WebView] " + consoleMessage.message() +
                    " (ligne " + consoleMessage.lineNumber() + ")");
                return true;
            }

            /**
             * File chooser pour upload de photos (étapes tube, etc.)
             * Propose: Appareil photo OU Galerie/Fichiers
             */
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                // Annuler le callback précédent si existant
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                // Vérifier la permission caméra
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                        != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST);
                    return true;
                }

                launchFileChooser();
                return true;
            }
        });

        // Gestionnaire de téléchargement pour PDF et Excel
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            Log.d(TAG, "Download requested: " + url + " mime=" + mimeType);
            downloadFile(url, userAgent, contentDisposition, mimeType);
        });
    }

    /**
     * Lance le sélecteur de fichier avec option caméra
     */
    private void launchFileChooser() {
        try {
            // Intent pour prendre une photo avec la caméra
            Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            cameraPhotoUri = null;

            if (cameraIntent.resolveActivity(getPackageManager()) != null) {
                File photoFile = createImageFile();
                if (photoFile != null) {
                    cameraPhotoUri = FileProvider.getUriForFile(this,
                        getPackageName() + ".fileprovider", photoFile);
                    cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri);
                }
            }

            // Intent pour choisir un fichier (galerie, fichiers…)
            Intent fileIntent = new Intent(Intent.ACTION_GET_CONTENT);
            fileIntent.addCategory(Intent.CATEGORY_OPENABLE);
            fileIntent.setType("image/*");

            // Combiner les deux intents dans un chooser
            Intent chooserIntent = Intent.createChooser(fileIntent, "Ajouter une photo");
            if (cameraPhotoUri != null) {
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cameraIntent});
            }

            fileChooserLauncher.launch(chooserIntent);

        } catch (Exception e) {
            Log.e(TAG, "Error launching file chooser", e);
            if (fileUploadCallback != null) {
                fileUploadCallback.onReceiveValue(null);
                fileUploadCallback = null;
            }
        }
    }

    /**
     * Lance le sélecteur de fichier sans l'option caméra (fallback)
     */
    private void launchFileChooserWithoutCamera() {
        try {
            Intent fileIntent = new Intent(Intent.ACTION_GET_CONTENT);
            fileIntent.addCategory(Intent.CATEGORY_OPENABLE);
            fileIntent.setType("image/*");
            fileChooserLauncher.launch(Intent.createChooser(fileIntent, "Choisir une photo"));
        } catch (Exception e) {
            Log.e(TAG, "Error launching file chooser without camera", e);
            if (fileUploadCallback != null) {
                fileUploadCallback.onReceiveValue(null);
                fileUploadCallback = null;
            }
        }
    }

    /**
     * Crée un fichier image temporaire pour la capture caméra
     */
    private File createImageFile() {
        try {
            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
            String imageFileName = "LOGITRACK_" + timeStamp + "_";
            File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
            return File.createTempFile(imageFileName, ".jpg", storageDir);
        } catch (IOException e) {
            Log.e(TAG, "Error creating image file", e);
            return null;
        }
    }

    /**
     * Télécharge un fichier (PDF, Excel) via DownloadManager
     */
    private void downloadFile(String url, String userAgent, String contentDisposition, String mimeType) {
        try {
            String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
            if (fileName == null || fileName.isEmpty()) {
                fileName = "logitrack_report";
                if ("application/pdf".equals(mimeType)) fileName += ".pdf";
                else if (mimeType != null && mimeType.contains("spreadsheet")) fileName += ".xlsx";
            }

            final String finalFileName = fileName;
            final String finalMimeType = mimeType;

            // Pour les URLs de l'API qui nécessitent le token JWT
            if (url.contains("/api/")) {
                webView.evaluateJavascript(
                    "(function() { return localStorage.getItem('logitrack2_token'); })()",
                    token -> {
                        String cleanToken = token != null ? token.replace("\"", "").trim() : "";
                        if ("null".equals(cleanToken)) cleanToken = "";
                        startDownload(url, userAgent, finalFileName, finalMimeType, cleanToken);
                    }
                );
            } else {
                startDownload(url, userAgent, finalFileName, finalMimeType, null);
            }
        } catch (Exception e) {
            Log.e(TAG, "Download error", e);
            Toast.makeText(this, "Erreur de téléchargement: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    /**
     * Lance le téléchargement effectif via DownloadManager
     */
    private void startDownload(String url, String userAgent, String fileName, String mimeType, String token) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setMimeType(mimeType);

            if (token != null && !token.isEmpty()) {
                request.addRequestHeader("Authorization", "Bearer " + token);
            }

            request.addRequestHeader("User-Agent", userAgent);
            request.setTitle(fileName);
            request.setDescription("Téléchargement Logi-Track V2");
            request.allowScanningByMediaScanner();
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
                Toast.makeText(this, "📥 " + fileName, Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Log.e(TAG, "DownloadManager error", e);
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(browserIntent);
            } catch (Exception ex) {
                Toast.makeText(this, "Erreur de téléchargement", Toast.LENGTH_LONG).show();
            }
        }
    }

    /**
     * JavaScript bridge — pour la page d'erreur et le frontend
     */
    private class LogiTrackBridge {
        @JavascriptInterface
        public void retry() {
            retryHandler.post(() -> loadApp());
        }

        @JavascriptInterface
        public void reconfigure() {
            retryHandler.post(() -> {
                SharedPreferences prefs = getSharedPreferences("logitrack_config", MODE_PRIVATE);
                prefs.edit().remove("server_url").apply();
                goToConfig();
            });
        }

        @JavascriptInterface
        public String getServerUrl() {
            return serverUrl != null ? serverUrl : "";
        }

        @JavascriptInterface
        public String getAppVersion() {
            return "2.1.0";
        }

        @JavascriptInterface
        public boolean isConnected() {
            return isNetworkAvailable();
        }

        @JavascriptInterface
        public void showToast(String message) {
            retryHandler.post(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void vibrate() {
            retryHandler.post(() -> {
                try {
                    android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE);
                    if (v != null && v.hasVibrator()) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            v.vibrate(android.os.VibrationEffect.createOneShot(50,
                                android.os.VibrationEffect.DEFAULT_AMPLITUDE));
                        }
                    }
                } catch (Exception ignored) {}
            });
        }
    }

    /**
     * Affiche la page d'erreur personnalisée dans le WebView
     */
    private void showCustomErrorPage(String errorMessage) {
        isShowingError = true;
        loadingBar.setVisibility(View.GONE);
        swipeRefresh.setRefreshing(false);

        webView.stopLoading();
        webView.loadUrl("file:///android_asset/error.html");

        retryHandler.postDelayed(this::updateErrorPageChecks, 800);
    }

    /**
     * Met à jour les indicateurs de la page d'erreur
     */
    private void updateErrorPageChecks() {
        boolean hasWifi = isNetworkAvailable();
        String wifiStatus = hasWifi ? "ok" : "fail";

        String safeUrl = serverUrl != null ? serverUrl.replace("'", "\\'") : "";
        String safeError = lastErrorMessage != null ? lastErrorMessage.replace("'", "\\'") : "";

        String js = String.format(
            "if(typeof setCheckStatus==='function'){" +
            "setCheckStatus('check-wifi','%s');" +
            "setCheckStatus('check-server','fail');" +
            "setCheckStatus('check-network','%s');" +
            "setErrorInfo('%s','%s');" +
            "}", wifiStatus, hasWifi ? "pending" : "fail", safeError, safeUrl
        );
        webView.evaluateJavascript(js, null);

        // Tester la connectivité serveur en arrière-plan
        if (hasWifi && serverUrl != null) {
            new Thread(() -> {
                try {
                    java.net.URL url = new java.net.URL(serverUrl + "/api/health");
                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(3000);
                    conn.setReadTimeout(3000);
                    int code = conn.getResponseCode();
                    conn.disconnect();

                    final String status = code == 200 ? "ok" : "fail";
                    runOnUiThread(() -> webView.evaluateJavascript(
                        "if(typeof setCheckStatus==='function'){" +
                        "setCheckStatus('check-server','" + status + "');" +
                        "setCheckStatus('check-network','" + status + "');" +
                        "}", null));
                } catch (Exception e) {
                    runOnUiThread(() -> webView.evaluateJavascript(
                        "if(typeof setCheckStatus==='function'){" +
                        "setCheckStatus('check-server','fail');" +
                        "setCheckStatus('check-network','fail');" +
                        "}", null));
                }
            }).start();
        }
    }

    /**
     * Injecte des optimisations CSS/JS pour l'affichage mobile
     */
    private void injectMobileOptimizations() {
        String css =
            "body { " +
            "  -webkit-touch-callout: none; " +
            "  -webkit-user-select: none; " +
            "  user-select: none; " +
            "  overscroll-behavior: none; " +
            "  -webkit-overflow-scrolling: touch; " +
            "} " +
            "input, textarea, select, [contenteditable] { " +
            "  -webkit-user-select: text !important; " +
            "  user-select: text !important; " +
            "} " +
            ".overflow-y-auto, .overflow-auto { " +
            "  -webkit-overflow-scrolling: touch; " +
            "} " +
            "::-webkit-scrollbar { width: 4px; height: 4px; } " +
            "::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; } ";

        String js =
            "(function() { " +
            "  if (document.getElementById('logitrack-mobile-css')) return; " +
            "  var style = document.createElement('style'); " +
            "  style.id = 'logitrack-mobile-css'; " +
            "  style.innerHTML = '" + css.replace("'", "\\'").replace("\n", " ") + "'; " +
            "  document.head.appendChild(style); " +
            "  window.__LOGITRACK_MOBILE__ = true; " +
            "  window.__LOGITRACK_VERSION__ = '2.1.0'; " +
            "})()";

        webView.evaluateJavascript(js, null);
    }

    private void loadApp() {
        if (serverUrl != null) {
            isShowingError = false;
            loadingBar.setVisibility(View.VISIBLE);

            if (!isNetworkAvailable()) {
                showCustomErrorPage(getString(R.string.no_network));
                return;
            }

            webView.loadUrl(serverUrl);
        }
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (cm == null) return false;

        Network network = cm.getActiveNetwork();
        if (network == null) return false;

        NetworkCapabilities caps = cm.getNetworkCapabilities(network);
        return caps != null && (
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        );
    }

    private void goToConfig() {
        Intent intent = new Intent(this, ConfigActivity.class);
        startActivity(intent);
        finish();
    }

    private void enableImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enableImmersiveMode();
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            new AlertDialog.Builder(this)
                .setTitle(R.string.quit_title)
                .setMessage(R.string.quit_message)
                .setPositiveButton("Oui", (dialog, which) -> finish())
                .setNegativeButton("Non", null)
                .show();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                launchFileChooser();
            } else {
                launchFileChooserWithoutCamera();
                Toast.makeText(this, "Permission caméra refusée — galerie uniquement", Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        enableImmersiveMode();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (webView != null) webView.destroy();
        if (nsdHelper != null) nsdHelper.stopDiscovery();
    }
}
