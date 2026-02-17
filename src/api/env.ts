/**
 * All API URL config from .env – no hardcoded URLs in .ts.
 * Single source: .env; this file only reads and exposes variables.
 */

type Env = {
  API_BASE_URL?: string
  API_AUTH_PREFIX?: string
  API_EVENTS_PREFIX?: string
  API_PUBLIC_PREFIX?: string
  API_PAYMENTS_PREFIX?: string
  API_CHAT_PREFIX?: string
  API_INBOX_PREFIX?: string
  API_DIRECT_MESSAGES_PREFIX?: string
  API_INVITATIONS_PREFIX?: string
  API_INVITATION_TEMPLATES_PREFIX?: string
  API_ANNOUNCEMENTS_PREFIX?: string
  API_PARTICIPANTS_PREFIX?: string
  API_EVENT_TYPES_PREFIX?: string
  API_WHATSAPP_PREFIX?: string
  API_RECEIVE_TIMEOUT?: string
  VITE_AUTH_SCHEME?: string
  VITE_WEBSOCKET_BASE_URL?: string
}

function getEnv(): Env {
  if (typeof import.meta === 'undefined') return {}
  return (import.meta as unknown as { env?: Env }).env ?? {}
}

function normPrefix(value: string | undefined, defaultVal: string): string {
  const s = (value ?? defaultVal).replace(/^\/+|\/+$/g, '')
  return s || defaultVal
}

/** API base URL from .env (no trailing slash). */
export function getApiBaseUrl(): string {
  return (getEnv().API_BASE_URL ?? '').replace(/\/$/, '')
}

export function getAuthPrefix(): string {
  return normPrefix(getEnv().API_AUTH_PREFIX, 'auth')
}
export function getEventsPrefix(): string {
  return normPrefix(getEnv().API_EVENTS_PREFIX, 'events')
}
export function getPublicPrefix(): string {
  return normPrefix(getEnv().API_PUBLIC_PREFIX, 'public')
}
export function getPaymentsPrefix(): string {
  return normPrefix(getEnv().API_PAYMENTS_PREFIX, 'payments')
}
export function getChatPrefix(): string {
  return normPrefix(getEnv().API_CHAT_PREFIX, 'chat')
}
export function getInboxPrefix(): string {
  return normPrefix(getEnv().API_INBOX_PREFIX, 'inbox')
}
export function getDirectMessagesPrefix(): string {
  return normPrefix(getEnv().API_DIRECT_MESSAGES_PREFIX, 'direct-messages')
}
export function getInvitationsPrefix(): string {
  return normPrefix(getEnv().API_INVITATIONS_PREFIX, 'invitations')
}
export function getInvitationTemplatesPrefix(): string {
  return normPrefix(getEnv().API_INVITATION_TEMPLATES_PREFIX, 'invitation-templates')
}
export function getAnnouncementsPrefix(): string {
  return normPrefix(getEnv().API_ANNOUNCEMENTS_PREFIX, 'announcements')
}
export function getParticipantsPrefix(): string {
  return normPrefix(getEnv().API_PARTICIPANTS_PREFIX, 'participants')
}
export function getEventTypesPrefix(): string {
  return normPrefix(getEnv().API_EVENT_TYPES_PREFIX, 'event-types')
}
export function getWhatsappPrefix(): string {
  return normPrefix(getEnv().API_WHATSAPP_PREFIX, 'whatsapp')
}

export function getAuthScheme(): string {
  const scheme = getEnv().VITE_AUTH_SCHEME?.trim()
  return scheme || 'Bearer'
}

export function getApiTimeoutMs(): number {
  const s = getEnv().API_RECEIVE_TIMEOUT
  if (s == null || s === '') return 60_000
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? n * 1000 : 60_000
}

/**
 * WebSocket base URL (no trailing slash).
 * Set VITE_WEBSOCKET_BASE_URL in .env (e.g. ws://162.0.233.47:8005)
 */
export function getWebSocketBaseUrl(): string {
  const ws = getEnv().VITE_WEBSOCKET_BASE_URL?.trim()
  if (ws) return ws.replace(/\/$/, '')
  // Fallback: derive from API base URL (http -> ws, https -> wss)
  const api = getApiBaseUrl()
  if (!api) return ''
  try {
    const u = new URL(api)
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'
    u.pathname = ''
    return u.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}
