<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import HeroSection from '@/components/HeroSection.vue'
import EventTypesSection from '@/components/EventTypesSection.vue'
import DiscoverEventsSection from '@/components/DiscoverEventsSection.vue'
import HowItWorksSection from '@/components/HowItWorksSection.vue'
import PricingSection from '@/components/PricingSection.vue'
import AboutSection from '@/components/AboutSection.vue'
import Footer from '@/components/Footer.vue'
import { usePublicEvents } from '@/composables/usePublicEvents'
import type { PublicEvent } from '@/types/events'

const router = useRouter()

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

function onEventCardClick(event: PublicEvent) {
  router.push({ name: 'event-public', params: { id: String(event.id) } })
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

      <HowItWorksSection />

      <PricingSection />
    </main>

    <AboutSection />

    <Footer />
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: #fff;
  position: relative;
}

main {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 0 32px 48px;
  background: #fff;
  border-radius: 24px 24px 0 0;
}

@media (max-width: 1024px) {
  main {
    padding: 0 24px 40px;
  }
}

@media (max-width: 768px) {
  main {
    padding: 0 16px 24px;
    border-radius: 20px 20px 0 0;
  }
}

@media (max-width: 480px) {
  main {
    padding: 0 12px 20px;
  }
}

.section {
  min-height: 60vh;
  padding: 24px 0;
  border-bottom: 1px solid rgba(26, 32, 44, 0.06);
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
  letter-spacing: -0.02em;
}

@media (max-width: 768px) {
  .section h2 {
    font-size: 26px;
    margin-bottom: 8px;
  }
}

.section p {
  font-size: 16px;
  color: #5a5a5e;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .section p {
    font-size: 15px;
    color: #6b7280;
    line-height: 1.5;
  }
}
</style>
