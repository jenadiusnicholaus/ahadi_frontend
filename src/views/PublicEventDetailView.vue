<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { assetUrl } from '@/api/client'
import { fetchEventById } from '@/api/event'
import ContributeDialog from '@/components/ContributeDialog.vue'
import JoinDialog from '@/components/JoinDialog.vue'
import type { PublicEvent } from '@/types/events'

const route = useRoute()
const router = useRouter()

const event = ref<PublicEvent | null>(null)
const loading = ref(true)
const error = ref<Error | null>(null)
const showContributeDialog = ref(false)
const showJoinDialog = ref(false)
const customAmount = ref<number | null>(null)
const customAmountInput = ref<string>('')

const eventId = computed(() => {
  const id = route.params.id
  if (typeof id !== 'string') return 0
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : 0
})

async function loadEvent() {
  if (!eventId.value) return
  try {
    event.value = await fetchEventById(eventId.value) as PublicEvent
    error.value = null
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load event')
    event.value = null
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

const formattedStartDate = computed(() => {
  const d = startDate.value
  if (!d) return ''
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
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
  return value.toLocaleString()
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'home' })
  }
}

function openContribute() {
  showContributeDialog.value = true
}

function openContributeWithAmount(amount: number | null) {
  if (amount && amount > 0) {
    customAmount.value = amount
  }
  showContributeDialog.value = true
}

function handleCustomDonate() {
  const amt = Number(customAmountInput.value) || 0
  if (amt > 0) {
    openContributeWithAmount(amt)
  }
}

function openJoin() {
  showJoinDialog.value = true
}

function shareEvent() {
  const ev = event.value
  if (!ev) return
  const text = `You're invited to "${ev.title}"!\nJoin using code: ${ev.join_code || ''}\n\nPowered by Ahadi - Event Contributions Made Easy`
  const url = window.location.href
  if (navigator.share) {
    navigator.share({
      title: ev.title,
      text,
      url,
    }).catch(() => {
      copyShareToClipboard(text, url)
    })
  } else {
    copyShareToClipboard(text, url)
  }
}

function copyShareToClipboard(text: string, url: string) {
  const full = `${text}\n${url}`
  navigator.clipboard.writeText(full).then(() => {
    // Could show a small toast
  }).catch(() => {})
}
</script>

