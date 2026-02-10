<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import WebNavbar from '@/components/WebNavbar.vue'
import { assetUrl } from '@/api/client'
import { fetchEventById, fetchEventParticipants, fetchEventContributions } from '@/api/event'
import { fetchInvitationTemplateById } from '@/api/invitation-templates'
import type { InvitationTemplate } from '@/api/invitation-templates'
import JoinDialog from '@/components/JoinDialog.vue'
import { useAuthStore } from '@/stores/auth'
import type { PublicEvent } from '@/types/events'

/** One person to show in contributors list (name + optional image). */
interface ContributorPerson {
  name: string
  initial: string
  imageUrl?: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isLoggedIn, user } = storeToRefs(authStore)

const isOwner = computed(() => {
  const ev = event.value
  const uid = user.value?.id
  return !!ev && !!uid && ev.owner === uid
})

const event = ref<PublicEvent | null>(null)
const invitationTemplate = ref<InvitationTemplate | null>(null)
const loading = ref(true)
const error = ref<Error | null>(null)
const showJoinDialog = ref(false)
const customAmountInput = ref<string>('')
const participants = ref<Array<{ name?: string; profile_image?: string; avatar?: string; image?: string }>>([])
const contributions = ref<Array<{ display_name?: string; participant_name?: string; contributor_name?: string; participant_image?: string; contributor_image?: string }>>([])

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

function parseList(res: unknown): unknown[] {
  if (Array.isArray(res)) return res
  if (res && typeof res === 'object' && 'results' in (res as object))
    return (res as { results: unknown[] }).results ?? []
  if (res && typeof res === 'object' && 'data' in (res as object))
    return (res as { data: unknown[] }).data ?? []
  return []
}

async function loadParticipants() {
  if (!eventId.value) return
  try {
    const res = await fetchEventParticipants(eventId.value)
    const raw = parseList(res)
    participants.value = raw.map((p: unknown) => {
      const o = p as Record<string, unknown>
      return {
        name: [o.name, o.full_name, o.user_name].find((v) => typeof v === 'string') as string | undefined,
        profile_image: typeof o.profile_image === 'string' ? o.profile_image : undefined,
        avatar: typeof o.avatar === 'string' ? o.avatar : undefined,
        image: typeof o.image === 'string' ? o.image : undefined,
      }
    })
  } catch {
    participants.value = []
  }
}

async function loadContributions() {
  if (!eventId.value) return
  try {
    const res = await fetchEventContributions(eventId.value)
    const raw = parseList(res)
    contributions.value = raw.map((c: unknown) => {
      const o = c as Record<string, unknown>
      return {
        display_name: typeof o.display_name === 'string' ? o.display_name : undefined,
        participant_name: typeof o.participant_name === 'string' ? o.participant_name : undefined,
        contributor_name: typeof o.contributor_name === 'string' ? o.contributor_name : undefined,
        participant_image: typeof o.participant_image === 'string' ? o.participant_image : undefined,
        contributor_image: typeof o.contributor_image === 'string' ? o.contributor_image : undefined,
      }
    })
  } catch {
    contributions.value = []
  }
}

