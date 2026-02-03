<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { logoutApi } from '@/api/auth'
import { APP_NAME } from '@/config/app'

const router = useRouter()
const authStore = useAuthStore()
const { isLoggedIn, user } = storeToRefs(authStore)
const showAccountMenu = ref(false)

const userInitial = computed(() => {
  const name = user.value?.full_name ?? ''
  return name.length > 0 ? name[0].toUpperCase() : 'U'
})

function goToAccount() {
  router.push({ name: 'home' })
  menuOpen.value = false
}

function toggleAccountMenu() {
  showAccountMenu.value = !showAccountMenu.value
}

function closeAccountMenu() {
  showAccountMenu.value = false
}

function onMyEvents() {
  closeAccountMenu()
  router.push({ name: 'home' })
}

function onDashboard() {
  closeAccountMenu()
  router.push({ name: 'home' })
}

function onProfile() {
  closeAccountMenu()
  router.push({ name: 'home' })
}

async function onSignOut() {
  const refresh = typeof localStorage !== 'undefined' ? localStorage.getItem('ahadi_refresh') : null
  if (refresh) {
    try {
      await logoutApi(refresh)
    } catch {
      // ignore network error; still clear local session
    }
  }
  authStore.logout()
  closeAccountMenu()
  menuOpen.value = false
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  const wrappers = document.querySelectorAll('.account-trigger-wrap, .account-dropdown')
  const inside = Array.from(wrappers).some((el) => el.contains(target))
  if (!inside) {
    showAccountMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

const isSearching = ref(false)
const searchQuery = ref('')
const menuOpen = ref(false)

const sectionIds = {
  discover: 'discover',
  howItWorks: 'how-it-works',
  pricing: 'pricing',
  about: 'about',
} as const

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  el?.scrollIntoView({ behavior: 'smooth' })
  menuOpen.value = false
}

function goToHome() {
  router.push({ name: 'home' })
  menuOpen.value = false
}

function openSearch() {
  isSearching.value = true
}

function closeSearch() {
  isSearching.value = false
  searchQuery.value = ''
}

function onSearchSubmit() {
  // Placeholder: wire to events search later
  console.log('Search:', searchQuery.value)
}
</script>

<template>
  <header class="navbar">
    <!-- Mobile header: logo + name + hamburger -->
    <div class="navbar-mobile">
      <button type="button" class="mobile-logo-wrap" @click="goToHome">
        <img
          src="/images/static_images/ahadi_logo.png"
          alt="Ahadi"
          class="mobile-logo-img"
        />
        <div class="mobile-brand">
          <span class="mobile-brand-name">{{ APP_NAME }}</span>
          <span class="mobile-brand-tagline">Events</span>
        </div>
      </button>
      <button
        type="button"
        class="hamburger"
        aria-label="Toggle menu"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span class="hamburger-line" />
        <span class="hamburger-line" />
        <span class="hamburger-line" />
      </button>
    </div>

    <!-- Mobile menu (slide-down when hamburger open) -->
    <Transition name="mobile-menu">
      <div v-show="menuOpen" class="mobile-menu" role="dialog" aria-label="Navigation menu">
        <nav class="mobile-nav">
          <button type="button" class="mobile-nav-link" @click="goToHome">
            Dashboard
          </button>
          <button type="button" class="mobile-nav-link" @click="scrollToSection(sectionIds.discover)">
            Discover
          </button>
          <button type="button" class="mobile-nav-link" @click="scrollToSection(sectionIds.howItWorks)">
            How It Works
          </button>
          <button type="button" class="mobile-nav-link" @click="scrollToSection(sectionIds.pricing)">
            Pricing
          </button>
          <button type="button" class="mobile-nav-link" @click="scrollToSection(sectionIds.about)">
            About
          </button>
        </nav>
        <div class="mobile-search-wrap">
          <div v-if="isSearching" class="search-box mobile-search-box">
            <span class="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search events..."
              @keydown.enter="onSearchSubmit"
            />
            <button type="button" class="search-close" aria-label="Close search" @click="closeSearch">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <button v-else type="button" class="search-btn mobile-search-btn" @click="openSearch">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span>Search</span>
          </button>
        </div>
        <div class="mobile-auth">
          <template v-if="isLoggedIn">
            <div class="account-trigger-wrap">
              <button type="button" class="btn-account-trigger" @click.stop="toggleAccountMenu">
                <span class="account-avatar">{{ userInitial }}</span>
                <svg class="account-chevron" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <Transition name="account-menu">
                <div v-show="showAccountMenu" class="account-dropdown" role="menu">
                  <button type="button" class="account-item" role="menuitem" @click="onMyEvents">
                    <svg class="account-item-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>My Events</span>
                  </button>
                  <button type="button" class="account-item" role="menuitem" @click="onDashboard">
                    <svg class="account-item-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                    <span>Dashboard</span>
                  </button>
                  <button type="button" class="account-item" role="menuitem" @click="onProfile">
                    <svg class="account-item-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                    <span>Profile</span>
                  </button>
                  <div class="account-divider" />
                  <button type="button" class="account-item account-item-danger" role="menuitem" @click="onSignOut">
                    <svg class="account-item-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </Transition>
            </div>
          </template>
          <template v-else>
            <button type="button" class="btn-log-in" @click="router.push({ name: 'login' })">Log In</button>
            <button type="button" class="btn-sign-up" @click="router.push({ name: 'login' })">Sign Up</button>
          </template>
        </div>
      </div>
    </Transition>

    <!-- Desktop navbar -->
    <div class="navbar-inner">
      <!-- Logo -->
      <button type="button" class="logo" @click="scrollToSection(sectionIds.discover)">
        <span class="logo-icon">
          <img
            src="/images/static_images/ahadi_logo.png"
            :alt="APP_NAME"
            class="logo-img"
          />
        </span>
        <span class="logo-text">{{ APP_NAME }}</span>
      </button>

      <div class="spacer" />

      <!-- Nav links -->
      <nav class="nav-links">
        <button type="button" class="nav-link" @click="goToHome">
          Dashboard
        </button>
        <button type="button" class="nav-link" @click="scrollToSection(sectionIds.discover)">
          Discover
        </button>
        <button type="button" class="nav-link" @click="scrollToSection(sectionIds.howItWorks)">
          How It Works
        </button>
        <button type="button" class="nav-link" @click="scrollToSection(sectionIds.pricing)">
          Pricing
        </button>
        <button type="button" class="nav-link" @click="scrollToSection(sectionIds.about)">
          About
        </button>
      </nav>

      <span class="nav-gap" />

      <!-- Search -->
      <div v-if="isSearching" class="search-box">
        <span class="search-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search events..."
          autofocus
          @keydown.enter="onSearchSubmit"
        />
        <button type="button" class="search-close" aria-label="Close search" @click="closeSearch">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <button v-else type="button" class="search-btn" @click="openSearch">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span>Search</span>
      </button>

      <span class="nav-gap" />

      <!-- Auth -->
      <div class="auth-actions">
        <template v-if="isLoggedIn">
          <div class="account-trigger-wrap">
            <button type="button" class="btn-account-trigger" @click.stop="toggleAccountMenu">
              <span class="account-avatar">{{ userInitial }}</span>
              <svg class="account-chevron" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <Transition name="account-menu">
              <div v-show="showAccountMenu" class="account-dropdown" role="menu">
                <button type="button" class="account-item" role="menuitem" @click="onMyEvents">
                  <svg class="account-item-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>My Events</span>
                </button>
                <button type="button" class="account-item" role="menuitem" @click="onDashboard">
                  <svg class="account-item-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                  <span>Dashboard</span>
                </button>
                <button type="button" class="account-item" role="menuitem" @click="onProfile">
                  <svg class="account-item-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                  <span>Profile</span>
                </button>
                <div class="account-divider" />
                <button type="button" class="account-item account-item-danger" role="menuitem" @click="onSignOut">
                  <svg class="account-item-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </Transition>
          </div>
        </template>
        <template v-else>
          <button type="button" class="btn-log-in" @click="router.push({ name: 'login' })">Log In</button>
          <button type="button" class="btn-sign-up" @click="router.push({ name: 'login' })">Sign Up</button>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

/* ----- Mobile header (visible only on small screens) ----- */
.navbar-mobile {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  padding-top: max(12px, env(safe-area-inset-top));
  background: #1a283b;
  min-height: 52px;
  gap: 10px;
}

@media (max-width: 768px) {
  .navbar {
    background: #1a283b;
    border-bottom: none;
  }
  .navbar-mobile {
    display: flex;
  }
}

.mobile-logo-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  min-width: 0;
}

