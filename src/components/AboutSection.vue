<script setup lang="ts">
import { useRouter } from 'vue-router'
import { getAccessToken } from '@/api/token'

const router = useRouter()

const TRUST_BADGES = [
  { icon: '🛡️', text: 'Secure Payments' },
  { icon: '💬', text: '24/7 Support' },
  { icon: '⚡', text: 'Instant Transfers' },
]

const STATS = [
  { value: '10,000+', label: 'Events Created', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.05)' },
  { value: '50,000+', label: 'Happy Users', color: '#10B981', bg: 'rgba(16, 185, 129, 0.05)' },
  { value: 'TZS 2B+', label: 'Total Raised', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.05)' },
  { value: '99.9%', label: 'Uptime', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.05)' },
]

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

function onLearnMore() {
  window.location.hash = '#' // placeholder
}
</script>

<template>
  <section id="about" class="about-section">
    <div class="about-inner">
      <!-- About content -->
      <div class="about-content">
        <div class="section-label">ABOUT US</div>
        <h2 class="section-heading">
          Tanzania's trusted platform for community contributions
        </h2>
        <p class="section-para">
          Ahadi was built with a simple mission: to make it easier for communities to come together and support each other. Whether it's a wedding, funeral, graduation, or any life event, we provide the tools to collect contributions transparently and securely.
        </p>
        <p class="section-para">
          We believe in the power of community. Our platform handles the complexity of payments so you can focus on what matters most—celebrating life's moments together.
        </p>
        <div class="trust-badges">
          <div
            v-for="badge in TRUST_BADGES"
            :key="badge.text"
            class="trust-badge"
          >
            <span class="trust-icon" aria-hidden="true">{{ badge.icon }}</span>
            <span class="trust-text">{{ badge.text }}</span>
          </div>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="stats-grid">
        <div
          v-for="stat in STATS"
          :key="stat.label"
          class="stat-item"
          :style="{ '--stat-color': stat.color, background: stat.bg }"
        >
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="cta-section">
      <h3 class="cta-heading">Ready to bring your community together?</h3>
      <p class="cta-subtext">
        Join thousands of Tanzanians using Ahadi to organize events and collect contributions effortlessly.
      </p>
      <div class="cta-buttons">
        <a href="#" class="cta-btn cta-btn-primary" @click.prevent="onCreateEvent">
          Create Free Event
        </a>
        <a href="#" class="cta-btn cta-btn-outline" @click.prevent="onLearnMore">
          Learn More
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about-section {
  width: 100%;
  max-width: 100%;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #eef2f6 100%);
  overflow-x: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.about-inner {
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 100px 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 80px;
}

@media (max-width: 1024px) {
  .about-inner {
    padding: 80px 20px;
    gap: 60px;
  }
}

@media (max-width: 768px) {
  .about-inner {
    flex-direction: column;
    padding: 48px 16px 40px;
    gap: 40px;
    align-items: stretch;
    min-width: 0;
    overflow-x: hidden;
  }
}

@media (max-width: 480px) {
  .about-inner {
    padding: 40px 12px 32px;
    gap: 32px;
  }
}

.about-content {
  flex: 5;
  min-width: 0;
  text-align: left;
}

@media (max-width: 768px) {
  .about-content {
    text-align: center;
  }
}

.section-label {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.section-heading {
  font-size: 34px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.03em;
  line-height: 1.25;
  margin: 0 0 20px;
}

@media (max-width: 768px) {
  .section-heading {
    font-size: 28px;
    text-align: center;
  }
}

.section-para {
  font-size: 17px;
  color: #6b7280;
  line-height: 1.8;
  margin: 0 0 20px;
}

@media (max-width: 768px) {
  .section-para {
    font-size: 16px;
    text-align: center;
  }
}

.section-para:last-of-type {
  margin-bottom: 32px;
}

.trust-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 24px;
  align-items: center;
}

@media (max-width: 768px) {
  .trust-badges {
    justify-content: center;
    gap: 16px;
  }
}

.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.trust-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 32, 44, 0.1);
  border-radius: 8px;
  font-size: 18px;
}

.trust-text {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
}

.stats-grid {
  flex: 4;
  min-width: 0;
  padding: 32px;
  background: #fff;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.8) inset;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .stats-grid {
    padding: 20px 16px;
    gap: 12px;
    border-radius: 20px;
  }
}

.stat-item {
  padding: 20px;
  border-radius: 16px;
  min-width: 0;
}

@media (max-width: 768px) {
  .stat-item {
    padding: 16px 12px;
  }
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 800;
  color: var(--stat-color);
  line-height: 1;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 22px;
  }
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

@media (max-width: 768px) {
  .stat-label {
    font-size: 12px;
  }
}

/* CTA Section - full width (AboutSection is outside main) */
.cta-section {
  width: 100%;
  padding: 72px 24px;
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d3a 50%, #252532 100%);
  text-align: center;
  box-sizing: border-box;
  position: relative;
}

.cta-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 80% at 50% 120%, rgba(255, 255, 255, 0.04) 0%, transparent 60%);
  pointer-events: none;
}

@media (max-width: 768px) {
  .cta-section {
    padding: 48px 16px;
  }
}

.cta-heading {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  margin: 0 0 16px;
  position: relative;
  letter-spacing: -0.02em;
}

@media (max-width: 768px) {
  .cta-heading {
    font-size: 24px;
  }
}

.cta-subtext {
  max-width: 500px;
  margin: 0 auto 32px;
  font-size: 17px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .cta-subtext {
    font-size: 15px;
  }
}

.cta-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 16px;
  justify-content: center;
  align-items: center;
}

.cta-btn {
  display: inline-block;
  padding: 18px 32px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  font-family: inherit;
  border: 2px solid transparent;
}

.cta-btn:hover {
  transform: scale(1.05);
}

.cta-btn-primary {
  background: #fff;
  color: hsl(220, 12%, 18%);
}

.cta-btn-primary:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.cta-btn-outline {
  background: transparent;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.5);
}

.cta-btn-outline:hover {
  border-color: #fff;
}
</style>
