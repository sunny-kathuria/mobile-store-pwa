<template>
  <div>
    <h1 class="step-title">Settings</h1>

    <!-- Google Drive Card -->
    <div class="card">
      <div class="section-header">
        <span class="section-icon">📂</span>
        <strong>Google Drive Backup</strong>
      </div>

      <div v-if="driveStore.isConnected" class="drive-connected">
        <div class="connected-info">
          <span class="badge badge-success">✓ Connected</span>
          <span class="connected-email">{{ driveStore.userEmail }}</span>
        </div>
        <div class="drive-actions">
          <button
            class="btn btn-primary btn-sm"
            :disabled="driveStore.isSyncing"
            @click="syncNow"
          >
            {{ driveStore.isSyncing ? '⏳ Syncing…' : '🔄 Sync Now' }}
          </button>
          <button class="btn btn-outline btn-sm" @click="disconnectDrive">
            Disconnect
          </button>
        </div>
        <div v-if="syncMsg" class="alert alert-info" style="margin-top:10px; font-size:13px;">
          {{ syncMsg }}
        </div>
        <div v-if="syncError" class="alert alert-error" style="margin-top:10px; font-size:13px;">
          {{ syncError }}
        </div>
      </div>

      <div v-else>
        <p style="font-size:14px;color:var(--text-muted);margin-bottom:12px;">
          Connect your Google Drive to back up all transaction records automatically.
        </p>
        <button
          class="btn btn-primary"
          :disabled="connecting"
          @click="connectDrive"
        >
          {{ connecting ? 'Connecting…' : '📂 Connect Google Drive' }}
        </button>
        <div v-if="connectError" class="alert alert-error" style="margin-top:10px;">
          {{ connectError }}
        </div>
      </div>
    </div>

    <!-- Change PIN Card -->
    <div class="card">
      <div class="section-header">
        <span class="section-icon">🔒</span>
        <strong>PIN Settings</strong>
      </div>
      <button class="btn btn-outline" @click="goChangePin">Change PIN</button>
    </div>

    <!-- Transaction List Card -->
    <div class="card">
      <div class="section-header">
        <span class="section-icon">📋</span>
        <strong>Transaction History</strong>
      </div>

      <div v-if="loading" style="text-align:center;padding:20px;color:var(--text-muted);">
        Loading…
      </div>

      <div v-else-if="transactions.length === 0" class="empty-state">
        No transactions yet.
      </div>

      <div v-else>
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="tx-row"
        >
          <div class="tx-left">
            <div class="tx-name">{{ tx.fullName }}</div>
            <div class="tx-meta">
              {{ maskMobile(tx.mobile) }} &middot; {{ tx.imei }} &middot; {{ formatDate(tx.createdAt) }}
            </div>
          </div>
          <span
            class="badge"
            :class="tx.syncStatus === 'synced' ? 'badge-success' : 'badge-warning'"
          >
            {{ tx.syncStatus === 'synced' ? '✓' : '⏳' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '../store/drive.js'
import { useAuthStore } from '../store/auth.js'
import { getAllTransactions } from '../services/db.js'
import { signIn, signOut, syncPending } from '../services/gdrive.js'

const router = useRouter()
const driveStore = useDriveStore()
const authStore = useAuthStore()

const transactions = ref([])
const loading = ref(true)
const connecting = ref(false)
const connectError = ref('')
const syncMsg = ref('')
const syncError = ref('')

onMounted(async () => {
  authStore.refreshSession()
  await loadTransactions()
})

async function loadTransactions() {
  loading.value = true
  try {
    transactions.value = await getAllTransactions()
  } finally {
    loading.value = false
  }
}

async function connectDrive() {
  connecting.value = true
  connectError.value = ''
  try {
    await signIn()
    await runSync()
  } catch (err) {
    connectError.value = err.message || 'Could not connect to Google Drive.'
    console.error(err)
  } finally {
    connecting.value = false
  }
}

function disconnectDrive() {
  signOut()
}

async function syncNow() {
  syncMsg.value = ''
  syncError.value = ''
  try {
    await syncPending()
    syncMsg.value = 'Sync complete!'
    await loadTransactions()
  } catch (err) {
    syncError.value = 'Sync failed. Check your Drive connection.'
    console.error(err)
  }
}

async function runSync() {
  try {
    await syncPending()
    await loadTransactions()
  } catch (err) {
    console.warn('Auto-sync failed:', err.message)
  }
}

function goChangePin() {
  // Lock session so user must re-enter new PIN
  authStore.lock()
  router.push('/pin-setup')
}

function maskMobile(mobile) {
  if (!mobile || mobile.length < 5) return mobile
  return mobile.slice(0, 2) + 'XXXXX' + mobile.slice(-3)
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  margin-bottom: 14px;
}
.section-icon { font-size: 20px; }

.drive-connected { }
.connected-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.connected-email {
  font-size: 13px;
  color: var(--text-muted);
  word-break: break-all;
}
.drive-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 14px;
}

.tx-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.tx-row:last-child { border-bottom: none; }
.tx-left { flex: 1; min-width: 0; }
.tx-name { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.tx-meta {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
