<template>
  <div>
    <h1 class="step-title">Customer Details</h1>
    <p class="step-subtitle">Fill in the seller's information accurately.</p>

    <div class="card">
      <div class="form-group">
        <label>Full Name *</label>
        <input
          v-model="form.fullName"
          type="text"
          placeholder="As on Aadhaar card"
          :class="{ error: errors.fullName }"
          @input="errors.fullName = ''"
        />
        <div v-if="errors.fullName" class="field-error">{{ errors.fullName }}</div>
      </div>

      <div class="form-group">
        <label>Date of Birth *</label>
        <input
          v-model="form.dob"
          type="date"
          :max="maxDob"
          :class="{ error: errors.dob }"
          @change="errors.dob = ''"
        />
        <div v-if="errors.dob" class="field-error">{{ errors.dob }}</div>
      </div>

      <div class="form-group">
        <label>Email Address</label>
        <input
          v-model="form.email"
          type="email"
          placeholder="customer@example.com"
          inputmode="email"
          :class="{ error: errors.email }"
          @input="errors.email = ''"
        />
        <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
      </div>

      <div class="form-group">
        <label>Address *</label>
        <textarea
          v-model="form.address"
          rows="3"
          placeholder="Full address including city and pincode"
          :class="{ error: errors.address }"
          @input="errors.address = ''"
        />
        <div v-if="errors.address" class="field-error">{{ errors.address }}</div>
      </div>

      <div class="form-group">
        <label>Aadhaar Number *</label>
        <div class="masked-input-row">
          <input
            v-model="form.aadhaarNumber"
            :type="showAadhaar ? 'text' : 'password'"
            inputmode="numeric"
            maxlength="12"
            pattern="\d{12}"
            placeholder="12-digit Aadhaar number"
            :class="{ error: errors.aadhaarNumber }"
            @input="errors.aadhaarNumber = ''"
          />
          <button type="button" class="toggle-btn" @click="showAadhaar = !showAadhaar">
            {{ showAadhaar ? '🙈' : '👁️' }}
          </button>
        </div>
        <div v-if="errors.aadhaarNumber" class="field-error">{{ errors.aadhaarNumber }}</div>
      </div>

      <div class="form-group">
        <label>IMEI Number *</label>
        <input
          v-model="form.imei"
          type="text"
          inputmode="numeric"
          maxlength="15"
          pattern="\d{15}"
          placeholder="15-digit IMEI (dial *#06#)"
          :class="{ error: errors.imei }"
          @input="errors.imei = ''"
        />
        <div v-if="errors.imei" class="field-error">{{ errors.imei }}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
          Dial *#06# on the phone to get the IMEI number.
        </div>
      </div>

      <button class="btn btn-primary" @click="proceed">
        Next: Aadhaar Photos →
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '../store/transaction.js'

const router = useRouter()
const txStore = useTransactionStore()

const showAadhaar = ref(false)

// Initialise from store (supports going back)
const form = reactive({
  fullName: txStore.details.fullName,
  dob: txStore.details.dob,
  email: txStore.details.email,
  address: txStore.details.address,
  aadhaarNumber: txStore.details.aadhaarNumber,
  imei: txStore.details.imei,
})

const errors = reactive({})

// Max DOB: must be at least 18 years old
const maxDob = new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000)
  .toISOString()
  .slice(0, 10)

function validate() {
  let valid = true
  if (!form.fullName.trim()) { errors.fullName = 'Full name is required.'; valid = false }
  if (!form.dob) { errors.dob = 'Date of birth is required.'; valid = false }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.'; valid = false
  }
  if (!form.address.trim()) { errors.address = 'Address is required.'; valid = false }
  if (!/^\d{12}$/.test(form.aadhaarNumber)) {
    errors.aadhaarNumber = 'Aadhaar number must be exactly 12 digits.'; valid = false
  }
  if (!/^\d{15}$/.test(form.imei)) {
    errors.imei = 'IMEI must be exactly 15 digits.'; valid = false
  }
  return valid
}

function proceed() {
  if (!validate()) return
  // Save to store (aadhaarNumber handled carefully — never logged)
  Object.assign(txStore.details, form)
  txStore.setStep(4)
  router.push('/step4')
}
</script>

<style scoped>
.masked-input-row {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.masked-input-row:focus-within { border-color: var(--primary); }
.masked-input-row input {
  border: none !important;
  border-radius: 0 !important;
  flex: 1;
}
.masked-input-row input:focus { outline: none; }
.toggle-btn {
  background: none;
  border: none;
  padding: 0 12px;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}
</style>
