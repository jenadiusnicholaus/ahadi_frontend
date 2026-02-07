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
 * Hero section: animated background video (from internet).
 * 
 * Configuration via environment variables (.env file):
 * - VITE_HERO_VIDEO_TYPE: 'youtube' | 'mp4' (default: 'youtube')
 * - VITE_HERO_VIDEO_URL: Video ID or URL (default: 'Uz4H-whMHfs')
 * 
 * Option 1: Use a YouTube video (unlisted/public)
 * - Set VITE_HERO_VIDEO_TYPE=youtube in .env
 * - Set VITE_HERO_VIDEO_URL to YouTube video ID (e.g., 'Uz4H-whMHfs')
 * - Get video ID from YouTube URL: youtube.com/watch?v=VIDEO_ID
 * 
 * Option 2: Self-host MP4 video (RECOMMENDED for best performance)
 * - Set VITE_HERO_VIDEO_TYPE=mp4 in .env
 * - Set VITE_HERO_VIDEO_URL to '/videos/your-video.mp4' or full URL
 * - Download from: https://www.pexels.com/videos/ or https://mixkit.co/free-stock-video/
 * - Place video file in: public/videos/your-video.mp4
 * 
 * Option 3: Direct MP4 URL (if hosting allows hotlinking)
 * - Set VITE_HERO_VIDEO_TYPE=mp4 in .env
 * - Set VITE_HERO_VIDEO_URL to full URL
 * 
 * To change video: Edit .env file and restart dev server
 */
export const HERO_VIDEO_TYPE: 'youtube' | 'mp4' = 
  (import.meta.env.VITE_HERO_VIDEO_TYPE as 'youtube' | 'mp4' | undefined) || 'youtube'

export const HERO_VIDEO_URL: string =
  import.meta.env.VITE_HERO_VIDEO_URL || 'Uz4H-whMHfs' // Default: WorldRemit video

/** Fallback hero image when video is not available (local or URL). */
export const HERO_IMAGE_FALLBACK = '/images/static_images/homepage.png'
