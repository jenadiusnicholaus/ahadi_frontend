<script setup lang="ts">
import { APP_NAME, APP_CONFIG, CONTACT_INFO } from '@/config/app'

const QUICK_LINKS = [
  { label: 'Discover Events', href: '#discover' },
  { label: 'Create Event', href: '#' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

const SUPPORT_LINKS = [
  { label: 'Help Center', href: '#' },
  { label: 'Contact Us', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
]

const SOCIAL_LINKS = [
  { 
    name: 'Facebook', 
    href: 'https://facebook.com', 
    icon: 'facebook',
    ariaLabel: 'Follow us on Facebook'
  },
  { 
    name: 'Twitter', 
    href: 'https://twitter.com', 
    icon: 'twitter',
    ariaLabel: 'Follow us on Twitter'
  },
  { 
    name: 'Instagram', 
    href: 'https://instagram.com', 
    icon: 'instagram',
    ariaLabel: 'Follow us on Instagram'
  },
  { 
    name: 'LinkedIn', 
    href: 'https://linkedin.com', 
    icon: 'linkedin',
    ariaLabel: 'Follow us on LinkedIn'
  },
]
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-grid">
        <!-- Brand -->
        <div class="footer-brand">
          <div class="footer-logo">
            <img
              src="/images/static_images/ahadi_logo.png"
              alt=""
              class="logo-icon-img"
            />
            <span class="logo-text">{{ APP_NAME }}</span>
          </div>
          <p class="footer-tagline">
            Making event contributions seamless and meaningful for communities across Tanzania.
          </p>
          <div class="footer-social">
            <a
              v-for="social in SOCIAL_LINKS"
              :key="social.name"
              :href="social.href"
              :aria-label="social.ariaLabel"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-social-link"
            >
              <svg v-if="social.icon === 'facebook'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
              <svg v-else-if="social.icon === 'twitter'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
              <svg v-else-if="social.icon === 'instagram'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              <svg v-else-if="social.icon === 'linkedin'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-col">
          <h4 class="footer-heading">Quick Links</h4>
          <nav class="footer-links">
            <a
              v-for="link in QUICK_LINKS"
              :key="link.label"
              :href="link.href"
              class="footer-link"
            >
              {{ link.label }}
            </a>
          </nav>
        </div>

        <!-- Support -->
        <div class="footer-col">
          <h4 class="footer-heading">Support</h4>
          <nav class="footer-links">
            <a
              v-for="link in SUPPORT_LINKS"
              :key="link.label"
              :href="link.href"
              class="footer-link"
            >
              {{ link.label }}
            </a>
          </nav>
        </div>

        <!-- Contact -->
        <div class="footer-col">
          <h4 class="footer-heading">Contact</h4>
          <div class="footer-contact">
            <a :href="`mailto:${CONTACT_INFO.email}`" class="footer-contact-item">
              <span class="contact-icon" aria-hidden="true">✉</span>
              {{ CONTACT_INFO.email }}
            </a>
            <a :href="`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`" class="footer-contact-item">
              <span class="contact-icon" aria-hidden="true">📞</span>
              {{ CONTACT_INFO.phone }}
            </a>
            <span class="footer-contact-item">
              <span class="contact-icon" aria-hidden="true">📍</span>
              {{ CONTACT_INFO.location }}
            </span>
          </div>
        </div>
      </div>

      <div class="footer-divider" />
      <p class="footer-copy">© {{ new Date().getFullYear() }} {{ APP_CONFIG.name }}. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  width: 100%;
  background: linear-gradient(180deg, #1a1a1e 0%, #141418 100%);
  padding: 56px 24px 48px;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

@media (max-width: 1024px) {
  .footer {
    padding: 48px 20px 40px;
  }
}

@media (max-width: 768px) {
  .footer {
    padding: 40px 16px 32px;
  }
}

@media (max-width: 480px) {
  .footer {
    padding: 32px 12px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .footer-inner {
    padding: 0 0;
  }
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  align-items: start;
}

@media (max-width: 900px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.logo-icon-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  background: hsl(220, 12%, 18%);
  border-radius: 10px;
  padding: 6px;
  box-sizing: border-box;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.footer-tagline {
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.footer-social {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.footer-social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.2s ease;
  text-decoration: none;
}

.footer-social-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.footer-social-link svg {
  width: 20px;
  height: 20px;
}

.footer-heading {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 16px;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-link {
  font-size: 14px;
  color: #9ca3af;
  text-decoration: none;
  transition: all 0.2s;
}

.footer-link:hover {
  color: #fff;
}

/* Footer buttons with primary color */
.footer-btn,
.footer-link.btn {
  display: inline-block;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #1a1a2e;
  border: none;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.footer-btn:hover,
.footer-link.btn:hover {
  background: #0f0f14;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 26, 46, 0.3);
}

.footer-btn:active,
.footer-link.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(26, 26, 46, 0.2);
}

.footer-contact {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.2s;
}

a.footer-contact-item:hover {
  color: #fff;
}

.contact-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.footer-divider {
  height: 1px;
  background: #374151;
  margin: 48px 0 24px;
}

.footer-copy {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}
</style>
