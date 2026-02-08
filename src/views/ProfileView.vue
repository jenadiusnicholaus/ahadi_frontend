<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import WebNavbar from '@/components/WebNavbar.vue'
import { useAuthStore } from '@/stores/auth'
import { getMe, deleteMe, patchMeProfilePicture } from '@/api/auth'
import { mediaUrl } from '@/api/client'

const router = useRouter()
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingPhoto = ref(false)
const photoError = ref('')
const authStore = useAuthStore()
const { user: storeUser } = storeToRefs(authStore)

const loading = ref(true)
const errorMessage = ref('')
const profile = ref<Record<string, unknown> | null>(null)

async function loadProfile() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getMe() as { data?: Record<string, unknown>; full_name?: string; phone?: string; email?: string }
    const data = res && typeof res === 'object' && 'data' in res ? (res.data ?? res) : res
    profile.value = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Failed to load profile'
    profile.value = null
  } finally {
    loading.value = false
  }
}

const displayUser = computed(() => {
  const p = profile.value
  if (p) return p
  const u = storeUser.value
  if (u) return { full_name: u.full_name, phone: u.phone, email: u.email, id: u.id }
  return null
})

const fullName = computed(() => (displayUser.value?.full_name as string) ?? 'Not set')
const phone = computed(() => (displayUser.value?.phone as string) ?? 'Not set')
const email = computed(() => (displayUser.value?.email as string) ?? 'Not set')
const profilePictureUrl = computed(() => {
  const url = displayUser.value?.profile_picture as string | undefined
  return url ? mediaUrl(url) : null
})
const initial = computed(() => {
  const name = fullName.value
  return name && name !== 'Not set' && name.length > 0 ? name.charAt(0).toUpperCase() : 'U'
})

const subscription = computed(() => {
  const sub = displayUser.value?.subscription as Record<string, unknown> | undefined
  return sub ?? {}
})
const planName = computed(() => (subscription.value?.plan as string) ?? 'Free')
const planType = computed(() => ((subscription.value?.plan_type as string) ?? 'FREE').toUpperCase())
const planColor = computed(() => {
  switch (planType.value) {
    case 'VIP': case 'INSTITUTIONAL': return '#7c3aed'
    case 'PREMIUM': return '#d97706'
    case 'BASIC': return '#1a283b'
    default: return '#64748b'
  }
})

const stats = computed(() => {
  const s = displayUser.value?.stats as Record<string, number> | undefined
  return s ?? {}
})
const ownedEvents = computed(() => stats.value?.owned_events ?? 0)
const participatingEvents = computed(() => stats.value?.participating_events ?? 0)

const features = computed(() => {
  const f = (subscription.value?.features as Record<string, boolean>) ?? {}
  return {
    chat: f?.chat ?? false,
    invitations: f?.invitations ?? false,
    reminders: f?.reminders ?? false,
    reports: f?.reports ?? false,
  }
})

function triggerPhotoUpload() {
  photoError.value = ''
  fileInput.value?.click()
}

async function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) {
    photoError.value = 'Please select an image file.'
    return
  }
  input.value = ''
  uploadingPhoto.value = true
  photoError.value = ''
  try {
    const res = await patchMeProfilePicture(file) as { data?: Record<string, unknown> }
    const data = res && typeof res === 'object' && 'data' in res ? res.data : res
    if (data && typeof data === 'object') {
      profile.value = { ...profile.value, ...data } as Record<string, unknown>
      authStore.setUser(data as { id?: number; full_name?: string; phone?: string; email?: string | null; [key: string]: unknown })
    }
  } catch (e) {
    photoError.value = e instanceof Error ? e.message : 'Upload failed'
  } finally {
    uploadingPhoto.value = false
  }
}

function openEdit() {
  router.push({ name: 'profile-edit' })
}

function goToSubscriptions() {
  router.push({ name: 'subscriptions' })
}

function goToWallet() {
  router.push({ name: 'wallet' })
}

function goToTransactions() {
  router.push({ name: 'transactions' })
}

async function doLogout() {
  try {
    await authStore.logout()
    router.push({ name: 'login' })
  } catch {
    router.push({ name: 'login' })
  }
}

function confirmDelete() {
  if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return
  deleteAccount()
}

async function deleteAccount() {
  try {
    await deleteMe()
    authStore.logout()
    router.push({ name: 'login' })
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Failed to delete account'
  }
}

onMounted(() => loadProfile())
</script>

