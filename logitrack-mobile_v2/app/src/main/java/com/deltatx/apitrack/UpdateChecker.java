package com.deltatx.apitrack;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.appcompat.app.AlertDialog;
import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * UpdateChecker — Vérifie les mises à jour de l'application
 * 
 * Vérifie un endpoint JSON /api/mobile/version qui retourne :
 * {
 *   "versionCode": 4,
 *   "versionName": "2.9.0",
 *   "downloadUrl": "https://server/apitrack-v2.9.0.apk",
 *   "releaseNotes": "Nouveautés de la version...",
 *   "mandatory": false
 * }
 */
public class UpdateChecker {

    private static final String TAG = "UpdateChecker";
    private static final String UPDATE_ENDPOINT = "/api/settings/mobile/version";

    private final Context context;
    private final Handler mainHandler;
    private UpdateCallback callback;

    public interface UpdateCallback {
        void onUpdateAvailable(String newVersion, String releaseNotes, String downloadUrl, boolean mandatory);
        void onNoUpdate();
        void onCheckFailed(String error);
    }

    public UpdateChecker(Context context) {
        this.context = context;
        this.mainHandler = new Handler(Looper.getMainLooper());
    }

    /**
     * Vérifie si une mise à jour est disponible
     */
    public void checkForUpdates(String serverUrl, UpdateCallback callback) {
        this.callback = callback;

        new Thread(() -> {
            try {
                String checkUrl = serverUrl + UPDATE_ENDPOINT;
                Log.d(TAG, "Checking for updates: " + checkUrl);

                URL url = new URL(checkUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Accept", "application/json");

                int code = conn.getResponseCode();
                if (code == 200) {
                    BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();
                    conn.disconnect();

                    JSONObject json = new JSONObject(sb.toString());
                    int remoteVersionCode = json.optInt("versionCode", 0);
                    String remoteVersionName = json.optString("versionName", "");
                    String downloadUrl = json.optString("downloadUrl", "");
                    String releaseNotes = json.optString("releaseNotes", "");
                    boolean mandatory = json.optBoolean("mandatory", false);

                    // Comparer avec la version locale
                    int localVersionCode = getLocalVersionCode();
                    Log.d(TAG, "Local version: " + localVersionCode + ", Remote: " + remoteVersionCode);

                    if (remoteVersionCode > localVersionCode && !downloadUrl.isEmpty()) {
                        mainHandler.post(() -> {
                            if (callback != null) {
                                callback.onUpdateAvailable(remoteVersionName, releaseNotes, downloadUrl, mandatory);
                            }
                        });
                    } else {
                        mainHandler.post(() -> {
                            if (callback != null) {
                                callback.onNoUpdate();
                            }
                        });
                    }
                } else {
                    conn.disconnect();
                    // Pas d'endpoint configuré = pas de mise à jour automatique
                    mainHandler.post(() -> {
                        if (callback != null) {
                            callback.onNoUpdate();
                        }
                    });
                }
            } catch (Exception e) {
                Log.w(TAG, "Update check failed: " + e.getMessage());
                mainHandler.post(() -> {
                    if (callback != null) {
                        callback.onCheckFailed(e.getMessage());
                    }
                });
            }
        }).start();
    }

    /**
     * Obtient le versionCode de l'APK installé
     */
    private int getLocalVersionCode() {
        try {
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return (int) pInfo.getLongVersionCode();
            } else {
                return pInfo.versionCode;
            }
        } catch (Exception e) {
            Log.e(TAG, "Cannot get local version", e);
            return 0;
        }
    }

    /**
     * Obtient le versionName de l'APK installé
     */
    public String getLocalVersionName() {
        try {
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            return pInfo.versionName;
        } catch (Exception e) {
            return "?";
        }
    }

    /**
     * Télécharge et installe la mise à jour
     */
    public void downloadAndInstall(Activity activity, String downloadUrl, String versionName) {
        try {
            String fileName = "ApiTrack-v" + versionName + ".apk";

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(downloadUrl));
            request.setTitle("Mise à jour ApiTrack");
            request.setDescription("Téléchargement de la version " + versionName);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            request.setMimeType("application/vnd.android.package-archive");

            DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            long downloadId = downloadManager.enqueue(request);

            // Écouter la fin du téléchargement
            BroadcastReceiver receiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context ctx, Intent intent) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (id == downloadId) {
                        ctx.unregisterReceiver(this);
                        installApk(activity, fileName);
                    }
                }
            };
            context.registerReceiver(receiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                Context.RECEIVER_NOT_EXPORTED);

            Log.i(TAG, "Download started: " + downloadUrl);
        } catch (Exception e) {
            Log.e(TAG, "Download failed", e);
        }
    }

    /**
     * Lance l'installation de l'APK téléchargé
     */
    private void installApk(Activity activity, String fileName) {
        try {
            File apkFile = new File(Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_DOWNLOADS), fileName);

            if (!apkFile.exists()) {
                Log.e(TAG, "APK file not found: " + apkFile.getAbsolutePath());
                return;
            }

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                Uri apkUri = FileProvider.getUriForFile(context, 
                    context.getPackageName() + ".fileprovider", apkFile);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } else {
                installIntent.setDataAndType(Uri.fromFile(apkFile), "application/vnd.android.package-archive");
            }
            
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(installIntent);
        } catch (Exception e) {
            Log.e(TAG, "Install failed", e);
        }
    }

    /**
     * Affiche un dialogue proposant la mise à jour
     */
    public static void showUpdateDialog(Activity activity, UpdateChecker checker, 
            String newVersion, String releaseNotes, String downloadUrl, boolean mandatory) {
        
        String message = "Une nouvelle version (" + newVersion + ") est disponible.";
        if (releaseNotes != null && !releaseNotes.isEmpty()) {
            message += "\n\n" + releaseNotes;
        }

        AlertDialog.Builder builder = new AlertDialog.Builder(activity)
            .setTitle("Mise à jour disponible")
            .setMessage(message)
            .setIcon(android.R.drawable.ic_dialog_info)
            .setPositiveButton("Télécharger", (dialog, which) -> {
                checker.downloadAndInstall(activity, downloadUrl, newVersion);
            });

        if (!mandatory) {
            builder.setNegativeButton("Plus tard", (dialog, which) -> dialog.dismiss());
        }

        builder.setCancelable(!mandatory);
        builder.show();
    }
}
