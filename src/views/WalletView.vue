<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchWallet } from '@/api/payments'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const wallet = ref<{ balance?: number; currency?: string; pending_disbursements?: number; total_disbursed?: number; recent_transactions?: unknown[] } | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetchWallet() as Record<string, unknown>
    wallet.value = res ?? null
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load wallet'
    wallet.value = null
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'profile' })
}

function goToTransactions() {
  router.push({ name: 'transactions' })
}

onMounted(load)
</script>

<template>
  <div class="wallet-page">
    <WebNavbar />
    <main class="wallet-main">
      <header class="wallet-header">
        <button type="button" class="btn-back" aria-label="Back to profile" @click="goBack">← Back</button>
        <h1 class="wallet-title">My Wallet</h1>
      </header>

      <div v-if="loading" class="state">Loading…</div>
      <div v-else-if="error" class="state state-error">
        <p>{{ error }}</p>
        <button type="button" class="btn-retry" @click="load">Retry</button>
      </div>
      <template v-else-if="wallet">
        <section class="card balance-card">
          <p class="balance-label">Available balance</p>
          <p class="balance-value">{{ (wallet.balance ?? 0).toLocaleString() }} <span class="currency">{{ wallet.currency ?? 'TZS' }}</span></p>
          <p v-if="(wallet.pending_disbursements ?? 0) > 0" class="balance-pending">Pending: {{ (wallet.pending_disbursements ?? 0).toLocaleString() }} {{ wallet.currency ?? 'TZS' }}</p>
        </section>
        <section class="card">
          <h2 class="card-title">Recent transactions</h2>
          <p v-if="!(wallet.recent_transactions?.length)" class="muted">No recent transactions.</p>
          <ul v-else class="tx-list">
            <li v-for="(tx, i) in (wallet.recent_transactions ?? []).slice(0, 10)" :key="i" class="tx-item">
              <span class="tx-amount">{{ (tx as Record<string, unknown>).amount ?? 0 }} {{ wallet.currency ?? 'TZS' }}</span>
              <span class="tx-status">{{ (tx as Record<string, unknown>).status ?? '-' }}</span>
            </li>
          </ul>
          <button type="button" class="btn-link" @click="goToTransactions">View all transactions →</button>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.wallet-page { min-height: 100vh; background: #fff; }
.wallet-main { max-width: 560px; margin: 0 auto; padding: 24px 16px; padding-top: 72px; }
.wallet-header { margin-bottom: 24px; }
.btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-size: 14px; padding: 0; margin-bottom: 8px; }
.btn-back:hover { color: #1e293b; }
.wallet-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.state { text-align: center; padding: 48px; color: #64748b; }
.state-error { color: #dc2626; }
.btn-retry { margin-top: 12px; padding: 8px 16px; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; }
.card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 16px; }
.balance-card { text-align: center; }
.balance-label { font-size: 14px; color: #64748b; margin: 0 0 8px; }
.balance-value { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0; }
.currency { font-size: 16px; font-weight: 500; color: #64748b; }
.balance-pending { font-size: 12px; color: #64748b; margin-top: 8px; }
.card-title { font-size: 18px; font-weight: 700; margin: 0 0 12px; }
.muted { color: #94a3b8; font-size: 14px; margin: 0; }
.tx-list { list-style: none; padding: 0; margin: 0; }
.tx-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
.tx-item:last-child { border-bottom: none; }
.btn-link { margin-top: 12px; background: none; border: none; color: #1a283b; font-weight: 500; cursor: pointer; font-size: 14px; padding: 0; }
.btn-link:hover { text-decoration: underline; }
</style>
