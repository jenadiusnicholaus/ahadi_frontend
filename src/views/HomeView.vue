<script setup lang="ts">
import { onMounted } from 'vue'
import WebNavbar from '@/components/WebNavbar.vue'
import HeroSection from '@/components/HeroSection.vue'
import EventTypesSection from '@/components/EventTypesSection.vue'
import DiscoverEventsSection from '@/components/DiscoverEventsSection.vue'
import { usePublicEvents } from '@/composables/usePublicEvents'
import type { PublicEvent } from '@/types/events'

const {
  eventTypes,
  eventTypesLoading,
  selectedEventTypeId,
  events,
  eventsLoading,
  eventsError,
  hasActiveFilters,
  loadEventTypes,
  loadEvents,
  filterByEventType,
  clearFilters,
} = usePublicEvents()

onMounted(() => {
  loadEventTypes()
  loadEvents(1)
})

function onEventCardClick(_event: PublicEvent) {
  // TODO: navigate to event details or open modal
}
</script>

<template>
  <div class="home">
    <WebNavbar />
    <HeroSection />

    <main>
      <section id="discover" class="discover-wrapper">
        <EventTypesSection
          :event-types="eventTypes"
          :loading="eventTypesLoading"
          :selected-event-type-id="selectedEventTypeId"
          @filter-by-type="filterByEventType"
        />
        <DiscoverEventsSection
          :events="events"
          :loading="eventsLoading"
          :error="eventsError"
          :has-active-filters="hasActiveFilters"
          @clear-filters="clearFilters"
          @card-click="onEventCardClick"
        />
      </section>

      <section id="how-it-works" class="section" style="margin-top: 0;">
        <h2>How It Works</h2>
        <p>Create, share, and manage events in a few steps.</p>
      </section>

      <section id="pricing" class="section">
        <h2>Pricing</h2>
        <p>Simple, transparent pricing for everyone.</p>
      </section>

      <section id="about" class="section">
        <h2>About</h2>
        <p>Learn more about Ahadi.</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f2ed;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 24px 24px;
  background: #fff;
}

@media (max-width: 768px) {
  main {
    padding: 16px 20px 20px;
    margin: 0;
  }
}

.section {
  min-height: 60vh;
  padding: 24px 0;
  border-bottom: 1px solid #e5e7eb;
}

.section:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .section {
    min-height: 0;
    padding: 20px 0 24px;
  }
  .section:first-child {
    padding-top: 12px;
  }
}

.section h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 12px;
  font-family: Georgia, 'Times New Roman', serif;
}

@media (max-width: 768px) {
  .section h2 {
    font-size: 26px;
    margin-bottom: 8px;
  }
}

.section p {
  font-size: 16px;
  color: #6b7280;
  font-family: Georgia, 'Times New Roman', serif;
}

@media (max-width: 768px) {
  .section p {
    font-size: 15px;
    color: #9ca3af;
    line-height: 1.5;
  }
}
</style>
