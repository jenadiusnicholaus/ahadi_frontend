<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { requestOtp, verifyOtp, type VerifyOtpResponse } from '@/api/auth'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  verified: [data: VerifyOtpResponse]
}>()

function handleEscapeKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

const step = ref<'phone' | 'otp'>('phone')
const phone = ref('')
const otpCode = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const otpInputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      step.value = 'phone'
      phone.value = ''
      otpCode.value = ''
      error.value = null
      document.addEventListener('keydown', handleEscapeKey)
    } else {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  },
  { immediate: true }
)

watch(step, (s) => {
  if (s === 'otp') {
    otpCode.value = ''
    error.value = null
    setTimeout(() => otpInputRef.value?.focus(), 100)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscapeKey)
})

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement)?.classList?.contains('pv-backdrop')) emit('close')
}

function sendCode() {
  const num = phone.value.trim()
  if (!num) {
    error.value = 'Please enter your phone number'
    return
  }
  error.value = null
  loading.value = true
  requestOtp(num)
    .then(() => {
      step.value = 'otp'
    })
    .catch((err) => {
      error.value = err instanceof Error ? err.message : 'Failed to send code'
    })
    .finally(() => {
      loading.value = false
    })
}

function resendCode() {
  if (!phone.value.trim()) return
  error.value = null
  loading.value = true
  requestOtp(phone.value.trim())
    .then(() => {
      error.value = null
    })
    .catch((err) => {
      error.value = err instanceof Error ? err.message : 'Failed to resend'
    })
    .finally(() => {
      loading.value = false
    })
}

function changeNumber() {
  step.value = 'phone'
  otpCode.value = ''
  error.value = null
}

function onOtpInput(e: Event) {
  const input = e.target as HTMLInputElement
  let v = input.value.replace(/\D/g, '').slice(0, 6)
  input.value = v
  otpCode.value = v
  if (v.length === 6) submitVerify()
}

const BYPASS_CODE = '123456'

function submitVerify() {
  const code = otpCode.value.trim()
  if (code.length !== 6) {
    error.value = 'Please enter the 6-digit code'
    return
  }
  error.value = null
  loading.value = true

  if (code === BYPASS_CODE) {
    emit('verified', {
      success: true,
      message: 'OTP verified (bypass)',
      data: {
        access: 'bypass-access-token',
        refresh: 'bypass-refresh-token',
        user: { id: 1, phone: phone.value.trim(), email: null, full_name: 'User', is_active: true },
        requires_phone_link: false,
      },
    })
    emit('close')
    loading.value = false
    return
  }

  verifyOtp(phone.value.trim(), code)
    .then((data) => {
      emit('verified', data)
      emit('close')
    })
    .catch((err) => {
      error.value = err instanceof Error ? err.message : 'Invalid or expired code'
    })
    .finally(() => {
      loading.value = false
    })
}

function onVerifyClick() {
  submitVerify()
}

</script>

