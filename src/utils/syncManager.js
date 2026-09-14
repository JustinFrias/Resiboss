/**
 * Resiboss Offline Queue & Background Sync Manager
 * Handles local-first persistence, client UUID deduplication, and
 * auto-synchronization to Supabase when network connectivity is restored.
 */

import { Network } from '@capacitor/network';
import { syncReceiptToSupabase, isSupabaseConfigured } from '../lib/supabase.js';

const OFFLINE_QUEUE_STORAGE_KEY = 'resiboss_offline_receipt_queue_v1';
const MAX_RETRY_ATTEMPTS = 3;

// Mutex lock to prevent simultaneous concurrent sync cycles
let isSyncInProgress = false;

/**
 * Generates a collision-free client-side receipt identifier.
 * Combining timestamp, random entropy, and standard UUID / format ensures
 * that re-syncing never duplicates records in Supabase (which uses onConflict: 'id').
 */
export function generateReceiptId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `REC-${crypto.randomUUID()}`;
  }
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REC-${new Date().getFullYear()}-${timestamp}-${randomPart}`;
}

/**
 * Checks current network connectivity status using Capacitor Network plugin
 * with navigator.onLine fallback.
 */
export async function checkIsOnline() {
  try {
    const status = await Network.getStatus();
    return Boolean(status.connected);
  } catch (_) {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
}

/**
 * Retrieves the current offline queue from persistent localStorage.
 * @returns {Array<Object>} List of queued receipt items with sync metadata.
 */
export function getOfflineQueue() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[SyncManager] Error reading offline queue:', err);
    return [];
  }
}

/**
 * Persists the offline queue back to localStorage.
 */
export function saveOfflineQueue(queue) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[SyncManager] Error saving offline queue:', err);
  }
}

/**
 * Adds or updates a receipt in the offline queue.
 *
 * @param {Object} receiptDoc - The full receipt document model.
 * @param {'pending' | 'synced' | 'failed'} syncStatus - Initial sync status.
 * @param {string} [errorMessage] - Optional error description if failed.
 */
export function enqueueReceipt(receiptDoc, syncStatus = 'pending', errorMessage = null) {
  if (!receiptDoc || !receiptDoc.id) return;

  const queue = getOfflineQueue();
  const existingIdx = queue.findIndex((item) => item.id === receiptDoc.id);

  const queueItem = {
    ...receiptDoc,
    syncStatus,
    retryCount: existingIdx >= 0 ? queue[existingIdx].retryCount || 0 : 0,
    lastSyncAttempt: Date.now(),
    syncError: errorMessage || null,
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = queueItem;
  } else {
    queue.push(queueItem);
  }

  saveOfflineQueue(queue);
  return queueItem;
}

/**
 * Updates an item's sync status within the queue.
 */
export function updateQueueItemStatus(receiptId, syncStatus, errorMessage = null) {
  const queue = getOfflineQueue();
  const idx = queue.findIndex((item) => item.id === receiptId);
  if (idx >= 0) {
    queue[idx].syncStatus = syncStatus;
    queue[idx].lastSyncAttempt = Date.now();
    if (errorMessage) {
      queue[idx].syncError = errorMessage;
      queue[idx].retryCount = (queue[idx].retryCount || 0) + 1;
    } else {
      queue[idx].syncError = null;
    }
    saveOfflineQueue(queue);
  }
}

/**
 * Returns the count of receipts pending synchronization ('pending' or 'failed').
 */
export function getPendingSyncCount() {
  const queue = getOfflineQueue();
  return queue.filter((item) => item.syncStatus === 'pending' || item.syncStatus === 'failed').length;
}

/**
 * Helper to pause execution for a given number of milliseconds (used for exponential backoff).
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Loops through all pending/failed receipts in the offline queue and synchronizes
 * them to Supabase in order with retry and exponential backoff.
 *
 * @param {Object} userProfile - Active user account profile for user isolation.
 * @param {Function} [onProgress] - Optional callback receiving { synced, total, currentItem }.
 * @returns {Promise<{ syncedCount: number, failedCount: number, remainingPending: number }>}
 */
export async function processSyncQueue(userProfile, onProgress = () => {}) {
  // Check connectivity first
  const online = await checkIsOnline();
  if (!online) {
    return { syncedCount: 0, failedCount: 0, remainingPending: getPendingSyncCount() };
  }

  if (!isSupabaseConfigured) {
    return { syncedCount: 0, failedCount: 0, remainingPending: 0 };
  }

  // Prevent concurrent sync executions
  if (isSyncInProgress) {
    return { syncedCount: 0, failedCount: 0, remainingPending: getPendingSyncCount() };
  }

  isSyncInProgress = true;
  let syncedCount = 0;
  let failedCount = 0;

  try {
    const queue = getOfflineQueue();
    const itemsToSync = queue.filter(
      (item) => item.syncStatus === 'pending' || item.syncStatus === 'failed'
    );

    for (let i = 0; i < itemsToSync.length; i++) {
      const item = itemsToSync[i];
      onProgress({ current: i + 1, total: itemsToSync.length, item });

      let success = false;
      let lastErr = null;

      // Retry loop with basic exponential backoff (e.g. attempt 1, attempt 2 with 400ms, attempt 3 with 800ms)
      for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          const res = await syncReceiptToSupabase(item, userProfile);
          if (res?.error) {
            throw res.error;
          }
          success = true;
          break;
        } catch (pushErr) {
          lastErr = pushErr;
          if (attempt < MAX_RETRY_ATTEMPTS) {
            await delay(attempt * 400);
          }
        }
      }

      if (success) {
        updateQueueItemStatus(item.id, 'synced');
        syncedCount++;
      } else {
        updateQueueItemStatus(item.id, 'failed', lastErr?.message || 'Network sync failed');
        failedCount++;
      }
    }

    // Clean up older synced queue entries to keep localStorage compact (retain last 50 synced records)
    cleanOldSyncedQueueEntries();
  } catch (globalSyncErr) {
    console.warn('[SyncManager] Global sync error:', globalSyncErr);
  } finally {
    isSyncInProgress = false;
  }

  return {
    syncedCount,
    failedCount,
    remainingPending: getPendingSyncCount(),
  };
}

/**
 * Trims older synced receipts from the offline queue, retaining recent entries.
 */
function cleanOldSyncedQueueEntries() {
  try {
    const queue = getOfflineQueue();
    const pendingAndFailed = queue.filter(
      (it) => it.syncStatus === 'pending' || it.syncStatus === 'failed'
    );
    const synced = queue.filter((it) => it.syncStatus === 'synced');

    // Keep only the most recent 40 synced entries for audit/status display
    const recentSynced = synced.slice(-40);
    saveOfflineQueue([...pendingAndFailed, ...recentSynced]);
  } catch (_) {}
}
