<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { fetchEventByJoinCode } from '@/api/event'
import { getAccessToken } from '@/api/token'
import JoinDialog from '@/components/JoinDialog.vue'
import { HERO_VIDEO_URL, HERO_VIDEO_TYPE, HERO_IMAGE_FALLBACK } from '@/config/app'

const useCssAnimation = false // Disabled - using real video
import type { PublicEvent } from '@/types/events'

const router = useRouter()
const isLoaded = ref(false)
const useVideo = ref(true)
const videoError = ref(false)
const videoLoaded = ref(false)

function onVideoError(e: Event) {
  console.warn('Hero video failed to load, falling back to image. Video URL:', HERO_VIDEO_URL, e)
  videoError.value = true
  useVideo.value = false
  // Force re-render to show fallback image
  setTimeout(() => {
    console.log('Fallback image should now be visible')
  }, 100)
}

function onVideoLoaded() {
  videoLoaded.value = true
  console.log('Hero video loaded successfully')
}

const showCodeModal = ref(false)
const joinCodeInput = ref('')
const codeError = ref('')
const codeLoading = ref(false)
const eventForJoin = ref<PublicEvent | null>(null)
const showJoinModal = ref(false)

function onJoinWithCode() {
  joinCodeInput.value = ''
  codeError.value = ''
  showCodeModal.value = true
}