<template>
  <div class="profile-page">
    <WebNavbar />
    <main class="profile-main">
      <header class="profile-header">
        <h1 class="profile-title">Profile</h1>
        <button type="button" class="btn-edit" aria-label="Edit profile" @click="openEdit">
          Edit
        </button>
      </header>

      <div v-if="loading && !displayUser" class="state state-loading">
        <div class="loader" aria-hidden="true" />
        <p>Loading profile…</p>
      </div>

      <div v-else-if="errorMessage && !displayUser" class="state state-error">
        <p class="error-message">{{ errorMessage }}</p>
        <button type="button" class="btn-retry" @click="loadProfile">Retry</button>
      </div>

      <template v-else-if="displayUser">
        <div class="profile-picture-section">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="photo-input"
            aria-label="Upload profile photo"
            @change="onPhotoSelected"
          />
          <button
            type="button"
            class="avatar-wrap avatar-btn"
            :disabled="uploadingPhoto"
            @click="triggerPhotoUpload"
          >
            <div v-if="uploadingPhoto" class="avatar-overlay"><span class="spinner" /></div>
            <img
              v-else-if="profilePictureUrl"
              :src="profilePictureUrl"
              alt="Profile"
              class="avatar-img"
            />
            <span v-else class="avatar-initial">{{ initial }}</span>
          </button>
          <p v-if="photoError" class="photo-error">{{ photoError }}</p>
          <button type="button" class="btn-change-photo" :disabled="uploadingPhoto" @click="triggerPhotoUpload">
            {{ uploadingPhoto ? 'Uploading…' : 'Change profile photo' }}
          </button>
          <p class="profile-name">{{ fullName }}</p>
          <p class="profile-phone">{{ phone }}</p>
        </div>

        <section class="card">
          <h2 class="card-title">Personal Information</h2>
          <hr class="card-divider" />
          <div class="info-row">
            <span class="info-icon" aria-hidden="true">👤</span>
            <div class="info-content">
              <span class="info-label">Full Name</span>
              <span class="info-value">{{ fullName }}</span>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon" aria-hidden="true">📱</span>
            <div class="info-content">
              <span class="info-label">Phone</span>
              <span class="info-value">{{ phone }}</span>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon" aria-hidden="true">✉️</span>
            <div class="info-content">
              <span class="info-label">Email</span>
              <span class="info-value">{{ email }}</span>
            </div>
          </div>
        </section>

        <section class="card subscription-card" :style="{ borderColor: planColor + '40' }">
          <div class="subscription-inner" :style="{ background: `linear-gradient(135deg, ${planColor}18, ${planColor}08)` }">
            <div class="subscription-icon" :style="{ backgroundColor: planColor + '30' }">
              <span :style="{ color: planColor }">★</span>
            </div>
            <div class="subscription-text">
              <span class="subscription-label">Current Plan</span>
              <span class="subscription-name" :style="{ color: planColor }">{{ planName }}</span>
            </div>
            <button type="button" class="btn-upgrade" @click="goToSubscriptions">Upgrade</button>
          </div>
        </section>

        <section class="card">
          <h2 class="card-title">Your Activity</h2>
          <hr class="card-divider" />
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-icon">📅</span>
              <span class="stat-value">{{ ownedEvents }}</span>
              <span class="stat-label">Events Created</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">👥</span>
              <span class="stat-value">{{ participatingEvents }}</span>
              <span class="stat-label">Participating</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">💰</span>
              <span class="stat-value">0</span>
              <span class="stat-label">Contributions</span>
            </div>
          </div>
        </section>

        <section class="card">
          <h2 class="card-title">Finance</h2>
          <hr class="card-divider" />
          <button type="button" class="finance-option" @click="goToWallet">
            <span class="finance-icon">👛</span>
            <div class="finance-text">
              <span class="finance-title">My Wallet</span>
              <span class="finance-subtitle">View balance and transactions</span>
            </div>
            <span class="finance-chevron">›</span>
          </button>
          <button type="button" class="finance-option" @click="goToTransactions">
            <span class="finance-icon">📋</span>
            <div class="finance-text">
              <span class="finance-title">Transaction History</span>
              <span class="finance-subtitle">View all your transactions</span>
            </div>
            <span class="finance-chevron">›</span>
          </button>
        </section>

        <section class="card">
          <h2 class="card-title">Plan Features</h2>
          <hr class="card-divider" />
          <div class="feature-row" :class="{ enabled: features.chat }">
            <span class="feature-icon">{{ features.chat ? '✓' : '○' }}</span>
            <span class="feature-label">Event Chat</span>
          </div>
          <div class="feature-row" :class="{ enabled: features.invitations }">
            <span class="feature-icon">{{ features.invitations ? '✓' : '○' }}</span>
            <span class="feature-label">Send Invitations</span>
          </div>
          <div class="feature-row" :class="{ enabled: features.reminders }">
            <span class="feature-icon">{{ features.reminders ? '✓' : '○' }}</span>
            <span class="feature-label">Payment Reminders</span>
          </div>
          <div class="feature-row" :class="{ enabled: features.reports }">
            <span class="feature-icon">{{ features.reports ? '✓' : '○' }}</span>
            <span class="feature-label">Advanced Reports</span>
          </div>
        </section>

        <div class="actions">
          <button type="button" class="btn-logout" @click="doLogout">Logout</button>
          <button type="button" class="btn-delete" @click="confirmDelete">Delete Account</button>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f8fafc;
}

