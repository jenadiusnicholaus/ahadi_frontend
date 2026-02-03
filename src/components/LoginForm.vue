<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { signInWithGoogle } from '@/api/auth'
import PhoneVerifyModal from '@/components/PhoneVerifyModal.vue'
import type { VerifyOtpResponse } from '@/api/auth'

defineProps<{
  showMobileLogo?: boolean
}>()

const router = useRouter()
const authStore = useAuthStore()
const googleLoading = ref(false)
const googleError = ref<string | null>(null)
const showPhoneModal = ref(false)

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID as string | undefined
const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

function onWhatsApp() {
  window.location.href = '#'
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No window'))
      return
    }
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    const existing = document.querySelector(`script[src="${GSI_SCRIPT_URL}"]`)
    if (existing) {
      const check = () => (window.google?.accounts?.oauth2 ? resolve() : setTimeout(check, 50))
      check()
      return
    }
    const script = document.createElement('script')
    script.src = GSI_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'))
    document.head.appendChild(script)
  })
}

function onGoogle() {
  if (!GOOGLE_CLIENT_ID) {
    googleError.value = 'Google Sign-In is not configured (missing GOOGLE_CLIENT_ID).'
    return
  }
  googleError.value = null
  googleLoading.value = true
  loadGoogleScript()
    .then(() => {
      const google = window.google
      if (!google?.accounts?.oauth2) {
        throw new Error('Google Sign-In not available')
      }
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse: { access_token: string }) => {
          try {
            await signInWithGoogle({ access_token: tokenResponse.access_token })
            showPhoneModal.value = true
          } catch (err) {
            googleError.value = err instanceof Error ? err.message : 'Sign-in failed'
          } finally {
            googleLoading.value = false
          }
        },
      })
      tokenClient.requestAccessToken()
    })
    .catch((err) => {
      googleError.value = err instanceof Error ? err.message : 'Google Sign-In failed'
      googleLoading.value = false
    })
}

function onFacebook() {
  window.location.href = '#'
}

function onApple() {
  window.location.href = '#'
}

function onCreateEvent() {
  window.location.href = '#'
}

function onPhoneVerified(data: VerifyOtpResponse) {
  const d = data?.data
  const access = d?.access ?? d?.access_token
  const refresh = d?.refresh ?? d?.refresh_token
  if (access != null) {
    localStorage.setItem('ahadi_access', String(access))
  } else {
    localStorage.setItem('ahadi_access', 'session')
  }
  if (refresh != null) {
    localStorage.setItem('ahadi_refresh', String(refresh))
  }
  if (d?.user != null && typeof d.user === 'object') {
    authStore.setUser(d.user as { full_name?: string; id?: number; phone?: string; email?: string | null; [key: string]: unknown })
  }
  authStore.setSessionExpiry()
  authStore.setLoggedIn(true)
  showPhoneModal.value = false
  router.push({ name: 'home' })
}

function onPhoneModalClose() {
  showPhoneModal.value = false
}
</script>

