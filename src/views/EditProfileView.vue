<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import WebNavbar from '@/components/WebNavbar.vue'
import { useAuthStore } from '@/stores/auth'
import { getMe, patchMe, patchMeProfilePicture, patchMeRemoveProfilePicture } from '@/api/auth'
import { mediaUrl } from '@/api/client'

const router = useRouter()
const authStore = useAuthStore()
const { user: storeUser } = storeToRefs(authStore)

const loading = ref(true)
const profile = ref<Record<string, unknown> | null>(null)
const fullName = ref('')
const email = ref('')
const saving = ref(false)
const errorMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingPhoto = ref(false)
const showPhotoOptions = ref(false)

const displayUser = computed(() => profile.value ?? (storeUser.value ? { full_name: storeUser.value.full_name, phone: storeUser.value.phone, email: storeUser.value.email, profile_picture: (storeUser.value as Record<string, unknown>).profile_picture } : null))

const phone = computed(() => (displayUser.value?.phone as string) ?? 'Not set')

const profilePictureUrl = computed(() => {
  const url = displayUser.value?.profile_picture as string | undefined
  return url ? mediaUrl(url) : null
})

const initial = computed(() => {
  const name = fullName.value || (displayUser.value?.full_name as string)
  return name && name.length > 0 ? name[0].toUpperCase() : 'U'
})

async function loadProfile() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getMe() as { data?: Record<string, unknown> }
    const data = res && typeof res === 'object' && 'data' in res ? (res.data ?? res) : res
    profile.value = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
    fullName.value = (displayUser.value?.full_name as string) ?? ''
    email.value = (displayUser.value?.email as string) ?? ''
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'profile' })
}

async function saveProfile() {
  saving.value = true
  errorMessage.value = ''
  try {
    const res = await patchMe({ full_name: fullName.value.trim(), email: email.value.trim() }) as { data?: Record<string, unknown> }
    const data = res && typeof res === 'object' && 'data' in res ? res.data : res
    if (data && typeof data === 'object') {
      profile.value = { ...profile.value, ...data } as Record<string, unknown>
      authStore.setUser(data as { id?: number; full_name?: string; phone?: string; email?: string | null; [key: string]: unknown })
    }
    router.push({ name: 'profile' })
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Failed to update'
  } finally {
    saving.value = false
  }
}

function triggerPhotoInput() {
  showPhotoOptions.value = false
  fileInput.value?.click()
}

async function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('image/')) return
  uploadingPhoto.value = true
  errorMessage.value = ''
  try {
    const res = await patchMeProfilePicture(file) as { data?: Record<string, unknown> }
    const data = res && typeof res === 'object' && 'data' in res ? res.data : res
    if (data && typeof data === 'object') {
      profile.value = { ...profile.value, ...data } as Record<string, unknown>
      authStore.setUser(data as { id?: number; full_name?: string; phone?: string; email?: string | null; [key: string]: unknown })
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Upload failed'
  } finally {
    uploadingPhoto.value = false
  }
}

function openPhotoOptions() {
  showPhotoOptions.value = true
}

function closePhotoOptions() {
  showPhotoOptions.value = false
}

