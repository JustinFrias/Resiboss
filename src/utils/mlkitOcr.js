/**
 * Resiboss Google ML Kit Offline OCR Module
 * Provides zero-latency on-device text recognition on Android and iOS devices
 * without requiring an internet connection or external API key.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Lazy-load TextRecognition plugin only when on a native platform
let TextRecognition = null;
let Script = null;

async function getMlKitPlugin() {
  if (TextRecognition) return { TextRecognition, Script };
  try {
    const mlkit = await import('@capacitor-mlkit/text-recognition');
    TextRecognition = mlkit.TextRecognition;
    Script = mlkit.Script || { Latin: 'LATIN' };
    return { TextRecognition, Script };
  } catch (err) {
    console.warn('[MLKitOCR] Failed to load @capacitor-mlkit/text-recognition:', err);
    return { TextRecognition: null, Script: null };
  }
}

/**
 * Checks if ML Kit on-device OCR is available on the current device.
 * True only when running inside the native Android/iOS Capacitor wrapper.
 */
export function isMlKitAvailable() {
  return Capacitor.isNativePlatform();
}

/**
 * Executes on-device Google ML Kit text recognition on the provided image.
 *
 * @param {string} imageUri - Base64 data URL, file path, or content URI.
 * @returns {Promise<string | null>} Raw recognized text string, or null if unavailable / error.
 */
export async function extractWithMlKit(imageUri) {
  // Guard: return null if not native platform (web) or empty input
  if (!Capacitor.isNativePlatform() || !imageUri) {
    return null;
  }

  let tempFilePath = null;

  try {
    const { TextRecognition: plugin, Script: scriptEnum } = await getMlKitPlugin();
    if (!plugin) {
      return null;
    }

    let localPath = imageUri;

    // If imageUri is a base64 data URL, write to temporary cache so native ML Kit can read file
    if (typeof imageUri === 'string' && imageUri.startsWith('data:')) {
      const match = imageUri.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      const ext = match ? match[1] : 'jpg';
      const base64Data = match ? match[2] : imageUri.replace(/^data:[^;]+;base64,/, '');

      const fileName = `resiboss_ocr_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
      tempFilePath = fileName;

      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      const uriResult = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache,
      });

      localPath = uriResult.uri;
    }

    // Support plugin.recognize or plugin.processImage (standard CapAwesome API)
    const recognizeFn = plugin.recognize
      ? plugin.recognize.bind(plugin)
      : (plugin.processImage ? plugin.processImage.bind(plugin) : null);

    if (!recognizeFn) {
      console.warn('[MLKitOCR] Neither recognize nor processImage found on TextRecognition plugin');
      return null;
    }

    const options = {
      path: localPath,
      script: scriptEnum?.Latin || 'LATIN',
    };

    const result = await recognizeFn(options);

    // Return raw text as a string (same format Tesseract.js returns: res.data.text)
    const rawText = (typeof result === 'string' ? result : result?.text) || '';
    return rawText.trim() || null;
  } catch (error) {
    console.warn('[MLKitOCR] Native text recognition failed, returning null:', error?.message || error);
    return null;
  } finally {
    // Clean up temporary cache file if one was written
    if (tempFilePath) {
      try {
        await Filesystem.deleteFile({
          path: tempFilePath,
          directory: Directory.Cache,
        });
      } catch (_) {}
    }
  }
}

