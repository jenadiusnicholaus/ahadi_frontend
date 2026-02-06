<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventById } from '@/api/event'
import { fetchParticipants, deleteParticipant } from '@/api/participants'
import type { PublicEvent } from '@/types/events'
import type { Participant } from '@/api/participants'

const route = useRoute()
const router = useRouter()
const event = ref<PublicEvent | null>(null)
const participants = ref<Participant[]>([])
const loading = ref(true)
const error = ref<Error | null>(null)
const searchQuery = ref('')

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

async function loadParticipants() {
  if (!eventId.value) return
  loading.value = true
  error.value = null
  try {
    const res = await fetchParticipants({
      event: eventId.value,
      page: 1,
      page_size: 50,
      search: searchQuery.value || undefined,
    })
    participants.value = res.results ?? []
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load participants')
    participants.value = []
  } finally {
    loading.value = false
  }
}

async function load() {
  if (!eventId.value) return
  await loadEvent()
  await loadParticipants()
}

onMounted(() => load())
watch(() => route.params.id, () => load())

const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return participants.value
  return participants.value.filter((p) => {
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q)
    )
  })
})

function formatAmount(value: string): string {
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString() : '0'
}

function statusColor(status: string): string {
  const s = (status || '').toUpperCase()
  if (s === 'CONFIRMED') return '#16a34a'
  if (s === 'PENDING') return '#ea580c'
  if (s === 'DECLINED') return '#dc2626'
  return '#6b7280'
}

function statusDisplay(status: string): string {
  if (!status) return '—'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

async function confirmRemove(p: Participant) {
  if (!confirm(`Remove ${p.name || 'Anonymous'} from this event?`)) return
  try {
    await deleteParticipant(p.id)
    await loadParticipants()
  } catch {
    // could toast
  }
}

function goBack() {
  router.push({ name: 'events-detail', params: { id: String(eventId.value) } })
}
</script>

<template>
  <div class="participants-page">
    <WebNavbar />
    <main class="participants-main">
      <button type="button" class="back-link" @click="goBack">
        <span class="back-icon">←</span> Back
      </button>

      <template v-if="event">
        <header class="page-header">
          <div class="header-left">
            <div class="count-badge">
              <span class="count-num">{{ participants.length }}</span>
              <span class="count-label">Participants</span>
            </div>
          </div>
          <div class="header-actions">
            <input
              v-model.trim="searchQuery"
              type="search"
              class="search-input"
              placeholder="Search by name, email or phone"
              aria-label="Search participants"
            />
            <button type="button" class="btn-add" disabled title="Add participant – coming soon">
              Add
            </button>
          </div>
        </header>

        <div v-if="loading && participants.length === 0" class="state-loading">
          <div class="loader" />
          <p>Loading participants…</p>
        </div>
        <div v-else-if="error" class="state-error">
          <p>{{ error.message }}</p>
          <button type="button" class="btn-retry" @click="loadParticipants">Retry</button>
        </div>
        <div v-else-if="filteredList.length === 0" class="state-empty">
          <span class="empty-icon">👥</span>
          <p>{{ searchQuery ? 'No participants found' : 'No participants yet' }}</p>
          <p v-if="!searchQuery" class="hint">Add participants to get started</p>
        </div>
        <ul v-else class="participants-list">
          <li v-for="p in filteredList" :key="p.id" class="card participant-card">
            <div class="avatar-wrap">
              <span class="avatar">{{ (p.name || '?')[0].toUpperCase() }}</span>
              <span
                class="status-dot"
                :style="{ backgroundColor: statusColor(p.status) }"
                :title="statusDisplay(p.status)"
              />
            </div>
            <div class="body">
              <span class="name">{{ p.name || 'Anonymous' }}</span>
              <p v-if="p.email" class="meta"><span class="meta-icon">✉️</span> {{ p.email }}</p>
              <p v-if="p.phone" class="meta"><span class="meta-icon">📞</span> {{ p.phone }}</p>
              <span class="amount-badge">TZS {{ formatAmount(p.total_contributions) }}</span>
            </div>
            <div class="actions">
              <button type="button" class="btn-icon" disabled title="Edit – coming soon">✏️</button>
              <button
                type="button"
                class="btn-icon btn-remove"
                title="Remove"
                @click="confirmRemove(p)"
              >
                🗑️
              </button>
            </div>
          </li>
        </ul>
      </template>
    </main>
  </div>
</template>

<style scoped>
.participants-page { min-height: 100vh; background: #f8fafc; }
.participants-main { max-width: 720px; margin: 0 auto; padding: 24px 20px 48px; }
.back-link { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 8px 0; font-size: 14px; color: #6b7280; background: none; border: none; cursor: pointer; }
.back-link:hover { color: #1a283b; }
.page-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; padding: 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.count-badge { display: flex; flex-direction: column; gap: 4px; }
.count-num { font-size: 28px; font-weight: 700; color: #1a1a2e; line-height: 1; }
.count-label { font-size: 14px; color: #6b7280; }
.header-actions { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.search-input { flex: 1; min-width: 120px; padding: 10px 14px; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 10px; }
.btn-add { padding: 10px 16px; font-size: 14px; font-weight: 600; color: #fff; background: #1a283b; border: none; border-radius: 10px; cursor: pointer; opacity: 0.7; }
.state-loading, .state-error, .state-empty { text-align: center; padding: 48px 24px; color: #6b7280; }
.loader { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #1a283b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.btn-retry { margin-top: 12px; padding: 10px 20px; font-size: 14px; font-weight: 500; color: #1a283b; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.hint { font-size: 13px; color: #9ca3af; margin-top: 4px; }
.participants-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; display: flex; align-items: flex-start; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar { width: 60px; height: 60px; border-radius: 16px; background: linear-gradient(135deg, rgba(26,40,59,0.3), rgba(26,40,59,0.15)); color: #1a283b; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 26px; }
.status-dot { position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #fff; }
.body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.name { font-size: 16px; font-weight: 700; color: #1a1a2e; }
.meta { margin: 0; font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 6px; }
.meta-icon { font-size: 14px; }
.amount-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; background: rgba(26,40,59,0.1); color: #1a283b; font-size: 13px; font-weight: 700; align-self: flex-start; }
.actions { display: flex; gap: 4px; }
.btn-icon { padding: 8px; border: none; background: #f3f4f6; border-radius: 8px; cursor: pointer; font-size: 14px; }
.btn-remove:hover { background: #fee2e2; }
</style>
