<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchMyEvents } from '@/api/event'
import type { PublicEvent } from '@/types/events'

const router = useRouter()
const events = ref<PublicEvent[]>([])
const loading = ref(true)
const error = ref<Error | null>(null)

async function loadEvents() {
  loading.value = true
  error.value = null
  try {
    const res = await fetchMyEvents()
    events.value = res.results ?? []
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load events')
    events.value = []
  } finally {
    loading.value = false
  }
}

const now = computed(() => new Date())

const sortedEvents = computed(() => {
  const list = [...events.value]
  list.sort((a, b) => {
    const aDate = parseDate(a.start_date) ?? new Date(0)
    const bDate = parseDate(b.start_date) ?? new Date(0)
    return aDate.getTime() - bDate.getTime()
  })
  return list
})

const upcomingEvents = computed(() => {
  const t = now.value.getTime()
  return sortedEvents.value.filter((e) => {
    const d = parseDate(e.start_date)
    return d && d.getTime() >= t
  })
})

const nextEvent = computed(() => upcomingEvents.value[0] ?? null)

const restUpcoming = computed(() => upcomingEvents.value.slice(1))

const pastEvents = computed(() => {
  const t = now.value.getTime()
  return sortedEvents.value
    .filter((e) => {
      const d = parseDate(e.start_date)
      return d && d.getTime() < t
    })
    .reverse()
})

const summary = computed(() => {
  const total = sortedEvents.value.length
  const upcoming = upcomingEvents.value.length
  return { total, upcoming }
})