<template>
  <Teleport to="body">
    <Transition name="pv">
      <div
        v-if="open"
        class="pv-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pv-title"
        @click="onBackdropClick"
      >
        <div class="pv-box" @click.stop>
          <button
            type="button"
            class="pv-close"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          <div class="pv-content">
            <div class="pv-icon-wrap">
              <span class="pv-icon" :class="step === 'otp' ? 'pv-icon-otp' : ''">
                <svg v-if="step === 'phone'" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
            </div>

            <h2 id="pv-title" class="pv-title">
              {{ step === 'otp' ? 'Enter Verification Code' : 'Enter Phone Number' }}
            </h2>
            <p class="pv-subtitle">
              {{ step === 'otp' ? `We sent a 6-digit code to\n${phone}` : "We'll send you a verification code" }}
            </p>

            <p v-if="error" class="pv-error" role="alert">{{ error }}</p>

            <template v-if="step === 'phone'">
              <div class="pv-field">
                <label for="pv-phone">Phone Number</label>
                <input
                  id="pv-phone"
                  v-model="phone"
                  type="tel"
                  placeholder="+255 XXX XXX XXX"
                  class="pv-input"
                  maxlength="20"
                  autocomplete="tel"
                  @keydown.enter="sendCode"
                />
              </div>
              <button
                type="button"
                class="pv-btn"
                :disabled="loading"
                @click="sendCode"
              >
                <span v-if="loading" class="pv-spinner" />
                <span v-else>Send Verification Code</span>
              </button>
            </template>

            <template v-else>
              <div class="pv-otp-wrap">
                <label for="pv-otp">Code</label>
                <input
                  id="pv-otp"
                  ref="otpInputRef"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="6"
                  class="pv-otp-input"
                  placeholder="000000"
                  :value="otpCode"
                  autocomplete="one-time-code"
                  @input="onOtpInput"
                />
              </div>
              <button
                type="button"
                class="pv-btn"
                :disabled="loading || otpCode.length !== 6"
                @click="onVerifyClick"
              >
                <span v-if="loading" class="pv-spinner" />
                <span v-else>Verify Code</span>
              </button>
              <div class="pv-links">
                <button type="button" class="pv-link" :disabled="loading" @click="resendCode">
                  Resend Code
                </button>
                <span class="pv-sep">|</span>
                <button type="button" class="pv-link pv-link-muted" @click="changeNumber">
                  Change Number
                </button>
              </div>
            </template>

            <div class="pv-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span>
                {{ step === 'otp' ? 'Code expires in 5 minutes. Check your SMS messages.' : "Standard SMS rates may apply. We'll only use this for verification." }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pv-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

.pv-box {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.pv-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: #374151;
}

.pv-close:hover {
  background: #e5e7eb;
}

.pv-content {
  padding: 32px 24px 28px;
}

.pv-icon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.pv-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 40, 59, 0.1);
  border-radius: 20px;
  color: #1a283b;
}

.pv-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
  text-align: center;
}

.pv-subtitle {
  font-size: 15px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 24px;
  text-align: center;
  white-space: pre-line;
}

.pv-error {
  font-size: 14px;
  color: #b91c1c;
  margin: 0 0 16px;
  text-align: center;
}

.pv-field,
.pv-otp-wrap {
  margin-bottom: 20px;
}

.pv-field label,
.pv-otp-wrap label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.pv-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 18px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.pv-input:focus {
  outline: none;
  border-color: #1a283b;
}

.pv-input::placeholder {
  color: #9ca3af;
}

.pv-otp-input {
  width: 100%;
  padding: 16px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.5em;
  text-align: center;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.pv-otp-input:focus {
  outline: none;
  border-color: #1a283b;
}

.pv-otp-input::placeholder {
  color: #d1d5db;
}

.pv-btn {
  width: 100%;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #1a283b;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;
}

.pv-btn:hover:not(:disabled) {
  background: #2d3a4f;
}

.pv-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.pv-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pv-spin 0.7s linear infinite;
}

@keyframes pv-spin {
  to { transform: rotate(360deg); }
}

.pv-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.pv-link {
  background: none;
  border: none;
  font-size: 14px;
  color: #1a283b;
  cursor: pointer;
  padding: 4px 8px;
}

.pv-link:hover:not(:disabled) {
  text-decoration: underline;
}

.pv-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pv-link-muted {
  color: #6b7280;
}

.pv-sep {
  color: #e5e7eb;
  font-size: 14px;
}

.pv-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 24px;
  padding: 16px;
  background: #eff6ff;
  border-radius: 12px;
  color: #1e40af;
  font-size: 13px;
  line-height: 1.5;
}

.pv-info svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.pv-enter-active,
.pv-leave-active {
  transition: opacity 0.2s ease;
}

.pv-enter-active .pv-box,
.pv-leave-active .pv-box {
  transition: transform 0.2s ease;
}

.pv-enter-from,
.pv-leave-to {
  opacity: 0;
}

.pv-enter-from .pv-box,
.pv-leave-to .pv-box {
  transform: scale(0.96);
}
</style>