.mobile-logo-img {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  object-fit: contain;
  border-radius: 50%;
}

.mobile-brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  min-width: 0;
}

.mobile-brand-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.mobile-brand-tagline {
  font-size: 11px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.3;
}

.hamburger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  background: transparent;
  border: 2px solid #f97316;
  border-radius: 8px;
  cursor: pointer;
  color: #fff;
  flex-shrink: 0;
}

.hamburger:hover {
  background: rgba(249, 115, 22, 0.15);
}

.hamburger-line {
  display: block;
  width: 18px;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
}

/* ----- Mobile menu (slide-down) ----- */
.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1a283b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 16px 24px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  z-index: 100;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.mobile-nav-link {
  display: block;
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 400;
  color: #fff;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
}

.mobile-nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
}

.mobile-search-wrap {
  margin-bottom: 16px;
}

.mobile-search-box,
.mobile-search-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.mobile-search-btn {
  justify-content: center;
}

.mobile-search-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.mobile-auth {
  display: flex;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-auth .btn-log-in {
  color: #fff;
}

.mobile-auth .btn-log-in:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.mobile-auth .btn-sign-up {
  flex: 1;
  background: #fff;
  color: #1a283b;
}

.mobile-auth .btn-sign-up:hover {
  background: rgba(255, 255, 255, 0.95);
}

/* ----- Desktop navbar (hidden on mobile) ----- */
.navbar-inner {
  display: flex;
  align-items: center;
  padding: 18px 64px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .navbar-inner {
    display: none;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.logo:hover {
  opacity: 0.9;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 2px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.5px;
}

.spacer {
  flex: 1;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  background: none;
  border: none;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px;
}

.nav-link:hover {
  color: #1a1a2e;
}

.nav-gap {
  width: 20px;
}

.search-box {
  display: flex;
  align-items: center;
  width: 280px;
  height: 44px;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 0 12px;
  gap: 8px;
}

.search-icon {
  display: flex;
  align-items: center;
  color: #6b7280;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-close {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
}

.search-close:hover {
  color: #374151;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 16px;
  background: none;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 400;
  color: #9ca3af;
  cursor: pointer;
}

.search-btn:hover {
  color: #6b7280;
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-log-in {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 400;
  color: #374151;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 8px;
}

.btn-log-in:hover {
  color: #1a1a2e;
}

.btn-sign-up {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: #1a1a2e;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.btn-sign-up:hover {
  background: #2d2d3a;
}

.btn-my-account {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #1a1a2e;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.btn-my-account:hover {
  background: #2d2d3a;
}

.mobile-auth .btn-my-account {
  flex: 1;
  background: #fff;
  color: #1a283b;
}

.mobile-auth .btn-my-account:hover {
  background: rgba(255, 255, 255, 0.95);
}

/* Account dropdown (logged in) */
.account-trigger-wrap {
  position: relative;
  display: inline-block;
}

.btn-account-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: #f3f4f6;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
}

.btn-account-trigger:hover {
  background: #e5e7eb;
}

.account-avatar {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a283b;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 50%;
  flex-shrink: 0;
}

.account-chevron {
  color: #6b7280;
  flex-shrink: 0;
}

.account-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  padding: 8px 0;
  z-index: 200;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  font-size: 14px;
  color: #374151;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.account-item:hover {
  background: #f9fafb;
}

.account-item-icon {
  flex-shrink: 0;
  color: #6b7280;
}

.account-item-danger,
.account-item-danger .account-item-icon {
  color: #b91c1c;
}

.account-item-danger:hover {
  background: #fef2f2;
}

.account-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

.account-menu-enter-active,
.account-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.account-menu-enter-from,
.account-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.mobile-auth .account-dropdown {
  right: 0;
  left: 0;
  min-width: 0;
}
</style>