function onCreateEvent() {
  // Check if user is logged in
  const hasToken = !!getAccessToken()
  
  if (hasToken) {
    // User is logged in - navigate directly to create event form
    router.push({ name: 'events-create' })
  } else {
    // User not logged in - redirect to login with redirect to create event form
    router.push({ 
      name: 'login', 
      query: { redirect: '/events/create' } 
    })
  }
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
    const event = (res && typeof res === 'object' && 'data' in res && res.data)
      ? res.data
      : (res as PublicEvent)
    if (event && (event as PublicEvent).join_code) {
      eventForJoin.value = event as PublicEvent
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
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    useVideo.value = false
    console.log('Reduced motion preference detected, using static image')
  } else {
    if (HERO_VIDEO_TYPE === 'youtube') {
      console.log('Loading YouTube video:', HERO_VIDEO_URL)
    } else {
      console.log('Loading video from:', HERO_VIDEO_URL)
    }
  }
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <section id="hero" class="hero">
    <!-- YouTube embed - Event/celebration video from internet -->
    <iframe
      v-if="useVideo && HERO_VIDEO_TYPE === 'youtube'"
      class="hero-video hero-video-youtube"
      :src="`https://www.youtube.com/embed/${HERO_VIDEO_URL}?autoplay=1&mute=1&loop=1&playlist=${HERO_VIDEO_URL}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&start=0`"
      frameborder="0"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
      loading="eager"
    />
    <!-- MP4 video -->
    <video
      v-else-if="useVideo && HERO_VIDEO_TYPE === 'mp4'"
      class="hero-video"
      :src="HERO_VIDEO_URL"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      poster="/images/static_images/homepage.png"
      @error="onVideoError"
      @loadeddata="onVideoLoaded"
      @canplay="onVideoLoaded"
    />
    <!-- Fallback image -->
    <div
      v-else
      class="hero-bg-image"
      :style="{ backgroundImage: `url(${HERO_IMAGE_FALLBACK})` }"
      aria-hidden="true"
    />
    <div class="hero-container" :class="{ 'is-loaded': isLoaded }">
      
      <!-- Main Content Grid -->
      <div class="hero-grid">
        
        <!-- Left: Primary Content -->
        <div class="hero-main">
          <div class="hero-label">Event Contribution Platform</div>
          
          <h1 class="hero-heading">
            Community<br>
            <span class="hero-heading-accent">Contributions</span><br>
            Made Simple
          </h1>

          <p class="hero-subtext">
            Professional platform for organizing weddings, funerals, and fundraisers 
            across Tanzania. Secure, transparent, and built for our communities.
          </p>
        </div>

        <!-- Right: Metrics Flowchart (on mobile: appears above the two buttons) -->
        <div class="hero-sidebar">
          <div class="metrics-flowchart">
            <div class="flowchart-title">Platform Metrics</div>
            
            <!-- Level 1: Top metric -->
            <div class="flowchart-level level-1">
              <div class="metric-box">
                <div class="metric-label">Total Funds Raised</div>
                <div class="metric-value">TZS 2.1B+</div>
              </div>
            </div>

            <!-- Connector from Level 1 to Level 2 -->
            <svg class="connector connector-1-2" viewBox="0 0 200 40" preserveAspectRatio="none">
              <line x1="100" y1="0" x2="100" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="100" y1="20" x2="50" y2="40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="100" y1="20" x2="150" y2="40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>

            <!-- Level 2: Two metrics -->
            <div class="flowchart-level level-2">
              <div class="metric-box">
                <div class="metric-label">Active Events</div>
                <div class="metric-value">10,247</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">Success Rate</div>
                <div class="metric-value">98.5%</div>
              </div>
            </div>

            <!-- Connectors from Level 2 to Level 3 -->
            <svg class="connector connector-2-3-left" viewBox="0 0 100 40" preserveAspectRatio="none">
              <line x1="50" y1="0" x2="50" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="50" y1="20" x2="25" y2="40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="50" y1="20" x2="75" y2="40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            <svg class="connector connector-2-3-right" viewBox="0 0 100 40" preserveAspectRatio="none">
              <line x1="50" y1="0" x2="50" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="50" y1="20" x2="25" y2="40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="50" y1="20" x2="75" y2="40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>

            <!-- Level 3: Four metrics -->
            <div class="flowchart-level level-3">
              <div class="metric-box metric-small">
                <div class="metric-label">New Users</div>
                <div class="metric-value">5,200</div>
              </div>
              <div class="metric-box metric-small">
                <div class="metric-label">Avg Response</div>
                <div class="metric-value">< 2 min</div>
              </div>
              <div class="metric-box metric-small">
                <div class="metric-label">Completion</div>
                <div class="metric-value">94%</div>
              </div>
              <div class="metric-box metric-small">
                <div class="metric-label">User Rating</div>
                <div class="metric-value">4.8/5</div>
              </div>
            </div>
          </div>

        </div>

        <!-- Two buttons: desktop = under main in left column; mobile = at end, in a row -->
        <div class="hero-actions">
          <button type="button" class="btn btn-primary" @click="onJoinWithCode">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>Join with Code</span>
          </button>
          <button type="button" class="btn btn-secondary" @click="onCreateEvent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v8"/>
              <path d="M8 12h8"/>
            </svg>
            <span>Create Event</span>
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Join with Code: enter code then open join form -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showCodeModal" class="code-modal-backdrop" @click.self="closeCodeModal">
        <div class="code-modal-box">
          <h3 class="code-modal-title">Join Event</h3>
          <p class="code-modal-text">Enter the event code shared by the organizer.</p>
          <input
            v-model="joinCodeInput"
            type="text"
            class="code-modal-input"
            placeholder="e.g. ABC123"
            @keydown.enter="onCodeSubmit"
          />
          <p v-if="codeError" class="code-modal-error">{{ codeError }}</p>
          <div class="code-modal-actions">
            <button type="button" class="code-modal-btn secondary" @click="closeCodeModal">Cancel</button>
            <button type="button" class="code-modal-btn primary" :disabled="codeLoading" @click="onCodeSubmit">
              {{ codeLoading ? 'Looking up…' : 'Continue' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
    <JoinDialog
      :event="eventForJoin"
      :open="showJoinModal"
      @close="closeJoinModal"
      @success="closeJoinModal"
    />
  </Teleport>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap');

/* ============================================
   BASE & VARIABLES
   ============================================ */
:root {
  --color-bg: #ffffff;
  --color-text: #0f0f12;
  --color-text-muted: #52525b;
  --color-text-light: #71717a;
  --color-border: #e4e4e7;
  --color-border-light: #f4f4f5;
  --color-accent: #1a1a2e;
  --color-accent-hover: #0f0f14;
  --color-metric-bg: rgba(255, 255, 255, 0.72);
  --color-metric-primary: linear-gradient(135deg, #2d2d3a 0%, #1a1a2e 100%);
  --spacing-unit: 8px;
}

.hero {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  padding: 80px 16px 48px;
  padding-top: max(80px, calc(56px + env(safe-area-inset-top)));
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

@media (max-width: 967px) {
  .hero {
    align-items: center;
    padding: 56px 16px 32px;
    padding-top: max(56px, calc(52px + env(safe-area-inset-top)));
  }
}

@media (min-width: 968px) {
  .hero {
    padding: 80px 24px 48px;
    padding-top: max(80px, calc(72px + env(safe-area-inset-top)));
  }
}

@media (min-width: 1280px) {
  .hero {
    padding-left: 32px;
    padding-right: 32px;
  }
}

/* Video or image background layer */
.hero-video,
.hero-bg-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.hero-bg-image {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.88;
}

/* CSS Animated Background - smooth zoom and pan effect */
.hero-bg-animated {
  animation: heroBackgroundAnimation 20s ease-in-out infinite;
  background-size: 110% 110%;
  opacity: 0.9;
}

@keyframes heroBackgroundAnimation {
  0%, 100% {
    transform: scale(1) translate(0, 0);
    opacity: 0.9;
  }
  25% {
    transform: scale(1.05) translate(-2%, -1%);
    opacity: 0.92;
  }
  50% {
    transform: scale(1.08) translate(1%, 2%);
    opacity: 0.9;
  }
  75% {
    transform: scale(1.05) translate(-1%, 1%);
    opacity: 0.92;
  }
}

/* Add subtle parallax-like movement */
.hero-animated::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 30% 50%,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%
  );
  animation: heroShimmer 8s ease-in-out infinite;
  z-index: 1;
  pointer-events: none;
}

@keyframes heroShimmer {
  0%, 100% {
    opacity: 0.3;
    transform: translate(0, 0);
  }
  50% {
    opacity: 0.5;
    transform: translate(10px, -10px);
  }
}

.hero-video {
  opacity: 1;
  pointer-events: none;
  filter: brightness(1.05) contrast(1.1) saturate(1.1);
}

.hero-video-youtube {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  z-index: 0;
  /* Scale YouTube video to cover full area and hide edges */
  transform: scale(1.4);
  transform-origin: center;
  pointer-events: none;
  border: none;
  /* Ensure video covers entire hero section */
  min-width: 100%;
  min-height: 100%;
}

@media (max-width: 768px) {
  .hero-video-youtube {
    transform: scale(1.6);
  }
}

/* Ensure video is visible and playing */
.hero-video[src] {
  display: block;
}

/* Enhanced overlay: selective gradient for text readability - lighter overlay where text is */
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.5) 20%,
    rgba(255, 255, 255, 0.3) 40%,
    rgba(255, 255, 255, 0.15) 60%,
    rgba(0, 0, 0, 0.1) 85%,
    rgba(0, 0, 0, 0.2) 100%
  );
  z-index: 1;
  pointer-events: none;
  mix-blend-mode: overlay;
}

