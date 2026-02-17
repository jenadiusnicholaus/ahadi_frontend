/**
 * Core WebSocket composable: connect with JWT, send JSON, receive messages.
 * Handles open/close/error and optional auto-reconnect.
 */

import { ref, onBeforeUnmount } from 'vue'
import { getWebSocketBaseUrl } from '@/api/env'
import { getAccessToken } from '@/api/token'

export type WsStatus = 'closed' | 'connecting' | 'open' | 'error'

export interface UseWebSocketOptions {
  /** Static path, e.g. "ws/chat/dm/notifications/" */
  path: string
  /** Dynamic path function (overrides path if set) */
  getPath?: () => string
  /** Auto-reconnect on unexpected close */
  autoReconnect?: boolean
  /** Max reconnect attempts (default 5) */
  maxReconnectAttempts?: number
  /** Initial reconnect delay ms (default 1000) */
  reconnectDelayMs?: number
}

export interface UseWebSocketReturn {
  status: import('vue').Ref<WsStatus>
  lastMessage: import('vue').Ref<Record<string, unknown> | null>
  error: import('vue').Ref<string | null>
  connect: () => void
  disconnect: () => void
  send: (payload: Record<string, unknown>) => void
  onMessage: (cb: (data: Record<string, unknown>) => void) => void
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { path, getPath, autoReconnect = false, maxReconnectAttempts = 5, reconnectDelayMs = 1000 } = options

  const status = ref<WsStatus>('closed')
  const lastMessage = ref<Record<string, unknown> | null>(null)
  const error = ref<string | null>(null)

  let ws: WebSocket | null = null
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let messageCallback: ((data: Record<string, unknown>) => void) | null = null

  function buildUrl(): string {
    const base = getWebSocketBaseUrl()
    const token = getAccessToken()
    const pathStr = getPath ? getPath() : path
    const pathNorm = pathStr.replace(/^\//, '')
    const url = base ? `${base}/${pathNorm}` : ''
    
    console.log('[WebSocket] Building URL:')
    console.log('  - Base URL:', base || '(not set)')
    console.log('  - Path:', pathNorm)
    console.log('  - Token:', token ? `${token.substring(0, 20)}...` : '(no token)')
    console.log('  - Full URL (without token):', url)
    
    if (!url) return ''
    const sep = url.includes('?') ? '&' : '?'
    return token ? `${url}${sep}token=${encodeURIComponent(token)}` : url
  }

  function cleanup() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws) {
      ws.onopen = null
      ws.onclose = null
      ws.onerror = null
      ws.onmessage = null
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000)
        }
      } catch {}
      ws = null
    }
    status.value = 'closed'
  }

  function connect() {
    if (typeof window === 'undefined') return
    // Don't connect if getPath returns empty
    if (getPath && !getPath().trim()) return
    const url = buildUrl()
    console.log('[WebSocket] Attempting to connect:', url)
    if (!url) {
      error.value = 'WebSocket URL not configured'
      status.value = 'error'
      console.error('[WebSocket] URL not configured. Check VITE_WEBSOCKET_BASE_URL in .env')
      return
    }
    if (!getAccessToken()) {
      error.value = 'Not authenticated'
      status.value = 'error'
      console.error('[WebSocket] Not authenticated - no access token')
      return
    }
    cleanup()
    error.value = null
    status.value = 'connecting'
    try {
      ws = new WebSocket(url)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create WebSocket'
      status.value = 'error'
      console.error('[WebSocket] Failed to create:', e)
      return
    }

    ws.onopen = () => {
      error.value = null
      status.value = 'open'
      reconnectAttempt = 0
      console.log('[WebSocket] Connected successfully:', url)
    }

    ws.onclose = (event) => {
      ws = null
      status.value = 'closed'
      console.log('[WebSocket] Closed. Code:', event.code, 'Reason:', event.reason)
      if (event.code === 4001 || event.code === 4003) {
        error.value = 'Unauthorized or forbidden'
        console.error('[WebSocket] Auth error - code:', event.code)
      } else if (event.code !== 1000 && autoReconnect && reconnectAttempt < maxReconnectAttempts) {
        reconnectAttempt += 1
        const delay = reconnectDelayMs * Math.min(reconnectAttempt, 5)
        console.log('[WebSocket] Reconnecting in', delay, 'ms (attempt', reconnectAttempt, ')')
        reconnectTimer = setTimeout(() => connect(), delay)
      }
    }

    ws.onerror = (e) => {
      error.value = 'WebSocket error'
      status.value = 'error'
      console.error('[WebSocket] Error:', e)
    }

    ws.onmessage = (event) => {
      console.log('[WebSocket] Message received:', event.data)
      try {
        const data = JSON.parse(event.data as string) as Record<string, unknown>
        console.log('[WebSocket] Parsed message:', data)
        lastMessage.value = data
        messageCallback?.(data)
      } catch {
        console.warn('[WebSocket] Failed to parse message:', event.data)
        lastMessage.value = { type: 'unknown', raw: event.data }
        messageCallback?.({ type: 'unknown', raw: event.data })
      }
    }
  }

  function disconnect() {
    cleanup()
  }

  function send(payload: Record<string, unknown>) {
    if (ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Sending:', payload)
      ws.send(JSON.stringify(payload))
    } else {
      console.warn('[WebSocket] Cannot send - not connected. State:', ws?.readyState)
    }
  }

  function onMessage(cb: (data: Record<string, unknown>) => void) {
    messageCallback = cb
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return { status, lastMessage, error, connect, disconnect, send, onMessage }
}
