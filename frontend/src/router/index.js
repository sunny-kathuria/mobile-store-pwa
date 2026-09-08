import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.js'
import { isPinSet } from '../services/pin.js'

// Views
import PinSetup from '../views/PinSetup.vue'
import PinLock from '../views/PinLock.vue'
import Step1OTP from '../views/Step1OTP.vue'
import Step2VerifyOTP from '../views/Step2VerifyOTP.vue'
import Step3Details from '../views/Step3Details.vue'
import Step4Aadhaar from '../views/Step4Aadhaar.vue'
import Step5Selfie from '../views/Step5Selfie.vue'
import Success from '../views/Success.vue'
import Settings from '../views/Settings.vue'

// Step index map — used to enforce linear wizard navigation
const STEP_ROUTES = ['/step1', '/step2', '/step3', '/step4', '/step5']

const routes = [
  { path: '/pin-setup', component: PinSetup },
  { path: '/pin-lock', component: PinLock },
  { path: '/step1', component: Step1OTP },
  { path: '/step2', component: Step2VerifyOTP },
  { path: '/step3', component: Step3Details },
  { path: '/step4', component: Step4Aadhaar },
  { path: '/step5', component: Step5Selfie },
  { path: '/success', component: Success },
  { path: '/settings', component: Settings },
  // Default redirect
  { path: '/', redirect: '/step1' },
  { path: '/:pathMatch(.*)*', redirect: '/step1' },
]

// Using hash history — simplest for GitHub Pages, no 404.html tricks needed
const router = createRouter({
  history: createWebHashHistory('/mobile-store-pwa/'),
  routes,
})

// ─── Global Navigation Guard ──────────────────────────────────────────────────
router.beforeEach(async (to) => {
  const pinSet = await isPinSet()
  const authStore = useAuthStore()

  // Allow PIN setup and lock routes always
  if (to.path === '/pin-setup' || to.path === '/pin-lock') return true

  // If no PIN set yet — must go to setup
  if (!pinSet) return { path: '/pin-setup' }

  // If PIN is set but session is locked — must unlock first
  if (!authStore.isUnlocked) return { path: '/pin-lock' }

  // Settings requires re-auth if session expired (idle > 5 min)
  if (to.path === '/settings' && authStore.isSessionExpired()) {
    authStore.lock()
    return { path: '/pin-lock' }
  }

  // Enforce linear wizard step order
  const stepIndex = STEP_ROUTES.indexOf(to.path)
  if (stepIndex > 0) {
    const { useTransactionStore } = await import('../store/transaction.js')
    const txStore = useTransactionStore()
    // Allow going back, never skip forward
    if (stepIndex > txStore.currentStep - 1) {
      return { path: STEP_ROUTES[txStore.currentStep - 1] || '/step1' }
    }
  }

  return true
})

export default router