async function loadInvitationTemplate() {
  const templateId = event.value?.invitation_card_template
  if (templateId == null) {
    invitationTemplate.value = null
    return
  }
  try {
    invitationTemplate.value = await fetchInvitationTemplateById(templateId)
  } catch {
    invitationTemplate.value = null
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
  await Promise.all([loadParticipants(), loadContributions(), loadInvitationTemplate()])
  loading.value = false
}

function toPerson(name: string, imageUrl?: string): ContributorPerson {
  const n = name.trim() || 'Anonymous'
  return { name: n, initial: n[0]?.toUpperCase() ?? '?', imageUrl }
}

/** People who contributed (from contributions API – use display_name). */
const contributorList = computed((): ContributorPerson[] => {
  const seen = new Set<string>()
  const list: ContributorPerson[] = []
  for (const c of contributions.value) {
    const name = c.display_name ?? c.participant_name ?? c.contributor_name ?? ''
    const n = name.trim() || 'Anonymous'
    const key = n.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const img = c.participant_image ?? c.contributor_image
    list.push(toPerson(n, img))
  }
  return list
})

/** People who are participants (from participants API – use name). */
const participantList = computed((): ContributorPerson[] => {
  return participants.value
    .filter((p) => (p.name ?? '').trim())
    .map((p) => toPerson(p.name!, p.profile_image ?? p.avatar ?? p.image))
})

const contributorCount = computed(() => contributorList.value.length)
const participantCountDisplay = computed(() => participantList.value.length)

onMounted(() => load())
watch(() => route.params.id, () => load())

const coverImageUrl = computed(() => {
  const raw = event.value?.cover_image
  return raw ? assetUrl(raw) : ''
})

const showInvitationCard = computed(() => {
  const ev = event.value
  return !!(ev?.custom_invitation_image || ev?.invitation_card_template)
})

const invitationImageUrl = computed(() => {
  const ev = event.value
  if (ev?.custom_invitation_image) return assetUrl(ev.custom_invitation_image)
  const t = invitationTemplate.value
  if (!t) return ''
  return t.preview_image_url || (t.preview_image ? assetUrl(t.preview_image) : '')
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

const endDate = computed(() => {
  const s = event.value?.end_date
  if (!s) return null
  try {
    return new Date(s)
  } catch {
    return null
  }
})

const formattedEndDate = computed(() => {
  const d = endDate.value
  if (!d) return ''
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

/** Live countdown for contributions (updates every second) */
const now = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  countdownTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

type CountdownPhase = 'before' | 'during' | 'ended' | 'started_no_end'

const contributionEventTypeLabel = computed(() => {
  // E.g. "Wedding", "Memorial", etc. Fallback is "Event".
  return event.value?.event_type_name || 'Event'
})

/**
 * Countdown that understands three phases:
 * - before: contributions have not started yet (count down to start date)
 * - during: contributions are open (count down to end date)
 * - ended: contributions are closed (no ticking numbers, just messaging)
 * - started_no_end: started but no end date available (treat as "started")
 */
const contributionCountdown = computed(() => {
  const start = startDate.value
  const end = endDate.value
  const nowMs = now.value

  if (!start && !end) return null

  let phase: CountdownPhase
  let target: Date | null = null

  if (start && nowMs < start.getTime()) {
    phase = 'before'
    target = start
  } else if (end && nowMs <= end.getTime()) {
    phase = 'during'
    target = end
  } else if (end && nowMs > end.getTime()) {
    phase = 'ended'
    target = end
  } else if (start) {
    phase = 'started_no_end'
    target = start
  } else {
    phase = 'ended'
    target = end
  }

  if (phase === 'ended') {
    return {
      phase,
      ended: true as const,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      targetDate: target,
    }
  }

  if (!target) return null

  const diff = Math.max(0, target.getTime() - nowMs)
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
  const s = Math.floor((diff % (60 * 1000)) / 1000)

  return {
    phase,
    ended: false as const,
    days,
    hours: h,
    minutes: m,
    seconds: s,
    targetDate: target,
  }
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

const PRESET_AMOUNTS = [20000, 60000, 120000, 250000] as const
const currentAmountFromInput = computed(() => {
  const raw = String(customAmountInput.value).replace(/\D/g, '')
  const num = raw ? Number(raw) : 0
  return Number.isFinite(num) ? num : 0
})

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

/** Clicking a preset amount only fills the amount field – no dialog */
function setPresetAmount(amount: number) {
  customAmountInput.value = String(amount)
}

/** Go to full-page contribute (no dialog); pass current amount so the page can pre-fill */
function goToContribute() {
  const amt = Number(String(customAmountInput.value).replace(/\D/g, '')) || 0
  router.push({
    name: 'event-contribute',
    params: { id: String(eventId.value) },
    query: amt > 0 ? { amount: String(amt) } : {},
  })
}

function handleCustomDonate() {
  goToContribute()
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

const joinCodeCopied = ref(false)
function copyJoinCode() {
  const code = event.value?.join_code
  if (!code) return
  navigator.clipboard.writeText(code).then(() => {
    joinCodeCopied.value = true
    setTimeout(() => { joinCodeCopied.value = false }, 2000)
  }).catch(() => {})
}

const copyLinkCopied = ref(false)
function copyLink() {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    copyLinkCopied.value = true
    setTimeout(() => { copyLinkCopied.value = false }, 2000)
  }).catch(() => {})
}

function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href)
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer')
}

function shareOnTwitter() {
  const ev = event.value
  const url = encodeURIComponent(window.location.href)
  const text = ev ? encodeURIComponent(`Check out "${ev.title}" on Ahadi`) : ''
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer')
}

function shareOnLinkedIn() {
  const url = encodeURIComponent(window.location.href)
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer')
}

const shareCardTitle = computed(() => {
  const ev = event.value
  if (!ev) return 'Share this event'
  const name = ev.owner_name || ev.title
  const eventType = ev.event_type_name || 'event'
  return `Share ${name}'s ${eventType}`
})

const shareCardTagline = computed(() => {
  const ev = event.value
  if (!ev) return 'Help spread the word and get more support.'
  const name = ev.owner_name || ev.title
  return `Help spread the word and get more support for ${name}.`
})
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
        <!-- Breadcrumbs (same layout when logged in or out) -->
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
            <!-- Countdown at top (frosted boxes, orange seconds) -->
            <div v-if="contributionCountdown" class="countdown-card countdown-card-top">
              <div class="countdown-label">
                <template v-if="contributionCountdown.phase === 'before'">
                  {{ contributionEventTypeLabel }} contributions start in
                </template>
                <template v-else-if="contributionCountdown.phase === 'during'">
                  {{ contributionEventTypeLabel }} contributions end in
                </template>
                <template v-else>
                  Event ended
                </template>
              </div>

              <template v-if="contributionCountdown.phase === 'before' || contributionCountdown.phase === 'during'">
                <div class="countdown-grid">
                  <div class="countdown-box">
                    <span class="countdown-num">{{ contributionCountdown.days }}</span>
                    <span class="countdown-unit-label">Days</span>
                  </div>
                  <div class="countdown-box">
                    <span class="countdown-num">{{ String(contributionCountdown.hours).padStart(2, '0') }}</span>
                    <span class="countdown-unit-label">Hours</span>
                  </div>
                  <div class="countdown-box">
                    <span class="countdown-num">{{ String(contributionCountdown.minutes).padStart(2, '0') }}</span>
                    <span class="countdown-unit-label">Minutes</span>
                  </div>
                  <div class="countdown-box">
                    <span class="countdown-num countdown-num-seconds">
                      {{ String(contributionCountdown.seconds).padStart(2, '0') }}
                    </span>
                    <span class="countdown-unit-label">Seconds</span>
                  </div>
                </div>
                <p class="countdown-subtitle">
                  <span class="countdown-subtitle-icon" aria-hidden="true">🕐</span>
                  <template v-if="contributionCountdown.phase === 'before'">
                    Time remaining until contributions start
                  </template>
                  <template v-else>
                    Time remaining until contributions close
                  </template>
                </p>
                <p class="countdown-date">
                  {{ contributionCountdown.phase === 'before' ? formattedStartDate : formattedEndDate }}
                </p>
              </template>
              <template v-else>
                <p class="countdown-subtitle">
                  <span class="countdown-subtitle-icon" aria-hidden="true">🕐</span>
                  {{ contributionEventTypeLabel }} contributions ended on
                </p>
                <p class="countdown-date">
                  {{ formattedEndDate || formattedStartDate }}
                </p>
              </template>
            </div>

            <h1 class="event-title">
              {{ event.title }}
              <span v-if="event.event_type_name" class="event-type-badge">{{ event.event_type_name }}</span>
            </h1>

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

            <!-- Event details: dates, location, venue, join code -->
            <div class="event-details-card">
              <h3 class="event-details-card-title">Event details</h3>
              <div class="event-details-rows">
                <div class="event-detail-row">
                  <span class="event-detail-icon" aria-hidden="true">📅</span>
                  <div class="event-detail-content">
                    <span class="event-detail-label">Start date</span>
                    <span class="event-detail-value">{{ formattedStartDate || '—' }}</span>
                  </div>
                </div>
                <div class="event-detail-row">
                  <span class="event-detail-icon" aria-hidden="true">📅</span>
                  <div class="event-detail-content">
                    <span class="event-detail-label">End date</span>
                    <span class="event-detail-value">{{ formattedEndDate || '—' }}</span>
                  </div>
                </div>
                <div class="event-detail-row">
                  <span class="event-detail-icon" aria-hidden="true">📍</span>
                  <div class="event-detail-content">
                    <span class="event-detail-label">Location</span>
                    <span class="event-detail-value">{{ event.location || '—' }}</span>
                  </div>
                </div>
                <div class="event-detail-row">
                  <span class="event-detail-icon" aria-hidden="true">🏛️</span>
                  <div class="event-detail-content">
                    <span class="event-detail-label">Venue</span>
                    <span class="event-detail-value">{{ event.venue_name || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Invitation Card (Flutter-style card) -->
            <div v-if="showInvitationCard" class="invitation-card-section">
              <h3 class="invitation-card-section-title">Invitation Card</h3>
              <div class="invitation-card-dart">
                <div v-if="event.custom_invitation_image || invitationImageUrl" class="invitation-card-inner">
                  <img
                    v-if="invitationImageUrl"
                    :src="invitationImageUrl"
                    :alt="invitationTemplate?.name || 'Invitation'"
                    class="invitation-card-img"
                    @error="($event.target as HTMLImageElement)?.classList?.add('img-error')"
                  />
                  <div v-else class="invitation-card-loading">
                    <div class="loader" aria-hidden="true" />
                    <span>Loading invitation…</span>
                  </div>
                </div>
                <div v-else-if="event.invitation_card_template" class="invitation-card-loading">
                  <div class="loader" aria-hidden="true" />
                  <span>Loading invitation…</span>
                </div>
                <p v-if="invitationTemplate?.name" class="invitation-card-caption">{{ invitationTemplate.name }}</p>
              </div>
            </div>
          </div>

          <!-- Right Column: Donation Widget -->
          <div class="event-right">
            <div class="donation-widget">
              <!-- Manage event (Contributions, Participants, etc.) – when logged in, at top -->
              <section v-if="isLoggedIn && eventId" class="public-quick-actions public-quick-actions-top">
                <h3 class="public-quick-actions-title">Manage event</h3>
                <div class="actions-row">
                  <router-link :to="{ name: 'events-contributions', params: { id: String(eventId) } }" class="action-tile">
                    <span class="action-icon">💳</span>
                    <span class="action-label">Contributions</span>
                  </router-link>
                  <router-link :to="{ name: 'events-participants', params: { id: String(eventId) } }" class="action-tile">
                    <span class="action-icon">👥</span>
                    <span class="action-label">Participants</span>
                  </router-link>
                  <button type="button" class="action-tile" @click="shareEvent">
                    <span class="action-icon">📤</span>
                    <span class="action-label">Share</span>
                  </button>
                  <router-link
                    v-if="event.chat_enabled"
                    :to="{ name: 'events-chat', params: { id: String(eventId) } }"
                    class="action-tile"
                  >
                    <span class="action-icon">💬</span>
                    <span class="action-label">Message</span>
                  </router-link>
                </div>
                <div v-if="isOwner" class="actions-row">
                  <router-link :to="{ name: 'events-announcements', params: { id: String(eventId) } }" class="action-tile">
                    <span class="action-icon">🔔</span>
                    <span class="action-label">Notifications</span>
                  </router-link>
                  <router-link :to="{ name: 'events-invitations', params: { id: String(eventId) } }" class="action-tile">
                    <span class="action-icon">✉️</span>
                    <span class="action-label">Invitations</span>
                  </router-link>
                  <router-link :to="{ name: 'events-wallet', params: { id: String(eventId) } }" class="action-tile">
                    <span class="action-icon">👛</span>
                    <span class="action-label">Wallet</span>
                  </router-link>
                  <router-link :to="{ name: 'events-transactions', params: { id: String(eventId) } }" class="action-tile">
                    <span class="action-icon">📋</span>
                    <span class="action-label">Transactions</span>
                  </router-link>
                  <router-link :to="{ name: 'events-edit', params: { id: String(eventId) } }" class="action-tile">
                    <span class="action-icon">✏️</span>
                    <span class="action-label">Edit Event</span>
                  </router-link>
                </div>
              </section>

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

              <!-- Preset Donation Amounts: selected when amount field matches (click or typed) -->
              <div class="preset-amounts">
                <button
                  v-for="amount in PRESET_AMOUNTS"
                  :key="amount"
                  type="button"
                  class="preset-amount-btn"
                  :class="{ active: currentAmountFromInput === amount }"
                  @click="setPresetAmount(amount)"
                >
                  {{ currency }}{{ formatAmount(amount) }}
                </button>
              </div>

              <!-- Amount field: presets/money only fill this. Dialog opens only when user clicks Contribute -->
              <div class="custom-donation">
                <input
                  v-model="customAmountInput"
                  type="text"
                  inputmode="numeric"
                  class="donation-input"
                  :placeholder="`${currency} Contribute`"
                  @keydown.enter="handleCustomDonate"
                />
                <button type="button" class="btn-donate" @click="handleCustomDonate">
                  Contribute
                </button>
              </div>

              <!-- Join and Get code -->
              <div class="action-card">
                <!-- Guest / non-owner: show Join + Get code side by side -->
                <template v-if="!isOwner">
                  <button type="button" class="action-card-btn action-card-join" @click="openJoin">
                    <span class="action-card-icon action-card-icon-join">👤</span>
                    Join
                  </button>
                  <button
                    type="button"
                    class="action-card-btn action-card-light"
                    @click="copyJoinCode"
                    :disabled="!event.join_code"
                  >
                    <span class="action-card-icon action-card-icon-code">🔗</span>
                    {{ joinCodeCopied ? 'Copied!' : 'Get code' }}
                  </button>
                </template>

                <!-- Owner: only show Get code, full-width -->
                <template v-else>
                  <button
                    type="button"
                    class="action-card-btn action-card-light"
                    @click="copyJoinCode"
                    :disabled="!event.join_code"
                  >
                    <span class="action-card-icon action-card-icon-code">🔗</span>
                    {{ joinCodeCopied ? 'Copied!' : 'Get code' }}
                  </button>
                </template>
              </div>

              <!-- Contributors (from contributions API) -->
              <div class="contributors-section">
                <h3 class="contributors-title">{{ contributorCount }} Contributor{{ contributorCount !== 1 ? 's' : '' }}</h3>
                <div class="contributors-avatars">
                  <div
                    v-for="(person, i) in contributorList.slice(0, 12)"
                    :key="`c-${person.name}-${i}`"
                    class="contributor-avatar"
                    :title="person.name"
                  >
                    <img v-if="person.imageUrl" :src="assetUrl(person.imageUrl)" :alt="person.name" class="contributor-avatar-img" />
                    <span v-else>{{ person.initial }}</span>
                  </div>
                </div>
              </div>
              <!-- Participants (from participants API) -->
              <div class="contributors-section participants-section">
                <h3 class="contributors-title">{{ participantCountDisplay }} Participant{{ participantCountDisplay !== 1 ? 's' : '' }}</h3>
                <div class="contributors-avatars">
                  <div
                    v-for="(person, i) in participantList.slice(0, 12)"
                    :key="`p-${person.name}-${i}`"
                    class="contributor-avatar participant-avatar"
                    :title="person.name"
                  >
                    <img v-if="person.imageUrl" :src="assetUrl(person.imageUrl)" :alt="person.name" class="contributor-avatar-img" />
                    <span v-else>{{ person.initial }}</span>
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

              <!-- Share card at bottom of right column -->
              <div class="share-story-card">
                <h3 class="share-story-title">{{ shareCardTitle }}</h3>
                <p class="share-story-tagline">{{ shareCardTagline }}</p>
                <div class="share-story-buttons">
                  <button type="button" class="share-story-btn" @click="shareOnFacebook">
                    <span class="share-story-icon share-story-icon-fb">f</span>
                    Facebook
                  </button>
                  <button type="button" class="share-story-btn" @click="shareOnTwitter">
                    <span class="share-story-icon share-story-icon-x">𝕏</span>
                    X (Twitter)
                  </button>
                  <button type="button" class="share-story-btn" @click="shareOnLinkedIn">
                    <span class="share-story-icon share-story-icon-in">in</span>
                    LinkedIn
                  </button>
                </div>
                <button type="button" class="share-story-copy-link" @click="copyLink">
                  <span class="share-story-copy-icon" aria-hidden="true">🔗</span>
                  {{ copyLinkCopied ? 'Link copied!' : 'Copy Link' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

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
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.event-type-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #5b21b6;
  background: #ede9fe;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
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

/* Countdown to event start (frosted boxes, orange seconds) */
.countdown-card {
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 16px;
  color: #fff;
  text-align: center;
}

.countdown-card-top {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.countdown-label {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.95;
  margin-bottom: 1rem;
}

.countdown-grid {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.countdown-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 0.75rem 0.5rem;
  background: rgba(59, 130, 246, 0.18);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
}

.countdown-num {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: #fff;
}

.countdown-num.countdown-num-seconds {
  color: #f97316;
}

.countdown-unit-label {
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.9;
  margin-top: 4px;
  color: #fff;
}

.countdown-subtitle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  opacity: 0.9;
  color: #e2e8f0;
}

.countdown-subtitle-icon {
  font-size: 0.875rem;
  opacity: 0.9;
}

.countdown-date {
  margin: 0;
  font-size: 0.9375rem;
  opacity: 0.95;
}

/* Event details card */
.event-details-card {
  margin-top: 2rem;
  padding: 1.25rem 1.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.event-details-card-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.event-details-rows {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.event-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.event-detail-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
  line-height: 1.4;
}

.event-detail-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.event-detail-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.event-detail-value {
  font-size: 0.9375rem;
  color: #111827;
  line-height: 1.4;
}

/* Invitation Card (Flutter/Material-style card) */
.invitation-card-section {
  margin-top: 2rem;
}

.invitation-card-section-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.invitation-card-dart {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  max-width: 420px;
}

.invitation-card-inner {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  min-height: 280px;
  background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%);
}

.invitation-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.invitation-card-img.img-error {
  object-fit: contain;
  background: #f1f3f5;
}

.invitation-card-caption {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

.invitation-card-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  min-height: 200px;
  color: #6b7280;
  font-size: 0.875rem;
}

.invitation-card-loading .loader {
  width: 32px;
  height: 32px;
  border-width: 3px;
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

.preset-amount-btn.active {
  border-color: #22c55e;
  background: #dcfce7;
  color: #16a34a;
  font-weight: 600;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
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

/* Amount input + Contribute button. Preset money buttons only fill the input; dialog opens on Contribute */
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

/* Join, Get code, Share card */
.action-card {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.action-card-btn {
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 0.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  min-height: 44px;
}

.action-card-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-card-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.action-card-join {
  background: #1d202f;
  color: #fff;
}

.action-card-join:hover:not(:disabled) {
  background: #2a2d3f;
}

.action-card-icon-join {
  filter: brightness(1.1);
}

.action-card-light {
  background: #fff;
  color: #3d4155;
  border: 1px solid #e0e2e8;
}

.action-card-light:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.action-card-icon-code {
  opacity: 0.9;
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
  overflow: hidden;
  flex-shrink: 0;
}

.contributor-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.participants-section .contributors-title {
  color: #1e40af;
}

.participant-avatar {
  background: #3b82f6;
}

/* Manage event – quick actions (when logged in) */
.public-quick-actions {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.public-quick-actions-top {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.public-quick-actions-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.public-quick-actions .actions-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.public-quick-actions .actions-row:last-child {
  margin-bottom: 0;
}

@media (min-width: 400px) {
  .public-quick-actions .actions-row {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }
}

.public-quick-actions .action-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 8px;
  min-width: 0;
  background: #fff;
  border: 1px solid rgba(26, 40, 59, 0.2);
  border-radius: 12px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;
}

.public-quick-actions .action-tile:hover {
  background: #fff;
  border-color: #1a283b;
}

.public-quick-actions .action-icon {
  font-size: 20px;
  line-height: 1;
}

.public-quick-actions .action-label {
  line-height: 1.2;
  word-break: break-word;
  text-align: center;
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

/* Share story card (bottom of right column) */
.share-story-card {
  margin-top: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.share-story-title {
  margin: 0 0 0.35rem;
  font-size: 1.0625rem;
  font-weight: 700;
  color: #374151;
}

.share-story-tagline {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.45;
}

.share-story-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.share-story-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background: #fff;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, border-color 0.2s;
}

.share-story-btn:hover {
  background: #eff6ff;
  border-color: #2563eb;
}

.share-story-icon {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
}

.share-story-icon-fb {
  color: #1877f2;
}

.share-story-icon-x {
  font-size: 0.8125rem;
}

.share-story-icon-in {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0a66c2;
}

.share-story-copy-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background: #fff;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, border-color 0.2s;
}

.share-story-copy-link:hover {
  background: #eff6ff;
  border-color: #2563eb;
}

.share-story-copy-icon {
  font-size: 0.9375rem;
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

  .event-type-badge {
    font-size: 0.6875rem;
    padding: 0.2rem 0.5rem;
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
