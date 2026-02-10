<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { registerEventByJoinCode } from '@/api/event'
import type { PublicEvent } from '@/types/events'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  event: PublicEvent | null
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const authStore = useAuthStore()
const { isLoggedIn, user } = storeToRefs(authStore)
const toast = useToast()

const name = ref('')
const phone = ref('')
const email = ref('')
const submitting = ref(false)
const error = ref('')

const joinCode = computed(() => props.event?.join_code?.trim() || '')

const hasUserName = computed(() => {
  const n = user.value?.full_name
  return typeof n === 'string' && n.trim().length > 0
})

const showAsLoggedIn = computed(() => isLoggedIn.value && hasUserName.value)

// Prefill when dialog opens and user is logged in
watch(
  () => [props.open, user.value],
  () => {
    if (props.open && isLoggedIn.value && user.value) {
      name.value = user.value.full_name?.trim() || ''
      phone.value = user.value.phone?.trim() || ''
      email.value = (user.value.email ?? '')?.trim() || ''
    } else if (props.open) {
      name.value = ''
      phone.value = ''
      email.value = ''
    }
  },
  { immediate: true }
)

function validate(): boolean {
  error.value = ''
  if (!showAsLoggedIn.value && !name.value?.trim()) {
    error.value = 'Please enter your name.'
    return false
  }
  if (!phone.value?.trim()) {
    error.value = 'Please enter your phone number.'
    return false
  }
  const clean = phone.value.replace(/\D/g, '')
  if (clean.length < 9) {
    error.value = 'Please enter a valid phone number.'
    return false
  }
  if (!joinCode.value) {
    error.value = 'Event code is missing.'
    return false
  }
  return true
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  error.value = ''
  try {
    const payload = {
      name: showAsLoggedIn.value ? (user.value?.full_name?.trim() || name.value) : name.value.trim(),
      phone: phone.value.trim(),
      ...(email.value?.trim() ? { email: email.value.trim() } : {}),
    }
    const res = await registerEventByJoinCode(joinCode.value, payload) as
      | { success?: boolean; message?: string; data?: { already_joined?: boolean } }
      | unknown

    const success = (res as any)?.success ?? true
    const alreadyJoined = !!(res as any)?.data?.already_joined
    const message = (res as any)?.message as string | undefined

    if (success) {
      if (alreadyJoined) {
        toast.info(message || 'You have already joined this event.')
      } else {
        toast.success(message || 'Congratulations! You have joined this event.')
      }
    }

    emit('success')
    emit('close')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not join event. Try again.'
  } finally {
    submitting.value = false
  }
}

function onClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="join-backdrop" @click.self="onClose">
        <div class="join-dialog">
          <button type="button" class="join-close" aria-label="Close" @click="onClose">
            <span aria-hidden="true">&times;</span>
          </button>
          <h2 class="join-title">Join Event</h2>

          <div v-if="event" class="join-event-name">
            <span class="join-event-icon">📅</span>
            {{ event.title }}
          </div>

          <!-- Logged in with name: show "Joining as X" and phone -->
          <div v-if="showAsLoggedIn" class="join-as-block">
            <p class="join-as-label">Joining as</p>
            <p class="join-as-name">{{ user?.full_name }}</p>
          </div>

          <template v-if="!showAsLoggedIn">
            <label class="join-label">
              Your Name *
              <input
                v-model="name"
                type="text"
                class="join-input"
                placeholder="Full name"
              />
            </label>
          </template>

          <label class="join-label">
            Phone Number *
            <input
              v-model="phone"
              type="tel"
              class="join-input"
              placeholder="e.g. 0712345678"
            />
          </label>

          <label v-if="!showAsLoggedIn" class="join-label">
            Email (optional)
            <input
              v-model="email"
              type="email"
              class="join-input"
              placeholder="your@email.com"
            />
          </label>

          <p v-if="error" class="join-error">{{ error }}</p>

          <button
            type="button"
            class="join-submit"
            :disabled="submitting"
            @click="onSubmit"
          >
            <span v-if="submitting">Joining…</span>
            <span v-else>Join Event</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.join-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}
.join-dialog {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
}
.join-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.join-close:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}
.join-title {
  margin: 0 0 20px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
}
.join-event-name {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding: 14px 16px;
  background: #eef2ff;
  border: 2px solid #c7d2fe;
  border-radius: 12px;
  font-weight: 600;
  color: #3730a3;
  font-size: 0.9375rem;
}
.join-event-icon { 
  font-size: 1.25rem; 
}
.join-as-block {
  margin-bottom: 20px;
  padding: 14px 16px;
  background: #ecfdf5;
  border: 2px solid #a7f3d0;
  border-radius: 12px;
}
.join-as-label {
  margin: 0 0 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #047857;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.join-as-name {
  margin: 0;
  font-weight: 700;
  font-size: 1rem;
  color: #065f46;
}
.join-label {
  display: block;
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 10px;
  color: #1a1a2e;
}
.join-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  margin-bottom: 16px;
  box-sizing: border-box;
  color: #1a1a2e;
  background: #fff;
  transition: border-color 0.2s ease;
}
.join-input:focus {
  outline: none;
  border-color: #1a1a2e;
  box-shadow: 0 0 0 3px rgba(26, 26, 46, 0.1);
}
.join-input::placeholder {
  color: #9ca3af;
}
.join-error {
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 8px 0 16px;
  padding: 10px 14px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}
.join-submit {
  width: 100%;
  padding: 16px 24px;
  background: #1a1a2e;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(26, 26, 46, 0.3);
}
.join-submit:hover:not(:disabled) {
  background: #0f0f14;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(26, 26, 46, 0.4);
}
.join-submit:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