<template>
  <div class="public-event-page">
    <WebNavbar />

    <main class="public-event-main">
      <div v-if="loading && !event" class="state state-loading">
        <div class="loader" aria-hidden="true" />
        <p>Loading event…</p>
      </div>

      <div v-else-if="error" class="state state-error">
        <p class="error-message">{{ error.message }}</p>
        <button type="button" class="btn-back" @click="goBack">Go back</button>
      </div>

      <template v-else-if="event">
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs">
          <button type="button" class="breadcrumb-link" @click="router.push({ name: 'home' })">Home</button>
          <span class="breadcrumb-separator">/</span>
          <button type="button" class="breadcrumb-link" @click="goBack">Events</button>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">{{ event.title }}</span>
        </nav>

        <!-- Two Column Layout -->
        <div class="event-layout">
          <!-- Left Column: Image and Story -->
          <div class="event-left">
            <h1 class="event-title">{{ event.title }}</h1>
            <p class="event-subtitle">Help {{ event.title }} reach its goal</p>

            <!-- Event Image -->
            <div class="event-image-wrap">
              <img
                v-if="coverImageUrl"
                :src="coverImageUrl"
                :alt="event.title"
                class="event-image"
                @error="($event.target as HTMLImageElement)?.classList?.add('img-error')"
              />
              <div v-else class="event-image-placeholder">
                <span>No image</span>
              </div>
            </div>

            <!-- Story Section -->
            <div class="story-section">
              <h2 class="story-title">{{ event.title }}'s Story</h2>
              <p v-if="event.description" class="story-text">{{ event.description }}</p>
              <p v-else class="story-text">This event is organized to bring together family, friends, and loved ones in one shared digital space. Through Ahadi, guests can view event details, receive updates, share memories, confirm attendance, and stay connected before, during, and after the celebration — making the experience seamless, interactive, and memorable for everyone involved.</p>
            </div>
          </div>

          <!-- Right Column: Donation Widget -->
          <div class="event-right">
            <div class="donation-widget">
              <!-- Progress Circle -->
              <div v-if="contributionTarget > 0" class="progress-circle-section">
                <div class="progress-circle-wrap">
                  <svg class="progress-circle" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                    <circle
                      class="progress-circle-bg"
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#e5e7eb"
                      stroke-width="14"
                    />
                    <circle
                      class="progress-circle-fill"
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#22c55e"
                      stroke-width="14"
                      :stroke-dasharray="2 * Math.PI * 85"
                      :stroke-dashoffset="2 * Math.PI * 85 * (1 - progressPercent / 100)"
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  <div class="progress-circle-text">
                    <div class="progress-percent-large">{{ progressPercent }}%</div>
                    <div class="progress-label">of funding raised</div>
                  </div>
                </div>
                <div class="progress-amount-large">
                  <div class="amount-raised">{{ currency }}{{ formatAmount(totalContributions) }}</div>
                  <div class="amount-to-go">{{ currency }}{{ formatAmount(contributionTarget - totalContributions) }} to go</div>
                </div>
              </div>

              <!-- Preset Donation Amounts -->
              <div class="preset-amounts">
                <button
                  v-for="amount in [20000, 60000, 120000, 250000]"
                  :key="amount"
                  type="button"
                  class="preset-amount-btn"
                  @click="openContributeWithAmount(amount)"
                >
                  {{ currency }}{{ formatAmount(amount) }}
                </button>
              </div>

              <!-- Custom Donation Input -->
              <div class="custom-donation">
                <input
                  v-model="customAmountInput"
                  type="number"
                  class="donation-input"
                  :placeholder="`${currency} Contribute`"
                  min="0"
                  @keydown.enter="handleCustomDonate"
                />
                <button type="button" class="btn-donate" @click="handleCustomDonate">
                  Contribute
                </button>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <button type="button" class="btn-action btn-join-action" @click="openJoin">
                  <span class="btn-action-icon">👤</span>
                  Join
                </button>
                <button type="button" class="btn-action btn-share-action" @click="shareEvent">
                  <span class="btn-action-icon">📤</span>
                  Share Event
                </button>
              </div>

              <!-- Contributors List -->
              <div class="contributors-section">
                <h3 class="contributors-title">{{ participantCount }} Contributors</h3>
                <div class="contributors-avatars">
                  <!-- Placeholder avatars - would be replaced with actual contributor data -->
                  <div v-for="i in Math.min(participantCount, 7)" :key="i" class="contributor-avatar">
                    {{ String.fromCharCode(64 + i) }}
                  </div>
                </div>
              </div>

              <!-- Supporters Section -->
              <div class="supporters-section">
                <div class="supporters-header">
                  <span class="supporters-icon">❤️</span>
                  <h3 class="supporters-title">Supporters</h3>
                </div>
                <!-- Placeholder supporter - would be replaced with actual data -->
                <div class="supporter-item">
                  <div class="supporter-name">Event Organizer</div>
                  <div class="supporter-amount">{{ currency }}{{ formatAmount(totalContributions || 0) }} {{ formattedStartDate ? formattedStartDate.split(',')[0] : '' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <ContributeDialog
      :event="event"
      :open="showContributeDialog"
      :initial-amount="customAmount"
      @close="showContributeDialog = false; customAmount = null"
      @success="showContributeDialog = false; customAmount = null"
    />
    <JoinDialog
      :event="event"
      :open="showJoinDialog"
      @close="showJoinDialog = false"
      @success="showJoinDialog = false"
    />
  </div>
</template>

<style scoped>
.public-event-page {
  min-height: 100vh;
  background: #fff;
}

.public-event-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 100px 32px 48px;
}

/* Breadcrumbs */
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 0;
  margin-bottom: 24px;
  padding-top: 0;
  font-size: 0.875rem;
}

.breadcrumb-link {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #9ca3af;
}

.breadcrumb-current {
  color: #111827;
}

/* Two Column Layout */
.event-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 48px;
  align-items: start;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .event-layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .event-right {
    position: static;
  }
}

