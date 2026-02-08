<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const PLANS = [
  {
    plan: 'Starter',
    fee: '5%',
    price: 'Free forever',
    features: [
      'Up to 50 contributors',
      'Basic event analytics',
      'M-Pesa & Airtel Money',
      'Email support',
    ],
    isPopular: false,
    accentColor: '#6B7280',
  },
  {
    plan: 'Pro',
    fee: '3%',
    price: 'TZS 15,000/mo',
    features: [
      'Unlimited contributors',
      'Advanced analytics',
      'All payment methods',
      'Event chat feature',
      'Priority support',
    ],
    isPopular: true,
    accentColor: 'hsl(220, 12%, 18%)',
  },
  {
    plan: 'Business',
    fee: '2%',
    price: 'TZS 40,000/mo',
    features: [
      'Everything in Pro',
      'Custom branding',
      'API access',
      'Dedicated manager',
      'Phone support',
    ],
    isPopular: false,
    accentColor: '#8B5CF6',
  },
]

function onGetStarted() {
  router.push({ name: 'home' }) // TODO: replace with login route when available
}
</script>

<template>
  <section id="pricing" class="pricing-section">
    <div class="pricing-inner">
      <div class="section-label">PRICING</div>
      <h2 class="section-heading">Simple, transparent pricing</h2>
      <p class="section-subheading">
        No monthly fees. We only charge a small percentage when you receive contributions.
      </p>

      <div class="pricing-cards">
        <article
          v-for="item in PLANS"
          :key="item.plan"
          class="pricing-card"
          :class="{ 'pricing-card-popular': item.isPopular }"
        >
          <div v-if="item.isPopular" class="popular-badge" :style="{ background: item.accentColor }">
            MOST POPULAR
          </div>
          <div class="card-body">
            <h3 class="plan-name" :style="{ color: item.accentColor }">{{ item.plan }}</h3>
            <div class="fee-row">
              <span class="fee-value">{{ item.fee }}</span>
              <span class="fee-label">fee</span>
            </div>
            <p class="price-text">{{ item.price }}</p>
            <div class="divider" />
            <ul class="features">
              <li v-for="(feature, i) in item.features" :key="i" class="feature-item">
                <span class="feature-check" aria-hidden="true">✓</span>
                <span class="feature-text">{{ feature }}</span>
              </li>
            </ul>
            <button
              type="button"
              class="btn-get-started"
              :class="item.isPopular ? 'btn-filled' : 'btn-outline'"
              :style="item.isPopular ? { background: item.accentColor, borderColor: item.accentColor } : {}"
              @click="onGetStarted"
            >
              Get Started
            </button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pricing-section {
  width: 100%;
  max-width: 100%;
  background: linear-gradient(180deg, #fff 0%, #fafafa 100%);
  padding: 64px 24px 100px;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
}

@media (max-width: 1024px) {
  .pricing-section {
    padding: 56px 20px 80px;
  }
}

@media (max-width: 768px) {
  .pricing-section {
    padding: 40px 16px 60px;
  }
}

@media (max-width: 480px) {
  .pricing-section {
    padding: 32px 12px 48px;
  }
}

.pricing-inner {
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  text-align: center;
  box-sizing: border-box;
}

.section-label {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.section-heading {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0 0 12px;
}

.section-subheading {
  max-width: 550px;
  margin: 0 auto 64px;
  font-size: 18px;
  color: #6b7280;
  line-height: 1.7;
  font-weight: 400;
  text-align: center;
}

@media (max-width: 768px) {
  .section-heading {
    font-size: 28px;
  }
  .section-subheading {
    font-size: 16px;
    margin-bottom: 48px;
  }
}

.pricing-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: stretch;
}

@media (min-width: 769px) {
  .pricing-cards {
    flex-direction: row;
    gap: 24px;
    align-items: stretch;
  }
}

.pricing-card {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 22px;
  border: 1px solid #e4e4e7;
  padding: 30px;
  text-align: left;
  transition: transform 0.25s ease-out, box-shadow 0.25s ease-out, border-color 0.25s ease-out;
  box-sizing: border-box;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.pricing-card:hover {
  transform: translateY(-6px);
  border-color: #d4d4d8;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
}

.pricing-card-popular {
  border-width: 2px;
  border-color: #1a1a2e;
  padding: 34px;
  box-shadow: 0 12px 32px rgba(26, 26, 46, 0.12), 0 1px 0 rgba(255, 255, 255, 0.5) inset;
}

.pricing-card-popular:hover {
  border-color: #1a1a2e;
  box-shadow: 0 20px 48px rgba(26, 26, 46, 0.18), 0 1px 0 rgba(255, 255, 255, 0.5) inset;
}

.popular-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.card-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.plan-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px;
}

.fee-row {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  margin-bottom: 8px;
}

.fee-value {
  font-size: 48px;
  font-weight: 800;
  color: #1a1a2e;
  line-height: 1;
}

.fee-label {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
  padding-bottom: 8px;
}

.price-text {
  font-size: 14px;
  color: #9ca3af;
  margin: 0 0 24px;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  width: 100%;
  margin-bottom: 24px;
}

.features {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.feature-item:last-child {
  margin-bottom: 0;
}

.feature-check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  font-size: 12px;
  font-weight: 700;
  border-radius: 50%;
}

.feature-text {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.4;
}

.btn-get-started {
  width: 100%;
  padding: 16px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  font-family: inherit;
  border: 1.5px solid transparent;
}

.btn-filled {
  background: hsl(220, 12%, 18%);
  color: #fff;
  border-color: hsl(220, 12%, 18%);
}

.btn-filled:hover {
  background: hsl(220, 12%, 14%);
  border-color: hsl(220, 12%, 14%);
}

.btn-outline {
  background: transparent;
  color: #4b5563;
  border-color: #e5e7eb;
}

.btn-outline:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}
</style>
