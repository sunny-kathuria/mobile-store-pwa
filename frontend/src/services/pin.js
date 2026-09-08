/**
 * PIN service — Mobile Store PWA
 *
 * PIN is NEVER stored as plaintext.
 * Uses Web Crypto SubtleCrypto (SHA-256) — no library needed.
 * Hash is stored in IndexedDB settings store.
 */

import { getSetting, setSetting } from './db.js'

const PIN_KEY = 'pin_hash'

/**
 * Hash a PIN string using SHA-256.
 * @param {string} pin
 * @returns {Promise<string>} hex-encoded hash
 */
export async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify a PIN against the stored hash.
 * @param {string} pin — plaintext input
 * @returns {Promise<boolean>}
 */
export async function verifyPin(pin) {
  const storedHash = await getSetting(PIN_KEY)
  if (!storedHash) return false
  const inputHash = await hashPin(pin)
  return inputHash === storedHash
}

/**
 * Save a new PIN hash to IndexedDB.
 * @param {string} pin — plaintext PIN (hashed before storage)
 */
export async function savePin(pin) {
  const hash = await hashPin(pin)
  await setSetting(PIN_KEY, hash)
}

/**
 * Returns true if a PIN has been set.
 */
export async function isPinSet() {
  const hash = await getSetting(PIN_KEY)
  return !!hash
}
