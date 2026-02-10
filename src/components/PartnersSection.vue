<script setup lang="ts">
/** Shared partner logo asset for now; replace with per-partner paths when available. */
const PARTNER_LOGO = '/images/partners_images/partner01.png'

const PARTNERS = [
  {
    id: 1,
    name: 'Karibu Weddings',
    shortName: 'Karibu',
    description: 'Boutique wedding planners using Ahadi to manage contribution lists and guest updates.',
    category: 'Events',
    logo: PARTNER_LOGO,
  },
  {
    id: 2,
    name: 'Moyo Memorial Services',
    shortName: 'Moyo',
    description: 'Funeral services company that coordinates family contribution campaigns in one place.',
    category: 'Memorial',
    logo: PARTNER_LOGO,
  },
  {
    id: 3,
    name: 'Upendo Giving Circle',
    shortName: 'Upendo',
    description: 'Community giving group using Ahadi for weddings, baby showers, and medical support events.',
    category: 'Community',
    logo: PARTNER_LOGO,
  },
  {
    id: 4,
    name: 'Harusi Hub Events',
    shortName: 'Harusi',
    description: 'Event management agency that centralizes all contribution campaigns for clients.',
    category: 'Events',
    logo: PARTNER_LOGO,
  },
  {
    id: 5,
    name: 'Tanzania Giving Network',
    shortName: 'TGN',
    description: 'Digital fundraising collective powering recurring campaigns for schools and churches.',
    category: 'Fundraising',
    logo: PARTNER_LOGO,
  },
  {
    id: 6,
    name: 'Shukrani Foundation',
    shortName: 'Shukrani',
    description: 'Non-profit using Ahadi to organize transparent, reportable contribution drives.',
    category: 'NGO',
    logo: PARTNER_LOGO,
  },
  {
    id: 7,
    name: 'Mtaa Champions',
    shortName: 'Mtaa',
    description: 'Neighborhood support group that runs casual but organized community fundraisers.',
    category: 'Community',
    logo: PARTNER_LOGO,
  },
  {
    id: 8,
    name: 'HopeCare Clinic',
    shortName: 'HopeCare',
    description: 'Private clinic using Ahadi to coordinate medical support campaigns for patients.',
    category: 'Health',
    logo: PARTNER_LOGO,
  },
  {
    id: 9,
    name: 'Coastal Alumni Network',
    shortName: 'CAN',
    description: 'Alumni association running scholarship and reunion contribution campaigns.',
    category: 'Alumni',
    logo: PARTNER_LOGO,
  },
  {
    id: 10,
    name: 'Safari Moments Studio',
    shortName: 'Safari',
    description: 'Photography studio that integrates Ahadi links into event invites for easy gifting.',
    category: 'Photography',
    logo: PARTNER_LOGO,
  },
  {
    id: 11,
    name: 'BrightFuture Academy PTA',
    shortName: 'BFA PTA',
    description: 'Parents association using Ahadi for school projects, trips, and welfare funds.',
    category: 'School',
    logo: PARTNER_LOGO,
  },
  {
    id: 12,
    name: 'Harbor City Youth Group',
    shortName: 'HC Youth',
    description: 'Youth group coordinating mission trips and outreach support via Ahadi.',
    category: 'Youth',
    logo: PARTNER_LOGO,
  },
]
</script>

<template>
  <section class="partners">
    <div class="partners-inner">
      <h2 class="section-heading">Partners</h2>
      <p class="section-subheading">
        Grateful for the support of our valued partners.
      </p>

      <div class="partners-grid">
        <article
          v-for="partner in PARTNERS"
          :key="partner.id"
          class="partner-card"
        >
          <div class="partner-front">
            <div class="partner-logo-placeholder">
              <img :src="partner.logo" :alt="partner.name" class="partner-logo-img" />
            </div>
            <div class="partner-name">{{ partner.name }}</div>
          </div>
          <div class="partner-hover">
            <div class="partner-hover-name">{{ partner.name }}</div>
            <p class="partner-hover-desc">{{ partner.description }}</p>
            <div class="partner-tag">
              {{ partner.category }}
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
