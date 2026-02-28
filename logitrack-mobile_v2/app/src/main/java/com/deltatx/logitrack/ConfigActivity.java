package com.deltatx.logitrack;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.format.Formatter;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.Inet4Address;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.Socket;
import java.net.URL;
import java.util.Enumeration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * ConfigActivity — Configuration initiale du serveur Logi-Track V2
 *
 * Stratégie de découverte (en parallèle) :
 *   1. mDNS (NSD) — recherche du service _logitrack._tcp
 *   2. Scan réseau — probe TCP+HTTP sur le sous-réseau local (ports 5174, 3003)
 *
 * Si aucune méthode ne trouve le serveur, propose la configuration manuelle.
 */
public class ConfigActivity extends AppCompatActivity {

    private static final String TAG = "ConfigActivity";
    private static final int MDNS_TIMEOUT = 5000;
    private static final int[] SCAN_PORTS = {5174, 3003};
    private static final int TCP_TIMEOUT = 150;   // ms — TCP connect probe (rapide)
    private static final int HTTP_TIMEOUT = 1500;  // ms — HTTP health check (confirmation)

    private NsdHelper nsdHelper;
    private final AtomicBoolean serverFound = new AtomicBoolean(false);
    private ExecutorService scanExecutor;
    private Handler mainHandler;

