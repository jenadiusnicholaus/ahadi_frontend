<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const isLoaded = ref(false)

function onJoinWithCode() {
  // TODO: open join-by-code dialog
  console.log('Join with code')
}

function onCreateEvent() {
  router.push({ name: 'home' }) // TODO: replace with login route when available
}

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <section class="hero">
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
              <div class="metric-box metric-primary">
                <div class="metric-label">Total Funds Raised</div>
                <div class="metric-value">TZS 2.1B+</div>
              </div>
            </div>

            <!-- Connector from Level 1 to Level 2 -->
            <svg class="connector connector-1-2" viewBox="0 0 200 40" preserveAspectRatio="none">
              <line x1="100" y1="0" x2="100" y2="20" stroke="#e5e5e5" stroke-width="2"/>
              <line x1="100" y1="20" x2="50" y2="40" stroke="#e5e5e5" stroke-width="2"/>
              <line x1="100" y1="20" x2="150" y2="40" stroke="#e5e5e5" stroke-width="2"/>
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
              <line x1="50" y1="0" x2="50" y2="20" stroke="#e5e5e5" stroke-width="2"/>
              <line x1="50" y1="20" x2="25" y2="40" stroke="#e5e5e5" stroke-width="2"/>
              <line x1="50" y1="20" x2="75" y2="40" stroke="#e5e5e5" stroke-width="2"/>
            </svg>
            <svg class="connector connector-2-3-right" viewBox="0 0 100 40" preserveAspectRatio="none">
              <line x1="50" y1="0" x2="50" y2="20" stroke="#e5e5e5" stroke-width="2"/>
              <line x1="50" y1="20" x2="25" y2="40" stroke="#e5e5e5" stroke-width="2"/>
              <line x1="50" y1="20" x2="75" y2="40" stroke="#e5e5e5" stroke-width="2"/>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ============================================
   BASE & VARIABLES
   ============================================ */
:root {
  --color-bg: #ffffff;
  --color-text: #0a0a0a;
  --color-text-muted: #666666;
  --color-text-light: #999999;
  --color-border: #e5e5e5;
  --color-border-light: #f0f0f0;
  --color-accent: #0a0a0a;
  --color-accent-hover: #1a1a1a;
  --color-metric-bg: #f9f6f0;
  --color-metric-primary: #e8dcc4;
  --spacing-unit: 8px;
}

.hero {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  padding: 16px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.hero-container {
  max-width: 1280px;
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

/* Mobile: order = main → metrics → buttons (buttons at end, in a row) */
.hero-main {
  order: 1;
}
.hero-sidebar {
  order: 2;
}
.hero-actions {
  order: 3;
}

@media (min-width: 968px) {
  .hero-grid {
    grid-template-columns: 1.2fr 1fr;
    grid-template-rows: auto auto;
    gap: 20px 28px;
  }
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
}

.hero-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.hero-heading {
  font-size: 64px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--color-text);
  margin: 0 0 16px 0;
}

.hero-heading-accent {
  position: relative;
  display: inline-block;
}

.hero-heading-accent::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-accent);
}

@media (max-width: 968px) {
  .hero-heading {
    font-size: 48px;
  }
}

@media (max-width: 640px) {
  .hero-heading {
    font-size: 38px;
  }
}

.hero-subtext {
  font-size: 17px;
  line-height: 1.7;
  color: var(--color-text-muted);
  max-width: 540px;
  margin: 0 0 18px 0;
}

/* ============================================
   ACTIONS – two buttons only; mobile: row at end
   ============================================ */
.hero-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 10px;
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
  gap: 10px;
  padding: 16px 28px;
  font-size: 15px;
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
}

.btn-primary {
  background: hsl(220, 12%, 18%);
  color: #fff;
  border-color: hsl(220, 12%, 18%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-primary:hover {
  background: hsl(220, 12%, 14%);
  border-color: hsl(220, 12%, 14%);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: transparent;
  color: var(--color-text);
  border-color: hsl(220, 8%, 45%);
}

.btn-secondary:hover {
  border-color: var(--color-text);
  background: rgba(0, 0, 0, 0.04);
}

@media (max-width: 640px) {
  .hero-actions {
    gap: 12px;
  }
  .btn {
    padding: 14px 24px;
    font-size: 14px;
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
  border: 1px solid var(--color-border);
  padding: 24px 20px;
  background: var(--color-bg);
  position: relative;
}

.flowchart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 20px;
  text-align: center;
  letter-spacing: -0.01em;
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
  background: var(--color-metric-bg);
  border: 2px solid var(--color-border);
  padding: 14px 18px;
  text-align: center;
  min-width: 130px;
  transition: all 0.2s ease;
}

.metric-box:hover {
  border-color: var(--color-text-light);
  transform: translateY(-2px);
}

.metric-primary {
  background: var(--color-metric-primary);
  border-color: #d4c5a0;
  min-width: 180px;
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

/* Connectors */
.connector {
  width: 100%;
  height: 40px;
  display: block;
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
</style>