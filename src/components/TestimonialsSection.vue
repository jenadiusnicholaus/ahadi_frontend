<script setup lang="ts">
/** Shared client avatar for now; replace with per-testimonial paths when available. */
const CLIENT_AVATAR = '/images/testimony/client01.jpeg'

const TESTIMONIALS = [
  {
    id: 1,
    quote:
      'Ahadi has made it so easy to coordinate contributions for our family events. Transparency has gone up and stress has gone down.',
    name: 'Fatima Khoury',
    role: 'Wedding organizer',
    handle: '@fatima_events',
    avatar: CLIENT_AVATAR,
  },
  {
    id: 2,
    quote:
      'We moved all our fundraising to Ahadi and have never looked back. Guests love how simple it is to contribute from anywhere.',
    name: 'Hassan Ali',
    role: 'Community leader',
    handle: '@hassan_community',
    avatar: CLIENT_AVATAR,
  },
  {
    id: 3,
    quote:
      'For memorial services, the platform gives our extended family one organized place to support and stay informed. It feels truly thoughtful.',
    name: 'Jorge Martínez',
    role: 'Family coordinator',
    handle: '@jorge_family',
    avatar: CLIENT_AVATAR,
  },
  {
    id: 4,
    quote:
      'As an events planner, Ahadi lets me manage multiple contribution campaigns at once. My clients appreciate the clear reporting.',
    name: 'Nicolás Sánchez',
    role: 'Events planner',
    handle: '@nicolas_events',
    avatar: CLIENT_AVATAR,
  },
  {
    id: 5,
    quote:
      'Before Ahadi, tracking who contributed and sending thanks was painful. Now it takes minutes instead of days.',
    name: 'Noel Jensen',
    role: 'Fundraising chair',
    handle: '@noel_funds',
    avatar: CLIENT_AVATAR,
  },
  {
    id: 6,
    quote:
      'Our organization uses Ahadi for all our campaigns. Contributors feel confident and we have a clear audit trail for every shilling.',
    name: 'Ahmad Khan',
    role: 'NGO finance officer',
    handle: '@ahmad_ngofunds',
    avatar: CLIENT_AVATAR,
  },
]
</script>

<template>
  <section class="testimonials">
    <div class="testimonials-inner">
      <div class="section-label">TESTIMONIALS</div>
      <h2 class="section-heading">Our trusted clients</h2>
      <p class="section-subheading">
        Real stories from families, organizers, and organizations using Ahadi to manage their contribution events.
      </p>

      <div class="cards-grid">
        <article
          v-for="item in TESTIMONIALS"
          :key="item.id"
          class="card"
        >
          <div class="card-quote-icon" aria-hidden="true">“</div>
          <p class="card-quote">
            {{ item.quote }}
          </p>
          <div class="card-footer">
            <div class="avatar">
              <img :src="item.avatar" :alt="item.name" class="avatar-img" />
            </div>
            <div class="card-meta">
              <div class="card-name">{{ item.name }}</div>
              <div class="card-role">{{ item.role }}</div>
              <div class="card-handle">{{ item.handle }}</div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testimonials {
  width: 100%;
  max-width: 100%;
  padding: 72px 32px 88px;
  background: #ffffff;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

@media (max-width: 1024px) {
  .testimonials {
    padding: 60px 24px 72px;
  }
}

@media (max-width: 768px) {
  .testimonials {
    padding: 48px 16px 56px;
  }
}

.testimonials-inner {
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}

.section-label {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 16px;
}

.section-heading {
  margin: 0 0 10px;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.section-subheading {
  margin: 0 auto 40px;
  max-width: 520px;
  font-size: 15px;
  line-height: 1.7;
  color: #6b7280;
}

@media (max-width: 768px) {
  .section-heading {
    font-size: 26px;
  }
  .section-subheading {
    font-size: 14px;
  }
}

.cards-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1024px) {
  .cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 22px 22px 20px;
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.06),
    0 0 0 1px rgba(148, 163, 184, 0.16);
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-quote-icon {
  font-size: 32px;
  line-height: 1;
  color: #e5e7eb;
}

.card-quote {
  font-size: 14px;
  line-height: 1.7;
  color: #4b5563;
  margin: 0;
}

.card-footer {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  overflow: hidden;
  background: #e5e7eb;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.card-role {
  font-size: 12px;
  color: #6b7280;
}

.card-handle {
  font-size: 11px;
  color: #9ca3af;
}
</style>
