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
 * @returns {Promise<{ text: string, blocks: Array } | null>} Recognized text or null if unavailable.
 */
export async function extractWithMlKit(imageUri) {
  // 1. Only execute on native Android/iOS platforms
  if (!isMlKitAvailable() || !imageUri) {
    return null;
  }

  const { TextRecognition: plugin, Script: scriptEnum } = await getMlKitPlugin();
  if (!plugin) {
    return null;
  }

  let tempFilePath = null;

  try {
    let localPath = imageUri;

    // If imageUri is a data URL, write it to temporary cache so ML Kit can read it via native file URI
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

    // Call ML Kit native text recognition
    const result = await plugin.processImage({
      path: localPath,
      script: scriptEnum?.Latin || 'LATIN',
    });

    const recognizedText = (result?.text || '').trim();

    return {
      text: recognizedText,
      blocks: result?.blocks || [],
    };
  } catch (error) {
    console.warn('[MLKitOCR] Native text recognition failed, will fall back:', error?.message || error);
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
