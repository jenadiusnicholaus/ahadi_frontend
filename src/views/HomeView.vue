<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import HeroSection from '@/components/HeroSection.vue'
import EventTypesSection from '@/components/EventTypesSection.vue'
import DiscoverEventsSection from '@/components/DiscoverEventsSection.vue'
import HowItWorksSection from '@/components/HowItWorksSection.vue'
import TestimonialsSection from '@/components/TestimonialsSection.vue'
import PartnersSection from '@/components/PartnersSection.vue'
import PricingSection from '@/components/PricingSection.vue'
import AboutSection from '@/components/AboutSection.vue'
import Footer from '@/components/Footer.vue'
import JoinDialog from '@/components/JoinDialog.vue'
import { usePublicEvents } from '@/composables/usePublicEvents'
import { fetchEventByJoinCode } from '@/api/event'
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

// Join with code flow (GET event by join_code, then show JoinDialog with register API)
const showCodeModal = ref(false)
const joinCodeInput = ref('')
const codeError = ref('')
const codeLoading = ref(false)
const eventForJoin = ref<PublicEvent | null>(null)
const showJoinModal = ref(false)

function openJoinWithCode() {
  joinCodeInput.value = ''
  codeError.value = ''
  showCodeModal.value = true
}

async function onCodeSubmit() {
  const code = joinCodeInput.value?.trim().toUpperCase()
  if (!code) {
    codeError.value = 'Please enter an event code.'
    return
  }
  codeLoading.value = true
  codeError.value = ''
  try {
    const res = await fetchEventByJoinCode(code) as { data?: PublicEvent; success?: boolean } | PublicEvent
    const raw = (res && typeof res === 'object' && 'data' in res && res.data)
      ? res.data
      : (res as PublicEvent)
    if (raw && (raw as any).id) {
      // Backend response for join code does not include join_code field,
      // so attach the typed code so JoinDialog can POST with it.
      const withCode = { ...(raw as PublicEvent), join_code: code } as PublicEvent
      eventForJoin.value = withCode
      showCodeModal.value = false
      showJoinModal.value = true
    } else {
      codeError.value = 'Event not found. Check the code and try again.'
    }
  } catch {
    codeError.value = 'Event not found. Check the code and try again.'
  } finally {
    codeLoading.value = false
  }
}

function closeCodeModal() {
  showCodeModal.value = false
  codeError.value = ''
}

function closeJoinModal() {
  showJoinModal.value = false
  eventForJoin.value = null
}

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
    <HeroSection :on-join-with-code="openJoinWithCode" />

    <!-- Join with code: enter code modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCodeModal" class="join-code-backdrop" @click.self="closeCodeModal">
          <div class="join-code-box">
            <h3 class="join-code-title">Join Event</h3>
            <p class="join-code-text">Enter the event code shared by the organizer.</p>
            <input
              v-model="joinCodeInput"
              type="text"
              class="join-code-input"
              placeholder="e.g. ABC123"
              @keydown.enter="onCodeSubmit"
            />
            <p v-if="codeError" class="join-code-error">{{ codeError }}</p>
            <div class="join-code-actions">
              <button type="button" class="join-code-btn secondary" @click="closeCodeModal">Cancel</button>
              <button type="button" class="join-code-btn primary" :disabled="codeLoading" @click="onCodeSubmit">
                {{ codeLoading ? 'Looking up…' : 'Continue' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Join event dialog (name, phone, email → POST register) -->
    <JoinDialog
      :event="eventForJoin"
      :open="showJoinModal"
      @close="closeJoinModal"
      @success="closeJoinModal"
    />

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
          :on-join-with-code="openJoinWithCode"
          @clear-filters="clearFilters"
          @card-click="onEventCardClick"
        />
      </section>

      <HowItWorksSection />

      <TestimonialsSection />

      <PartnersSection />

      <!-- Pricing temporarily hidden
      <PricingSection />
      -->
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
  overflow-x: hidden;
  max-width: 100%;
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
  box-sizing: border-box;
}

.discover-wrapper {
  overflow-x: hidden;
  max-width: 100%;
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

/* Join with code modal (homepage) */
.join-code-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.join-code-box {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
}
.join-code-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}
.join-code-text {
  margin: 0 0 16px;
  font-size: 14px;
  color: #64748b;
}
.join-code-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 16px;
  margin-bottom: 8px;
  box-sizing: border-box;
}
.join-code-input:focus {
  outline: none;
  border-color: #1a283b;
  box-shadow: 0 0 0 2px rgba(26, 40, 59, 0.15);
}
.join-code-error {
  margin: 0 0 12px;
  font-size: 13px;
  color: #dc2626;
}
.join-code-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
.join-code-btn {
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.join-code-btn.secondary {
  background: #f1f5f9;
  color: #475569;
}
.join-code-btn.primary {
  background: #1a283b;
  color: #fff;
}
.join-code-btn.primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
