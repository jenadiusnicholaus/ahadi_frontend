<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventById } from '@/api/event'
import { fetchEventContributions } from '@/api/payments'
import type { PublicEvent } from '@/types/events'

/** Contribution item from GET /payments/events/{id}/contributions/ */
export interface ContributionItem {
  id: number
  event?: number
  amount: number
  status: string
  kind?: string
  message?: string
  created_at?: string
  participant_name?: string
  contributor_name?: string
  participant_id?: number
}

const route = useRoute()
const router = useRouter()
const event = ref<PublicEvent | null>(null)
const contributions = ref<ContributionItem[]>([])
const loading = ref(true)
const error = ref<Error | null>(null)
const activeTab = ref<'all' | 'by-contributor'>('all')
const statusFilter = ref<string>('all')

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

async function loadContributions() {
  if (!eventId.value) return
  loading.value = true
  error.value = null
  try {
    const data = await fetchEventContributions(eventId.value) as { results?: ContributionItem[] } | ContributionItem[]
    if (Array.isArray(data)) {
      contributions.value = data
    } else if (data && typeof data === 'object' && 'results' in data) {
      contributions.value = (data as { results: ContributionItem[] }).results ?? []
    } else {
      contributions.value = []
    }
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load contributions')
    contributions.value = []
  } finally {
    loading.value = false
  }
}

async function load() {
  if (!eventId.value) return
  await loadEvent()
  await loadContributions()
}

onMounted(() => load())
watch(() => route.params.id, () => load())

const targetNum = computed(() => {
  const t = event.value?.contribution_target
  if (t === undefined || t === null || t === '') return 0
  const n = Number(t)
  return Number.isFinite(n) && n > 0 ? n : 0
})
const totalFromEvent = computed(() => Number(event.value?.total_contributions) || 0)
const progressPercent = computed(() => {
  if (targetNum.value <= 0) return 0
  return Math.min(100, Math.round((totalFromEvent.value / targetNum.value) * 100))
})

const completedContributions = computed(() =>
  contributions.value.filter((c) => c.status === 'CONFIRMED' || c.status === 'COMPLETED')
)
const totalCollected = computed(() =>
  completedContributions.value.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
)
const avgAmount = computed(() => {
  const list = completedContributions.value
  if (list.length === 0) return 0
  return totalCollected.value / list.length
})

const filteredByStatus = computed(() => {
  if (statusFilter.value === 'all') return contributions.value
  return contributions.value.filter((c) => c.status === statusFilter.value)
})

const groupedByContributor = computed(() => {
  const list = statusFilter.value === 'all'
    ? completedContributions.value
    : contributions.value.filter((c) => c.status === statusFilter.value)
  const map = new Map<string, ContributionItem[]>()
  for (const c of list) {
    const name = (c.participant_name ?? c.contributor_name ?? '').trim() || 'Anonymous'
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(c)
  }
  return Array.from(map.entries()).sort((a, b) => {
    const totalA = a[1].reduce((s, x) => s + (Number(x.amount) || 0), 0)
    const totalB = b[1].reduce((s, x) => s + (Number(x.amount) || 0), 0)
    return totalB - totalA
  })
})

const filters = [
  { key: 'all', label: 'All' },
  { key: 'CONFIRMED', label: 'Completed' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'FAILED', label: 'Failed' },
]

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toFixed(0)
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'CONFIRMED':
    case 'COMPLETED':
      return '#16a34a'
    case 'PENDING':
      return '#ea580c'
    case 'FAILED':
      return '#dc2626'
    default:
      return '#6b7280'
  }
}

function contributorName(c: ContributionItem): string {
  return (c.participant_name ?? c.contributor_name ?? '').trim() || 'Anonymous'
}

function goBack() {
  router.push({ name: 'events-detail', params: { id: String(eventId.value) } })
}
</script>

