import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ACCESS_KEY = 'ahadi_access'
const EXPIRY_KEY = 'ahadi_access_expiry'
const REFRESH_KEY = 'ahadi_refresh'
const USER_KEY = 'ahadi_user'
const SESSION_HOURS = 2

export interface AuthUser {
  id?: number
  full_name?: string
  phone?: string
  email?: string | null
  [key: string]: unknown
}

function getStoredExpiry(): number | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(EXPIRY_KEY)
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function isSessionValid(): boolean {
  const expiry = getStoredExpiry()
  if (expiry == null) return !!localStorage.getItem(ACCESS_KEY)
  return Date.now() < expiry
}

function readLoggedIn(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    const token = localStorage.getItem(ACCESS_KEY)
    if (!token || token.length === 0) return false
    if (!isSessionValid()) {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(EXPIRY_KEY)
      localStorage.removeItem(REFRESH_KEY)
      localStorage.removeItem(USER_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

function readStoredUser(): AuthUser | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const hasAccessToken = ref(false)
  const user = ref<AuthUser | null>(null)

  if (typeof window !== 'undefined') {
    hasAccessToken.value = readLoggedIn()
    user.value = readStoredUser()
  }

  const isLoggedIn = computed(() => hasAccessToken.value)

  function hydrate() {
    hasAccessToken.value = readLoggedIn()
    user.value = readStoredUser()
  }

  function setLoggedIn(loggedIn: boolean) {
    hasAccessToken.value = loggedIn
  }

  function setUser(u: AuthUser | null) {
    user.value = u
    if (typeof localStorage !== 'undefined') {
      if (u == null) localStorage.removeItem(USER_KEY)
      else localStorage.setItem(USER_KEY, JSON.stringify(u))
    }
  }

  /** Call after storing access token to set 2-hour expiry */
  function setSessionExpiry() {
    if (typeof localStorage === 'undefined') return
    const expiry = Date.now() + SESSION_HOURS * 60 * 60 * 1000
    localStorage.setItem(EXPIRY_KEY, String(expiry))
  }

  function logout() {
    hasAccessToken.value = false
    user.value = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(EXPIRY_KEY)
      localStorage.removeItem(REFRESH_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }

  return { isLoggedIn, user, hydrate, setLoggedIn, setUser, setSessionExpiry, logout }
})
