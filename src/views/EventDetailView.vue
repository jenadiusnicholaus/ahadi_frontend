<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import WebNavbar from '@/components/WebNavbar.vue'
import { assetUrl } from '@/api/client'
import { fetchEventById, fetchEventParticipants } from '@/api/event'
import { useAuthStore } from '@/stores/auth'
import type { PublicEvent } from '@/types/events'
import type { Participant } from '@/api/participants'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const event = ref<PublicEvent | null>(null)
const participants = ref<Participant[]>([])
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
    error.value = null
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load event')
    event.value = null
  }
}

async function loadParticipants() {
  if (!eventId.value) return
  try {
    const data = await fetchEventParticipants(eventId.value) as { results?: Participant[] } | Participant[]
    if (Array.isArray(data)) {
      participants.value = data
    } else if (data && typeof data === 'object' && 'results' in data) {
      participants.value = (data as { results: Participant[] }).results ?? []
    } else {
      participants.value = []
    }
  } catch {
    participants.value = []
  }
}

async function load() {
  if (!eventId.value) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  await loadEvent()
  await loadParticipants()
  loading.value = false
}

onMounted(() => load())
watch(() => route.params.id, () => load())

const coverImageUrl = computed(() => {
  const raw = event.value?.cover_image
  return raw ? assetUrl(raw) : ''
})

const startDate = computed(() => {
  const s = event.value?.start_date
  if (!s) return null
  try {
    return new Date(s)
  } catch {
    return null
  }
})

const endDate = computed(() => {
  const s = event.value?.end_date
  if (!s) return null
  try {
    return new Date(s)
  } catch {
    return null
  }
})

const formattedStartDate = computed(() => {
  const d = startDate.value
  if (!d) return ''
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const formattedEndDate = computed(() => {
  const d = endDate.value
  if (!d) return ''
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const participantCount = computed(() => {
  const n = event.value?.participant_count
  if (n === undefined || n === null || n === '') return 0
  const num = Number(n)
  return Number.isFinite(num) ? num : 0
})

const contributionTarget = computed(() => {
  const t = event.value?.contribution_target
  if (t === undefined || t === null || t === '') return 0
  const num = Number(t)
  return Number.isFinite(num) && num > 0 ? num : 0
})

const totalContributions = computed(() => {
  const t = event.value?.total_contributions
  if (t === undefined || t === null || t === '') return 0
  const num = Number(t)
  return Number.isFinite(num) ? num : 0
})

const progressPercent = computed(() => {
  const target = contributionTarget.value
  if (target <= 0) return 0
  return Math.min(100, Math.round((totalContributions.value / target) * 100))
})

const currency = computed(() => event.value?.currency || 'TZS')

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toFixed(0)
}

const statusDisplay = computed(() => {
  const s = event.value?.status ?? ''
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
})

const visibilityDisplay = computed(() => {
  const v = event.value?.visibility ?? ''
  if (!v) return '—'
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
})

const currentUserId = computed(() => user.value?.id ?? 0)
const isOwner = computed(() => event.value != null && event.value.owner === currentUserId.value)

const isWedding = computed(() => {
  const name = event.value?.event_type_name ?? ''
  return name.toLowerCase().includes('wedding')
})

const recentParticipants = computed(() => participants.value.slice(0, 5))

function getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'ACTIVE': return '#16a34a'
    case 'DRAFT': return '#ea580c'
    case 'COMPLETED': return '#2563eb'
    case 'CANCELLED': return '#dc2626'
    default: return '#6b7280'
  }
}

function getParticipantStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED': return '#16a34a'
    case 'PENDING': return '#ea580c'
    case 'DECLINED': return '#dc2626'
    default: return '#6b7280'
  }
}