.profile-main {
  max-width: 560px;
  margin: 0 auto;
  padding: 24px 16px;
  padding-top: 72px;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.profile-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.btn-edit {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #1a283b;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
}

.btn-edit:hover {
  background: #f1f5f9;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: #64748b;
}

.state-loading .loader {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #1a283b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message { color: #dc2626; margin-bottom: 12px; }
.btn-retry {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #1a283b;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
}

.profile-picture-section {
  text-align: center;
  margin-bottom: 24px;
}

.photo-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.avatar-wrap {
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
  border-radius: 50%;
  border: 3px solid rgba(26, 40, 59, 0.2);
  overflow: hidden;
  background: rgba(26, 40, 59, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-btn {
  cursor: pointer;
  padding: 0;
  position: relative;
}

.avatar-btn:disabled { cursor: wait; }
.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.photo-error { color: #dc2626; font-size: 13px; margin: 8px 0 0; }
.btn-change-photo {
  margin-top: 8px;
  padding: 6px 12px;
  font-size: 14px;
  color: #1a283b;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
}
.btn-change-photo:hover:not(:disabled) { background: #f1f5f9; }
.btn-change-photo:disabled { opacity: 0.7; cursor: wait; }

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  font-size: 48px;
  font-weight: 700;
  color: #1a283b;
}

.profile-name { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
.profile-phone { font-size: 14px; color: #64748b; margin: 0; }

.card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px;
}

.card-divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 0 0 16px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.info-row:last-child { margin-bottom: 0; }

.info-icon { font-size: 20px; }
.info-content { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 12px; color: #64748b; }
.info-value { font-size: 16px; font-weight: 500; color: #1e293b; }

.subscription-card { padding: 0; overflow: hidden; }
.subscription-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.subscription-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.subscription-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.subscription-label { font-size: 12px; color: #64748b; }
.subscription-name { font-size: 20px; font-weight: 700; }

.btn-upgrade {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #1a283b;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
}

.btn-upgrade:hover { background: #f1f5f9; }

.stats-row {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-icon { font-size: 24px; }
.stat-value { font-size: 20px; font-weight: 700; color: #1e293b; }
.stat-label { font-size: 12px; color: #64748b; text-align: center; }

.finance-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
}

.finance-option:last-child { margin-bottom: 0; }
.finance-option:hover { background: #f8fafc; }

.finance-icon { font-size: 24px; }
.finance-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.finance-title { font-size: 16px; font-weight: 500; color: #1e293b; }
.finance-subtitle { font-size: 12px; color: #64748b; }
.finance-chevron { font-size: 20px; color: #94a3b8; }

.feature-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  color: #94a3b8;
}

.feature-row.enabled { color: #1e293b; }
.feature-icon { font-size: 18px; }
.feature-label { font-size: 14px; }

.actions { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; max-width: 400px; margin-left: auto; margin-right: auto; }

.btn-logout {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 500;
  color: #ea580c;
  background: transparent;
  border: 1px solid #ea580c;
  border-radius: 8px;
  cursor: pointer;
}

.btn-logout:hover { background: #fff7ed; }

.btn-delete {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 500;
  color: #dc2626;
  background: transparent;
  border: 1px solid #dc2626;
  border-radius: 8px;
  cursor: pointer;
}

.btn-delete:hover { background: #fef2f2; }
</style>
