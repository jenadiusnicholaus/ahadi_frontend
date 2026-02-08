<script setup lang="ts">
import EventCard from '@/components/EventCard.vue'
import type { PublicEvent } from '@/types/events'

withDefaults(
  defineProps<{
    events: PublicEvent[]
    loading?: boolean
    error: Error | null
    hasActiveFilters?: boolean
  }>(),
  { loading: false, hasActiveFilters: false }
)

const emit = defineEmits<{
  clearFilters: []
  cardClick: [event: PublicEvent]
}>()

function onClearFilters() {
  emit('clearFilters')
}

function onCardClick(event: PublicEvent) {
  emit('cardClick', event)
}
</script>

<template>
  <section class="discover-section">
    <div class="section-header">
      <span class="section-label">DISCOVER</span>
      <h2 class="section-title">Explore upcoming events</h2>
      <button
        v-if="hasActiveFilters"
        type="button"
        class="btn-clear"
        @click="onClearFilters"
      >
        <span class="btn-clear-icon" aria-hidden="true">✕</span>
        Clear filters
      </button>
    </div>
    <div class="section-spacer" />

    <div v-if="loading && events.length === 0" class="state state-loading">
      <div class="loader" aria-hidden="true" />
      <p>Loading events…</p>
    </div>

    <div v-else-if="error" class="state state-error">
      <p class="error-message">{{ error.message }}</p>
      <slot name="retry">
        <p>Try again later.</p>
      </slot>
    </div>

    <div
      v-else-if="!loading && events.length === 0"
      class="state state-empty"
    >
      <p>No events found.</p>
      <p class="state-hint">Try changing the category or clear filters.</p>
    </div>

    <div v-else class="events-grid">
      <EventCard
        v-for="event in events"
        :key="event.id"
        :event="event"
        @click="onCardClick"
      />
    </div>
  </section>
</template>

<style scoped>
.discover-section {
  width: 100%;
  margin: 0;
  padding: 32px 24px 48px;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

@media (max-width: 1024px) {
  .discover-section {
    padding: 24px 20px 40px;
  }
}

@media (max-width: 768px) {
  .discover-section {
    padding: 20px 16px 32px;
  }
  .section-spacer {
    height: 16px;
  }
  .events-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .discover-section {
    padding: 16px 12px 24px;
  }
  .section-title {
    font-size: 22px;
  }
  .events-grid {
    gap: 12px;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-bottom: 4px;
}

.section-label {
  width: 100%;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #71717a;
  margin-bottom: 2px;
}

.section-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.02em;
  flex: 1 1 auto;
  min-width: 0;
}

.section-spacer {
  height: 24px;
}

.btn-clear {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 14px;
  color: #6b7280;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-clear:hover {
  background: #f9fafb;
  color: #374151;
}

.btn-clear-icon {
  font-size: 12px;
}

.events-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
  width: 100%;
}

@media (min-width: 640px) {
  .events-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (min-width: 968px) {
  .events-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

@media (min-width: 1200px) {
  .events-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 28px;
  }
}

.state {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
  font-size: 16px;
}

.state-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: hsl(220, 12%, 18%);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-error .error-message {
  color: #b91c1c;
  font-weight: 500;
  margin-bottom: 8px;
}

.state-empty .state-hint {
  font-size: 14px;
  color: #9ca3af;
  margin-top: 8px;
}
</style>
