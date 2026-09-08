import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isUnlocked = ref(false)
  const lastUnlockedAt = ref(null)

  // Unlock the session and record timestamp
  function unlock() {
    isUnlocked.value = true
    lastUnlockedAt.value = Date.now()
  }

  // Lock the session
  function lock() {
    isUnlocked.value = false
    lastUnlockedAt.value = null
  }

  // Returns true if last unlock was > 5 minutes ago
  function isSessionExpired() {
    if (!lastUnlockedAt.value) return true
    return Date.now() - lastUnlockedAt.value > 5 * 60 * 1000
  }

  // Refresh the unlock timestamp (call on any user interaction in Settings)
  function refreshSession() {
    if (isUnlocked.value) {
      lastUnlockedAt.value = Date.now()
    }
  }

  return { isUnlocked, lastUnlockedAt, unlock, lock, isSessionExpired, refreshSession }
})
