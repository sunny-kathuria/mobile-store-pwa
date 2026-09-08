<template>
  <div id="app-wrapper">
    <!-- App Header -->
    <header class="app-header" v-if="showHeader">
      <div class="header-content">
        <span class="app-title">📱 Mobile Store</span>
        <button
          class="settings-btn"
          @click="goToSettings"
          aria-label="Settings"
          v-if="isUnlocked"
        >
          ⚙️
        </button>
      </div>
      <!-- Progress bar shown only during wizard steps -->
      <ProgressBar v-if="showProgressBar" :current-step="currentStep" />
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './store/auth.js'
import { useTransactionStore } from './store/transaction.js'
import ProgressBar from './components/ProgressBar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const txStore = useTransactionStore()

const isUnlocked = computed(() => authStore.isUnlocked)

const wizardRoutes = ['/step1', '/step2', '/step3', '/step4', '/step5']
const showProgressBar = computed(() => wizardRoutes.includes(route.path))
const showHeader = computed(() => !['/', '/pin-setup', '/pin-lock'].includes(route.path))

const currentStep = computed(() => txStore.currentStep)

function goToSettings() {
  router.push('/settings')
}
</script>

<style>
:root {
  --primary: #1a56db;
  --primary-dark: #1341a8;
  --primary-light: #e8f0fe;
  --success: #059669;
  --warning: #d97706;
  --danger: #dc2626;
  --text: #111827;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --bg: #f3f4f6;
  --white: #ffffff;
  --radius: 12px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

#app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--primary);
  color: white;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 10px;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.settings-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  line-height: 1;
}

.settings-btn:active {
  background: rgba(255,255,255,0.15);
}

.app-main {
  flex: 1;
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

/* ── Card ── */
.card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  margin-bottom: 16px;
}

/* ── Form elements ── */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  color: var(--text);
  background: var(--white);
  transition: border-color 0.15s;
  -webkit-appearance: none;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.form-group input.error,
.form-group textarea.error {
  border-color: var(--danger);
}

.field-error {
  color: var(--danger);
  font-size: 12px;
  margin-top: 4px;
}

/* ── Buttons ── */
.btn {
  display: block;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: opacity 0.15s, transform 0.1s;
}

.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover:not(:disabled) { background: var(--primary-dark); }

.btn-success { background: var(--success); color: white; }
.btn-outline {
  background: transparent;
  color: var(--primary);
  border: 1.5px solid var(--primary);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
  width: auto;
  display: inline-block;
}

/* ── Badge ── */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.badge-success { background: #d1fae5; color: #065f46; }
.badge-warning { background: #fef3c7; color: #92400e; }

/* ── Step title ── */
.step-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}
.step-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 20px;
}

/* ── Alert ── */
.alert {
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}
.alert-error { background: #fee2e2; color: #991b1b; }
.alert-info { background: #dbeafe; color: #1e40af; }
</style>