function participantStatusDisplay(status: string): string {
  if (!status) return '—'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function goBack() {
  router.push({ name: 'events' })
}

function onViewContributions() {
  if (event.value) router.push({ name: 'events-contributions', params: { id: String(event.value.id) } })
}

function onViewParticipants() {
  if (event.value) router.push({ name: 'events-participants', params: { id: String(event.value.id) } })
}


function copyJoinCode() {
  const code = event.value?.join_code
  if (!code) return
  navigator.clipboard.writeText(code).then(() => {
    // Could use a toast; for now no UI
  })
}

function shareEvent() {
  const ev = event.value
  if (!ev) return
  const text = `You're invited to "${ev.title}"!\nJoin using code: ${ev.join_code}\nPowered by Ahadi - Event Contributions Made Easy`
  const url = window.location.href
  if (navigator.share) {
    navigator.share({ title: ev.title, text, url }).catch(() => {
      navigator.clipboard.writeText(text)
    })
  } else {
    navigator.clipboard.writeText(text)
  }
}

function formatParticipantAmount(value: string): string {
  const n = Number(value)
  return Number.isFinite(n) ? formatAmount(n) : '0'
}
</script>

<template>
  <div class="event-detail-page">
    <WebNavbar />
    <main class="event-detail-main">
      <div v-if="loading && !event" class="state state-loading">
        <div class="loader" aria-hidden="true" />
        <p>Loading event…</p>
      </div>

      <div v-else-if="error" class="state state-error">
        <p class="error-message">{{ error.message }}</p>
        <button type="button" class="btn-retry" @click="load">Try again</button>
        <button type="button" class="btn-back" @click="goBack">Back to Events</button>
      </div>

      <template v-else-if="event">
        <!-- Back -->
        <button type="button" class="back-link" aria-label="Back to events" @click="goBack">
          <span class="back-icon" aria-hidden="true">←</span>
          Back to Events
        </button>

        <!-- Header -->
        <header class="detail-header">
          <div class="header-badges">
            <span
              class="badge badge-status"
              :style="{ color: getStatusColor(event.status), backgroundColor: getStatusColor(event.status) + '20' }"
            >
              {{ statusDisplay }}
            </span>
            <span v-if="event.event_type_name" class="badge badge-type">
              {{ event.event_type_name }}
            </span>
          </div>
          <h1 class="detail-title">{{ event.title }}</h1>
          <p v-if="event.location" class="detail-location">
            <span class="location-icon" aria-hidden="true">📍</span>
            {{ event.location }}
          </p>
        </header>

        <!-- Cover image -->
        <div v-if="coverImageUrl" class="cover-wrap">
          <img :src="coverImageUrl" :alt="event.title" class="cover-image" @error="($event.target as HTMLImageElement)?.classList?.add('img-error')" />
        </div>
        <div v-else class="cover-wrap cover-placeholder">
          <span>No image</span>
        </div>

        <!-- Progress card -->
        <section v-if="contributionTarget > 0" id="progress" class="card progress-card">
          <div class="progress-header">
            <div class="progress-amounts">
              <span class="progress-total">{{ currency }} {{ formatAmount(totalContributions) }}</span>
              <span class="progress-of">of {{ currency }} {{ formatAmount(contributionTarget) }} target</span>
            </div>
            <span class="progress-percent">{{ progressPercent }}%</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" :style="{ width: Math.min(100, progressPercent) + '%' }" />
          </div>
          <div class="progress-footer">
            <span class="participants-count">👥 {{ participantCount }} participants</span>
            <button type="button" class="btn-link" @click="onViewContributions">View all contributions</button>
          </div>
        </section>

        <!-- Quick actions -->
        <section class="quick-actions">
          <div class="actions-row">
            <button type="button" class="action-tile" @click="onViewContributions">
              <span class="action-icon">💳</span>
              <span class="action-label">Contributions</span>
            </button>
            <button type="button" class="action-tile" @click="onViewParticipants">
              <span class="action-icon">👥</span>
              <span class="action-label">Participants</span>
            </button>
            <button type="button" class="action-tile" @click="shareEvent">
              <span class="action-icon">📤</span>
              <span class="action-label">Share</span>
            </button>
            <router-link
              v-if="event.chat_enabled"
              :to="{ name: 'events-chat', params: { id: String(event.id) } }"
              class="action-tile"
            >
              <span class="action-icon">💬</span>
              <span class="action-label">Message</span>
            </router-link>
          </div>
          <div v-if="isOwner" class="actions-row">
            <router-link :to="{ name: 'events-wallet', params: { id: String(event.id) } }" class="action-tile">
              <span class="action-icon">👛</span>
              <span class="action-label">Wallet</span>
            </router-link>
            <router-link :to="{ name: 'events-transactions', params: { id: String(event.id) } }" class="action-tile">
              <span class="action-icon">📋</span>
              <span class="action-label">Transactions</span>
            </router-link>
            <router-link :to="{ name: 'events-edit', params: { id: String(event.id) } }" class="action-tile">
              <span class="action-icon">✏️</span>
              <span class="action-label">Edit Event</span>
            </router-link>
          </div>
        </section>

        <!-- Invitation (wedding) -->
        <section v-if="isWedding" class="card invitation-card">
          <h3 class="card-title">Invitation Card</h3>
          <div v-if="event.custom_invitation_image" class="invitation-preview">
            <img :src="assetUrl(event.custom_invitation_image)" alt="Custom invitation" class="invitation-img" />
            <span class="invitation-badge custom">Custom</span>
          </div>
          <div v-else-if="event.invitation_card_template" class="invitation-placeholder">
            <span class="invitation-icon">🎴</span>
            <p>Template selected</p>
            <router-link :to="{ name: 'events-detail', params: { id: String(event.id) }, query: { tab: 'templates' } }" class="btn-secondary">Change template</router-link>
          </div>
          <div v-else class="invitation-placeholder">
            <span class="invitation-icon">🎴</span>
            <p>No template selected</p>
            <p class="hint">Choose a template for your wedding invitations</p>
            <router-link :to="{ name: 'events-detail', params: { id: String(event.id) }, query: { tab: 'templates' } }" class="btn-primary-inv">Select Template</router-link>
          </div>
        </section>

        <!-- About -->
        <section v-if="event.description" class="card about-card">
          <h3 class="card-title">About</h3>
          <p class="about-text">{{ event.description }}</p>
        </section>

        <!-- Event details -->
        <section class="card details-card">
          <h3 class="card-title">Event Details</h3>
          <div class="detail-rows">
            <div v-if="formattedStartDate" class="detail-row">
              <span class="detail-row-icon">📅</span>
              <div>
                <span class="detail-row-label">Start Date</span>
                <span class="detail-row-value">{{ formattedStartDate }}</span>
              </div>
            </div>
            <div v-if="formattedEndDate" class="detail-row">
              <span class="detail-row-icon">📅</span>
              <div>
                <span class="detail-row-label">End Date</span>
                <span class="detail-row-value">{{ formattedEndDate }}</span>
              </div>
            </div>
            <div v-if="event.location" class="detail-row">
              <span class="detail-row-icon">📍</span>
              <div>
                <span class="detail-row-label">Location</span>
                <span class="detail-row-value">{{ event.location }}</span>
              </div>
            </div>
            <div v-if="event.venue_name" class="detail-row">
              <span class="detail-row-icon">🏛️</span>
              <div>
                <span class="detail-row-label">Venue</span>
                <span class="detail-row-value">{{ event.venue_name }}</span>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-row-icon">👁️</span>
              <div>
                <span class="detail-row-label">Visibility</span>
                <span class="detail-row-value">{{ visibilityDisplay }}</span>
              </div>
            </div>
            <div v-if="event.join_code" class="detail-row detail-row-clickable" @click="copyJoinCode">
              <span class="detail-row-icon">🔗</span>
              <div>
                <span class="detail-row-label">Join Code</span>
                <span class="detail-row-value">{{ event.join_code }}</span>
              </div>
              <span class="copy-hint">Copy</span>
            </div>
          </div>
        </section>

        <!-- Recent participants -->
        <section id="participants" class="card participants-card">
          <div class="participants-header">
            <h3 class="card-title">Recent Participants</h3>
            <button type="button" class="btn-link" @click="onViewParticipants">View all</button>
          </div>
          <div v-if="recentParticipants.length === 0" class="participants-empty">
            No participants yet
          </div>
          <ul v-else class="participants-list">
            <li v-for="p in recentParticipants" :key="p.id" class="participant-item">
              <span class="participant-avatar">{{ (p.name || '?').charAt(0).toUpperCase() }}</span>
              <div class="participant-info">
                <span class="participant-name">{{ p.name || 'Anonymous' }}</span>
                <span class="participant-amount">{{ currency }} {{ formatParticipantAmount(p.total_contributions) }}</span>
              </div>
              <span
                class="participant-status"
                :style="{ color: getParticipantStatusColor(p.status), backgroundColor: getParticipantStatusColor(p.status) + '20' }"
              >
                {{ participantStatusDisplay(p.status) }}
              </span>
            </li>
          </ul>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.event-detail-page {
  min-height: 100vh;
  background: #f8fafc;
}

.event-detail-main {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  padding-top: 72px;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  text-align: center;
  color: #6b7280;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #1a283b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-retry,
.btn-back {
  margin-top: 12px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #1a283b;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}

.btn-retry:hover,
.btn-back:hover {
  background: #f9fafb;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 8px 0;
  font-size: 14px;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
}

.back-link:hover {
  color: #1a283b;
}

.back-icon {
  font-size: 18px;
}

.detail-header {
  margin-bottom: 20px;
}

.header-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge-type {
  background: #f3f4f6;
  color: #6b7280;
}

.detail-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
  line-height: 1.3;
}

.detail-location {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.cover-wrap {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: #e5e7eb;
  margin-bottom: 20px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-image.img-error {
  object-fit: none;
  background: #e5e7eb;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 12px;
}

.progress-card .progress-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.progress-amounts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.progress-total {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.progress-of {
  font-size: 14px;
  color: #6b7280;
}

.progress-percent {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  color: #1a283b;
  background: rgba(26, 40, 59, 0.1);
}

.progress-bar-wrap {
  height: 12px;
  background: #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar-fill {
  height: 100%;
  background: #1a283b;
  border-radius: 8px;
  transition: width 0.3s ease;
}

.progress-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #6b7280;
}

.btn-link {
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #1a283b;
  cursor: pointer;
  padding: 0;
}

.btn-link:hover {
  text-decoration: underline;
}

.quick-actions {
  margin-bottom: 20px;
}

.actions-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.actions-row:last-child {
  margin-bottom: 0;
}

@media (max-width: 480px) {
  .actions-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 10px;
  }
}

.action-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 8px;
  min-width: 0;
  background: #fff;
  border: 1px solid rgba(26, 40, 59, 0.3);
  border-radius: 12px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;
  text-align: center;
}

.action-tile:hover {
  background: #f8fafc;
  border-color: #1a283b;
}

.action-icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
}

.action-label {
  line-height: 1.2;
  word-break: break-word;
  overflow-wrap: break-word;
}

@media (max-width: 480px) {
  .action-tile {
    padding: 16px 10px;
  }
  .action-icon {
    font-size: 22px;
  }
}

.invitation-card {
  border-color: #fbcfe8;
}

.invitation-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #fbcfe8;
}

