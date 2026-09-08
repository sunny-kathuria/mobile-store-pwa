<template>
  <div>
    <h1 class="step-title">Aadhaar Card</h1>
    <p class="step-subtitle">Capture clear photos of the front and back of the Aadhaar card.</p>

    <div class="card">
      <!-- Front -->
      <div class="photo-section">
        <label class="photo-label">Front of Aadhaar *</label>
        <div
          class="photo-preview"
          :class="{ captured: frontPreview }"
          @click="triggerInput('front')"
        >
          <img v-if="frontPreview" :src="frontPreview" alt="Aadhaar front" />
          <div v-else class="photo-placeholder">
            <span class="photo-icon">📷</span>
            <span>Tap to capture</span>
          </div>
        </div>
        <input
          ref="frontInput"
          type="file"
          accept="image/*"
          capture="environment"
          style="display:none"
          @change="onFileChange('front', $event)"
        />
        <div v-if="errors.front" class="field-error">{{ errors.front }}</div>
      </div>

      <!-- Back -->
      <div class="photo-section" style="margin-top: 20px;">
        <label class="photo-label">Back of Aadhaar *</label>
        <div
          class="photo-preview"
          :class="{ captured: backPreview }"
          @click="triggerInput('back')"
        >
          <img v-if="backPreview" :src="backPreview" alt="Aadhaar back" />
          <div v-else class="photo-placeholder">
            <span class="photo-icon">📷</span>
            <span>Tap to capture</span>
          </div>
        </div>
        <input
          ref="backInput"
          type="file"
          accept="image/*"
          capture="environment"
          style="display:none"
          @change="onFileChange('back', $event)"
        />
        <div v-if="errors.back" class="field-error">{{ errors.back }}</div>
      </div>

      <button
        class="btn btn-primary"
        style="margin-top: 20px;"
        :disabled="!frontPreview || !backPreview"
        @click="proceed"
      >
        Next: Take Selfie →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '../store/transaction.js'

const router = useRouter()
const txStore = useTransactionStore()

const frontInput = ref(null)
const backInput = ref(null)
const frontPreview = ref(null)
const backPreview = ref(null)
const errors = ref({})

// Restore previews if going back
if (txStore.aadhaarFrontFile) {
  frontPreview.value = URL.createObjectURL(txStore.aadhaarFrontFile)
}
if (txStore.aadhaarBackFile) {
  backPreview.value = URL.createObjectURL(txStore.aadhaarBackFile)
}

function triggerInput(side) {
  if (side === 'front') frontInput.value?.click()
  else backInput.value?.click()
}

function onFileChange(side, event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (side === 'front') {
    txStore.aadhaarFrontFile = file
    frontPreview.value = URL.createObjectURL(file)
    errors.value.front = ''
  } else {
    txStore.aadhaarBackFile = file
    backPreview.value = URL.createObjectURL(file)
    errors.value.back = ''
  }
}

function proceed() {
  errors.value = {}
  if (!txStore.aadhaarFrontFile) { errors.value.front = 'Please capture the front of Aadhaar.'; return }
  if (!txStore.aadhaarBackFile) { errors.value.back = 'Please capture the back of Aadhaar.'; return }
  txStore.setStep(5)
  router.push('/step5')
}
</script>

<style scoped>
.photo-section { }
.photo-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.photo-preview {
  width: 100%;
  aspect-ratio: 16/9;
  border: 2px dashed var(--border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: var(--bg);
  transition: border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-preview.captured {
  border-style: solid;
  border-color: var(--success);
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 14px;
}

.photo-icon { font-size: 32px; }
</style>
