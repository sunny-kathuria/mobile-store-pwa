<template>
  <div class="pin-page">
    <div class="pin-card">
      <div class="pin-icon">🔒</div>
      <h1 class="pin-title">Mobile Store</h1>
      <p class="pin-subtitle">Enter your 4-digit PIN to continue</p>

      <!-- PIN dots display -->
      <div class="pin-dots">
        <div
          v-for="i in 4"
          :key="i"
          class="dot"
          :class="{ filled: enteredPin.length >= i }"
        />
      </div>

      <div v-if="errorMsg" class="alert alert-error" style="margin-bottom: 16px;">
        {{ errorMsg }}
      </div>

      <!-- Numeric keypad -->
      <div class="keypad">
        <button
          v-for="key in keypadKeys"
          :key="key"
          class="key-btn"
          :class="{ 'key-btn-action': key === '⌫' }"
          @click="pressKey(key)"
          :disabled="loading"
        >
          {{ key }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { verifyPin } from '../services/pin.js'
import { useAuthStore } from '../store/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const enteredPin = ref('')
const errorMsg = ref('')
const loading = ref(false)

const keypadKeys = ['1','2','3','4','5','6','7','8','9','','0','⌫']

function pressKey(key) {
  if (key === '') return
  if (key === '⌫') {
    enteredPin.value = enteredPin.value.slice(0, -1)
    errorMsg.value = ''
    return
  }
  if (enteredPin.value.length >= 4) return
  enteredPin.value += key

  if (enteredPin.value.length === 4) {
    checkPin()
  }
}

async function checkPin() {
  loading.value = true
  errorMsg.value = ''
  try {
    const valid = await verifyPin(enteredPin.value)
    if (valid) {
      authStore.unlock()
      // Redirect to intended destination or step1
      const redirect = route.query.redirect || '/step1'
      router.replace(redirect)
    } else {
      errorMsg.value = 'Wrong PIN. Please try again.'
      enteredPin.value = ''
    }
  } catch (err) {
    errorMsg.value = 'Error verifying PIN.'
    console.error(err)
    enteredPin.value = ''
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
  max-width: 320px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.pin-icon { font-size: 48px; margin-bottom: 8px; }
.pin-title { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.pin-subtitle { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }

.pin-dots {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: white;
  transition: all 0.15s;
}

.dot.filled {
  background: var(--primary);
  border-color: var(--primary);
}

.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  max-width: 240px;
  margin: 0 auto;
}

.key-btn {
  height: 60px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: white;
  font-size: 22px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  transition: background 0.1s;
  -webkit-tap-highlight-color: transparent;
}

.key-btn:active:not(:disabled) {
  background: var(--primary-light);
}

.key-btn-action {
  color: var(--danger);
  font-size: 20px;
}

.key-btn:disabled { opacity: 0.5; }
</style>
