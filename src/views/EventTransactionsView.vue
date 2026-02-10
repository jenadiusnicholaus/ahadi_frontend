<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventById } from '@/api/event'
import { fetchEventTransactions } from '@/api/payments'
import type { PublicEvent } from '@/types/events'

export interface TransactionItem {
  id?: number | string
  amount: number | string
  status: string
  payer_name?: string
  payer_phone?: string
  payer_email?: string
  method?: string
  method_display?: string
  payment_method?: string
  provider_name?: string
  reference?: string
  created_at?: string
  completed_at?: string
  transaction_id?: string
  status_message?: string
  [key: string]: unknown
}

const route = useRoute()
const router = useRouter()
const event = ref<PublicEvent | null>(null)
const transactions = ref<TransactionItem[]>([])
const loading = ref(true)
const error = ref<Error | null>(null)
const selectedTransaction = ref<TransactionItem | null>(null)
const showDetailModal = ref(false)

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
    const raw = await fetchEventTransactions(eventId.value)
    const data = raw as
      | TransactionItem[]
      | { data?: { transactions?: TransactionItem[] }; results?: TransactionItem[]; transactions?: TransactionItem[] }
    if (Array.isArray(data)) {
      transactions.value = data
    } else if (data && typeof data === 'object') {
      const inner = (data as { data?: { transactions?: TransactionItem[] } }).data
      if (inner && Array.isArray(inner.transactions)) {
        transactions.value = inner.transactions
      } else if (Array.isArray((data as { results?: TransactionItem[] }).results)) {
        transactions.value = (data as { results: TransactionItem[] }).results
      } else if (Array.isArray((data as { transactions?: TransactionItem[] }).transactions)) {
        transactions.value = (data as { transactions: TransactionItem[] }).transactions
      } else {
        transactions.value = []
      }
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
  return (t.method_display ?? t.method ?? t.provider_name ?? t.payment_method ?? '—') as string
}

function goBack() {
  router.push({ name: 'event-public', params: { id: String(eventId.value) } })
}

const labelForKey: Record<string, string> = {
  reference: 'Reference',
  transaction_id: 'Transaction ID',
  mno_reference: 'MNO Reference',
  event: 'Event',
  contribution: 'Contribution',
  payer: 'Payer',
  payer_phone: 'Payer Phone',
  payer_name: 'Payer Name',
  payer_email: 'Payer Email',
  amount: 'Amount',
  currency: 'Currency',
  payment_method: 'Payment Method',
  provider: 'Provider',
  provider_name: 'Provider Name',
  status: 'Status',
  status_message: 'Status Message',
  created_at: 'Created At',
  completed_at: 'Completed At',
}

function fieldLabel(key: string): string {
  return labelForKey[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function detailEntries(t: TransactionItem): { key: string; label: string; value: string }[] {
  return Object.keys(t)
    .filter((k) => k !== 'id')
    .map((key) => ({
      key,
      label: fieldLabel(key),
      value: detailValue(t, key),
    }))
}

function openTransactionDetail(t: TransactionItem) {
  selectedTransaction.value = t
  showDetailModal.value = true
}

function closeTransactionDetail() {
  showDetailModal.value = false
  selectedTransaction.value = null
}

function detailValue(t: TransactionItem, key: string): string {
  const v = t[key]
  if (v === undefined || v === null) return '—'
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

function formatDetailDate(value: string): string {
  if (!value) return value
  try {
    const d = new Date(value)
    return d.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}
</script>

<template>
  <div class="transactions-page">
    <WebNavbar />
    <main class="transactions-main">
      <nav v-if="event" class="transactions-breadcrumbs" aria-label="Breadcrumb">
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'home' })">Home</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'events' })">Events</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="goBack">{{ event.title }}</button>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Transactions</span>
      </nav>

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
                <button
                  type="button"
                  class="t-view-btn"
                  @click.stop="openTransactionDetail(t)"
                >
                  View
                </button>
              </div>
            </li>
          </ul>

          <!-- Transaction detail modal -->
          <Teleport to="body">
            <div
              v-if="showDetailModal && selectedTransaction"
              class="detail-modal-backdrop"
              aria-modal="true"
              role="dialog"
              aria-labelledby="transaction-detail-title"
              @click.self="closeTransactionDetail"
            >
              <div class="detail-modal">
                <div class="detail-modal-header">
                  <h2 id="transaction-detail-title" class="detail-modal-title">Transaction details</h2>
                  <button
                    type="button"
                    class="detail-modal-close"
                    aria-label="Close"
                    @click="closeTransactionDetail"
                  >
                    ×
                  </button>
                </div>
                <div class="detail-modal-body">
                  <dl class="detail-dl">
                    <template
                      v-for="entry in detailEntries(selectedTransaction)"
                      :key="entry.key"
                    >
                      <dt class="detail-dt">{{ entry.label }}</dt>
                      <dd class="detail-dd">
                        {{ entry.key === 'created_at' || entry.key === 'completed_at' ? formatDetailDate(entry.value) : entry.value }}
                      </dd>
                    </template>
                  </dl>
                </div>
                <div class="detail-modal-footer">
                  <button type="button" class="btn-close-detail" @click="closeTransactionDetail">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </Teleport>
        </template>
      </template>
    </main>
  </div>
</template>

<style scoped>
.transactions-page { min-height: 100vh; background: #fff; }
.transactions-main { max-width: 720px; margin: 0 auto; padding: 96px 24px 48px; }
@media (max-width: 768px) {
  .transactions-main { padding: 88px 16px 32px; }
}
.transactions-breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}
.transactions-breadcrumbs .breadcrumb-link {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  text-decoration: underline;
}
.transactions-breadcrumbs .breadcrumb-link:hover { color: #2563eb; }
.transactions-breadcrumbs .breadcrumb-sep { color: #9ca3af; }
.transactions-breadcrumbs .breadcrumb-current { color: #111827; }
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
.t-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.t-amount { font-size: 15px; font-weight: 700; color: #16a34a; }
.t-amount.muted { color: #6b7280; }
.t-status { padding: 2px 8px; border-radius: 8px; font-size: 10px; font-weight: 600; }
.t-view-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #3b82f6;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  cursor: pointer;
}
.t-view-btn:hover { background: #dbeafe; color: #2563eb; }

/* Transaction detail modal */
.detail-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}
.detail-modal {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.detail-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.detail-modal-title { margin: 0; font-size: 18px; font-weight: 600; color: #111827; }
.detail-modal-close {
  width: 36px;
  height: 36px;
  padding: 0;
  font-size: 24px;
  line-height: 1;
  color: #6b7280;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.detail-modal-close:hover { background: #f3f4f6; color: #111827; }
.detail-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
.detail-dl { margin: 0; display: flex; flex-direction: column; gap: 12px; }
.detail-dt { margin: 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
.detail-dd { margin: 0; font-size: 14px; color: #111827; word-break: break-word; }
.detail-modal-footer {
  padding: 12px 20px 20px;
  border-top: 1px solid #e5e7eb;
}
.btn-close-detail {
  width: 100%;
  padding: 10px 16px;
  font-size: 14px; font-weight: 500;
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}
.btn-close-detail:hover { background: #e5e7eb; }
</style>
