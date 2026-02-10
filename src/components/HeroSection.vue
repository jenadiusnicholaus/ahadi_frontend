<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { getAccessToken } from '@/api/token'

const props = defineProps<{
  onJoinWithCode?: () => void
}>()

const router = useRouter()
const isLoaded = ref(false)

function onJoinWithCode() {
  props.onJoinWithCode?.()
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

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <section id="hero" class="hero">
    <!-- Solid gradient background (no image) -->
    <div class="hero-bg-solid" aria-hidden="true" />
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
  overflow-x: hidden;
  box-sizing: border-box;
  max-width: 100%;
}

@media (max-width: 967px) {
  .hero {
    align-items: center;
    padding: 56px 28px 40px;
    padding-left: max(28px, env(safe-area-inset-left));
    padding-right: max(28px, env(safe-area-inset-right));
    padding-bottom: max(40px, env(safe-area-inset-bottom));
    padding-top: max(88px, calc(72px + env(safe-area-inset-top)));
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

/* Image or solid background layer */
.hero-background-image,
.hero-bg-solid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.hero-background-image {
  object-fit: cover;
  object-position: center;
  filter: brightness(1.05) contrast(1.1) saturate(1.1);
}

.hero-bg-solid {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%);
}

/* Unused animated classes removed for performance */

/* Ensure image is visible */
.hero-background-image {
  display: block;
  opacity: 1;
  pointer-events: none;
}

.hero::after {
  display: none;
}

.hero::before {
  display: none;
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
  padding: 0;
  box-sizing: border-box;
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

/* ============================================
   MOBILE LAYOUT (≤967px)
   ============================================ */
@media (max-width: 967px) {
  .hero-grid {
    min-height: auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 40px;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    padding-bottom: 32px;
  }

  /* --- Text block: centered --- */
  .hero-main {
    order: 1;
    width: 100%;
    text-align: center;
  }

  .hero-subtext {
    margin-left: auto;
    margin-right: auto;
  }

  /* --- Metrics sidebar --- */
  .hero-sidebar {
    display: flex;
    order: 2;
    width: 100%;
  }

  /* --- Buttons --- */
  .hero-actions {
    order: 3;
    justify-content: center;
    width: 100%;
  }

  /* Hide tree connectors on mobile */
  .connector {
    display: none;
  }

  /* Title: centered, subtle */
  .flowchart-title {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 0;
    font-size: 11px;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.5);
  }
  .flowchart-title::after {
    display: none;
  }

  /* Stack all levels vertically */
  .metrics-flowchart {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .flowchart-level {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0 !important;
  }

  /* All cards: full-width, consistent padding */
  .metric-box,
  .metric-primary,
  .metric-small {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    flex: none !important;
    margin: 0;
    border-radius: 14px;
    padding: 20px 24px;
    box-sizing: border-box;
  }

  .level-1,
  .level-2,
  .level-3 {
    gap: 12px;
    margin: 0 !important;
  }

  /* 2-column grid for bottom 4 metrics */
  .level-3 {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    flex-direction: unset !important;
  }

  .level-3 .metric-box {
    padding: 16px 16px;
  }

  .metric-label {
    font-size: 10px;
  }
  .metric-value {
    font-size: 22px;
  }
  .metric-primary .metric-value {
    font-size: 28px;
  }
  .metric-small .metric-label {
    font-size: 9px;
  }
  .metric-small .metric-value {
    font-size: 18px;
  }
}

/* ============================================
   SMALL PHONE (≤480px)
   ============================================ */
@media (max-width: 480px) {
  .hero {
    padding-left: max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
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
  color: #ffffff;
  margin-bottom: 10px;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.5),
    0 0 8px rgba(0, 0, 0, 0.3);
  display: block;
  opacity: 0.9;
}

.hero-heading {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 56px;
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  overflow-wrap: break-word;
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
    font-size: 28px;
    line-height: 1.12;
  }
  
  .hero-label {
    font-size: 11px;
    margin-bottom: 8px;
  }
  
  .hero-subtext {
    font-size: 15px;
    line-height: 1.55;
    margin-bottom: 12px;
  }
  
  .hero-actions {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }
  
  .metric-box,
  .metric-primary,
  .metric-small {
    padding: 18px 20px;
  }
  
  .level-3 .metric-box {
    padding: 14px 12px;
  }
}

.hero-heading-accent {
  position: relative;
  display: inline-block;
  color: #ffd700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.hero-heading-accent::after {
  content: '';
  position: absolute;
  bottom: 6px;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ffd700 0%, rgba(255, 215, 0, 0.3) 100%);
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
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
  color: #f0f0f0;
  max-width: 520px;
  margin: 0 0 24px 0;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  overflow-wrap: break-word;
  font-weight: 400;
}

@media (max-width: 967px) {
  .hero-subtext {
    font-size: 16px;
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .hero-subtext {
    font-size: 15px;
    line-height: 1.6;
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
  border: none;
  padding: 0;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-radius: 0;
  box-shadow: none;
  position: relative;
  overflow: visible;
}

@media (max-width: 967px) {
  .metrics-flowchart {
    padding: 0;
    border-radius: 0;
  }
}

.flowchart-title {
  font-size: 13px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 32px;
  text-align: center;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  position: relative;
  padding-bottom: 16px;
}

.flowchart-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.6), transparent);
  border-radius: 2px;
}

/* Flowchart Levels */
.flowchart-level {
  display: flex;
  justify-content: center;
  gap: 12px;
  position: relative;
  flex-wrap: wrap;
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
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px 24px;
  text-align: center;
  min-width: 140px;
  border-radius: 16px;
  transition: transform 0.25s ease, border-color 0.25s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.metric-box::before {
  display: none;
}

.metric-box:hover {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.metric-primary {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.08) 100%);
  border-color: rgba(255, 215, 0, 0.35);
  min-width: 220px;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.metric-primary::before {
  display: none;
}

.metric-primary .metric-label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  font-size: 12px;
}

.metric-primary .metric-value {
  color: #ffffff;
  font-weight: 800;
}

.metric-primary:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.metric-small {
  min-width: 110px;
  padding: 14px 16px;
}

.metric-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
  display: block;
  line-height: 1.4;
}

.metric-value {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.04em;
  display: block;
  line-height: 1.1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.metric-primary .metric-value {
  font-size: 32px;
  color: #ffd700;
  text-shadow: 0 2px 12px rgba(255, 215, 0, 0.4);
}

.metric-small .metric-label {
  font-size: 10px;
  margin-bottom: 8px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

.metric-small .metric-value {
  font-size: 18px;
  font-weight: 800;
  color: #ffffff;
}

/* Connectors – visible lines linking metrics */
.connector {
  width: 100%;
  height: 40px;
  display: block;
  color: rgba(255, 255, 255, 0.25);
  stroke-width: 2;
  opacity: 0.6;
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
  margin-bottom: 36px;
  gap: 16px;
}

.level-1 {
  margin-bottom: 8px;
}

.level-3 {
  gap: 14px;
  margin-top: 8px;
}

/* level-2 mobile handled in main mobile block above */

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

/* Very small phones: single column for bottom metrics */
@media (max-width: 360px) {
  .level-3 {
    grid-template-columns: 1fr !important;
  }
}

</style>