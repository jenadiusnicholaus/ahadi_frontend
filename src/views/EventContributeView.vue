<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import WebNavbar from '@/components/WebNavbar.vue'
import { getApiBaseUrl } from '@/api/env'
import { fetchEventById } from '@/api/event'
import { checkoutMno } from '@/api/payments'
import { useAuthStore } from '@/stores/auth'
import type { PublicEvent } from '@/types/events'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const event = ref<PublicEvent | null>(null)
const loading = ref(true)
const error = ref<Error | null>(null)

const amountInput = ref('')
const messageInput = ref('')
const nameInput = ref('')
const selectedProvider = ref<string | null>(null)
const phoneInput = ref('')
const submitting = ref(false)
const submitError = ref('')

const PROVIDERS = [
  { value: 'Mpesa', label: 'M-Pesa (Vodacom)' },
  { value: 'Airtel', label: 'Airtel Money' },
  { value: 'Tigo', label: 'Tigo Pesa' },
  { value: 'Halotel', label: 'Halotel' },
] as const

const PRESET_AMOUNTS = [20000, 60000, 120000, 250000] as const

const eventId = computed(() => {
  const id = route.params.id
  if (typeof id !== 'string') return 0
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : 0
})

const currency = computed(() => event.value?.currency || 'TZS')

function buildAssetUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = getApiBaseUrl()
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path
}

const coverImageUrl = computed(() => {
  const raw = event.value?.cover_image
  if (!raw || typeof raw !== 'string') return ''
  return buildAssetUrl(raw)
})

const amountNum = computed(() => {
  const raw = String(amountInput.value).replace(/\D/g, '')
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
})

const currentPresetMatch = computed(() =>
  PRESET_AMOUNTS.includes(amountNum.value as (typeof PRESET_AMOUNTS)[number])
    ? amountNum.value
    : null
)

function formatAmount(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString() : '0'
}

async function loadEvent() {
  if (!eventId.value) return
  loading.value = true
  error.value = null
  try {
    event.value = (await fetchEventById(eventId.value)) as PublicEvent
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load event')
    event.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEvent()
  const q = route.query.amount
  if (typeof q === 'string' && q) {
    const n = Number(String(q).replace(/\D/g, ''))
    if (Number.isFinite(n) && n > 0) amountInput.value = String(n)
  }
  if (user.value?.full_name) {
    nameInput.value = user.value.full_name
  }
})

function setPreset(amount: number) {
  amountInput.value = String(amount)
}

function formatPhoneForApi(phoneStr: string): string {
  const clean = phoneStr.replace(/\D/g, '')
  if (clean.startsWith('0')) return '255' + clean.slice(1)
  if (!clean.startsWith('255')) return '255' + clean
  return clean
}

function goBack() {
  router.push({ name: 'event-public', params: { id: String(eventId.value) } })
}