/* Additional targeted overlay for text areas */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 50% 80% at 25% 50%,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.2) 30%,
    transparent 60%
  ),
  radial-gradient(
    ellipse 40% 60% at 75% 50%,
    rgba(0, 0, 0, 0.2) 0%,
    transparent 50%
  );
  z-index: 1;
  pointer-events: none;
}

.hero .hero-container {
  position: relative;
  z-index: 2;
}

/* Ensure hero content doesn't appear above mobile drawer */
@media (max-width: 967px) {
  .hero-container {
    z-index: 1;
  }
  
  .metrics-flowchart {
    z-index: 1 !important;
  }
}

.hero-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-container.is-loaded {
  opacity: 1;
  transform: translateY(0);
}

/* ============================================
   GRID LAYOUT
   ============================================ */
.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

/* Mobile: full-screen left part only – hide metrics, center main + buttons */
@media (max-width: 967px) {
  .hero-grid {
    min-height: calc(100vh - 52px - 88px);
    min-height: calc(100dvh - 52px - 88px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 28px;
  }
  .hero-sidebar {
    display: none;
  }
  .hero-main {
    order: 1;
  }
  .hero-actions {
    order: 2;
    justify-content: flex-start;
    margin-top: 0;
  }
}

@media (min-width: 968px) {
  .hero-grid {
    min-height: calc(100vh - 80px - 120px);
    min-height: calc(100dvh - 80px - 120px);
    display: grid;
    flex-direction: unset;
    justify-content: unset;
    grid-template-columns: 1.15fr 1fr;
    grid-template-rows: auto auto;
    gap: 24px 32px;
    align-content: center;
  }
  
  .hero-sidebar {
    display: flex;
    order: unset;
  }
  
  .hero-main {
    order: unset;
  }
  
  .hero-actions {
    order: unset;
    justify-content: flex-start;
  }
}

@media (min-width: 968px) {
  .hero-main {
    grid-column: 1;
    grid-row: 1;
    order: unset;
  }
  .hero-sidebar {
    grid-column: 2;
    grid-row: 1 / -1;
    align-self: start;
    order: unset;
  }
  .hero-actions {
    grid-column: 1;
    grid-row: 2;
    align-self: start;
    order: unset;
  }
}

/* ============================================
   MAIN CONTENT (LEFT)
   ============================================ */
.hero-main {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero-main > * + * {
  margin-top: 0;
}

.hero-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 10px;
  text-shadow: 
    0 1px 2px rgba(255, 255, 255, 0.95),
    0 0 8px rgba(255, 255, 255, 0.7),
    0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.hero-heading {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 56px;
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: var(--color-text);
  margin: 0 0 16px 0;
  text-shadow: 
    0 2px 4px rgba(255, 255, 255, 0.95),
    0 0 12px rgba(255, 255, 255, 0.8),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 0 20px rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

@media (max-width: 967px) {
  .hero-heading {
    font-size: 40px;
    line-height: 1.1;
  }
}

@media (max-width: 640px) {
  .hero-heading {
    font-size: 28px;
    line-height: 1.15;
    margin-bottom: 12px;
  }
}

@media (max-width: 480px) {
  .hero-heading {
    font-size: 24px;
    line-height: 1.2;
  }
  
  .hero-label {
    font-size: 11px;
    margin-bottom: 8px;
  }
  
  .hero-subtext {
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 12px;
  }
  
  .hero-actions {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

.hero-heading-accent {
  position: relative;
  display: inline-block;
  color: var(--color-accent);
  text-shadow: 
    0 2px 4px rgba(255, 255, 255, 0.95),
    0 0 12px rgba(255, 255, 255, 0.8),
    0 4px 8px rgba(0, 0, 0, 0.15);
}

.hero-heading-accent::after {
  content: '';
  position: absolute;
  bottom: 6px;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-accent) 0%, rgba(26, 26, 46, 0.6) 100%);
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
}

@media (max-width: 640px) {
  .hero-heading-accent::after {
    bottom: 4px;
    height: 3px;
  }
}


.hero-subtext {
  font-size: 17px;
  line-height: 1.7;
  color: var(--color-text-muted);
  max-width: 520px;
  margin: 0 0 24px 0;
  text-shadow: 
    0 1px 3px rgba(255, 255, 255, 0.9),
    0 0 8px rgba(255, 255, 255, 0.7),
    0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

@media (max-width: 967px) {
  .hero-subtext {
    font-size: 16px;
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .hero-subtext {
    font-size: 15px;
    line-height: 1.6;
    margin-bottom: 16px;
  }
}

/* ============================================
   ACTIONS – two buttons only; mobile: row at end
   ============================================ */
.hero-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 12px;
  margin-top: 0;
  margin-bottom: 0;
  align-items: center;
}

/* Mobile: metrics above, then these two buttons in a row at the end */
@media (max-width: 967px) {
  .hero-actions {
    justify-content: flex-end;
    margin-top: 16px;
    width: 100%;
  }
}

@media (min-width: 968px) {
  .hero-actions {
    margin-top: 4px;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  letter-spacing: -0.01em;
}

.btn svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.btn-primary {
  background: #1a1a2e;
  color: #fff;
  border-color: #1a1a2e;
  box-shadow: 0 4px 16px rgba(26, 26, 46, 0.3);
  font-weight: 600;
  text-shadow: none;
  backdrop-filter: none;
}

.btn-primary:hover {
  background: #0f0f14;
  border-color: #0f0f14;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(26, 26, 46, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(26, 26, 46, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a2e;
  border-color: rgba(26, 26, 46, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-weight: 600;
  text-shadow: none;
}

.btn-secondary:hover {
  background: #fff;
  border-color: #1a1a2e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 46, 0.2);
}

@media (max-width: 640px) {
  .hero-actions {
    gap: 10px;
  }
  .btn {
    padding: 10px 18px;
    font-size: 13px;
  }
  .btn svg {
    width: 15px;
    height: 15px;
  }
}

/* ============================================
   SUPPORT SECTION
   ============================================ */
.hero-support {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--color-border-light);
}

.support-item {
  display: flex;
  gap: 16px;
}

.support-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.support-text {
  flex: 1;
}

.support-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}

.support-desc {
  font-size: 14px;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .hero-support {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

/* ============================================
   METRICS FLOWCHART (RIGHT SIDEBAR)
   ============================================ */
.hero-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metrics-flowchart {
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 28px 22px;
  background: #fff;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.8) inset;
  position: relative;
}

@media (max-width: 967px) {
  .metrics-flowchart {
    padding: 24px 18px;
    border-radius: 16px;
  }
}

.flowchart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 22px;
  text-align: center;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Flowchart Levels */
.flowchart-level {
  display: flex;
  justify-content: center;
  gap: 12px;
  position: relative;
}

.level-1 {
  margin-bottom: 0;
}

.level-2 {
  margin-bottom: 0;
}

.level-3 {
  margin-bottom: 0;
}

/* Metric Boxes */
.metric-box {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 16px 18px;
  text-align: center;
  min-width: 130px;
  border-radius: 14px;
  transition: all 0.25s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.6) inset;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.metric-box:hover {
  border-color: rgba(26, 26, 46, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.metric-primary {
  background: var(--color-metric-primary);
  border-color: transparent;
  min-width: 180px;
  color: #fff;
  box-shadow: 0 6px 20px rgba(26, 26, 46, 0.2);
}

.metric-primary .metric-label {
  color: rgba(255, 255, 255, 0.85);
}

.metric-primary .metric-value {
  color: #fff;
}

.metric-primary:hover {
  box-shadow: 0 10px 28px rgba(26, 26, 46, 0.28);
}

.metric-small {
  min-width: 110px;
  padding: 14px 16px;
}

.metric-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.metric-primary .metric-value {
  font-size: 24px;
}

.metric-small .metric-label {
  font-size: 10px;
  margin-bottom: 6px;
}

.metric-small .metric-value {
  font-size: 16px;
}

/* Connectors – visible lines linking metrics */
.connector {
  width: 100%;
  height: 40px;
  display: block;
  color: rgba(0, 0, 0, 0.28);
}

.connector-1-2 {
  margin: 0;
}

.connector-2-3-left,
.connector-2-3-right {
  position: absolute;
  width: 50%;
  height: 40px;
}

.connector-2-3-left {
  left: 0;
}

.connector-2-3-right {
  right: 0;
}

/* Adjust spacing between levels */
.level-1 + .connector-1-2 {
  margin-bottom: -8px;
}

.level-2 {
  position: relative;
  margin-bottom: 32px;
}

/* Features List */
.features-list {
  border: 1px solid var(--color-border);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: 500;
  letter-spacing: -0.01em;
}

.feature-item svg {
  flex-shrink: 0;
  opacity: 0.6;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .metrics-flowchart {
    padding: 24px 16px;
  }

  .metric-box {
    min-width: 100px;
    padding: 12px 16px;
  }

  .metric-primary {
    min-width: 140px;
  }

  .metric-small {
    min-width: 80px;
    padding: 10px 12px;
  }

  .metric-value {
    font-size: 16px;
  }

  .metric-primary .metric-value {
    font-size: 20px;
  }

  .metric-small .metric-value {
    font-size: 14px;
  }

  .level-3 {
    flex-wrap: wrap;
    gap: 12px;
  }

  .level-3 .metric-box {
    flex: 1 1 calc(50% - 6px);
    min-width: 0;
  }
}

/* Join with Code modal */
.code-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.code-modal-box {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
}
.code-modal-title {
  margin: 0 0 10px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
}
.code-modal-text {
  margin: 0 0 20px;
  font-size: 0.9375rem;
  color: #52525b;
  line-height: 1.5;
}
.code-modal-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-align: center;
  text-transform: uppercase;
  box-sizing: border-box;
  margin-bottom: 8px;
  color: #1a1a2e;
  background: #fff;
  transition: border-color 0.2s ease;
}
.code-modal-input:focus {
  outline: none;
  border-color: #1a1a2e;
  box-shadow: 0 0 0 3px rgba(26, 26, 46, 0.1);
}
.code-modal-input::placeholder {
  text-transform: none;
  font-weight: 400;
  color: #9ca3af;
  letter-spacing: normal;
}
.code-modal-error {
  margin: 0 0 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #dc2626;
  padding: 10px 14px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}
.code-modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.code-modal-btn {
  flex: 1;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  border: none;
  transition: all 0.2s ease;
}
.code-modal-btn.secondary {
  background: #f3f4f6;
  color: #374151;
}
.code-modal-btn.secondary:hover {
  background: #e5e7eb;
}
.code-modal-btn.primary {
  background: #1a1a2e;
  color: #fff;
  box-shadow: 0 4px 12px rgba(26, 26, 46, 0.3);
}
.code-modal-btn.primary:hover:not(:disabled) {
  background: #0f0f14;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(26, 26, 46, 0.4);
}
.code-modal-btn.primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
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