/* Left Column */
.event-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.event-title {
  margin: 0;
  margin-top: 0;
  padding-top: 0;
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.event-subtitle {
  margin: 0;
  font-size: 1rem;
  color: #6b7280;
  font-weight: 400;
  margin-bottom: 1.5rem;
}

.event-image-wrap {
  width: 90%;
  border-radius: 12px;
  overflow: hidden;
  background: #e5e7eb;
  margin-bottom: 2rem;
}

.event-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.event-image.img-error {
  display: none;
}

.event-image-placeholder {
  width: 100%;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 1rem;
}

.story-section {
  margin-top: 2rem;
}

.story-title {
  margin: 0 0 1rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #111827;
}

.story-text {
  margin: 0;
  font-size: 1rem;
  color: #374151;
  line-height: 1.7;
}

/* Right Column - Donation Widget */
.event-right {
  position: sticky;
  top: 100px;
}

.donation-widget {
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 2rem 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Progress Circle */
.progress-circle-section {
  margin-bottom: 0;
  padding-top: 2rem;
  padding-bottom: 2rem;
  text-align: center;
}

.progress-circle-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.progress-circle {
  width: 200px;
  height: 200px;
  transform: rotate(-90deg);
}

.progress-circle-bg {
  stroke: #e5e7eb;
  stroke-width: 14;
}

.progress-circle-fill {
  stroke: #22c55e;
  stroke-width: 14;
  transition: stroke-dashoffset 0.5s ease;
}

.progress-circle-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-percent-large {
  font-size: 2.5rem;
  font-weight: 700;
  color: #22c55e;
  line-height: 1.2;
}

.progress-label {
  font-size: 0.9375rem;
  color: #6b7280;
  margin-top: 8px;
}

.progress-amount-large {
  text-align: center;
}

.amount-raised {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.amount-to-go {
  font-size: 1rem;
  color: #6b7280;
}

/* Preset Amounts */
.preset-amounts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.preset-amount-btn {
  padding: 0.875rem 1rem;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.preset-amount-btn:hover {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22c55e;
}

/* Fully Fund Button */
.btn-fully-fund {
  width: 90%;
  padding: 1rem 1.25rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  margin: 0 auto 1rem;
  display: block;
  transition: background 0.2s;
  min-height: 48px;
}

.btn-fully-fund:hover {
  background: #16a34a;
}

/* Custom Donation */
.custom-donation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.donation-input {
  flex: 0.7;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  min-height: 44px;
}

.btn-donate {
  flex: 0.3;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.donation-input:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.btn-donate:hover {
  border-color: #22c55e;
  color: #22c55e;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-action {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  min-height: 44px;
}

.btn-action-icon {
  font-size: 1.125rem;
}

.btn-join-action {
  background: #1a283b;
  color: #fff;
}

.btn-join-action:hover {
  background: #2d3a4f;
}

.btn-share-action {
  background: #fff;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.btn-share-action:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* Contributors Section */
.contributors-section {
  margin-bottom: 0;
  padding-top: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.contributors-title {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.contributors-avatars {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.contributor-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #22c55e;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Supporters Section */
.supporters-section {
  margin-top: 1.5rem;
}

.supporters-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.supporters-icon {
  font-size: 1.125rem;
}

.supporters-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.supporter-item {
  margin-bottom: 12px;
}

.supporter-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.supporter-amount {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .public-event-main {
    padding: 80px 24px 32px;
  }

  .event-layout {
    gap: 24px;
  }

  .event-image-wrap {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .public-event-main {
    padding: 80px 16px 24px;
  }

  .breadcrumbs {
    font-size: 0.8125rem;
    margin-bottom: 20px;
  }

  .event-title {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }

  .event-subtitle {
    font-size: 0.9375rem;
    margin-bottom: 1.25rem;
  }

  .event-image-wrap {
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .story-title {
    font-size: 1.125rem;
    margin-bottom: 0.75rem;
  }

  .story-text {
    font-size: 0.9375rem;
    line-height: 1.6;
  }

  .donation-widget {
    padding: 1.5rem 1.25rem;
  }

  .progress-circle-section {
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
  }

  .progress-circle {
    width: 160px;
    height: 160px;
  }

  .progress-percent-large {
    font-size: 2rem;
  }

  .progress-label {
    font-size: 0.875rem;
  }

  .amount-raised {
    font-size: 1.5rem;
  }

  .amount-to-go {
    font-size: 0.9375rem;
  }

  .preset-amounts {
    grid-template-columns: 1fr 1fr;
    gap: 0.625rem;
  }

  .preset-amount-btn {
    padding: 0.75rem 0.875rem;
    font-size: 0.875rem;
    min-height: 40px;
  }

  .custom-donation {
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .donation-input {
    padding: 0.75rem 0.875rem;
    font-size: 0.875rem;
    min-height: 40px;
  }

  .btn-donate {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    min-height: 40px;
  }

  .action-buttons {
    gap: 0.625rem;
    margin-bottom: 1.25rem;
  }

  .btn-action {
    padding: 0.75rem 0.875rem;
    font-size: 0.875rem;
    min-height: 40px;
  }

  .contributors-section {
    padding-top: 1.5rem;
    padding-bottom: 1.25rem;
  }

  .contributors-title {
    font-size: 1rem;
  }

  .supporters-section {
    margin-top: 1.25rem;
  }

  .supporters-title {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .public-event-main {
    padding: 80px 12px 20px;
  }

  .event-title {
    font-size: 1.5rem;
  }

  .event-subtitle {
    font-size: 0.875rem;
  }

  .progress-circle {
    width: 140px;
    height: 140px;
  }

  .progress-percent-large {
    font-size: 1.75rem;
  }

  .amount-raised {
    font-size: 1.25rem;
  }

  .preset-amounts {
    grid-template-columns: 1fr;
  }

  .preset-amount-btn {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }
}

/* States */
.state {
  text-align: center;
  padding: 48px 24px;
}

.state-loading .loader {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 3px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.state-loading p,
.state-error p {
  margin: 0;
  font-size: 1rem;
  color: #6b7280;
}

.state-error .error-message {
  color: #dc2626;
  margin-bottom: 16px;
}

.btn-back {
  padding: 10px 20px;
  background: #1a283b;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
