<template>
  <div>
    <h1 class="step-title">Seller Selfie</h1>
    <p class="step-subtitle">Take a photo of the person selling the phone.</p>

    <div class="card">
      <!-- Live camera view / captured preview -->
      <div class="camera-container">
        <video
          v-show="!capturedImage"
          ref="videoEl"
          autoplay
          playsinline
          muted
          class="camera-feed"
        />
        <img
          v-if="capturedImage"
          :src="capturedImage"
          alt="Seller selfie"
          class="captured-img"
        />
        <canvas ref="canvasEl" style="display:none" />
      </div>

      <div v-if="cameraError" class="alert alert-error">{{ cameraError }}</div>

      <div class="camera-actions">
        <button
          v-if="!capturedImage"
          class="btn btn-primary"
          :disabled="!cameraReady"
          @click="capture"
        >
          📸 Capture Photo
        </button>

        <button
          v-if="capturedImage"
          class="btn btn-outline"
          style="margin-bottom: 10px;"
          @click="retake"
        >
          🔄 Retake
        </button>

        <button
          v-if="capturedImage"
          class="btn btn-success"
          :disabled="submitting"
          @click="submit"
        >
          {{ submitting ? 'Saving…' : '✓ Submit Transaction' }}
        </button>
      </div>

      <div v-if="submitError" class="alert alert-error" style="margin-top: 10px;">
        {{ submitError }}
      </div>
    </div>

    <!-- Fallback: file input if camera blocked -->
    <div class="fallback-section">
      <p>Camera not available?</p>
      <label class="btn btn-outline btn-sm" style="cursor:pointer;">
        Upload Photo Instead
        <input
          type="file"
          accept="image/*"
          capture="user"
          style="display:none"
          @change="onFallbackFile"
        />
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '../store/transaction.js'
import { saveTransaction } from '../services/db.js'
import { ensureConnected, syncTransaction } from '../services/gdrive.js'

const router = useRouter()
const txStore = useTransactionStore()

const videoEl = ref(null)
const canvasEl = ref(null)
const capturedImage = ref(null)
const cameraReady = ref(false)
const cameraError = ref('')
const submitting = ref(false)
const submitError = ref('')

let stream = null

onMounted(async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    })
    videoEl.value.srcObject = stream
    await videoEl.value.play()
    cameraReady.value = true
  } catch (err) {
    cameraError.value =
      'Camera access denied. Please use the "Upload Photo Instead" option below.'
    console.error('Camera error:', err.name)
  }
})

onUnmounted(() => {
  stopCamera()
})

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
}

function capture() {
  const video = videoEl.value
  const canvas = canvasEl.value
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  capturedImage.value = canvas.toDataURL('image/jpeg', 0.85)
  stopCamera()
}

function retake() {
  capturedImage.value = null
  txStore.selfieBlob = null
  // Restart camera
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: 'user' } })
    .then((s) => {
      stream = s
      videoEl.value.srcObject = s
      videoEl.value.play()
      cameraReady.value = true
    })
    .catch(() => { cameraError.value = 'Could not restart camera.' })
}

function onFallbackFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  stopCamera()
  const url = URL.createObjectURL(file)
  capturedImage.value = url
  txStore.selfieBlob = file
}

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl)
  return res.blob()
}

async function fileToBlob(file) {
  return file
}

async function submit() {
  submitting.value = true
  submitError.value = ''

  try {
    // Convert selfie to Blob
    let selfieBlob
    if (txStore.selfieBlob instanceof File || txStore.selfieBlob instanceof Blob) {
      selfieBlob = txStore.selfieBlob
    } else {
      selfieBlob = await dataUrlToBlob(capturedImage.value)
    }

    // Convert Aadhaar files to Blobs
    const aadhaarFrontBlob = await fileToBlob(txStore.aadhaarFrontFile)
    const aadhaarBackBlob = await fileToBlob(txStore.aadhaarBackFile)

    // Build transaction record
    const record = {
      sessionToken: txStore.sessionToken,
      mobile: txStore.mobile,
      fullName: txStore.details.fullName,
      dob: txStore.details.dob,
      email: txStore.details.email,
      address: txStore.details.address,
      aadhaarNumber: txStore.details.aadhaarNumber,
      imei: txStore.details.imei,
      aadhaarFrontBlob,
      aadhaarBackBlob,
      selfieBlob,
    }

    // Save locally first (always succeeds offline)
    const id = await saveTransaction(record)

    // Reconnect silently when already authorized, then sync automatically.
    if (await ensureConnected()) {
      try {
        const fullRecord = { ...record, id }
        await syncTransaction(fullRecord)
      } catch (syncErr) {
        // Non-fatal — will sync later from Settings
        console.warn('Drive sync failed, will retry later:', syncErr.message)
      }
    }

    router.push('/success')
  } catch (err) {
    submitError.value = 'Failed to save transaction. Please try again.'
    console.error(err)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.camera-container {
  width: 100%;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
}

.camera-feed, .captured-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-feed {
  transform: scaleX(-1); /* Mirror for selfie */
}

.camera-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fallback-section {
  text-align: center;
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>
