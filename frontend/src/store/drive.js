import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDriveStore = defineStore('drive', () => {
  const isConnected = ref(false)
  const userEmail = ref('')
  const accessToken = ref('')
  const tokenExpiresAt = ref(0)
  const isSyncing = ref(false)

  function setToken(token, email, expiresIn) {
    accessToken.value = token
    userEmail.value = email
    isConnected.value = true
    // expiresIn is in seconds from now
    tokenExpiresAt.value = Date.now() + expiresIn * 1000
  }

  function isTokenValid() {
    return isConnected.value &&
      accessToken.value &&
      Date.now() < tokenExpiresAt.value - 60_000 // 60s buffer
  }

  function disconnect() {
    isConnected.value = false
    userEmail.value = ''
    accessToken.value = ''
    tokenExpiresAt.value = 0
  }

  return {
    isConnected,
    userEmail,
    accessToken,
    tokenExpiresAt,
    isSyncing,
    setToken,
    isTokenValid,
    disconnect,
  }
})
