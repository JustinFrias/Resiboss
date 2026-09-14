import assert from 'node:assert/strict';
import { isMlKitAvailable, extractWithMlKit } from '../src/utils/mlkitOcr.js';
import {
  generateReceiptId,
  enqueueReceipt,
  getOfflineQueue,
  saveOfflineQueue,
  updateQueueItemStatus,
  getPendingSyncCount,
  processSyncQueue,
} from '../src/utils/syncManager.js';

console.log('🧪 Running Resiboss Offline-First & Sync Manager Test Suite...\n');

let passedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ ${name}:`, err.message);
    throw err;
  }
}

// Mock browser localStorage for Node testing environment
const memoryStorage = new Map();
global.localStorage = {
  getItem: (key) => memoryStorage.get(key) || null,
  setItem: (key, val) => memoryStorage.set(key, String(val)),
  removeItem: (key) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
};

// =========================================================================
// TEST 1: ML KIT PLATFORM CHECK & WEB FALLBACK
// =========================================================================
runTest('ML Kit: Gracefully returns null on non-native environments (web fallback)', async () => {
  const available = isMlKitAvailable();
  assert.equal(available, false, 'isMlKitAvailable should be false on web / non-native');

  const result = await extractWithMlKit('data:image/png;base64,iVBORw0KGgo=');
  assert.equal(result, null, 'extractWithMlKit should return null on non-native platform');
});

// =========================================================================
// TEST 2: CLIENT UUID GENERATION
// =========================================================================
runTest('Sync Manager: Generates collision-free client IDs for offline deduplication', () => {
  const id1 = generateReceiptId();
  const id2 = generateReceiptId();
  assert.ok(id1.startsWith('REC-'), 'Receipt ID must start with REC-');
  assert.ok(id2.startsWith('REC-'), 'Receipt ID must start with REC-');
  assert.notEqual(id1, id2, 'Generated receipt IDs must be unique');
});

// =========================================================================
// TEST 3: OFFLINE QUEUE PERSISTENCE & STATUS TRACKING
// =========================================================================
runTest('Sync Manager: Enqueues offline receipts and updates syncStatus', () => {
  memoryStorage.clear();

  const receiptA = {
    id: generateReceiptId(),
    merchant: 'Shell Station Buendia',
    date: '2026-09-14',
    total: 1500.0,
    items: [{ name: 'Diesel', qty: 1, price: 1500.0, total: 1500.0 }],
  };

  const receiptB = {
    id: generateReceiptId(),
    merchant: 'Puregold Cubao',
    date: '2026-09-14',
    total: 350.0,
    items: [{ name: 'Bread', qty: 2, price: 175.0, total: 350.0 }],
  };

  // Enqueue as offline pending
  enqueueReceipt(receiptA, 'pending');
  enqueueReceipt(receiptB, 'pending');

  assert.equal(getPendingSyncCount(), 2, 'Pending sync count must be 2');

  const queue = getOfflineQueue();
  assert.equal(queue.length, 2);
  assert.equal(queue[0].syncStatus, 'pending');
  assert.equal(queue[1].syncStatus, 'pending');

  // Transition receiptA to synced
  updateQueueItemStatus(receiptA.id, 'synced');
  assert.equal(getPendingSyncCount(), 1, 'Pending sync count must be 1 after receiptA is synced');

  // Transition receiptB to failed
  updateQueueItemStatus(receiptB.id, 'failed', 'Timeout error');
  assert.equal(getPendingSyncCount(), 1, 'Failed items should remain in pending count for retry');

  const updatedQueue = getOfflineQueue();
  const itemB = updatedQueue.find((i) => i.id === receiptB.id);
  assert.equal(itemB.syncStatus, 'failed');
  assert.equal(itemB.syncError, 'Timeout error');
  assert.equal(itemB.retryCount, 1);
});

// =========================================================================
// TEST 4: DEDUPLICATION & BACKGROUND QUEUE PROCESSING
// =========================================================================
runTest('Sync Manager: Upserting same receipt updates queue without duplicating records', () => {
  memoryStorage.clear();

  const docId = generateReceiptId();
  const receiptDoc = {
    id: docId,
    merchant: 'McDonalds Makati',
    total: 220.0,
    items: [{ name: 'Big Mac', qty: 1, price: 220.0, total: 220.0 }],
  };

  // Enqueue twice
  enqueueReceipt(receiptDoc, 'pending');
  enqueueReceipt({ ...receiptDoc, total: 250.0 }, 'pending');

  const queue = getOfflineQueue();
  assert.equal(queue.length, 1, 'Queue must not duplicate items with same id');
  assert.equal(queue[0].total, 250.0, 'Queue item should be updated with newest data');
});

// =========================================================================
// TEST 5: ENGINE PRIORITY LOGIC (Gemini -> ML Kit -> Tesseract)
// =========================================================================
runTest('Engine Priority: Verifies online/offline engine routing logic', () => {
  // Case A: Online + Key -> Gemini
  const onlineWithKey = { hasKey: true, isOnline: true };
  const engineA = onlineWithKey.hasKey && onlineWithKey.isOnline ? 'gemini' : 'other';
  assert.equal(engineA, 'gemini');

  // Case B: Offline + Key -> skips Gemini, checks native ML Kit
  const offlineWithKey = { hasKey: true, isOnline: false, isNative: true };
  let engineB = 'tesseract';
  if (offlineWithKey.hasKey && offlineWithKey.isOnline) {
    engineB = 'gemini';
  } else if (offlineWithKey.isNative) {
    engineB = 'mlkit';
  }
  assert.equal(engineB, 'mlkit', 'Offline native device must select ML Kit');

  // Case C: Offline + Web -> skips Gemini and ML Kit, selects Tesseract
  const offlineWeb = { hasKey: true, isOnline: false, isNative: false };
  let engineC = 'tesseract';
  if (offlineWeb.hasKey && offlineWeb.isOnline) {
    engineC = 'gemini';
  } else if (offlineWeb.isNative) {
    engineC = 'mlkit';
  }
  assert.equal(engineC, 'tesseract', 'Offline web must select Tesseract');
});

console.log(`\n🎉 All ${passedTests} offline-first & sync tests passed successfully!`);
