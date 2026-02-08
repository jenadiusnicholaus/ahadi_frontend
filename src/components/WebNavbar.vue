<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { logoutApi } from '@/api/auth'
import { getRefreshToken } from '@/api/token'
import { APP_NAME } from '@/config/app'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isLoggedIn, user } = storeToRefs(authStore)
const showAccountMenu = ref(false)

const SCROLL_THRESHOLD = 60
const isScrolled = ref(false)

function onScroll() {
  isScrolled.value = window.scrollY > SCROLL_THRESHOLD
}

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
  router.push({ name: 'events' })
}

function onInbox() {
  closeAccountMenu()
  menuOpen.value = false
  router.push({ name: 'messages' })
}

function onCalendar() {
  closeAccountMenu()
  menuOpen.value = false
  router.push({ name: 'calendar' })
}

function onDashboard() {
  closeAccountMenu()
  router.push({ name: 'home' })
}

function onProfile() {
  closeAccountMenu()
  router.push({ name: 'profile' })
}

async function onSignOut() {
  const refresh = getRefreshToken()
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

function handleResize() {
  if (typeof window !== 'undefined' && window.innerWidth > 768 && menuOpen.value) {
    menuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('scroll', onScroll)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

const isSearching = ref(false)
const searchQuery = ref('')
const menuOpen = ref(false)

// Toggle mobile menu (only works on mobile)
function toggleMobileMenu() {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    menuOpen.value = !menuOpen.value
  } else {
    menuOpen.value = false
  }
}

// Prevent body scroll when mobile menu is open (only on mobile)
watch(menuOpen, (isOpen) => {
  if (typeof document !== 'undefined' && typeof window !== 'undefined' && window.innerWidth <= 768) {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  } else if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    // On desktop, ensure menu is closed
    if (isOpen) {
      menuOpen.value = false
    }
  }
})



const sectionIds = {
  discover: 'discover',
  howItWorks: 'how-it-works',
  pricing: 'pricing',
  about: 'about',
} as const

function scrollToSection(sectionId: string) {
  menuOpen.value = false
  
  // If we're on the home page, scroll directly to the section
  if (route.name === 'home') {
    // Use nextTick to ensure DOM is ready
    nextTick(() => {
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    })
  } else {
    // If we're on a different page, navigate to home with hash
    router.push({ name: 'home', hash: `#${sectionId}` }).then(() => {
      // After navigation, scroll to the section
      nextTick(() => {
        const el = document.getElementById(sectionId)
        if (el) {
          // Small delay to ensure page has rendered
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      })
    })
  }
}

function goToHome() {
  menuOpen.value = false
  
  // If we're on the home page, scroll to hero section
  if (route.name === 'home') {
    nextTick(() => {
      const el = document.getElementById('hero')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        // Scroll to top of hero section
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  } else {
    // If we're on a different page, navigate to home
    router.push({ name: 'home' }).then(() => {
      nextTick(() => {
        // Scroll to top of page (hero section)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    })
  }
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
  <header class="navbar" :class="{ 'navbar-scrolled': isScrolled }">
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
        @click="toggleMobileMenu"
      >
        <span class="hamburger-line" />
        <span class="hamburger-line" />
        <span class="hamburger-line" />
      </button>
    </div>

    <!-- Mobile menu (drawer from right) - Only visible on mobile -->
    <Transition name="mobile-drawer">
      <div
        v-show="menuOpen"
        v-if="menuOpen"
        class="mobile-drawer-overlay"
        role="dialog"
        aria-label="Navigation menu"
        @click.self="menuOpen = false"
      >
        <div class="mobile-drawer-panel">
          <!-- Header: logo + title + close X -->
          <div class="mobile-drawer-header">
            <div class="mobile-drawer-brand">
              <img src="/images/static_images/ahadi_logo.png" alt="" class="mobile-drawer-logo" />
              <div class="mobile-drawer-titles">
                <span class="mobile-drawer-title">{{ APP_NAME }}</span>
                <span class="mobile-drawer-tagline">Events</span>
              </div>
            </div>
            <button
              type="button"
              class="mobile-drawer-close"
              aria-label="Close menu"
              @click="menuOpen = false"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div class="mobile-drawer-body">
            <!-- When logged in: circular avatar + username + email -->
          <div v-if="isLoggedIn" class="mobile-drawer-user">
            <div class="mobile-drawer-avatar">{{ userInitial }}</div>
            <div class="mobile-drawer-user-info">
              <span class="mobile-drawer-username">{{ user?.full_name || user?.phone || 'User' }}</span>
              <span v-if="user?.email" class="mobile-drawer-email">{{ user.email }}</span>
            </div>
          </div>

          <!-- When logged in: account list (no dropdown) -->
          <nav v-if="isLoggedIn" class="mobile-nav mobile-nav-account">
            <button type="button" class="mobile-nav-link" @click="onMyEvents(); menuOpen = false">
              <span class="mobile-nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
              <span>My Events</span>
            </button>
            <button type="button" class="mobile-nav-link" @click="onInbox(); menuOpen = false">
              <span class="mobile-nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
              <span>Inbox</span>
            </button>
            <button type="button" class="mobile-nav-link" @click="onCalendar(); menuOpen = false">
              <span class="mobile-nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
              <span>Calendar</span>
            </button>
            <button type="button" class="mobile-nav-link" @click="onDashboard(); menuOpen = false">
              <span class="mobile-nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg></span>
              <span>Dashboard</span>
            </button>
            <button type="button" class="mobile-nav-link" @click="onProfile(); menuOpen = false">
              <span class="mobile-nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg></span>
              <span>Profile</span>
            </button>
            <button type="button" class="mobile-nav-link mobile-nav-link-danger" @click="onSignOut">
              <span class="mobile-nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>
              <span>Sign Out</span>
            </button>
          </nav>

          <!-- Main nav links with icons and separators - ALWAYS VISIBLE -->
          <nav class="mobile-nav mobile-nav-main" style="display: flex !important; visibility: visible !important; opacity: 1 !important;">
            <button type="button" class="mobile-nav-link" @click="scrollToSection(sectionIds.discover); menuOpen = false" style="display: flex !important; visibility: visible !important; opacity: 1 !important;">
              <span class="mobile-nav-icon" style="display: flex !important; visibility: visible !important;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76 2.83-2.83"/><path d="m7.76 16.24-2.83 2.83"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>
              </span>
              <span style="display: inline-block !important; visibility: visible !important;">Discover</span>
            </button>
            <button type="button" class="mobile-nav-link" @click="scrollToSection(sectionIds.howItWorks); menuOpen = false" style="display: flex !important; visibility: visible !important; opacity: 1 !important;">
              <span class="mobile-nav-icon" style="display: flex !important; visibility: visible !important;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </span>
              <span style="display: inline-block !important; visibility: visible !important;">How It Works</span>
            </button>
            <button type="button" class="mobile-nav-link" @click="scrollToSection(sectionIds.pricing); menuOpen = false" style="display: flex !important; visibility: visible !important; opacity: 1 !important;">
              <span class="mobile-nav-icon" style="display: flex !important; visibility: visible !important;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </span>
              <span style="display: inline-block !important; visibility: visible !important;">Pricing</span>
            </button>
            <button type="button" class="mobile-nav-link" @click="scrollToSection(sectionIds.about); menuOpen = false" style="display: flex !important; visibility: visible !important; opacity: 1 !important;">
              <span class="mobile-nav-icon" style="display: flex !important; visibility: visible !important;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </span>
              <span style="display: inline-block !important; visibility: visible !important;">About</span>
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
        <div v-if="!isLoggedIn" class="mobile-auth">
          <button type="button" class="btn-log-in" @click="router.push({ name: 'login' })">Log In</button>
          <button type="button" class="btn-sign-up" @click="router.push({ name: 'login' })">Sign Up</button>
        </div>

          </div>
          <!-- Footer (dark strip like reference) -->
          <div class="mobile-drawer-footer">
            <div class="mobile-drawer-footer-title">Follow us</div>
            <div class="mobile-drawer-social">
              <a href="#" class="mobile-drawer-social-btn" aria-label="Twitter"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></a>
              <a href="#" class="mobile-drawer-social-btn" aria-label="Facebook"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
              <a href="#" class="mobile-drawer-social-btn" aria-label="Instagram"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
            </div>
            <p class="mobile-drawer-tagline-footer">Event contributions made simple</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Desktop navbar -->
    <div class="navbar-inner">
      <!-- Logo -->
      <button type="button" class="logo" @click="goToHome">
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
                <button type="button" class="account-item" role="menuitem" @click="onInbox">
                  <svg class="account-item-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span>Inbox</span>
                </button>
                <button type="button" class="account-item" role="menuitem" @click="onCalendar">
                  <svg class="account-item-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>Calendar</span>
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  transition: background 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease;
}

.navbar.navbar-scrolled {
  background: #fff;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom-color: #e5e7eb;
}

/* ----- Mobile header (visible only on small screens) ----- */
.navbar-mobile {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  padding-top: max(12px, env(safe-area-inset-top));
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  min-height: 52px;
  gap: 10px;
  transition: background 0.25s ease, backdrop-filter 0.25s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.navbar.navbar-scrolled .navbar-mobile {
  background: #fff;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

@media (max-width: 768px) {
  .navbar:not(.navbar-scrolled) {
    border-bottom: none;
  }
  .navbar-mobile {
    display: flex;
  }
}

/* Mobile: dark text when navbar has solid background (scrolled) */
.navbar.navbar-scrolled .mobile-brand-name {
  color: #1a1a2e;
  text-shadow: none;
}

.navbar.navbar-scrolled .mobile-brand-tagline {
  color: #6b7280;
  text-shadow: none;
}

.navbar.navbar-scrolled .hamburger {
  color: #1a1a2e;
  border-color: #1a1a2e;
}

.navbar.navbar-scrolled .hamburger:hover {
  background: rgba(0, 0, 0, 0.06);
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
  color: #1a1a2e;
  letter-spacing: -0.5px;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.mobile-brand-tagline {
  font-size: 11px;
  font-weight: 400;
  color: #52525b;
  line-height: 1.3;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
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
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid #1a1a2e;
  border-radius: 8px;
  cursor: pointer;
  color: #1a1a2e;
  flex-shrink: 0;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.hamburger:hover {
  background: rgba(255, 255, 255, 0.4);
  border-color: #0f0f14;
}

.hamburger-line {
  display: block;
  width: 18px;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
}

/* ----- Mobile menu (drawer from right to left) ----- */
.mobile-drawer-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  display: none !important; /* Hidden by default */
  justify-content: flex-end;
  align-items: stretch;
  background: rgba(0, 0, 0, 0.7) !important;
  backdrop-filter: blur(8px);
  overflow: hidden;
  pointer-events: auto;
  margin: 0 !important;
  padding: 0 !important;
}

/* Only show drawer on mobile/tablet */
@media (max-width: 768px) {
  .mobile-drawer-overlay {
    display: flex !important;
  }
}

@media (max-width: 480px) {
  .mobile-drawer-overlay {
    background: rgba(0, 0, 0, 0.6);
  }
}

.mobile-drawer-panel {
  width: min(320px, 85vw);
  max-width: 100%;
  height: 100vh !important;
  min-height: 100vh !important;
  max-height: 100vh !important;
  display: flex !important;
  flex-direction: column;
  background: #ffffff !important;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  position: relative;
  z-index: 10000 !important;
  isolation: isolate;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  pointer-events: auto;
  margin: 0 !important;
  padding: 0 !important;
}

@media (max-width: 480px) {
  .mobile-drawer-panel {
    width: min(300px, 90vw);
  }
}

.mobile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #ffffff !important;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.mobile-drawer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-drawer-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.mobile-drawer-titles {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.mobile-drawer-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e3a5f;
  line-height: 1.2;
}

.mobile-drawer-tagline {
  font-size: 0.8125rem;
  color: #6b7280;
  font-style: italic;
}

.mobile-drawer-close {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #374151;
  cursor: pointer;
  flex-shrink: 0;
}

.mobile-drawer-close:hover {
  background: #f9fafb;
  color: #111827;
}

.mobile-drawer-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  display: flex !important;
  flex-direction: column;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 16px;
  position: relative;
  z-index: 1;
  background: #ffffff !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.mobile-drawer-body > * {
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  background: transparent;
}

.mobile-drawer-user {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  margin: 0 16px 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.mobile-drawer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1e3a5f;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.mobile-drawer-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mobile-drawer-username {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.mobile-drawer-email {
  font-size: 0.8125rem;
  color: #6b7280;
}

.mobile-drawer-enter-active,
.mobile-drawer-leave-active {
  transition: opacity 0.25s ease;
}

.mobile-drawer-enter-active .mobile-drawer-panel,
.mobile-drawer-leave-active .mobile-drawer-panel {
  transition: transform 0.25s ease;
}

.mobile-drawer-enter-from,
.mobile-drawer-leave-to {
  opacity: 0;
}

.mobile-drawer-enter-from .mobile-drawer-panel,
.mobile-drawer-leave-to .mobile-drawer-panel {
  transform: translateX(100%);
}

/* Prevent body scroll when drawer is open */
body:has(.mobile-drawer-overlay[style*="display: flex"]) {
  overflow: hidden;
}

.mobile-nav {
  display: flex !important;
  flex-direction: column;
  margin-bottom: 0;
  padding: 8px 16px;
  background: #ffffff !important;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 10 !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.mobile-nav-main {
  margin-top: 0;
  padding-top: 8px;
  padding-bottom: 8px;
}

.mobile-nav-link {
  display: flex !important;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 500;
  color: #374151 !important;
  background: none;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  opacity: 1 !important;
  visibility: visible !important;
}

.mobile-nav-link span {
  display: inline-block;
  opacity: 1 !important;
  visibility: visible !important;
}

.mobile-nav-link:last-of-type {
  border-bottom: none;
}

.mobile-nav-link:hover {
  color: #1e3a5f !important;
  background: rgba(0, 0, 0, 0.02);
}

.mobile-nav-link:active {
  background: rgba(0, 0, 0, 0.04);
}

.mobile-nav-icon {
  display: flex !important;
  align-items: center;
  justify-content: center;
  color: #6b7280 !important;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  opacity: 1 !important;
  visibility: visible !important;
}

.mobile-nav-link:hover .mobile-nav-icon {
  color: #1e3a5f !important;
}

@media (max-width: 480px) {
  .mobile-nav {
    padding: 6px 12px;
  }
  
  .mobile-nav-link {
    padding: 12px 0;
    font-size: 14px;
  }
  
  .mobile-nav-icon {
    width: 18px;
    height: 18px;
  }
}

.mobile-nav-account {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.mobile-nav-link-danger {
  color: #dc2626;
}

.mobile-nav-link-danger .mobile-nav-icon {
  color: #dc2626;
}

.mobile-nav-link-danger:hover {
  color: #b91c1c;
}

.mobile-nav-link-danger:hover .mobile-nav-icon {
  color: #b91c1c;
}

.mobile-search-wrap {
  margin: 0 16px 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.mobile-search-box,
.mobile-search-btn {
  width: 100%;
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.mobile-search-btn {
  justify-content: center;
}

.mobile-search-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.mobile-auth {
  display: flex;
  gap: 12px;
  padding: 12px 16px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f3f4f6;
  flex-shrink: 0;
}

.mobile-auth .btn-log-in {
  color: #374151;
}

.mobile-auth .btn-log-in:hover {
  color: #1e3a5f;
  background: #e5e7eb;
}

.mobile-auth .btn-sign-up {
  flex: 1;
  background: #1e3a5f;
  color: #fff;
}

.mobile-auth .btn-sign-up:hover {
  background: #162942;
}

/* Drawer footer (dark strip) */
.mobile-drawer-footer {
  background: #1e3a5f;
  color: #fff;
  padding: 20px 16px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.mobile-drawer-footer-title {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

.mobile-drawer-social {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.mobile-drawer-social-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 10px;
}

.mobile-drawer-social-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.mobile-drawer-tagline-footer {
  margin: 0;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

/* ----- Desktop navbar (hidden on mobile) ----- */
.navbar-inner {
  display: flex;
  align-items: center;
  padding: 18px 64px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .navbar-inner {
    padding: 16px 32px;
  }
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
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
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
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  border-radius: 8px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  transition: color 0.2s ease, background 0.2s ease;
}

.nav-link:hover {
  color: #1a1a2e;
  background: rgba(255, 255, 255, 0.5);
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
