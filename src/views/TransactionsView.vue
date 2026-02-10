<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchMyTransactions } from '@/api/payments'

/** Status filter: '' = All, SUCCESS, PENDING, FAILED (matches Flutter FilterChip values) */
const statusFilter = ref('')

const FILTER_CHIPS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Successful', value: 'SUCCESS' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
]

const router = useRouter()
const loading = ref(true)
const error = ref('')
const transactions = ref<Record<string, unknown>[]>([])

/** List sorted by date newest first (Flutter-style list order). */
const sortedTransactions = computed(() => {
  const list = [...transactions.value]
  list.sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at as string).getTime() : 0
    const db = b.created_at ? new Date(b.created_at as string).getTime() : 0
    return db - da
  })
  return list
})

function setFilter(value: string) {
  statusFilter.value = value
  load()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : undefined
    const res = await fetchMyTransactions(params) as { results?: Record<string, unknown>[] } | Record<string, unknown>[]
    const list = Array.isArray(res) ? res : (res?.results ?? [])
    transactions.value = Array.isArray(list) ? list : []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load transactions'
    transactions.value = []
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'profile' })
}

function statusDisplay(status: string): string {
  switch (String(status).toUpperCase()) {
    case 'SUCCESS': return 'Successful'
    case 'PENDING': return 'Pending'
    case 'FAILED': return 'Failed'
    default: return status || '—'
  }
}

const emptyMessage = computed(() => {
  if (statusFilter.value) {
    const label = FILTER_CHIPS.find((c) => c.value === statusFilter.value)?.label ?? statusFilter.value.toLowerCase()
    return `No ${label.toLowerCase()} transactions`
  }
  return 'Your transactions will appear here'
})

onMounted(load)
</script>

<template>
  <div class="transactions-page">
    <WebNavbar />
    <main class="transactions-main">
      <header class="transactions-header">
        <button type="button" class="btn-back" aria-label="Back to profile" @click="goBack">← Back</button>
        <h1 class="transactions-title">Transaction History</h1>
      </header>

      <div v-if="loading" class="state">Loading…</div>
      <div v-else-if="error" class="state state-error">
        <p>{{ error }}</p>
        <button type="button" class="btn-retry" @click="load">Retry</button>
      </div>
      <template v-else>
        <!-- Filter chips (Flutter FilterChip style) -->
        <div class="filter-chips-wrap">
          <div class="filter-chips">
            <button
              v-for="chip in FILTER_CHIPS"
              :key="chip.value || 'all'"
              type="button"
              class="filter-chip"
              :class="{ selected: statusFilter === chip.value }"
              @click="setFilter(chip.value)"
            >
              {{ chip.label }}
            </button>
          </div>
        </div>

        <p v-if="!transactions.length" class="muted">{{ emptyMessage }}</p>
        <ul v-else class="tx-list">
          <li v-for="(tx, i) in sortedTransactions" :key="i" class="tx-item">
            <div class="tx-main">
              <span class="tx-amount">{{ (tx.amount ?? 0).toLocaleString() }} {{ tx.currency ?? 'TZS' }}</span>
              <span class="tx-ref">{{ tx.reference ?? tx.external_id ?? '—' }}</span>
              <span v-if="tx.created_at" class="tx-date">{{ new Date(tx.created_at as string).toLocaleDateString() }}</span>
            </div>
            <span class="tx-status" :class="(tx.status as string)?.toLowerCase()">{{ statusDisplay((tx.status as string) ?? '') }}</span>
          </li>
        </ul>
      </template>
    </main>
  </div>
</template>

<style scoped>
.transactions-page { min-height: 100vh; background: #fff; }
.transactions-main { max-width: 560px; margin: 0 auto; padding: 24px 16px; padding-top: 72px; }
.transactions-header { margin-bottom: 24px; }
.btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-size: 14px; padding: 0; margin-bottom: 8px; }
.btn-back:hover { color: #1e293b; }
.transactions-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.state { text-align: center; padding: 48px; color: #64748b; }
.state-error { color: #dc2626; }
.btn-retry { margin-top: 12px; padding: 8px 16px; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; }

.filter-chips-wrap {
  padding: 12px 0 16px;
  margin-bottom: 8px;
}
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-chip {
  padding: 8px 16px;
  font-size: 14px;
  color: #475569;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
}
.filter-chip:hover { border-color: #1a283b; color: #1e293b; }
.filter-chip.selected {
  background: rgba(26, 40, 59, 0.12);
  color: #1a283b;
  border-color: #1a283b;
}

.muted { color: #94a3b8; font-size: 14px; margin: 0; }
.tx-list { list-style: none; padding: 0; margin: 0; }
.tx-item { display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px; }
.tx-main { display: flex; flex-direction: column; gap: 4px; }
.tx-amount { font-weight: 600; color: #1e293b; }
.tx-ref { font-size: 12px; color: #64748b; }
.tx-date { font-size: 11px; color: #94a3b8; }
.tx-status { font-size: 12px; font-weight: 500; }
.tx-status.success { color: #16a34a; }
.tx-status.pending { color: #d97706; }
.tx-status.failed { color: #dc2626; }
</style>