async function removePhoto() {
  closePhotoOptions()
  uploadingPhoto.value = true
  errorMessage.value = ''
  try {
    const res = await patchMeRemoveProfilePicture() as { data?: Record<string, unknown> }
    const data = res && typeof res === 'object' && 'data' in res ? res.data : res
    if (data && typeof data === 'object') {
      profile.value = { ...profile.value, ...data } as Record<string, unknown>
      authStore.setUser(data as { id?: number; full_name?: string; phone?: string; email?: string | null; [key: string]: unknown })
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Failed to remove photo'
  } finally {
    uploadingPhoto.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="edit-profile-page">
    <WebNavbar />
    <header class="edit-header">
      <button type="button" class="btn-back" aria-label="Back" @click="goBack">← Back</button>
      <h1 class="edit-title">Edit Profile</h1>
      <button
        type="button"
        class="btn-save"
        :disabled="saving"
        @click="saveProfile"
      >
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </header>

    <main class="edit-main">
      <div v-if="loading" class="state">Loading…</div>

      <template v-else-if="displayUser">
        <!-- Profile picture -->
        <div class="photo-section">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="photo-input"
            aria-label="Upload photo"
            @change="onPhotoSelected"
          />
          <div class="photo-wrap">
            <button
              type="button"
              class="avatar-btn"
              :disabled="uploadingPhoto"
              @click="openPhotoOptions"
            >
              <div v-if="uploadingPhoto" class="avatar-overlay">
                <span class="spinner" />
              </div>
              <img
                v-else-if="profilePictureUrl"
                :src="profilePictureUrl"
                alt="Profile"
                class="avatar-img"
              />
              <span v-else class="avatar-initial">{{ initial }}</span>
            </button>
            <button
              type="button"
              class="avatar-camera"
              :disabled="uploadingPhoto"
              aria-label="Change photo"
              @click="openPhotoOptions"
            >
              📷
            </button>
          </div>
          <button type="button" class="btn-change-photo" :disabled="uploadingPhoto" @click="triggerPhotoInput">
            Change Profile Picture
          </button>

          <!-- Photo options (bottom sheet style) -->
          <Teleport to="body">
            <div v-if="showPhotoOptions" class="options-backdrop" @click.self="closePhotoOptions">
              <div class="options-sheet">
                <p class="options-title">Change Profile Picture</p>
                <button type="button" class="options-item" @click="triggerPhotoInput">
                  <span class="options-icon">🖼️</span> Choose from Gallery
                </button>
                <button
                  v-if="profilePictureUrl"
                  type="button"
                  class="options-item options-item-danger"
                  @click="removePhoto"
                >
                  <span class="options-icon">🗑️</span> Remove Photo
                </button>
                <button type="button" class="options-cancel" @click="closePhotoOptions">Cancel</button>
              </div>
            </div>
          </Teleport>
        </div>

        <!-- Full name -->
        <div class="field">
          <label class="field-label">Full Name</label>
          <input
            v-model="fullName"
            type="text"
            class="field-input"
            placeholder="Enter your full name"
          />
        </div>

        <!-- Email -->
        <div class="field">
          <label class="field-label">Email Address</label>
          <input
            v-model="email"
            type="email"
            class="field-input"
            placeholder="Enter your email address"
          />
        </div>

        <!-- Error -->
        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <!-- Phone (read-only) -->
        <div class="phone-info">
          <span class="phone-icon">📱</span>
          <div class="phone-text">
            <span class="phone-label">Phone Number</span>
            <span class="phone-value">{{ phone }}</span>
          </div>
          <span class="phone-lock" title="Read-only">🔒</span>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.edit-profile-page { min-height: 100vh; background: #f8fafc; }
.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}
.btn-back { background: none; border: none; color: #64748b; font-size: 14px; cursor: pointer; padding: 0; }
.btn-back:hover { color: #1e293b; }
.edit-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; }
.btn-save {
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: #1a283b;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.edit-main { max-width: 480px; margin: 0 auto; padding: 24px 16px; }
.state { text-align: center; padding: 48px; color: #64748b; }

.photo-section { text-align: center; margin-bottom: 32px; }
.photo-input { position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none; }
.photo-wrap { position: relative; display: inline-block; margin-bottom: 8px; }
.avatar-btn {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid rgba(26, 40, 59, 0.3);
  overflow: hidden;
  background: rgba(26, 40, 59, 0.08);
  padding: 0;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-btn:disabled { cursor: wait; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initial { font-size: 40px; font-weight: 700; color: #1a283b; }
.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.avatar-camera {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1a283b;
  border: 2px solid #fff;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.avatar-camera:disabled { opacity: 0.6; cursor: wait; }
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

.options-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.options-sheet {
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  width: 100%;
  max-width: 480px;
}
.options-title { font-size: 18px; font-weight: 700; margin: 0 0 16px; text-align: center; }
.options-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: #fff;
  font-size: 16px;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
}
.options-item:hover { background: #f1f5f9; }
.options-item-danger { color: #dc2626; }
.options-icon { font-size: 20px; }
.options-cancel {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  border: none;
  background: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
}

.field { margin-bottom: 20px; }
.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
}
.field-input {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-sizing: border-box;
}
.field-input:focus {
  outline: none;
  border-color: #1a283b;
  box-shadow: 0 0 0 2px rgba(26, 40, 59, 0.15);
}

.error-msg { color: #dc2626; font-size: 14px; margin-bottom: 16px; text-align: center; }

.phone-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f1f5f9;
  border-radius: 12px;
  margin-top: 24px;
}
.phone-icon { font-size: 20px; }
.phone-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.phone-label { font-size: 12px; color: #64748b; }
.phone-value { font-size: 16px; font-weight: 500; color: #1e293b; }
.phone-lock { font-size: 16px; opacity: 0.7; }
</style>
