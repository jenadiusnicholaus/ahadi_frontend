<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getCheckoutMnoFee, checkoutMno } from '@/api/payments'
import type { PublicEvent } from '@/types/events'

const props = defineProps<{
  event: PublicEvent | null
  open: boolean
  initialAmount?: number | null
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const PROVIDERS = [
  { value: 'Mpesa', label: 'M-Pesa (Vodacom)' },
  { value: 'Airtel', label: 'Airtel Money' },
  { value: 'Tigo', label: 'Tigo Pesa' },
  { value: 'Halotel', label: 'Halotel' },
] as const

const selectedProvider = ref<string | null>(null)
const phone = ref('')
const amount = ref('')
const name = ref('')
const feeInfo = ref<{ fee?: number; total?: number } | null>(null)
const loadingFee = ref(false)
const submitting = ref(false)
const error = ref('')

const targetNum = computed(() => {
  const t = props.event?.contribution_target
  if (t === undefined || t === null || t === '') return 0
  const n = Number(t)
  return Number.isFinite(n) && n > 0 ? n : 0
})

const totalNum = computed(() => {
  const t = props.event?.total_contributions
  if (t === undefined || t === null || t === '') return 0
  const n = Number(t)
  return Number.isFinite(n) ? n : 0
})

const progressPct = computed(() => {
  if (targetNum.value <= 0) return 0
  return Math.min(100, Math.round((totalNum.value / targetNum.value) * 100))
})

const currency = computed(() => props.event?.currency || '')

function formatVal(v: number): string {
  return Number.isFinite(v) ? v.toLocaleString() : '0'
}

async function fetchFee() {
  const amt = Number(amount.value?.replace(/\D/g, '') || 0)
  const prov = selectedProvider.value
  if (!prov || amt < 1000) {
    feeInfo.value = null
    return
  }
  loadingFee.value = true
  feeInfo.value = null
  try {
    const res = (await getCheckoutMnoFee(amt, prov)) as { fee?: number; total?: number }
    feeInfo.value = {
      fee: res?.fee != null ? Number(res.fee) : undefined,
      total: res?.total != null ? Number(res.total) : undefined,
    }
  } catch {
    feeInfo.value = null
  } finally {
    loadingFee.value = false
  }
}

watch([selectedProvider, amount], () => { fetchFee() })

watch(() => props.initialAmount, (val) => {
  if (val && val > 0 && props.open) {
    amount.value = String(val)
  }
}, { immediate: true })

watch(() => props.open, (isOpen) => {
  if (isOpen && props.initialAmount && props.initialAmount > 0) {
    amount.value = String(props.initialAmount)
  }
})

function validate(): boolean {
  error.value = ''
  const amt = Number(amount.value?.replace(/\D/g, '') || 0)
  if (!selectedProvider.value) {
    error.value = 'Please select a payment provider.'
    return false
  }
  if (!phone.value?.trim()) {
    error.value = 'Please enter your phone number.'
    return false
  }
  const cleanPhone = phone.value.replace(/\D/g, '')
  if (cleanPhone.length < 9 || cleanPhone.length > 12) {
    error.value = 'Please enter a valid phone number.'
    return false
  }
  if (amt < 1000) {
    error.value = 'Minimum amount is 1,000.'
    return false
  }
  return true
}

function formatPhoneForApi(phoneStr: string): string {
  const clean = phoneStr.replace(/\D/g, '')
  if (clean.startsWith('0')) return '255' + clean.slice(1)
  if (!clean.startsWith('255')) return '255' + clean
  return clean
}

async function onPay() {
  if (!props.event || !validate()) return
  submitting.value = true
  error.value = ''
  try {
    const amt = Number(amount.value?.replace(/\D/g, '') || 0)
    await checkoutMno({
      event_id: props.event.id,
      amount: amt,
      phone_number: formatPhoneForApi(phone.value),
      provider: selectedProvider.value!,
      ...(name.value?.trim() ? { payer_name: name.value.trim() } : {}),
    })
    emit('success')
    emit('close')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Payment could not be started. Try again.'
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
      <div v-if="open" class="contribute-backdrop" @click.self="onClose">
        <div class="contribute-dialog">
          <button type="button" class="contribute-close" aria-label="Close" @click="onClose">
            <span aria-hidden="true">&times;</span>
          </button>
          <h2 class="contribute-title">Mobile Money Payment</h2>

          <!-- Event card -->
          <div v-if="event" class="contribute-event-card">
            <div class="contribute-event-header">
              <span class="contribute-event-icon">📅</span>
              <span class="contribute-event-title">{{ event.title }}</span>
            </div>
            <template v-if="targetNum > 0">
              <div class="contribute-event-row">
                <span>Collected</span>
                <strong>{{ currency }}{{ formatVal(totalNum) }}</strong>
              </div>
              <div class="contribute-event-row">
                <span>Target</span>
                <strong>{{ currency }}{{ formatVal(targetNum) }}</strong>
              </div>
              <div class="contribute-progress">
                <div class="contribute-progress-fill" :style="{ width: progressPct + '%' }" />
              </div>
            </template>
          </div>

          <p class="contribute-label">Select Payment Provider</p>
          <div class="contribute-providers">
            <button
              v-for="opt in PROVIDERS"
              :key="opt.value"
              type="button"
              class="contribute-provider-btn"
              :class="{ active: selectedProvider === opt.value }"
              @click="selectedProvider = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>

          <label class="contribute-label">
            Phone Number
            <input
              v-model="phone"
              type="tel"
              class="contribute-input"
              placeholder="e.g. 0712345678"
            />
          </label>
          <label class="contribute-label">
            Amount (TZS)
            <input
              v-model="amount"
              type="text"
              inputmode="numeric"
              class="contribute-input"
              placeholder="Enter amount"
            />
            <span class="contribute-hint">Minimum 1,000</span>
          </label>
          <label class="contribute-label">
            Your Name (optional)
            <input
              v-model="name"
              type="text"
              class="contribute-input"
              placeholder="How should we recognize you?"
            />
          </label>

          <!-- Fee breakdown -->
          <div v-if="loadingFee" class="contribute-fee loading">Calculating fee…</div>
          <div v-else-if="feeInfo" class="contribute-fee">
            <div class="contribute-fee-row">
              <span>Amount</span>
              <span>{{ currency }}{{ formatVal(Number(amount.replace(/\D/g, '') || 0)) }}</span>
            </div>
            <div class="contribute-fee-row highlight">
              <span>Transaction Fee</span>
              <span>{{ currency }}{{ formatVal(feeInfo.fee ?? 0) }}</span>
            </div>
            <div class="contribute-fee-row total">
              <span>Total to Pay</span>
              <span>{{ currency }}{{ formatVal(feeInfo.total ?? 0) }}</span>
            </div>
          </div>

          <p v-if="error" class="contribute-error">{{ error }}</p>

          <button
            type="button"
            class="contribute-submit"
            :disabled="!selectedProvider || submitting"
            @click="onPay"
          >
            <span v-if="submitting">Processing…</span>
            <span v-else>Pay Now</span>
          </button>

          <p class="contribute-info">
            You will receive a prompt on your phone to complete the payment. Make sure your phone is on and has sufficient balance.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.contribute-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}
.contribute-dialog {
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
}
.contribute-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  color: #374151;
}
.contribute-close:hover {
  background: #e5e7eb;
}
.contribute-title {
  margin: 0 0 20px;
  font-size: 1.25rem;
  font-weight: 700;
}
.contribute-event-card {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}
.contribute-event-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.contribute-event-icon { font-size: 1.25rem; }
.contribute-event-title { font-weight: 700; font-size: 1rem; }
.contribute-event-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-bottom: 4px;
}
.contribute-progress {
  height: 6px;
  background: rgba(255,255,255,0.3);
  border-radius: 4px;
  margin-top: 12px;
  overflow: hidden;
}
.contribute-progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 4px;
  transition: width 0.2s;
}
.contribute-label {
  display: block;
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 8px;
  color: #374151;
}
.contribute-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  margin-bottom: 4px;
  box-sizing: border-box;
}
.contribute-hint {
  font-size: 0.75rem;
  color: #6b7280;
}
.contribute-providers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.contribute-provider-btn {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
  font-size: 0.875rem;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s, background 0.2s;
}
.contribute-provider-btn:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}
.contribute-provider-btn.active {
  border-color: #4f46e5;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
}
.contribute-fee {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
}
.contribute-fee.loading {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}
.contribute-fee-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-bottom: 8px;
}
.contribute-fee-row:last-child { margin-bottom: 0; }
.contribute-fee-row.highlight { color: #b45309; }
.contribute-fee-row.total { font-weight: 700; font-size: 1rem; }
.contribute-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin: 8px 0;
}
.contribute-submit {
  width: 100%;
  padding: 14px 20px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}
.contribute-submit:hover:not(:disabled) {
  background: #4338ca;
}
.contribute-submit:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
.contribute-info {
  margin: 16px 0 0;
  padding: 12px;
  background: #eff6ff;
  border-radius: 12px;
  font-size: 0.8125rem;
  color: #1e40af;
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
