<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import WebNavbar from '@/components/WebNavbar.vue'
import PaymentStatusModal from '@/components/PaymentStatusModal.vue'
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
const providerDropdownOpen = ref(false)
const providerDropdownRef = ref<HTMLElement | null>(null)
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
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

const selectedProviderLabel = computed(() => {
  if (!selectedProvider.value) return ''
  const p = PROVIDERS.find((x) => x.value === selectedProvider.value)
  return p ? p.label : selectedProvider.value
})

const successMessage = computed(() => {
  if (!event.value) return ''
  const owner = event.value.owner_name || 'Event creator'
  const typeName = event.value.event_type_name ? ` (${event.value.event_type_name})` : ''
  return `${owner} says thank you for your contribution to ${event.value.title}${typeName}.`
})

const errorMessage = computed(() => {
  if (!submitError.value) {
    return 'Something went wrong starting your payment. Please try again.'
  }
  return submitError.value
})

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
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function setPreset(amount: number) {
  amountInput.value = String(amount)
}

function selectProvider(value: string) {
  selectedProvider.value = value
  providerDropdownOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (providerDropdownRef.value && !providerDropdownRef.value.contains(e.target as Node)) {
    providerDropdownOpen.value = false
  }
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

function handleSuccessPrimary() {
  showSuccessModal.value = false
  goBack()
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
    showSuccessModal.value = true
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Payment could not be started. Try again.'
    showErrorModal.value = true
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="contribute-page">
    <WebNavbar />
    <main class="contribute-main">
      <nav v-if="event" class="contribute-breadcrumbs" aria-label="Breadcrumb">
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'home' })">Home</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'events' })">Events</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="goBack">{{ event.title }}</button>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Contribute</span>
      </nav>

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
            </div>
            
            <div class="contribute-payment-card">
              <label class="contribute-payment-field">
                <span class="contribute-payment-label">Provider <span class="required">*</span></span>
                <div ref="providerDropdownRef" class="contribute-select-wrap">
                  <span v-show="!selectedProvider" class="contribute-select-placeholder" aria-hidden="true">Select provider</span>
                  <button
                    type="button"
                    class="contribute-payment-input contribute-payment-select contribute-select-trigger"
                    :class="{ 'contribute-payment-input--empty': !selectedProvider }"
                    aria-haspopup="listbox"
                    :aria-expanded="providerDropdownOpen"
                    @click.stop="providerDropdownOpen = !providerDropdownOpen"
                  >
                    {{ selectedProviderLabel }}
                  </button>
                  <div v-show="providerDropdownOpen" class="contribute-select-dropdown" role="listbox">
                    <button
                      v-for="p in PROVIDERS"
                      :key="p.value"
                      type="button"
                      role="option"
                      class="contribute-select-option"
                      :aria-selected="selectedProvider === p.value"
                      @click.stop="selectProvider(p.value)"
                    >
                      {{ p.label }}
                    </button>
                  </div>
                </div>
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

      <PaymentStatusModal
        v-model="showSuccessModal"
        variant="success"
        title="Contribution started"
        :message="successMessage"
        primary-label="Back to event"
        @primary="handleSuccessPrimary"
      />

      <PaymentStatusModal
        v-model="showErrorModal"
        variant="error"
        title="Payment failed"
        :message="errorMessage"
        primary-label="Try again"
        @primary="showErrorModal = false"
      />
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
  /* Extra top padding so fixed navbar doesn't overlap breadcrumb */
  padding: 96px 24px 48px;
}

@media (max-width: 768px) {
  .contribute-main {
    padding: 88px 16px 32px;
  }
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

/* Breadcrumbs: Home / Events / Event name / Contribute */
.contribute-breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.contribute-breadcrumbs .breadcrumb-link {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  text-decoration: underline;
}

.contribute-breadcrumbs .breadcrumb-link:hover {
  color: #2563eb;
}

.contribute-breadcrumbs .breadcrumb-sep {
  color: #9ca3af;
}

.contribute-breadcrumbs .breadcrumb-current {
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
  background: #f9fafb;
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
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-family: inherit;
  background: #f9fafb;
  box-sizing: border-box;
}

.contribute-payment-input:hover {
  border-color: #d1d5db;
}

.contribute-payment-select {
  font-size: 1.0625rem;
  font-weight: 600;
}

.contribute-payment-select option {
  font-weight: 600;
  font-size: 1rem;
}

.contribute-select-wrap {
  position: relative;
  width: 100%;
}

.contribute-select-trigger {
  text-align: left;
  cursor: pointer;
  appearance: none;
  color: #111827;
}

.contribute-select-placeholder {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 1.0625rem;
  font-weight: 600;
  font-family: inherit;
  pointer-events: none;
  white-space: nowrap;
}

.contribute-payment-input--empty {
  color: transparent;
}

.contribute-select-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 240px;
  overflow-y: auto;
}

.contribute-select-option {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  color: #111827;
  background: #fff;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.contribute-select-option:hover,
.contribute-select-option:focus {
  background: #f3f4f6;
  color: #111827;
  outline: none;
}

.contribute-select-option[aria-selected="true"] {
  background: #eff6ff;
  color: #111827;
}

.contribute-payment-input--placeholder {
  color: #6b7280;
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
