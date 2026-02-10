<script setup lang="ts">
import WebNavbar from '@/components/WebNavbar.vue'
import LoginForm from '@/components/LoginForm.vue'

const featureItems = [
  { icon: 'calendar-check', text: 'Create & manage events effortlessly' },
  { icon: 'user-group', text: 'Connect with your community' },
  { icon: 'wallet', text: 'Seamless contributions & tracking' },
]
</script>

<template>
  <div class="login-page">
    <!-- Navbar: always visible so login content does not cover it -->
    <div class="login-navbar-wrap">
      <WebNavbar />
    </div>

    <!-- Desktop: split layout -->
    <div class="login-desktop">
      <!-- Left: Branding -->
      <div class="login-brand">
        <div class="brand-bg" />
        <div class="brand-pattern" aria-hidden="true" />
        <div class="brand-shape brand-shape-1" aria-hidden="true" />
        <div class="brand-shape brand-shape-2" aria-hidden="true" />
        <div class="brand-shape brand-shape-3" aria-hidden="true" />
        <div class="brand-content">
          <div class="brand-logo-wrap">
            <img
              src="/images/static_images/ahadi_logo.png"
              alt="Ahadi"
              class="brand-logo-img"
            />
          </div>
          <h1 class="brand-title">Ahadi</h1>
          <p class="brand-slogan">Celebrate Together, Contribute Seamlessly</p>
          <div class="brand-features">
            <div
              v-for="(item, i) in featureItems"
              :key="i"
              class="brand-feature"
            >
              <span class="brand-feature-icon" :aria-label="item.text">
                <!-- Calendar check -->
                <svg
                  v-if="item.icon === 'calendar-check'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M3 10h18" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
                <!-- User group -->
                <svg
                  v-else-if="item.icon === 'user-group'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <!-- Wallet -->
                <svg
                  v-else-if="item.icon === 'wallet'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                </svg>
              </span>
              <span class="brand-feature-text">{{ item.text }}</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Right: Form -->
      <div class="login-form-wrap login-form-desktop">
        <LoginForm />
      </div>
    </div>

    <!-- Mobile: form only -->
    <div class="login-mobile">
      <div class="login-form-wrap login-form-mobile">
        <LoginForm :show-mobile-logo="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #fff;
  /* Reserve space for fixed navbar so login content does not cover it */
  padding-top: 72px;
  box-sizing: border-box;
}


/* Desktop layout: visible from 769px */
.login-desktop {
  display: none;
}

@media (min-width: 769px) {
  .login-desktop {
    display: flex;
    min-height: 100vh;
  }
}

.login-mobile {
  display: block;
  min-height: 100vh;
}

@media (min-width: 769px) {
  .login-mobile {
    display: none;
  }
}

/* Left branding panel */
.login-brand {
  flex: 5;
  position: relative;
  background: linear-gradient(135deg, #1a283b 0%, rgba(26, 40, 59, 0.85) 100%);
  overflow: hidden;
}

.brand-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a283b 0%, rgba(26, 40, 59, 0.85) 100%);
}

.brand-pattern {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 38px,
    rgba(255, 255, 255, 0.04) 38px,
    rgba(255, 255, 255, 0.04) 40px
  );
}

.brand-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

.brand-shape-1 {
  width: 80px;
  height: 80px;
  top: 50px;
  right: 50px;
}

.brand-shape-2 {
  width: 60px;
  height: 60px;
  bottom: 100px;
  left: 30px;
}

.brand-shape-3 {
  width: 40px;
  height: 40px;
  top: 200px;
  left: 100px;
}

.brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 48px;
  box-sizing: border-box;
}

.brand-logo-wrap {
  width: 120px;
  height: 120px;
  background: #fff;
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-title {
  margin: 32px 0 12px;
  font-size: 52px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1.5px;
  line-height: 1.2;
}

.brand-slogan {
  margin: 0;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
  text-align: center;
}

.brand-features {
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.brand-feature {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 320px;
}

.brand-feature-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  color: #fff;
}

.brand-feature-text {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
}

/* Form wrapper */
.login-form-wrap {
  flex: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.login-form-desktop {
  padding: 24px 48px;
}

.login-form-mobile {
  padding: 40px 28px;
  min-height: 100vh;
  align-items: center;
}
</style>