function parseDate(s: string | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDateTime(iso: string | undefined): string {
  const d = parseDate(iso)
  if (!d) return '—'
  return d.toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function durationText(event: PublicEvent): string {
  const start = parseDate(event.start_date)
  const end = parseDate(event.end_date)
  if (!start || !end) return 'No duration set'
  const diffMs = end.getTime() - start.getTime()
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
  if (days > 0) return `${days} day${days === 1 ? '' : 's'}${hours > 0 ? ` ${hours} hour${hours === 1 ? '' : 's'}` : ''}`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'}${minutes > 0 ? ` ${minutes} min` : ''}`
  return `${minutes} minutes`
}

function timeRemaining(event: PublicEvent): { text: string; type: 'live' | 'ended' | 'upcoming' } {
  const start = parseDate(event.start_date)
  if (!start) return { text: 'Date not set', type: 'upcoming' }
  const nowDate = new Date()
  const diffMs = start.getTime() - nowDate.getTime()
  if (diffMs < 0) {
    const end = parseDate(event.end_date)
    if (end && end.getTime() < nowDate.getTime()) return { text: 'Event Ended', type: 'ended' }
    return { text: 'Event Live', type: 'live' }
  }
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
  if (days > 0) return { text: `${days} day${days === 1 ? '' : 's'} remaining`, type: 'upcoming' }
  if (hours > 0) return { text: `${hours} hour${hours === 1 ? '' : 's'} remaining`, type: 'upcoming' }
  return { text: `${minutes} minute${minutes === 1 ? '' : 's'} remaining`, type: 'upcoming' }
}

function nextEventSubline(event: PublicEvent): string {
  const remaining = timeRemaining(event)
  const dateStr = formatDateTime(event.start_date)
  if (remaining.type === 'upcoming') return `${remaining.text} · ${dateStr}`
  return dateStr
}

function addToCalendar(_event: PublicEvent) {
  const start = parseDate(_event.start_date)
  const end = parseDate(_event.end_date)
  if (!start) return
  const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', _event.title)
  url.searchParams.set('dates', `${format(start)}/${end ? format(end) : format(start)}`)
  if (_event.location) url.searchParams.set('location', _event.location)
  window.open(url.toString(), '_blank')
}

function goToEvent(event: PublicEvent) {
  router.push({ name: 'event-public', params: { id: String(event.id) } })
}

onMounted(() => {
  loadEvents()
})
</script>

<template>
  <div class="calendar-page">
    <WebNavbar />
    <main class="calendar-main">
      <header class="calendar-header">
        <h1 class="calendar-title">Calendar</h1>
        <p class="calendar-subtitle">Your upcoming events</p>
      </header>

      <div v-if="loading && events.length === 0" class="state state-loading">
        <div class="loader" aria-hidden="true" />
        <p>Loading calendar…</p>
      </div>

      <div v-else-if="error" class="state state-error">
        <p class="error-message">{{ error.message }}</p>
        <button type="button" class="btn-retry" @click="loadEvents">Try again</button>
      </div>

      <div v-else-if="sortedEvents.length === 0" class="state state-empty">
        <span class="empty-icon" aria-hidden="true">📅</span>
        <p>No Events</p>
        <p class="state-hint">Create or join events to see them here</p>
      </div>

      <template v-else>
        <!-- Overview summary -->
        <section class="calendar-summary" aria-label="Calendar overview">
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="summary-value">{{ summary.total }}</span>
              <span class="summary-label">Total events</span>
            </div>
            <div class="summary-stat highlight">
              <span class="summary-value">{{ summary.upcoming }}</span>
              <span class="summary-label">Upcoming</span>
            </div>
          </div>
        </section>

        <!-- Next up (most recent coming event) -->
        <section v-if="nextEvent" class="calendar-next-section">
          <h2 class="section-title">Next up</h2>
          <div
            class="calendar-card calendar-card-featured"
            role="button"
            tabindex="0"
            @click="goToEvent(nextEvent)"
            @keydown.enter="goToEvent(nextEvent)"
          >
            <div class="featured-badge">Soonest</div>
            <div class="card-featured-head">
              <span class="card-icon" aria-hidden="true">📅</span>
              <div class="card-featured-meta">
                <span class="card-type">{{ nextEvent.event_type_name || 'Event' }}</span>
                <span class="card-featured-subline">{{ nextEventSubline(nextEvent) }}</span>
              </div>
            </div>
            <h3 class="card-featured-title">{{ nextEvent.title }}</h3>
            <div class="card-featured-dates">
              <span class="featured-date">{{ formatDateTime(nextEvent.start_date) }}</span>
              <span v-if="nextEvent.end_date" class="featured-date-end">→ {{ formatDateTime(nextEvent.end_date) }}</span>
            </div>
            <div class="card-featured-actions">
              <button
                type="button"
                class="btn-add-calendar"
                aria-label="Add to Google Calendar"
                @click.stop="addToCalendar(nextEvent)"
              >
                Add to Google Calendar
              </button>
              <button type="button" class="btn-view-event" @click.stop="goToEvent(nextEvent)">
                View event
              </button>
            </div>
          </div>
        </section>

        <!-- More upcoming -->
        <section v-if="restUpcoming.length > 0" class="calendar-list-section">
          <h2 class="section-title">More upcoming</h2>
          <ul class="calendar-list">
            <li
              v-for="event in restUpcoming"
              :key="event.id"
              class="calendar-card calendar-card-compact"
              @click="goToEvent(event)"
            >
              <div class="compact-left">
                <span class="compact-date">{{ formatDateTime(event.start_date) }}</span>
                <span class="compact-title">{{ event.title }}</span>
                <span class="compact-meta">{{ event.event_type_name || 'Event' }} · {{ timeRemaining(event).text }}</span>
              </div>
              <button
                type="button"
                class="btn-add-calendar compact-btn"
                aria-label="Add to Google Calendar"
                @click.stop="addToCalendar(event)"
              >
                Add to Google Calendar
              </button>
            </li>
          </ul>
        </section>

        <!-- Past events -->
        <section v-if="pastEvents.length > 0" class="calendar-list-section">
          <h2 class="section-title">Past events</h2>
          <ul class="calendar-list">
            <li
              v-for="event in pastEvents"
              :key="event.id"
              class="calendar-card calendar-card-compact past"
              @click="goToEvent(event)"
            >
              <div class="compact-left">
                <span class="compact-date">{{ formatDateTime(event.start_date) }}</span>
                <span class="compact-title">{{ event.title }}</span>
                <span class="compact-meta">{{ event.event_type_name || 'Event' }} · {{ timeRemaining(event).text }}</span>
              </div>
              <button
                type="button"
                class="btn-add-calendar compact-btn"
                aria-label="Add to Google Calendar"
                @click.stop="addToCalendar(event)"
              >
                Add to Google Calendar
              </button>
            </li>
          </ul>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.calendar-page {
  min-height: 100vh;
  background: #fff;
}

.calendar-main {
  max-width: 720px;
  margin: 0 auto;
  padding: 96px 24px 48px;
}

@media (max-width: 768px) {
  .calendar-main {
    padding: 88px 16px 32px;
  }
}

.calendar-header {
  margin-bottom: 24px;
}

.calendar-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.calendar-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Overview summary */
.calendar-summary {
  margin-bottom: 28px;
}

.summary-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.summary-stat {
  min-width: 100px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.summary-stat.highlight {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.summary-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.summary-stat.highlight .summary-value {
  color: #1e293b;
}

.summary-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.summary-stat.highlight .summary-label {
  color: #64748b;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 12px;
  letter-spacing: 0.02em;
}

/* Next up featured card */
.calendar-next-section {
  margin-bottom: 28px;
}

.calendar-card-featured {
  position: relative;
  padding: 24px;
  background: #fff;
  border: 2px solid #e2e8f0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.calendar-card-featured:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.featured-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #475569;
  background: #f1f5f9;
  padding: 6px 10px;
  border-radius: 8px;
}

.card-featured-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.card-featured-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-type {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.card-featured-subline {
  font-size: 13px;
  color: #64748b;
}

.card-featured-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px;
  line-height: 1.3;
}

.card-featured-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #475569;
}

.featured-date-end {
  color: #64748b;
}

.card-featured-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-view-event {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-view-event:hover {
  background: #1d4ed8;
}

/* List sections */
.calendar-list-section {
  margin-bottom: 28px;
}

.calendar-list-section .section-title {
  margin-bottom: 12px;
}

.calendar-card-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 10px;
}

.calendar-card-compact .compact-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.compact-date {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.compact-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.compact-meta {
  font-size: 13px;
  color: #64748b;
}

.calendar-card-compact.past .compact-title,
.calendar-card-compact.past .compact-date {
  color: #94a3b8;
}

.calendar-card-compact.past .compact-meta {
  color: #cbd5e1;
}

.compact-btn {
  flex-shrink: 0;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: #64748b;
}

.state-loading .loader {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #1a283b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message { color: #dc2626; margin-bottom: 12px; }
.btn-retry {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #1a283b;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
}

.empty-icon { font-size: 64px; margin-bottom: 16px; }
.state-hint { font-size: 14px; margin-top: 8px; }

.calendar-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.calendar-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin: 0 4px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.calendar-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.card-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 40, 59, 0.1);
  border-radius: 12px;
  font-size: 24px;
}

.card-head-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-label {
  font-size: 18px;
  font-weight: 600;
  color: #334155;
}

.card-sublabel {
  font-size: 14px;
  color: #64748b;
}

.btn-add-calendar {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #1a283b;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;
}

.btn-add-calendar:hover {
  background: rgba(26, 40, 59, 0.06);
}

.card-dates {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.date-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.date-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  flex-shrink: 0;
}

.date-icon.start { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
.date-icon.end { background: rgba(239, 68, 68, 0.15); color: #dc2626; }

.date-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.date-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.date-value {
  font-size: 15px;
  font-weight: 500;
  color: #334155;
}

.card-duration {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(26, 40, 59, 0.05);
  border: 1px solid rgba(26, 40, 59, 0.12);
  border-radius: 12px;
  margin-bottom: 16px;
}

.duration-icon { font-size: 20px; }
.duration-content { display: flex; flex-direction: column; gap: 2px; }
.duration-label { font-size: 14px; font-weight: 500; color: #64748b; }
.duration-value { font-size: 16px; font-weight: 600; color: #1a283b; }

.card-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid;
}

.card-status.upcoming {
  background: rgba(26, 40, 59, 0.08);
  border-color: rgba(26, 40, 59, 0.25);
  color: #1a283b;
}

.card-status.live {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #16a34a;
}

.card-status.ended {
  background: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.3);
  color: #64748b;
}

.status-icon { font-size: 14px; }
.status-text { font-size: 14px; font-weight: 600; }

.card-event-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 16px 0 0;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}
</style>
