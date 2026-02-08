<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import EventCard from '@/components/EventCard.vue'
import { fetchMyEvents } from '@/api/myEvents'
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

onMounted(() => {
  loadEvents()
})

function onEventCardClick(event: PublicEvent) {
  router.push({ name: 'event-public', params: { id: String(event.id) } })
}

function goToCreateEvent() {
  router.push({ name: 'events-create' })
}
</script>

<template>
  <div class="events-page">
    <WebNavbar />
    <main class="events-main">
      <header class="events-header">
        <div class="header-text">
          <h1 class="page-title">My Events</h1>
          <p class="page-subtitle">Manage and track events you've created or joined</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-create" @click="goToCreateEvent">
            <span class="btn-create-icon" aria-hidden="true">+</span>
            Create Event
          </button>
        </div>
      </header>

      <div v-if="loading && events.length === 0" class="state state-loading">
        <div class="loader" aria-hidden="true" />
        <p>Loading your events…</p>
      </div>

      <div v-else-if="error" class="state state-error">
        <p class="error-message">{{ error.message }}</p>
        <button type="button" class="btn-retry" @click="loadEvents">Try again</button>
      </div>

      <div v-else-if="events.length === 0" class="state state-empty">
        <p>No events yet</p>
        <p class="state-hint">Create your first event to get started.</p>
        <button type="button" class="btn-create btn-create-large" @click="goToCreateEvent">
          Create Event
        </button>
      </div>

      <div v-else class="events-grid">
        <EventCard
          v-for="event in events"
          :key="event.id"
          :event="event"
          @click="onEventCardClick"
        >
          <template #actions>
            <router-link
              :to="{ name: 'events-detail', params: { id: String(event.id) } }"
              class="events-manage-link"
              @click.stop
            >
              Manage
            </router-link>
          </template>
        </EventCard>
      </div>
    </main>
  </div>
</template>

<style scoped>
.events-page {
  min-height: 100vh;
  background: #f8fafc;
}

.events-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

@media (max-width: 768px) {
  .events-main {
    padding: 20px 16px 32px;
  }
}

.events-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  flex-shrink: 0;
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #1a283b;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

.btn-create:hover {
  background: #2d3a4f;
}

.btn-create-icon {
  font-size: 18px;
  line-height: 1;
}

.btn-create-large {
  margin-top: 16px;
  padding: 14px 28px;
  font-size: 16px;
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

.state-loading p,
.state-empty p,
.state-error .error-message {
  margin: 12px 0 0;
  font-size: 16px;
}

.state-hint {
  font-size: 14px;
  color: #9ca3af;
  margin-top: 4px;
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
  to {
    transform: rotate(360deg);
  }
}

.btn-retry {
  margin-top: 16px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #1a283b;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}

.btn-retry:hover {
  background: #f9fafb;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.events-manage-link {
  font-size: 12px;
  font-weight: 500;
  color: #3b82f6;
  text-decoration: none;
}

.events-manage-link:hover {
  text-decoration: underline;
}
</style>