<template>
  <div class="login-form">
    <div class="login-form-inner">
      <!-- Mobile logo (only when showMobileLogo) -->
      <template v-if="showMobileLogo">
        <div class="mobile-logo-wrap">
          <img
            src="/images/static_images/ahadi_logo.png"
            alt="Ahadi"
            class="mobile-logo-img"
          />
        </div>
        <div class="mobile-logo-spacer" />
      </template>

      <h1 class="form-title">Welcome Back</h1>
      <p class="form-subtitle">Sign in to manage your events and contributions</p>
      <div class="form-spacer" />

      <!-- WhatsApp (primary) -->
      <button type="button" class="btn-primary btn-whatsapp" @click="onWhatsApp">
        <span class="btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </span>
        <span>Continue with WhatsApp</span>
      </button>
      <div class="form-spacer-sm" />

      <!-- Divider -->
      <div class="divider">
        <span class="divider-line" />
        <span class="divider-text">or continue with</span>
        <span class="divider-line" />
      </div>
      <div class="form-spacer-sm" />

      <!-- Social row -->
      <div class="social-row">
        <button
          type="button"
          class="social-btn"
          aria-label="Continue with Google"
          :disabled="googleLoading"
          @click="onGoogle"
        >
          <span class="social-icon social-icon-google">
            <span v-if="googleLoading" class="social-spinner" aria-hidden="true" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </span>
          <span class="social-label">{{ googleLoading ? 'Signing in…' : 'Google' }}</span>
        </button>
        <button type="button" class="social-btn" aria-label="Continue with Facebook" @click="onFacebook">
          <span class="social-icon social-icon-facebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </span>
          <span class="social-label">Facebook</span>
        </button>
        <button type="button" class="social-btn" aria-label="Continue with Apple" @click="onApple">
          <span class="social-icon social-icon-apple">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          </span>
          <span class="social-label">Apple</span>
        </button>
      </div>
      <p v-if="googleError" class="form-error" role="alert">{{ googleError }}</p>
      <div class="form-spacer" />

      <!-- Terms -->
      <p class="terms">
        By continuing, you agree to our
        <a href="#">Terms of Service</a>
        and
        <a href="#">Privacy Policy</a>.
      </p>
      <div class="form-spacer-md" />

      <!-- Create event card -->
      <button type="button" class="create-event-card" @click="onCreateEvent">
        <span class="create-event-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </span>
        <span class="create-event-content">
          <span class="create-event-title">Create your first event</span>
          <span class="create-event-sub">Sign in to start organizing</span>
        </span>
        <span class="create-event-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>

    <PhoneVerifyModal
      :open="showPhoneModal"
      @close="onPhoneModalClose"
      @verified="onPhoneVerified"
    />
  </div>
</template>

<style scoped>
.login-form {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.login-form-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 8px;
  box-sizing: border-box;
}

.mobile-logo-wrap {
  width: 100px;
  height: 100px;
  background: #fff;
  border-radius: 25px;
  box-shadow: 0 10px 30px rgba(26, 40, 59, 0.15);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.mobile-logo-spacer {
  height: 32px;
}

.form-title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .form-title {
    font-size: 28px;
  }
}

.form-subtitle {
  margin: 10px 0 0;
  font-size: 15px;
  color: #6b7280;
  line-height: 1.4;
}

.form-spacer {
  height: 48px;
}

.form-spacer-sm {
  height: 32px;
}

.form-spacer-md {
  height: 40px;
}

/* Primary button (WhatsApp) */
.btn-primary {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.3px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  box-sizing: border-box;
}

.btn-whatsapp {
  background: #25d366;
  box-shadow: 0 4px 14px rgba(37, 211, 102, 0.4);
}

.btn-whatsapp:hover {
  filter: brightness(1.05);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 20px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, #d1d5db);
}

.divider-line:last-of-type {
  background: linear-gradient(to left, transparent, #d1d5db);
}

.divider-text {
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  flex-shrink: 0;
}

/* Social row */
.social-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 24px;
}

.social-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.social-btn:hover .social-icon {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.social-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a2e;
  transition: background 0.2s, border-color 0.2s;
}

.social-icon-google,
.social-icon-facebook,
.social-icon-apple {
  padding: 0;
}

.social-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.social-spinner {
  width: 22px;
  height: 22px;
  border: 2px solid #e5e7eb;
  border-top-color: #4285f4;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-error {
  margin: 12px 0 0;
  font-size: 13px;
  color: #b91c1c;
  text-align: center;
}

.social-btn:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

/* Terms */
.terms {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.5;
  padding: 0 16px;
}

.terms a {
  color: #1a283b;
  font-weight: 600;
  text-decoration: none;
}

.terms a:hover {
  text-decoration: underline;
}

/* Create event card */
.create-event-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(26, 40, 59, 0.05), rgba(26, 40, 59, 0.02));
  border: 1px solid rgba(26, 40, 59, 0.1);
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  box-sizing: border-box;
  transition: background 0.2s, border-color 0.2s;
}

.create-event-card:hover {
  background: linear-gradient(135deg, rgba(26, 40, 59, 0.08), rgba(26, 40, 59, 0.04));
  border-color: rgba(26, 40, 59, 0.15);
}

.create-event-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 40, 59, 0.1);
  border-radius: 14px;
  color: #1a283b;
}

.create-event-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.create-event-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.create-event-sub {
  font-size: 13px;
  color: #6b7280;
}

.create-event-arrow {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 40, 59, 0.1);
  border-radius: 50%;
  color: #1a283b;
}
</style>
