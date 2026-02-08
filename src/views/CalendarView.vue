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

const sortedEvents = computed(() => {
  const list = [...events.value]
  list.sort((a, b) => {
    const aDate = parseDate(a.start_date) ?? new Date(0)
    const bDate = parseDate(b.start_date) ?? new Date(0)
    return aDate.getTime() - bDate.getTime()
  })
  return list
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
  const now = new Date()
  const diffMs = start.getTime() - now.getTime()
  if (diffMs < 0) {
    const end = parseDate(event.end_date)
    if (end && end.getTime() < now.getTime()) return { text: 'Event Ended', type: 'ended' }
    return { text: 'Event Live', type: 'live' }
  }
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
  if (days > 0) return { text: `${days} day${days === 1 ? '' : 's'} remaining`, type: 'upcoming' }
  if (hours > 0) return { text: `${hours} hour${hours === 1 ? '' : 's'} remaining`, type: 'upcoming' }
  return { text: `${minutes} minute${minutes === 1 ? '' : 's'} remaining`, type: 'upcoming' }
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

      <ul v-else class="calendar-list">
        <li
          v-for="event in sortedEvents"
          :key="event.id"
          class="calendar-card"
          @click="goToEvent(event)"
        >
          <div class="card-head">
            <span class="card-icon" aria-hidden="true">📅</span>
            <div class="card-head-text">
              <span class="card-label">Event Schedule</span>
              <span class="card-sublabel">Dates and reminders</span>
            </div>
            <button
              type="button"
              class="btn-add-calendar"
              aria-label="Add to calendar"
              @click.stop="addToCalendar(event)"
            >
              Add to Calendar
            </button>
          </div>

          <div class="card-dates">
            <div class="date-row">
              <span class="date-icon start">▶</span>
              <div class="date-content">
                <span class="date-label">Start Date</span>
                <span class="date-value">{{ formatDateTime(event.start_date) }}</span>
              </div>
            </div>
            <div class="date-row">
              <span class="date-icon end">■</span>
              <div class="date-content">
                <span class="date-label">End Date</span>
                <span class="date-value">{{ formatDateTime(event.end_date) || '—' }}</span>
              </div>
            </div>
          </div>

          <div class="card-duration">
            <span class="duration-icon" aria-hidden="true">⏱</span>
            <div class="duration-content">
              <span class="duration-label">Duration</span>
              <span class="duration-value">{{ durationText(event) }}</span>
            </div>
          </div>

          <div
            class="card-status"
            :class="timeRemaining(event).type"
          >
            <span class="status-icon" aria-hidden="true">
              {{ timeRemaining(event).type === 'live' ? '●' : timeRemaining(event).type === 'ended' ? '○' : '◷' }}
            </span>
            <span class="status-text">{{ timeRemaining(event).text }}</span>
          </div>

          <p class="card-event-title">{{ event.title }}</p>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.calendar-page {
  min-height: 100vh;
  background: #f8fafc;
}

.calendar-main {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px;
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
