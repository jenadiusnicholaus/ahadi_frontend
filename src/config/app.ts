/**
 * Global app / brand configuration.
 * Use these constants for app name, title, and shared brand values.
 */
export const APP_NAME = 'Ahadi'

export const DESKTOP_BREAKPOINT = 1200

export const APP_CONFIG = {
  name: APP_NAME,
  /** Used for document title, meta tags, etc. */
  title: `${APP_NAME} – Events`,
} as const

/** Contact info for footer and elsewhere */
export const CONTACT_INFO = {
  email: 'support@ahadi.co.tz',
  phone: '+255 123 456 789',
  location: 'Dar es Salaam, Tanzania',
} as const

/**
 * Hero section: background image.
 * Set VITE_HERO_IMAGE_URL in .env to path under public/ (e.g. /images/hero-background.jpg).
 * Restart dev server after changing .env.
 */
const _heroImageUrl = import.meta.env.VITE_HERO_IMAGE_URL as string | undefined
export const HERO_IMAGE_URL: string =
  (_heroImageUrl?.trim()) || '/images/static_images/homepage.png'
