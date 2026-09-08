<template>
  <div class="success-page">
    <div class="success-icon">✅</div>
    <h1 class="success-title">Transaction Saved!</h1>
    <p class="success-subtitle">The purchase record has been saved on this device.</p>

    <div class="card">
      <div class="info-row">
        <span class="info-label">Transaction ID</span>
        <span class="info-value">#{{ txId || '—' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Mobile</span>
        <span class="info-value">+91 {{ txStore.mobile }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Name</span>
        <span class="info-value">{{ txStore.details.fullName }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">IMEI</span>
        <span class="info-value">{{ txStore.details.imei }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Cloud Sync</span>
        <span>
          <span v-if="driveStore.isConnected" class="badge badge-success">✓ Synced</span>
          <span v-else class="badge badge-warning">⏳ Pending</span>
        </span>
      </div>
    </div>

    <div v-if="!driveStore.isConnected" class="card drive-prompt">
      <p style="font-size:14px;margin-bottom:12px;">
        Connect Google Drive to back up this transaction to the cloud.
      </p>
      <button class="btn btn-primary" @click="connectDrive" :disabled="connecting">
        {{ connecting ? 'Connecting…' : '📂 Connect Google Drive' }}
      </button>
      <div v-if="driveError" class="alert alert-error" style="margin-top:10px;">{{ driveError }}</div>
    </div>

    <button class="btn btn-outline" style="margin-top: 8px;" @click="newTransaction">
      + New Transaction
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '../store/transaction.js'
import { useDriveStore } from '../store/drive.js'
import { signIn, syncPending } from '../services/gdrive.js'
import { getAllTransactions } from '../services/db.js'

const router = useRouter()
const txStore = useTransactionStore()
const driveStore = useDriveStore()

const txId = ref(null)
const connecting = ref(false)
const driveError = ref('')

onMounted(async () => {
  // Get the ID of the last saved transaction
  try {
    const all = await getAllTransactions()
    if (all.length > 0) txId.value = all[0].id
  } catch { /* non-fatal */ }
})

async function connectDrive() {
  connecting.value = true
  driveError.value = ''
  try {
    await signIn()
    await syncPending()
  } catch (err) {
    driveError.value = err.message || 'Could not connect to Google Drive. Please try again.'
    console.error(err)
  } finally {
    connecting.value = false
  }
}

function newTransaction() {
  txStore.reset()
  router.push('/step1')
}
</script>

<style scoped>
.success-page { text-align: center; padding-bottom: 24px; }
.success-icon { font-size: 64px; margin-bottom: 8px; }
.success-title { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
.success-subtitle { font-size: 14px; color: var(--text-muted); margin-bottom: 20px; }

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 13px; color: var(--text-muted); }
.info-value { font-size: 14px; font-weight: 600; }

.drive-prompt { text-align: left; }
</style>
