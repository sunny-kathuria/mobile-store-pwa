/**
 * Google Drive service — Mobile Store PWA
 *
 * Uses Google Identity Services (GIS) token client for OAuth 2.0.
 * Scope: drive.file — app can only access files it created.
 * Access token is kept in Pinia only (never persisted to storage).
 *
 * Drive folder structure:
 *   MobileStore/
 *     transactions/   ← JSON files: <date>_<id>.json
 *     images/
 *       <id>/         ← aadhaar_front.jpg, aadhaar_back.jpg, selfie.jpg
 */

import { useDriveStore } from '../store/drive.js'
import { markSynced, getPendingSync } from './db.js'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

// ─── OAuth ────────────────────────────────────────────────────────────────────

let _tokenClient = null

function getTokenClient() {
  if (_tokenClient) return _tokenClient
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {}, // overridden per-call
  })
  return _tokenClient
}

/**
 * Sign in and get an access token.
 * Returns a Promise that resolves when the user has granted access.
 */
export function signIn() {
  return new Promise((resolve, reject) => {
    const driveStore = useDriveStore()
    let client
    try {
      client = getTokenClient()
    } catch (error) {
      reject(new Error('Google Drive is not configured. Check VITE_GOOGLE_CLIENT_ID.'))
      console.error(error)
      return
    }

    client.callback = (response) => {
      if (response.error) {
        if (response.error === 'origin_mismatch') {
          reject(new Error(
            'Google OAuth origin is not registered. Add https://sunny-kathuria.github.io '
            + 'to the Authorized JavaScript origins for this OAuth client.'
          ))
        } else {
          reject(new Error(`Google OAuth failed: ${response.error}`))
        }
        return
      }
      // Decode the JWT id_token is not available in token flow, fetch user info
      fetchUserEmail(response.access_token).then((email) => {
        driveStore.setToken(response.access_token, email, response.expires_in)
        resolve()
      })
    }

    client.requestAccessToken({ prompt: 'consent' })
  })
}

async function fetchUserEmail(accessToken) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    return data.email || 'Connected'
  } catch {
    return 'Connected'
  }
}

/**
 * Sign out — revoke token and clear store.
 */
export function signOut() {
  const driveStore = useDriveStore()
  if (driveStore.accessToken) {
    window.google.accounts.oauth2.revoke(driveStore.accessToken, () => {})
  }
  driveStore.disconnect()
}

/**
 * Check if Drive is connected and token is valid.
 */
export function isConnected() {
  const driveStore = useDriveStore()
  return driveStore.isTokenValid()
}

// ─── Drive API helpers ────────────────────────────────────────────────────────

function authHeader() {
  const driveStore = useDriveStore()
  return { Authorization: `Bearer ${driveStore.accessToken}` }
}

/**
 * Find a folder by name under a parent, or create it.
 * @returns {string} folder id
 */
async function getOrCreateFolder(name, parentId = null) {
  // Search for existing folder
  const q = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`

  const searchRes = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    { headers: authHeader() }
  )
  const searchData = await searchRes.json()

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id
  }

  // Create the folder
  const meta = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId ? { parents: [parentId] } : {}),
  }
  const createRes = await fetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(meta),
  })
  const folder = await createRes.json()
  return folder.id
}

/**
 * Upload a file (Blob) to a Drive folder.
 * @returns {string} file id
 */
async function uploadFile(blob, filename, mimeType, folderId) {
  const meta = { name: filename, parents: [folderId] }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
  form.append('file', blob, filename)

  const res = await fetch(`${DRIVE_UPLOAD}/files?uploadType=multipart`, {
    method: 'POST',
    headers: authHeader(),
    body: form,
  })
  const data = await res.json()
  if (!data.id) throw new Error(`Drive upload failed: ${JSON.stringify(data)}`)
  return data.id
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

/**
 * Sync a single transaction record to Google Drive.
 * Uploads 3 images + 1 JSON metadata file.
 */
export async function syncTransaction(record) {
  const driveStore = useDriveStore()

  // Ensure token is still valid
  if (!driveStore.isTokenValid()) {
    throw new Error('Google Drive session expired. Please reconnect.')
  }

  // Ensure folder structure exists
  const rootFolderId = await getOrCreateFolder('MobileStore')
  const imagesFolderId = await getOrCreateFolder('images', rootFolderId)
  const txFolderId = await getOrCreateFolder(String(record.id), imagesFolderId)
  const txFolderRoot = await getOrCreateFolder('transactions', rootFolderId)

  // Upload the three images
  const frontId = await uploadFile(
    record.aadhaarFrontBlob,
    'aadhaar_front.jpg',
    'image/jpeg',
    txFolderId
  )
  const backId = await uploadFile(
    record.aadhaarBackBlob,
    'aadhaar_back.jpg',
    'image/jpeg',
    txFolderId
  )
  const selfieId = await uploadFile(
    record.selfieBlob,
    'selfie.jpg',
    'image/jpeg',
    txFolderId
  )

  // Build JSON metadata — exclude blob fields, include Drive file IDs
  const dateStr = new Date(record.createdAt).toISOString().slice(0, 10)
  const jsonMeta = {
    id: record.id,
    createdAt: record.createdAt,
    sessionToken: record.sessionToken,
    mobile: record.mobile,
    fullName: record.fullName,
    dob: record.dob,
    email: record.email,
    address: record.address,
    // NOTE: aadhaarNumber omitted from cloud record for extra privacy
    imei: record.imei,
    driveFiles: {
      aadhaarFront: frontId,
      aadhaarBack: backId,
      selfie: selfieId,
    },
  }

  const jsonBlob = new Blob([JSON.stringify(jsonMeta, null, 2)], {
    type: 'application/json',
  })
  await uploadFile(jsonBlob, `${dateStr}_${record.id}.json`, 'application/json', txFolderRoot)

  // Mark as synced in IndexedDB
  await markSynced(record.id)
}

/**
 * Sync all pending (unsynced) transactions.
 */
export async function syncPending() {
  const driveStore = useDriveStore()
  if (!driveStore.isTokenValid()) return

  driveStore.isSyncing = true
  try {
    const pending = await getPendingSync()
    for (const record of pending) {
      await syncTransaction(record)
    }
  } finally {
    driveStore.isSyncing = false
  }
}
