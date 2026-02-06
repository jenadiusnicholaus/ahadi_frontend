<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventById } from '@/api/event'
import {
  fetchEventPayout,
  fetchEventDisbursements,
  fetchEventContributions,
} from '@/api/payments'
import type { PublicEvent } from '@/types/events'

interface PayoutSummary {
  gross_amount?: number
  total_fees?: number
  net_payout?: number
  net_amount?: number
  available_balance?: number
  total_disbursed?: number
  fee_percent?: string
  [key: string]: unknown
}

interface DisbursementItem {
  id?: number
  reference?: string
  net_amount?: number
  status?: string
  provider?: string
  recipient_phone?: string
  created_at?: string
  status_message?: string
  status_display?: string
  [key: string]: unknown
}

const route = useRoute()
const router = useRouter()
const event = ref<PublicEvent | null>(null)
const payout = ref<PayoutSummary | null>(null)
const disbursements = ref<DisbursementItem[]>([])
const contributionsCount = ref(0)
const loading = ref(true)
const error = ref<Error | null>(null)

const eventId = computed(() => {
  const id = route.params.id
  if (typeof id !== 'string') return 0
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : 0
})

async function loadEvent() {
  if (!eventId.value) return
  try {
    event.value = await fetchEventById(eventId.value)
  } catch {
    event.value = null
  }
}

