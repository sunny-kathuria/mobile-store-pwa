<template>
  <div class="pin-page">
    <div class="pin-card">
      <div class="pin-icon">🔐</div>
      <h1 class="pin-title">Set Your PIN</h1>
      <p class="pin-subtitle">
        Create a 4-digit PIN to protect this app.<br />
        Only you and staff who know this PIN can use it.
      </p>

      <div class="form-group">
        <label>New PIN</label>
        <input
          v-model="pin"
          type="password"
          inputmode="numeric"
          pattern="\d{4}"
          maxlength="4"
          placeholder="• • • •"
          class="pin-input"
          :class="{ error: pinError }"
          autocomplete="new-password"
        />
      </div>

      <div class="form-group">
        <label>Confirm PIN</label>
        <input
          v-model="confirmPin"
          type="password"
          inputmode="numeric"
          pattern="\d{4}"
          maxlength="4"
          placeholder="• • • •"
          class="pin-input"
          :class="{ error: pinError }"
          autocomplete="new-password"
        />
      </div>

      <div v-if="pinError" class="alert alert-error">{{ pinError }}</div>

      <button
        class="btn btn-primary"
        :disabled="loading || pin.length < 4 || confirmPin.length < 4"
        @click="setupPin"
      >
        {{ loading ? 'Saving…' : 'Set PIN & Continue' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { savePin } from '../services/pin.js'
import { useAuthStore } from '../store/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const pin = ref('')
const confirmPin = ref('')
const pinError = ref('')
const loading = ref(false)

async function setupPin() {
  pinError.value = ''

  if (!/^\d{4}$/.test(pin.value)) {
    pinError.value = 'PIN must be exactly 4 digits.'
    return
  }
  if (pin.value !== confirmPin.value) {
    pinError.value = 'PINs do not match. Please try again.'
    confirmPin.value = ''
    return
  }

  loading.value = true
  try {
    await savePin(pin.value)
    authStore.unlock()
    router.replace('/step1')
  } catch (err) {
    pinError.value = 'Failed to save PIN. Please try again.'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pin-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  padding: 24px;
}

.pin-card {
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  width: 100%;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.pin-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.pin-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text);
}

.pin-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
  line-height: 1.5;
}

.pin-input {
  text-align: center;
  font-size: 24px;
  letter-spacing: 8px;
}
</style>
