<template>
  <div>
    <h1 class="step-title">Customer Mobile</h1>
    <p class="step-subtitle">Enter the seller's mobile number to send a verification OTP.</p>

    <div class="card">
      <div class="form-group">
        <label>Mobile Number</label>
        <div class="mobile-input-row">
          <span class="country-code">+91</span>
          <input
            v-model="mobile"
            type="tel"
            inputmode="numeric"
            maxlength="10"
            pattern="\d{10}"
            placeholder="9876543210"
            :class="{ error: mobileError }"
            @input="mobileError = ''"
          />
        </div>
        <div v-if="mobileError" class="field-error">{{ mobileError }}</div>
      </div>

      <div v-if="apiError" class="alert alert-error">{{ apiError }}</div>
      <button
        class="btn btn-primary"
        :disabled="loading || mobile.length !== 10"
        @click="sendOtpHandler"
      >
        {{ loading ? 'Sending…' : 'Send OTP' }}
      </button>
    </div>

    <p class="legal-note">
      By proceeding, the customer agrees to legally sell this device to the store.
      An OTP is sent as proof of consent.
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { sendOtp } from '../services/otp.js'
import { useTransactionStore } from '../store/transaction.js'

const router = useRouter()
const txStore = useTransactionStore()

const mobile = ref(txStore.mobile || '')
const loading = ref(false)
const mobileError = ref('')
const apiError = ref('')

async function sendOtpHandler() {
  mobileError.value = ''
  apiError.value = ''

  if (!/^\d{10}$/.test(mobile.value)) {
    mobileError.value = 'Enter a valid 10-digit mobile number.'
    return
  }

  loading.value = true
  try {
    await sendOtp(mobile.value)
    txStore.mobile = mobile.value
    txStore.setStep(2)
    router.push('/step2')
  } catch (err) {
    const msg = err.response?.data?.error || 'Failed to send OTP. Please try again.'
    apiError.value = msg
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
.mobile-input-row {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.mobile-input-row:focus-within {
  border-color: var(--primary);
}

.country-code {
  padding: 12px 12px;
  background: var(--bg);
  color: var(--text-muted);
  font-size: 16px;
  font-weight: 600;
  border-right: 1.5px solid var(--border);
  white-space: nowrap;
}

.mobile-input-row input {
  border: none !important;
  border-radius: 0 !important;
  flex: 1;
}

.mobile-input-row input:focus {
  outline: none;
}

.legal-note {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  margin-top: 8px;
  line-height: 1.5;
  padding: 0 8px;
}
</style>