async function load() {
  if (!eventId.value) return
  loading.value = true
  error.value = null
  try {
    await loadEvent()
    const [payoutRes, disbRes, contribRes] = await Promise.all([
      fetchEventPayout(eventId.value).catch(() => null),
      fetchEventDisbursements(eventId.value).catch(() => []),
      fetchEventContributions(eventId.value).catch(() => []),
    ])
    payout.value = payoutRes as PayoutSummary | null
    const d = disbRes as { results?: DisbursementItem[] } | DisbursementItem[]
    disbursements.value = Array.isArray(d) ? d : (d?.results ?? [])
    const c = contribRes as { results?: unknown[] } | unknown[]
    contributionsCount.value = Array.isArray(c) ? c.length : (c?.results?.length ?? 0)
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load wallet')
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
watch(() => route.params.id, () => load())

const available = computed(() => payout.value?.available_balance ?? payout.value?.net_amount ?? 0)
const gross = computed(() => payout.value?.gross_amount ?? 0)
const fees = computed(() => payout.value?.total_fees ?? 0)
const net = computed(() => payout.value?.net_payout ?? payout.value?.net_amount ?? 0)
const totalDisbursed = computed(() => payout.value?.total_disbursed ?? 0)
const feePercent = computed(() => payout.value?.fee_percent ?? '3')
const canWithdraw = computed(() => available.value > 0)
const recentDisbursements = computed(() => disbursements.value.slice(0, 5))

function formatNum(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString() : '0'
}

function statusColor(status?: string): string {
  const s = (status || '').toUpperCase()
  if (s === 'COMPLETED') return '#16a34a'
  if (s === 'PROCESSING' || s === 'PENDING') return '#ea580c'
  if (s === 'FAILED') return '#dc2626'
  return '#6b7280'
}

function goBack() {
  router.push({ name: 'events-detail', params: { id: String(eventId.value) } })
}

function goToTransactions() {
  router.push({ name: 'events-transactions', params: { id: String(eventId.value) } })
}
</script>

<template>
  <div class="wallet-page">
    <WebNavbar />
    <main class="wallet-main">
      <button type="button" class="back-link" @click="goBack">
        <span class="back-icon">←</span> Back
      </button>

      <template v-if="event">
        <header class="event-header card">
          <span class="event-icon">📅</span>
          <div class="event-info">
            <h1 class="event-title">{{ event.title }}</h1>
            <p class="event-meta">{{ contributionsCount }} contributions</p>
          </div>
        </header>

        <div v-if="loading" class="state-loading">
          <div class="loader" />
          <p>Loading wallet…</p>
        </div>
        <div v-else-if="error" class="state-error">
          <p>{{ error.message }}</p>
          <button type="button" class="btn-retry" @click="load">Retry</button>
        </div>
        <template v-else>
          <section class="balance-card">
            <div class="balance-header">
              <span class="balance-icon">👛</span>
              <span class="fee-badge">{{ feePercent }}% fee</span>
            </div>
            <p class="balance-label">Available for Withdrawal</p>
            <p class="balance-amount">TZS {{ formatNum(available) }}</p>
          </section>

          <section class="summary-card card">
            <h2 class="card-title">Financial Summary</h2>
            <div class="summary-rows">
              <div class="summary-row">
                <span class="summary-icon green">↓</span>
                <span class="summary-label">Total Contributions</span>
                <span class="summary-value">TZS {{ formatNum(gross) }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-icon orange">−</span>
                <span class="summary-label">Platform Fees ({{ feePercent }}%)</span>
                <span class="summary-value">-TZS {{ formatNum(fees) }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-icon primary">🏦</span>
                <span class="summary-label">Net Amount</span>
                <span class="summary-value bold">TZS {{ formatNum(net) }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-icon grey">↑</span>
                <span class="summary-label">Already Withdrawn</span>
                <span class="summary-value">-TZS {{ formatNum(totalDisbursed) }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-icon green">👛</span>
                <span class="summary-label">Available Balance</span>
                <span class="summary-value bold green">TZS {{ formatNum(available) }}</span>
              </div>
            </div>
          </section>

          <div class="action-buttons">
            <button type="button" class="btn-outline" @click="goToTransactions">
              📋 Transactions
            </button>
            <button type="button" class="btn-primary" :disabled="!canWithdraw" title="Withdraw – use app for payout">
              💸 Withdraw
            </button>
          </div>

          <section class="disbursements-section">
            <h2 class="card-title">Withdrawal History</h2>
            <div v-if="recentDisbursements.length === 0" class="empty-history">
              <span class="empty-icon">📜</span>
              <p>No withdrawals yet</p>
            </div>
            <ul v-else class="disbursements-list">
              <li
                v-for="d in recentDisbursements"
                :key="d.reference ?? d.id ?? Math.random()"
                class="disbursement-item card"
              >
                <span
                  class="d-icon"
                  :style="{ backgroundColor: statusColor(d.status) + '20', color: statusColor(d.status) }"
                >
                  {{ d.status === 'COMPLETED' ? '✓' : d.status === 'FAILED' ? '✕' : '⋯' }}
                </span>
                <div class="d-body">
                  <span class="d-amount">TZS {{ formatNum(Number(d.net_amount)) }}</span>
                  <span class="d-meta">{{ d.provider }} • {{ d.recipient_phone }}</span>
                </div>
                <div class="d-right">
                  <span
                    class="d-status"
                    :style="{ color: statusColor(d.status), backgroundColor: statusColor(d.status) + '20' }"
                  >
                    {{ d.status_display ?? d.status }}
                  </span>
                  <span class="d-date">{{ d.created_at ? new Date(d.created_at).toLocaleDateString() : '' }}</span>
                </div>
              </li>
            </ul>
          </section>
        </template>
      </template>
    </main>
  </div>
</template>

<style scoped>
.wallet-page { min-height: 100vh; background: #f8fafc; }
.wallet-main { max-width: 720px; margin: 0 auto; padding: 24px 20px 48px; }
.back-link { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 8px 0; font-size: 14px; color: #6b7280; background: none; border: none; cursor: pointer; }
.back-link:hover { color: #1a283b; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
.event-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.event-icon { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background: rgba(26,40,59,0.1); border-radius: 12px; font-size: 28px; }
.event-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
.event-meta { font-size: 13px; color: #6b7280; margin: 0; }
.state-loading, .state-error { text-align: center; padding: 48px 24px; color: #6b7280; }
.loader { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #1a283b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.btn-retry { margin-top: 12px; padding: 10px 20px; font-size: 14px; font-weight: 500; color: #1a283b; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
.balance-card { background: linear-gradient(135deg, #1a283b, #2d3a4f); border-radius: 20px; padding: 24px; margin-bottom: 20px; color: #fff; box-shadow: 0 6px 20px rgba(26,40,59,0.3); }
.balance-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.balance-icon { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); border-radius: 12px; font-size: 24px; }
.fee-badge { padding: 4px 10px; background: rgba(255,255,255,0.2); border-radius: 12px; font-size: 12px; font-weight: 500; }
.balance-label { font-size: 14px; color: rgba(255,255,255,0.8); margin: 0 0 4px; }
.balance-amount { font-size: 32px; font-weight: 700; margin: 0; }
.summary-card { margin-bottom: 20px; }
.card-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0 0 16px; }
.summary-rows { display: flex; flex-direction: column; gap: 0; }
.summary-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
.summary-row:last-child { border-bottom: none; }
.summary-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 16px; }
.summary-icon.green { background: rgba(22,163,74,0.1); color: #16a34a; }
.summary-icon.orange { background: rgba(234,88,12,0.1); color: #ea580c; }
.summary-icon.primary { background: rgba(26,40,59,0.1); color: #1a283b; }
.summary-icon.grey { background: #f3f4f6; color: #6b7280; }
.summary-label { flex: 1; font-size: 14px; color: #6b7280; }
.summary-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.summary-value.bold { font-weight: 700; }
.summary-value.green { color: #16a34a; }
.action-buttons { display: flex; gap: 12px; margin-bottom: 24px; }
.btn-outline { flex: 1; padding: 14px; font-size: 14px; font-weight: 600; color: #1a283b; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; cursor: pointer; }
.btn-primary { flex: 1; padding: 14px; font-size: 14px; font-weight: 600; color: #fff; background: #1a283b; border: none; border-radius: 12px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.disbursements-section { margin-bottom: 24px; }
.disbursements-section .card-title { margin-bottom: 12px; }
.empty-history { padding: 32px; text-align: center; background: #f9fafb; border-radius: 12px; color: #6b7280; }
.empty-history .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.disbursements-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.disbursement-item { display: flex; align-items: center; gap: 12px; }
.d-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
.d-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.d-amount { font-weight: 700; font-size: 16px; color: #1a1a2e; }
.d-meta { font-size: 13px; color: #6b7280; }
.d-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.d-status { padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; }
.d-date { font-size: 11px; color: #9ca3af; }
</style>