.invitation-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.invitation-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
}

.invitation-badge.custom {
  background: #16a34a;
}

.invitation-placeholder {
  padding: 24px;
  background: #fdf2f8;
  border: 1px solid #fbcfe8;
  border-radius: 12px;
  text-align: center;
}

.invitation-placeholder .invitation-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.invitation-placeholder p {
  margin: 0 0 8px;
  color: #831843;
  font-weight: 500;
}

.invitation-placeholder .hint {
  font-size: 12px;
  color: #9d174d;
  margin-bottom: 16px;
}

.btn-primary-inv,
.btn-secondary {
  display: inline-block;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary-inv {
  background: #ec4899;
  color: #fff;
}

.btn-primary-inv:hover {
  background: #db2777;
}

.btn-secondary {
  background: #fff;
  color: #ec4899;
  border: 1px solid #f9a8d4;
}

.btn-secondary:hover {
  background: #fdf2f8;
}

.about-text {
  margin: 0;
  font-size: 15px;
  color: #6b7280;
  line-height: 1.5;
}

.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.detail-row-clickable {
  cursor: pointer;
}

.detail-row-clickable:hover .copy-hint {
  opacity: 1;
}

.detail-row-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.detail-row-label {
  display: block;
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.detail-row-value {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.copy-hint {
  margin-left: auto;
  font-size: 12px;
  color: #1a283b;
  opacity: 0.7;
}

.participants-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.participants-header .card-title {
  margin: 0;
}

.participants-empty {
  padding: 24px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.participants-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.participant-item:last-child {
  border-bottom: none;
}

.participant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(26, 40, 59, 0.1);
  color: #1a283b;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.participant-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.participant-name {
  font-weight: 500;
  color: #1a1a2e;
}

.participant-amount {
  font-size: 12px;
  color: #6b7280;
}

.participant-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
</style>
