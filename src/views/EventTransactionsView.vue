<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventById } from '@/api/event'
import { fetchEventTransactions } from '@/api/payments'
import type { PublicEvent } from '@/types/events'

export interface TransactionItem {
  id?: number
  amount: number
  status: string
  payer_name?: string
  payer_phone?: string
  method?: string
  method_display?: string
  reference?: string
  created_at?: string
  completed_at?: string
  transaction_id?: string
  [key: string]: unknown
}

const route = useRoute()
const router = useRouter()
const event = ref<PublicEvent | null>(null)
const transactions = ref<TransactionItem[]>([])
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

async function loadTransactions() {
  if (!eventId.value) return
  loading.value = true
  error.value = null
  try {
    const data = await fetchEventTransactions(eventId.value) as { results?: TransactionItem[] } | TransactionItem[]
    if (Array.isArray(data)) {
      transactions.value = data
    } else if (data && typeof data === 'object' && 'results' in data) {
      transactions.value = (data as { results: TransactionItem[] }).results ?? []
    } else {
      transactions.value = []
    }
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load transactions')
    transactions.value = []
  } finally {
    loading.value = false
  }
}

async function load() {
  if (!eventId.value) return
  await loadEvent()
  await loadTransactions()
}

onMounted(() => load())
watch(() => route.params.id, () => load())

const completed = computed(() =>
  transactions.value.filter((t) => (t.status || '').toUpperCase() === 'COMPLETED')
)
const pending = computed(() =>
  transactions.value.filter((t) => {
    const s = (t.status || '').toUpperCase()
    return s === 'PENDING' || s === 'PROCESSING'
  })
)
const totalReceived = computed(() =>
  completed.value.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
)

function formatNum(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString() : '0'
}

function statusColor(status?: string): string {
  const s = (status || '').toUpperCase()
  if (s === 'COMPLETED') return '#16a34a'
  if (s === 'PROCESSING' || s === 'PENDING') return '#ea580c'
  if (s === 'FAILED' || s === 'CANCELLED') return '#dc2626'
  return '#6b7280'
}

function statusDisplay(status?: string): string {
  if (!status) return '—'
  const s = status.toUpperCase()
  if (s === 'COMPLETED') return 'Completed'
  if (s === 'PENDING') return 'Pending'
  if (s === 'PROCESSING') return 'Processing'
  if (s === 'FAILED') return 'Failed'
  if (s === 'CANCELLED') return 'Cancelled'
  return status
}

function methodDisplay(t: TransactionItem): string {
  return t.method_display ?? t.method ?? '—'
}

function goBack() {
  router.push({ name: 'events-detail', params: { id: String(eventId.value) } })
}
</script>

<template>
  <div class="transactions-page">
    <WebNavbar />
    <main class="transactions-main">
      <button type="button" class="back-link" @click="goBack">
        <span class="back-icon">←</span> Back
      </button>

      <template v-if="event">
        <header class="page-header">
          <h1 class="page-title">Transactions</h1>
          <p class="page-subtitle">{{ event.title }}</p>
        </header>

        <div v-if="loading" class="state-loading">
          <div class="loader" />
          <p>Loading transactions…</p>
        </div>
        <div v-else-if="error" class="state-error">
          <p>{{ error.message }}</p>
          <button type="button" class="btn-retry" @click="loadTransactions">Retry</button>
        </div>
        <template v-else>
          <section class="stats-card card">
            <div class="stat">
              <span class="stat-icon green">↓</span>
              <span class="stat-value">TZS {{ formatNum(totalReceived) }}</span>
              <span class="stat-label">Total Received</span>
            </div>
            <div class="stat-divider" />
            <div class="stat">
              <span class="stat-icon green">✓</span>
              <span class="stat-value">{{ completed.length }}</span>
              <span class="stat-label">Completed</span>
            </div>
            <div class="stat-divider" />
            <div class="stat">
              <span class="stat-icon orange">⋯</span>
              <span class="stat-value">{{ pending.length }}</span>
              <span class="stat-label">Pending</span>
            </div>
          </section>

          <div v-if="transactions.length === 0" class="state-empty">
            <span class="empty-icon">📋</span>
            <p>No transactions yet</p>
            <p class="hint">Contributions will appear here</p>
          </div>
          <ul v-else class="transactions-list">
            <li
              v-for="t in transactions"
              :key="t.id ?? t.reference ?? Math.random()"
              class="card transaction-card"
              role="button"
              tabindex="0"
              @click="() => {}"
              @keydown.enter.prevent="() => {}"
            >
              <span
                class="t-icon"
                :style="{ backgroundColor: statusColor(t.status) + '20', color: statusColor(t.status) }"
              >
                {{ (t.status || '').toUpperCase() === 'COMPLETED' ? '✓' : (t.status || '').toUpperCase() === 'FAILED' ? '✕' : '⋯' }}
              </span>
              <div class="t-body">
                <span class="t-name">{{ t.payer_name || 'Anonymous' }}</span>
                <span class="t-meta">📞 {{ t.payer_phone || '—' }} • {{ methodDisplay(t) }}</span>
              </div>
              <div class="t-right">
                <span
                  class="t-amount"
                  :class="{ muted: (t.status || '').toUpperCase() !== 'COMPLETED' }"
                >
                  TZS {{ formatNum(Number(t.amount)) }}
                </span>
                <span
                  class="t-status"
                  :style="{ color: statusColor(t.status), backgroundColor: statusColor(t.status) + '20' }"
                >
                  {{ statusDisplay(t.status) }}
                </span>
              </div>
            </li>
          </ul>
        </template>
      </template>
    </main>
  </div>
</template>

<style scoped>
.transactions-page { min-height: 100vh; background: #f8fafc; }
.transactions-main { max-width: 720px; margin: 0 auto; padding: 24px 20px 48px; }
.back-link { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 8px 0; font-size: 14px; color: #6b7280; background: none; border: none; cursor: pointer; }
.back-link:hover { color: #1a283b; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
.page-subtitle { font-size: 14px; color: #6b7280; margin: 0; }
.state-loading, .state-error, .state-empty { text-align: center; padding: 48px 24px; color: #6b7280; }
.loader { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #1a283b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.btn-retry { margin-top: 12px; padding: 10px 20px; font-size: 14px; font-weight: 500; color: #1a283b; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
.stats-card { display: flex; align-items: center; justify-content: space-around; margin-bottom: 24px; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
.stat-icon { font-size: 20px; }
.stat-icon.green { color: #16a34a; }
.stat-icon.orange { color: #ea580c; }
.stat-value { font-size: 14px; font-weight: 700; color: #1a1a2e; }
.stat-label { font-size: 11px; color: #6b7280; }
.stat-divider { width: 1px; height: 40px; background: #e5e7eb; }
.empty-icon { font-size: 64px; display: block; margin-bottom: 12px; }
.hint { font-size: 13px; color: #9ca3af; margin-top: 4px; }
.transactions-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.transaction-card { display: flex; align-items: center; gap: 12px; cursor: default; }
.t-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; }
.t-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.t-name { font-weight: 600; font-size: 15px; color: #1a1a2e; }
.t-meta { font-size: 12px; color: #6b7280; }
.t-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.t-amount { font-size: 15px; font-weight: 700; color: #16a34a; }
.t-amount.muted { color: #6b7280; }
.t-status { padding: 2px 8px; border-radius: 8px; font-size: 10px; font-weight: 600; }
</style>