<template>
  <div class="contributions-page">
    <WebNavbar />
    <main class="contributions-main">
      <button type="button" class="back-link" @click="goBack">
        <span class="back-icon">←</span> Back
      </button>

      <template v-if="event">
        <header class="page-header">
          <h1 class="page-title">Contributions</h1>
          <p class="page-subtitle">{{ event.title }}</p>
        </header>

        <!-- Stats -->
        <section class="stats-grid">
          <div class="stat-card stat-green">
            <span class="stat-icon">💰</span>
            <span class="stat-value">TZS {{ formatAmount(totalCollected) }}</span>
            <span class="stat-label">Total Collected</span>
          </div>
          <div class="stat-card stat-blue">
            <span class="stat-icon">📋</span>
            <span class="stat-value">{{ completedContributions.length }}</span>
            <span class="stat-label">Total Contributions</span>
          </div>
          <div class="stat-card stat-purple">
            <span class="stat-icon">📊</span>
            <span class="stat-value">TZS {{ formatAmount(avgAmount) }}</span>
            <span class="stat-label">Average Amount</span>
          </div>
          <div class="stat-card stat-orange">
            <span class="stat-icon">🎯</span>
            <span class="stat-value">{{ progressPercent }}%</span>
            <span class="stat-label">Target Progress</span>
          </div>
        </section>

        <!-- Tabs -->
        <div class="tabs">
          <button
            type="button"
            class="tab"
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            All Contributions
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: activeTab === 'by-contributor' }"
            @click="activeTab = 'by-contributor'"
          >
            By Contributor
          </button>
        </div>

        <!-- Filter chips -->
        <div class="filter-chips">
          <button
            v-for="f in filters"
            :key="f.key"
            type="button"
            class="chip"
            :class="{ active: statusFilter === f.key }"
            @click="statusFilter = f.key"
          >
            {{ f.label }}
          </button>
        </div>

        <div v-if="loading" class="state-loading">
          <div class="loader" />
          <p>Loading contributions…</p>
        </div>
        <div v-else-if="error" class="state-error">
          <p>{{ error.message }}</p>
          <button type="button" class="btn-retry" @click="loadContributions">Retry</button>
        </div>
        <div v-else-if="activeTab === 'all'">
          <div v-if="filteredByStatus.length === 0" class="state-empty">
            <span class="empty-icon">💳</span>
            <p>No contributions yet</p>
            <p class="hint">Be the first to contribute</p>
          </div>
          <ul v-else class="list contributions-list">
            <li v-for="c in filteredByStatus" :key="c.id" class="card contribution-card">
              <span class="avatar">{{ (contributorName(c) || 'U').charAt(0).toUpperCase() }}</span>
              <div class="body">
                <span class="name">{{ contributorName(c) }}</span>
                <span class="date">{{ formatDate(c.created_at) }}</span>
                <p v-if="c.message" class="message">"{{ c.message }}"</p>
              </div>
              <div class="right">
                <span class="amount">TZS {{ formatAmount(Number(c.amount)) }}</span>
                <span
                  class="status-badge"
                  :style="{ color: statusColor(c.status), backgroundColor: statusColor(c.status) + '20' }"
                >
                  {{ c.status }}
                </span>
              </div>
            </li>
          </ul>
        </div>
        <div v-else>
          <div v-if="groupedByContributor.length === 0" class="state-empty">
            <p>No contributors yet</p>
          </div>
          <ul v-else class="list contributors-list">
            <li
              v-for="(entry, index) in groupedByContributor"
              :key="entry[0]"
              class="card contributor-card"
            >
              <span class="avatar" :class="{ rank: index < 3 }">{{ (entry[0] || 'U').charAt(0).toUpperCase() }}</span>
              <div class="body">
                <span class="name">{{ entry[0] }}</span>
                <span class="count">{{ entry[1].length }} contribution(s)</span>
              </div>
              <span class="total">TZS {{ formatAmount(entry[1].reduce((s, x) => s + (Number(x.amount) || 0), 0)) }}</span>
            </li>
          </ul>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.contributions-page { min-height: 100vh; background: #f8fafc; }
.contributions-main { max-width: 720px; margin: 0 auto; padding: 24px 20px 48px; }
.back-link { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 8px 0; font-size: 14px; color: #6b7280; background: none; border: none; cursor: pointer; }
.back-link:hover { color: #1a283b; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
.page-subtitle { font-size: 14px; color: #6b7280; margin: 0; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 4px; }
.stat-icon { font-size: 18px; }
.stat-value { font-size: 16px; font-weight: 700; color: #1a1a2e; }
.stat-label { font-size: 11px; color: #6b7280; }
.stat-green .stat-value { color: #16a34a; }
.stat-blue .stat-value { color: #2563eb; }
.stat-purple .stat-value { color: #7c3aed; }
.stat-orange .stat-value { color: #ea580c; }
.tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.tab { padding: 10px 16px; font-size: 14px; font-weight: 500; color: #6b7280; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; cursor: pointer; }
.tab.active { color: #1a283b; border-color: #1a283b; background: rgba(26, 40, 59, 0.06); }
.filter-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.chip { padding: 6px 12px; font-size: 12px; border-radius: 20px; border: none; background: #f3f4f6; color: #6b7280; cursor: pointer; }
.chip.active { background: rgba(26, 40, 59, 0.1); color: #1a283b; font-weight: 600; }
.state-loading, .state-error, .state-empty { text-align: center; padding: 48px 24px; color: #6b7280; }
.loader { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #1a283b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.btn-retry { margin-top: 12px; padding: 10px 20px; font-size: 14px; font-weight: 500; color: #1a283b; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.hint { font-size: 13px; color: #9ca3af; margin-top: 4px; }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: flex; align-items: flex-start; gap: 12px; }
.avatar { width: 44px; height: 44px; border-radius: 50%; background: rgba(26, 40, 59, 0.1); color: #1a283b; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; }
.avatar.rank { outline: 2px solid #eab308; }
.body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.name { font-weight: 600; color: #1a1a2e; }
.date { font-size: 12px; color: #6b7280; }
.message { font-size: 13px; color: #6b7280; font-style: italic; margin: 8px 0 0; }
.right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.amount { font-size: 16px; font-weight: 700; color: #1a283b; }
.status-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.contributor-card .body .count { font-size: 12px; color: #6b7280; }
.total { font-size: 16px; font-weight: 700; color: #1a283b; }
</style>
