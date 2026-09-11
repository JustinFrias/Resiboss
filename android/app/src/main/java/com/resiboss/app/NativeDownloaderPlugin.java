package com.resiboss.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "NativeDownloader")
public class NativeDownloaderPlugin extends Plugin {

    private static final String TAG = "NativeDownloader";

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String filename = call.getString("filename");
        String base64Data = call.getString("content");
        String mimeType = call.getString("mimeType", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        boolean openAfterSave = call.getBoolean("openAfterSave", false);

        if (filename == null || filename.isEmpty()) {
            filename = "Resiboss_Export_" + System.currentTimeMillis() + ".xlsx";
        }

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Content (base64 data) is required.");
            return;
        }

        try {
            // Strip data URI prefix if present
            if (base64Data.contains(",")) {
                base64Data = base64Data.split(",")[1];
            }
            byte[] fileBytes = Base64.decode(base64Data, Base64.DEFAULT);

            Context context = getContext();
            Uri publicSavedUri = null;
            String savedFilePath = null;

            // 1. Save directly into public Downloads folder
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (API 29+): MediaStore.Downloads API (requires zero runtime permissions)
                ContentResolver resolver = context.getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Resiboss");
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                publicSavedUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (publicSavedUri != null) {
                    try (OutputStream os = resolver.openOutputStream(publicSavedUri)) {
                        if (os != null) {
                            os.write(fileBytes);
                            os.flush();
                        }
                    }
                    values.clear();
                    values.put(MediaStore.Downloads.IS_PENDING, 0);
                    resolver.update(publicSavedUri, values, null, null);
                }
            } else {
                // Android 9 and lower: write to Environment.DIRECTORY_DOWNLOADS
                File downloadsDir = new File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "Resiboss"
                );
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }
                File targetFile = new File(downloadsDir, filename);
                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                    fos.write(fileBytes);
                    fos.flush();
                }
                savedFilePath = targetFile.getAbsolutePath();
                publicSavedUri = Uri.fromFile(targetFile);

                MediaScannerConnection.scanFile(
                    context,
                    new String[]{savedFilePath},
                    new String[]{mimeType},
                    null
                );
            }

            // 2. Also write a copy to internal app cache for FileProvider so Android Intent can view/share it safely
            File cacheFile = new File(context.getCacheDir(), filename);
            try (FileOutputStream fos = new FileOutputStream(cacheFile)) {
                fos.write(fileBytes);
                fos.flush();
            }

            Uri shareableContentUri = null;
            try {
                shareableContentUri = FileProvider.getUriForFile(
                    getActivity(),
                    context.getPackageName() + ".fileprovider",
                    cacheFile
                );
            } catch (Exception fErr) {
                Logger.warn(TAG, "FileProvider getUri error: " + fErr.getMessage());
            }

            // 3. If openAfterSave is requested, launch the Android chooser (Excel, Sheets, Share)
            if (openAfterSave && shareableContentUri != null) {
                Intent sendIntent = new Intent(Intent.ACTION_SEND);
                sendIntent.setType(mimeType);
                sendIntent.putExtra(Intent.EXTRA_STREAM, shareableContentUri);
                sendIntent.putExtra(Intent.EXTRA_SUBJECT, filename);
                sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(sendIntent, "Open or Share " + filename);
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(chooser);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("filename", filename);
            ret.put("savedToDownloads", true);
            ret.put("downloadUri", publicSavedUri != null ? publicSavedUri.toString() : "");
            ret.put("cacheUri", shareableContentUri != null ? shareableContentUri.toString() : "");
            call.resolve(ret);

        } catch (Exception ex) {
            Logger.error(TAG, "saveToDownloads error: " + ex.getMessage(), ex);
            call.reject("Failed to save file to Downloads: " + ex.getMessage());
        }
    }
}
