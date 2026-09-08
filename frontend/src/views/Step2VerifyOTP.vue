<template>
  <div>
    <h1 class="step-title">Verify OTP</h1>
    <p class="step-subtitle">
      Enter the 6-digit OTP sent to
      <strong>+91 {{ txStore.mobile }}</strong>
    </p>

    <div class="card">
      <!-- 6-digit OTP input boxes -->
      <div class="otp-boxes">
        <input
          v-for="(_, i) in 6"
          :key="i"
          :ref="(el) => { if (el) inputs[i] = el }"
          v-model="digits[i]"
          type="tel"
          inputmode="numeric"
          maxlength="1"
          pattern="\d"
          class="otp-box"
          :class="{ error: verifyError }"
          @input="onInput(i, $event)"
          @keydown="onKeydown(i, $event)"
          @paste="onPaste($event)"
        />
      </div>

      <div v-if="verifyError" class="alert alert-error">{{ verifyError }}</div>

      <button
        class="btn btn-primary"
        :disabled="loading || otp.length < 6"
        @click="verifyHandler"
        style="margin-top: 8px;"
      >
        {{ loading ? 'Verifying…' : 'Verify & Continue' }}
      </button>
    </div>

    <button class="back-link" @click="goBack">← Change mobile number</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { verifyOtp } from '../services/otp.js'
import { useTransactionStore } from '../store/transaction.js'

const router = useRouter()
const txStore = useTransactionStore()

const digits = ref(Array(6).fill(''))
const inputs = ref([])
const loading = ref(false)
const verifyError = ref('')

const otp = computed(() => digits.value.join(''))

function onInput(index, event) {
  verifyError.value = ''
  const val = event.target.value.replace(/\D/g, '')
  digits.value[index] = val.slice(-1)
  if (val && index < 5) {
    inputs.value[index + 1]?.focus()
  }
}

function onKeydown(index, event) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputs.value[index - 1]?.focus()
  }
}

function onPaste(event) {
  event.preventDefault()
  const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  text.split('').forEach((char, i) => { digits.value[i] = char })
  inputs.value[Math.min(text.length, 5)]?.focus()
}

async function verifyHandler() {
  verifyError.value = ''
  loading.value = true
  try {
    const result = await verifyOtp(txStore.mobile, otp.value)
    txStore.sessionToken = result.sessionToken
    txStore.setStep(3)
    router.push('/step3')
  } catch (err) {
    const msg = err.response?.data?.error || 'Verification failed. Please try again.'
    verifyError.value = msg
    digits.value = Array(6).fill('')
    inputs.value[0]?.focus()
  } finally {
    loading.value = false
  }
}

function goBack() {
  txStore.setStep(1)
  router.push('/step1')
}
</script>

<style scoped>
.otp-boxes {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.otp-box {
  width: 44px;
  height: 52px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  padding: 0;
  background: white;
  color: var(--text);
  -webkit-appearance: none;
  transition: border-color 0.15s;
}

.otp-box:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.otp-box.error {
  border-color: var(--danger);
}

.back-link {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 14px;
  cursor: pointer;
  margin-top: 12px;
  display: block;
  text-align: center;
  width: 100%;
  padding: 8px;
}
</style>