async function submitContribute() {
  const ev = event.value
  if (!ev) return
  submitError.value = ''
  if (amountNum.value < 1000) {
    submitError.value = 'Minimum amount is 1,000.'
    return
  }
  if (!selectedProvider.value) {
    submitError.value = 'Please select a payment provider.'
    return
  }
  const cleanPhone = phoneInput.value.replace(/\D/g, '')
  if (cleanPhone.length < 9 || cleanPhone.length > 12) {
    submitError.value = 'Please enter a valid phone number.'
    return
  }
  submitting.value = true
  try {
    await checkoutMno({
      event_id: ev.id,
      amount: amountNum.value,
      phone_number: formatPhoneForApi(phoneInput.value),
      provider: selectedProvider.value,
      ...(nameInput.value?.trim() ? { payer_name: nameInput.value.trim() } : {}),
      ...(messageInput.value?.trim() ? { message: messageInput.value.trim() } : {}),
    })
    goBack()
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Payment could not be started. Try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="contribute-page">
    <WebNavbar />
    <main class="contribute-main">
      <button type="button" class="contribute-back" @click="goBack">Back</button>

      <template v-if="loading">
        <div class="contribute-state">Loading…</div>
      </template>
      <template v-else-if="error || !event">
        <div class="contribute-state contribute-state-error">
          {{ error?.message || 'Event not found' }}
        </div>
      </template>
      <template v-else>
        <div class="contribute-layout">
          <aside class="contribute-left">
            <h1 class="contribute-heading">You're contributing to {{ event.owner_name || event.title }}!</h1>
            <div class="contribute-image-wrap">
              <img
                v-if="coverImageUrl"
                :src="coverImageUrl"
                :alt="event.title"
                class="contribute-image"
              />
              <div v-else class="contribute-image-placeholder">📅</div>
            </div>
          </aside>
          <section class="contribute-card">
          <h2 class="contribute-card-title">Confirm one-time contribution amount</h2>

          <label class="contribute-field">
            <span class="contribute-field-label">Donation amount</span>
            <input
              v-model="amountInput"
              type="text"
              inputmode="numeric"
              class="contribute-amount-input"
              :placeholder="`${currency} 0`"
            />
          </label>

          <div class="contribute-presets">
            <button
              v-for="amt in PRESET_AMOUNTS"
              :key="amt"
              type="button"
              class="contribute-preset-btn"
              :class="{ active: currentPresetMatch === amt }"
              @click="setPreset(amt)"
            >
              {{ currency }} {{ formatAmount(amt) }}
            </button>
          </div>

          <label class="contribute-field">
            <span class="contribute-field-label">Your name (optional)</span>
            <input
              v-model="nameInput"
              type="text"
              class="contribute-amount-input"
              placeholder="How should we recognize you?"
            />
          </label>

          <label class="contribute-field">
            <span class="contribute-field-label">Message (optional)</span>
            <textarea
              v-model="messageInput"
              class="contribute-message"
              placeholder="Add a message with your contribution..."
              rows="3"
            />
          </label>

          <div class="contribute-payment-section">
            <h3 class="contribute-payment-heading">Choose payment method</h3>
            <div class="contribute-payment-tabs">
              <span class="contribute-payment-tab active">Mobile Money</span>
              <span class="contribute-payment-tab inactive">Card</span>
            </div>
            <div class="contribute-payment-card">
              <label class="contribute-payment-field">
                <span class="contribute-payment-label">Provider <span class="required">*</span></span>
                <select
                  v-model="selectedProvider"
                  class="contribute-payment-input"
                  :class="{ 'contribute-payment-input--placeholder': !selectedProvider }"
                  required
                >
                  <option value="" disabled selected>Choose mobile network</option>
                  <option v-for="p in PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
                </select>
              </label>
              <label class="contribute-payment-field">
                <span class="contribute-payment-label">Phone Number <span class="required">*</span></span>
                <input
                  v-model="phoneInput"
                  type="tel"
                  class="contribute-payment-input"
                  placeholder="0789123456"
                />
              </label>
            </div>
          </div>

          <p v-if="submitError" class="contribute-submit-error">{{ submitError }}</p>

          <button
            type="button"
            class="contribute-submit-btn"
            :disabled="submitting || amountNum < 1000"
            @click="submitContribute"
          >
            {{ submitting ? 'Processing…' : `Contribute ${currency} ${formatAmount(amountNum)}` }}
          </button>
          </section>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.contribute-page {
  min-height: 100vh;
  background: #fff;
}

.contribute-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 72px 24px 48px;
}

.contribute-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: start;
}

@media (min-width: 720px) {
  .contribute-layout {
    grid-template-columns: 380px 1fr;
  }
}

.contribute-left {
  background: #fff;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.contribute-heading {
  font-size: 1.625rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2rem;
  line-height: 1.3;
}

.contribute-image-wrap {
  display: inline-block;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  overflow: hidden;
  background: #e5e7eb;
}

.contribute-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contribute-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
}

.contribute-back {
  display: inline-flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
  font-size: 0.9375rem;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
}
.contribute-back:hover {
  color: #111827;
}

.contribute-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}
.contribute-state-error {
  color: #dc2626;
}

.contribute-card {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.contribute-card-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem;
}

.contribute-field {
  display: block;
  margin-bottom: 1rem;
}

.contribute-field-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.35rem;
}

.contribute-amount-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  box-sizing: border-box;
}
.contribute-amount-input:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

.contribute-presets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.contribute-preset-btn {
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #374151;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}
.contribute-preset-btn:hover {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #16a34a;
}
.contribute-preset-btn.active {
  border-color: #22c55e;
  background: #dcfce7;
  color: #16a34a;
  font-weight: 600;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
}

.contribute-message {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
}
.contribute-message:focus {
  outline: none;
  border-color: #22c55e;
}

.contribute-payment-section {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.contribute-payment-heading {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem;
}

.contribute-payment-tabs {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.contribute-payment-tab {
  font-size: 0.9375rem;
  font-weight: 500;
  padding-bottom: 0.5rem;
  cursor: default;
}
.contribute-payment-tab.active {
  color: #2563eb;
  border-bottom: 2px solid #2563eb;
}
.contribute-payment-tab.inactive {
  color: #9ca3af;
}

.contribute-payment-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.contribute-payment-field {
  display: block;
  margin-bottom: 1rem;
}
.contribute-payment-field:last-child {
  margin-bottom: 0;
}

.contribute-payment-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.35rem;
}

.contribute-payment-label .required {
  color: #dc2626;
}

.contribute-payment-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-family: inherit;
  background: #fff;
  box-sizing: border-box;
}
.contribute-payment-input--placeholder {
  color: #9ca3af;
}
.contribute-payment-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.contribute-submit-error {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: #dc2626;
}

.contribute-submit-btn {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: #111827;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.contribute-submit-btn:hover:not(:disabled) {
  background: #1f2937;
}
.contribute-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
