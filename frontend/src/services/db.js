/**
 * IndexedDB service — Mobile Store PWA
 * Uses the `idb` library for a promise-based API.
 *
 * Database: mobile-store-db  v1
 * Object stores:
 *   transactions  — all purchase records + image blobs
 *   settings      — PIN hash and app config
 */

import { openDB } from 'idb'

const DB_NAME = 'mobile-store-db'
const DB_VERSION = 1

let _db = null

async function getDb() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('by-mobile', 'mobile')
        store.createIndex('by-syncStatus', 'syncStatus')
      }

      // Settings store (key-value pairs)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings')
      }
    },
  })
  return _db
}

/**
 * Save a new transaction record.
 * @param {Object} record — all customer fields + Blob images, WITHOUT an id
 * @returns {number} the auto-assigned id
 */
export async function saveTransaction(record) {
  const db = await getDb()
  const id = await db.add('transactions', {
    ...record,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
  })
  return id
}

/**
 * Get a single transaction by id.
 */
export async function getTransaction(id) {
  const db = await getDb()
  return db.get('transactions', id)
}

/**
 * Get all transactions, sorted by createdAt descending.
 */
export async function getAllTransactions() {
  const db = await getDb()
  const all = await db.getAll('transactions')
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Mark a transaction as synced to Google Drive.
 */
export async function markSynced(id) {
  const db = await getDb()
  const tx = db.transaction('transactions', 'readwrite')
  const store = tx.objectStore('transactions')
  const record = await store.get(id)
  if (record) {
    record.syncStatus = 'synced'
    await store.put(record)
  }
  await tx.done
}

/**
 * Get all transactions that have not been synced yet.
 */
export async function getPendingSync() {
  const db = await getDb()
  return db.getAllFromIndex('transactions', 'by-syncStatus', 'pending')
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

export async function getSetting(key) {
  const db = await getDb()
  return db.get('settings', key)
}

export async function setSetting(key, value) {
  const db = await getDb()
  return db.put('settings', value, key)
}
