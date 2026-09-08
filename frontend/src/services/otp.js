/**
 * OTP service — Mobile Store PWA
 * Calls the Cloudflare Worker proxy to send and verify OTPs.
 * The Fast2SMS API key is NEVER in this file — it lives in the Worker.
 */

import axios from 'axios'

const WORKER_URL = import.meta.env.VITE_WORKER_URL

if (!WORKER_URL) {
  console.error('VITE_WORKER_URL is not set. OTP sending will not work.')
}

/**
 * Send OTP to a mobile number via the Cloudflare Worker.
 * @param {string} mobile — 10-digit Indian mobile number
 * @returns {Promise<{ success: boolean }>}
 */
export async function sendOtp(mobile) {
  const res = await axios.post(`${WORKER_URL}/send`, { mobile })
  return res.data
}

/**
 * Verify the OTP entered by the user.
 * @param {string} mobile
 * @param {string} otp — 6-digit string
 * @returns {Promise<{ verified: boolean, sessionToken: string }>}
 */
export async function verifyOtp(mobile, otp) {
  const res = await axios.post(`${WORKER_URL}/verify`, { mobile, otp })
  return res.data
}
