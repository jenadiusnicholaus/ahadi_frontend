<script setup lang="ts">
import type { Partner } from '@/api/public'

/** Default partner logo */
const DEFAULT_LOGO = '/images/partners_images/partner01.png'

defineProps<{
  partners: Partner[]
}>()

function getLogo(partner: Partner): string {
  return partner.logo || DEFAULT_LOGO
}

function getShortName(partner: Partner): string {
  return partner.short_name || partner.name
}

function getDescription(partner: Partner): string {
  return partner.description || `Partner organization using Ahadi.`
}

function getCategory(partner: Partner): string {
  return partner.category || 'Partner'
}
</script>

<template>
  <section v-if="partners && partners.length > 0" class="partners">
    <div class="partners-inner">
      <h2 class="section-heading">Partners</h2>
      <p class="section-subheading">
        Grateful for the support of our valued partners.
      </p>

      <div class="partners-grid">
        <article
          v-for="partner in partners"
          :key="partner.id"
          class="partner-card"
        >
          <div class="partner-front">
            <div class="partner-logo-placeholder">
              <img :src="partner.logo" :alt="partner.name" class="partner-logo-img" loading="lazy" />
            </div>
            <div class="partner-name">{{ partner.name }}</div>
          </div>
          <div class="partner-hover">
            <div class="partner-hover-name">{{ partner.name }}</div>
            <p class="partner-hover-desc">{{ getDescription(partner) }}</p>
            <div class="partner-tag">
              {{ getCategory(partner) }}
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.partners {
  width: 100%;
  max-width: 100%;
  padding: 64px 32px 80px;
  background: #ffffff;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

@media (max-width: 1024px) {
  .partners {
    padding: 56px 24px 72px;
  }
}

@media (max-width: 768px) {
  .partners {
    padding: 44px 16px 56px;
  }
}

.partners-inner {
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}

.section-heading {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.section-subheading {
  margin: 0 auto 32px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  max-width: 460px;
}

.partners-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 1024px) {
  .partners-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .partners-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .partners-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.partner-card {
  position: relative;
  background: #ffffff;
  border-radius: 14px;
  padding: 14px 10px;
  box-shadow:
    0 12px 28px rgba(15, 23, 42, 0.06),
    0 0 0 1px rgba(226, 232, 240, 0.9);
  overflow: hidden;
  cursor: default;
}

.partner-front {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.partner-logo-placeholder {
  width: 54px;
  height: 54px;
  border-radius: 10px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.partner-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.partner-logo-text {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.partner-name {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}

.partner-hover {
  position: absolute;
  inset: 0;
  padding: 14px 12px;
  border-radius: inherit;
  background: linear-gradient(135deg, #eef2ff, #e0f2fe);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.partner-card:hover .partner-hover {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.partner-hover-name {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.partner-hover-desc {
  font-size: 12px;
  color: #374151;
  line-height: 1.45;
  margin: 0 0 8px;
}

.partner-tag {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #1d4ed8;
  background: rgba(191, 219, 254, 0.9);
}
</style>
