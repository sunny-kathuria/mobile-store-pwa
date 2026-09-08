import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useTransactionStore = defineStore('transaction', () => {
  // Current wizard step (1–5). Step N is unlocked when step N-1 is complete.
  const currentStep = ref(1)

  // OTP step
  const mobile = ref('')
  const sessionToken = ref('')

  // Customer details (step 3)
  const details = reactive({
    fullName: '',
    dob: '',
    email: '',
    address: '',
    aadhaarNumber: '',
    imei: '',
  })

  // Aadhaar images (step 4) — stored as File objects
  const aadhaarFrontFile = ref(null)
  const aadhaarBackFile = ref(null)

  // Selfie (step 5) — stored as Blob
  const selfieBlob = ref(null)

  // Advance to next step
  function nextStep() {
    if (currentStep.value < 5) currentStep.value++
  }

  // Mark a specific step as reached (used when navigating back)
  function setStep(n) {
    if (n >= 1 && n <= 5) currentStep.value = n
  }

  // Reset entire wizard state for a new transaction
  function reset() {
    currentStep.value = 1
    mobile.value = ''
    sessionToken.value = ''
    details.fullName = ''
    details.dob = ''
    details.email = ''
    details.address = ''
    details.aadhaarNumber = ''
    details.imei = ''
    aadhaarFrontFile.value = null
    aadhaarBackFile.value = null
    selfieBlob.value = null
  }

  return {
    currentStep,
    mobile,
    sessionToken,
    details,
    aadhaarFrontFile,
    aadhaarBackFile,
    selfieBlob,
    nextStep,
    setStep,
    reset,
  }
})