    // UI components
    private LinearLayout discoverySection;
    private LinearLayout manualSection;
    private ProgressBar progressDiscovery;
    private TextView tvDiscoveryStatus;
    private TextView tvFoundServer;
    private Button btnUseFound;
    private Button btnRetry;
    private Button btnManual;
    private EditText etServerIp;
    private EditText etServerPort;
    private Button btnConnect;
    private Button btnBackToAuto;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_config);

        mainHandler = new Handler(Looper.getMainLooper());
        initViews();
        nsdHelper = new NsdHelper(this);

        // Lancer la découverte automatique
        startDiscovery();

        btnManual.setOnClickListener(v -> showManualConfig());
        btnBackToAuto.setOnClickListener(v -> {
            manualSection.setVisibility(View.GONE);
            discoverySection.setVisibility(View.VISIBLE);
            startDiscovery();
        });

        btnRetry.setOnClickListener(v -> startDiscovery());
        btnUseFound.setOnClickListener(v -> {
            String url = (String) btnUseFound.getTag();
            if (url != null) {
                testAndSaveServer(url);
            }
        });

        btnConnect.setOnClickListener(v -> {
            String ip = etServerIp.getText().toString().trim();
            String portStr = etServerPort.getText().toString().trim();

            if (ip.isEmpty()) {
                etServerIp.setError("Adresse IP requise");
                return;
            }

            int port = 5174;
            if (!portStr.isEmpty()) {
                try {
                    port = Integer.parseInt(portStr);
                } catch (NumberFormatException e) {
                    etServerPort.setError("Port invalide");
                    return;
                }
            }

            String url = "http://" + ip + ":" + port;
            testAndSaveServer(url);
        });
    }

    private void initViews() {
        discoverySection = findViewById(R.id.discovery_section);
        manualSection = findViewById(R.id.manual_section);
        progressDiscovery = findViewById(R.id.progress_discovery);
        tvDiscoveryStatus = findViewById(R.id.tv_discovery_status);
        tvFoundServer = findViewById(R.id.tv_found_server);
        btnUseFound = findViewById(R.id.btn_use_found);
        btnRetry = findViewById(R.id.btn_retry);
        btnManual = findViewById(R.id.btn_manual);
        etServerIp = findViewById(R.id.et_server_ip);
        etServerPort = findViewById(R.id.et_server_port);
        btnConnect = findViewById(R.id.btn_connect);
        btnBackToAuto = findViewById(R.id.btn_back_to_auto);
    }

    // ====================================================================
    // DÉCOUVERTE AUTOMATIQUE (NSD + SCAN RÉSEAU EN PARALLÈLE)
    // ====================================================================

    private void startDiscovery() {
        serverFound.set(false);
        stopScan();

        progressDiscovery.setVisibility(View.VISIBLE);
        tvDiscoveryStatus.setText("Recherche du serveur Logi-Track…");
        tvFoundServer.setVisibility(View.GONE);
        btnUseFound.setVisibility(View.GONE);
        btnRetry.setVisibility(View.GONE);

        // Méthode 1 : mDNS (NSD)
        nsdHelper.discoverServer(new NsdHelper.DiscoveryCallback() {
            @Override
            public void onServerFound(String host, int port) {
                if (serverFound.compareAndSet(false, true)) {
                    stopScan();
                    showFoundServer(host, port);
                }
            }

            @Override
            public void onDiscoveryFailed() {
                // NSD a échoué — le scan réseau continue en parallèle
                Log.d(TAG, "mDNS discovery failed, network scan continues…");
            }
        }, MDNS_TIMEOUT);

        // Méthode 2 : Scan du sous-réseau local (en parallèle)
        startSubnetScan();
    }

    /**
     * Scan le sous-réseau WiFi du mobile sur les ports 5174 et 3003.
     * Utilise un ThreadPool pour des probes TCP rapides puis HTTP.
     */
    private void startSubnetScan() {
        new Thread(() -> {
            String deviceIp = getDeviceIpAddress();
            if (deviceIp == null) {
                Log.w(TAG, "Cannot determine device IP — skip subnet scan");
                // Attendre que NSD finisse son timeout avant d'afficher l'échec
                mainHandler.postDelayed(() -> {
                    if (!serverFound.get()) {
                        showDiscoveryFailed();
                    }
                }, MDNS_TIMEOUT + 500);
                return;
            }

            String subnet = deviceIp.substring(0, deviceIp.lastIndexOf('.') + 1);
            Log.i(TAG, "Subnet scan: " + subnet + "0/24 from device " + deviceIp);

            mainHandler.post(() ->
                tvDiscoveryStatus.setText("Scan du réseau " + subnet + "…"));

            scanExecutor = Executors.newFixedThreadPool(30);

            for (int i = 1; i <= 254 && !serverFound.get(); i++) {
                final String ip = subnet + i;
                // Ne pas scanner notre propre IP
                if (ip.equals(deviceIp)) continue;

                for (int port : SCAN_PORTS) {
                    final int p = port;
                    try {
                        scanExecutor.submit(() -> {
                            if (serverFound.get()) return;
                            if (probeServer(ip, p)) {
                                if (serverFound.compareAndSet(false, true)) {
                                    nsdHelper.stopDiscovery();
                                    mainHandler.post(() -> showFoundServer(ip, p));
                                }
                            }
                        });
                    } catch (Exception ignored) {}
                }
            }

            scanExecutor.shutdown();
            try {
                scanExecutor.awaitTermination(20, TimeUnit.SECONDS);
            } catch (InterruptedException ignored) {}

            if (!serverFound.get()) {
                mainHandler.post(this::showDiscoveryFailed);
            }
        }).start();
    }

    /**
     * Probe un serveur : TCP connect rapide + vérification HTTP /api/health.
     */
    private boolean probeServer(String ip, int port) {
        // Phase 1 : TCP connect rapide (filtre les IPs inactives)
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(ip, port), TCP_TIMEOUT);
            // Port ouvert → fermer et vérifier HTTP
        } catch (Exception e) {
            return false; // Port fermé ou IP inaccessible
        }

        // Phase 2 : Vérification HTTP /api/health
        try {
            URL url = new URL("http://" + ip + ":" + port + "/api/health");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(HTTP_TIMEOUT);
            conn.setReadTimeout(HTTP_TIMEOUT);
            conn.setRequestMethod("GET");

            int code = conn.getResponseCode();
            if (code == 200) {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
                reader.close();
                conn.disconnect();

                String response = sb.toString();
                if (response.contains("Logi-Track") || response.contains("LogiTrack") || response.contains("OK")) {
                    Log.i(TAG, "✅ Serveur trouvé : " + ip + ":" + port);
                    return true;
                }
            }
            conn.disconnect();
        } catch (Exception ignored) {}

        return false;
    }

    /**
     * Obtenir l'adresse IP locale du mobile (WiFi ou Ethernet).
     */
    private String getDeviceIpAddress() {
        // Méthode 1 : NetworkInterface (fiable, tous Android)
        try {
            for (Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces();
                 en != null && en.hasMoreElements(); ) {
                NetworkInterface intf = en.nextElement();
                for (Enumeration<InetAddress> addrs = intf.getInetAddresses(); addrs.hasMoreElements(); ) {
                    InetAddress addr = addrs.nextElement();
                    if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                        String ip = addr.getHostAddress();
                        if (ip != null && (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172."))) {
                            return ip;
                        }
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting IP via NetworkInterface", e);
        }

        // Méthode 2 : WifiManager (fallback)
        try {
            @SuppressWarnings("deprecation")
            WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                @SuppressWarnings("deprecation")
                WifiInfo wi = wm.getConnectionInfo();
                int ipInt = wi.getIpAddress();
                if (ipInt != 0) {
                    @SuppressWarnings("deprecation")
                    String ip = Formatter.formatIpAddress(ipInt);
                    return ip;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting IP via WifiManager", e);
        }

        return null;
    }

    // ====================================================================
    // UI : AFFICHAGE RÉSULTATS
    // ====================================================================

    private void showFoundServer(String host, int port) {
        progressDiscovery.setVisibility(View.GONE);
        tvDiscoveryStatus.setText("✅ Serveur trouvé !");
        tvFoundServer.setVisibility(View.VISIBLE);
        tvFoundServer.setText(host + ":" + port);

        String url = "http://" + host + ":" + port;
        btnUseFound.setTag(url);
        btnUseFound.setVisibility(View.VISIBLE);
        btnRetry.setVisibility(View.GONE);
    }

    private void showDiscoveryFailed() {
        progressDiscovery.setVisibility(View.GONE);
        tvDiscoveryStatus.setText("❌ Serveur non trouvé sur le réseau");
        tvFoundServer.setVisibility(View.GONE);
        btnUseFound.setVisibility(View.GONE);
        btnRetry.setVisibility(View.VISIBLE);
    }

    // ====================================================================
    // CONFIGURATION MANUELLE
    // ====================================================================

    private void showManualConfig() {
        nsdHelper.stopDiscovery();
        stopScan();
        discoverySection.setVisibility(View.GONE);
        manualSection.setVisibility(View.VISIBLE);

        // Pré-remplir avec les dernières valeurs connues
        SharedPreferences prefs = getSharedPreferences("logitrack_config", MODE_PRIVATE);
        String lastIp = prefs.getString("last_ip", "");
        int lastPort = prefs.getInt("last_port", 5174);

        if (!lastIp.isEmpty()) {
            etServerIp.setText(lastIp);
        } else {
            // Pré-remplir avec le sous-réseau du mobile
            String deviceIp = getDeviceIpAddress();
            if (deviceIp != null) {
                String subnet = deviceIp.substring(0, deviceIp.lastIndexOf('.') + 1);
                etServerIp.setText(subnet);
                etServerIp.setSelection(subnet.length());
            }
        }
        etServerPort.setText(String.valueOf(lastPort));
    }

    // ====================================================================
    // TEST ET SAUVEGARDE SERVEUR
    // ====================================================================

    /**
     * Teste la connexion au serveur puis sauvegarde si OK.
     * Essaie d'abord l'URL fournie, puis tente l'autre port en fallback.
     */
    private void testAndSaveServer(String baseUrl) {
        btnConnect.setEnabled(false);
        btnUseFound.setEnabled(false);

        new Thread(() -> {
            // Essai 1 : URL fournie directement
            if (checkHealthEndpoint(baseUrl)) {
                runOnUiThread(() -> {
                    saveServerConfig(baseUrl);
                    Toast.makeText(this, getString(R.string.connected_toast), Toast.LENGTH_SHORT).show();
                    navigateToMain();
                });
                return;
            }

            // Essai 2 : Si le port était 5174, essayer 3003 (et vice-versa)
            String fallbackUrl = getFallbackUrl(baseUrl);
            if (fallbackUrl != null && checkHealthEndpoint(fallbackUrl)) {
                runOnUiThread(() -> {
                    saveServerConfig(fallbackUrl);
                    Toast.makeText(this, getString(R.string.connected_toast), Toast.LENGTH_SHORT).show();
                    navigateToMain();
                });
                return;
            }

            // Échec total
            runOnUiThread(() -> {
                Toast.makeText(this, getString(R.string.connection_failed), Toast.LENGTH_LONG).show();
                btnConnect.setEnabled(true);
                btnUseFound.setEnabled(true);
            });
        }).start();
    }

    /**
     * Vérifie /api/health sur une URL donnée.
     */
    private boolean checkHealthEndpoint(String baseUrl) {
        try {
            URL url = new URL(baseUrl + "/api/health");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int code = conn.getResponseCode();
            if (code == 200) {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
                reader.close();
                conn.disconnect();

                String response = sb.toString();
                return response.contains("Logi-Track") || response.contains("LogiTrack") || response.contains("OK");
            }
            conn.disconnect();
        } catch (Exception e) {
            Log.w(TAG, "Health check failed for " + baseUrl + ": " + e.getMessage());
        }
        return false;
    }

    /**
     * Retourne l'URL avec le port alternatif (5174 ↔ 3003).
     */
    private String getFallbackUrl(String baseUrl) {
        try {
            URL url = new URL(baseUrl);
            int currentPort = url.getPort();
            int fallbackPort = (currentPort == 5174) ? 3003 : 5174;
            return "http://" + url.getHost() + ":" + fallbackPort;
        } catch (Exception e) {
            return null;
        }
    }

    private void saveServerConfig(String serverUrl) {
        SharedPreferences prefs = getSharedPreferences("logitrack_config", MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("server_url", serverUrl);

        // Sauvegarder IP et port pour la config manuelle
        try {
            URL url = new URL(serverUrl);
            editor.putString("last_ip", url.getHost());
            editor.putInt("last_port", url.getPort());
        } catch (Exception ignored) {}

        editor.apply();
    }

    private void navigateToMain() {
        Intent intent = new Intent(this, MainActivity.class);
        startActivity(intent);
        finish();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    // ====================================================================
    // LIFECYCLE & CLEANUP
    // ====================================================================

    private void stopScan() {
        if (scanExecutor != null && !scanExecutor.isShutdown()) {
            scanExecutor.shutdownNow();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (nsdHelper != null) nsdHelper.stopDiscovery();
        stopScan();
    }
}
