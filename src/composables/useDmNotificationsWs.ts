/**
 * DM Notifications WebSocket: ws/chat/dm/notifications/
 * Connect when Messages page opens. Receives new_message for DMs; sends ping for keepalive.
 */

import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useWebSocket } from './useWebSocket'

const PING_INTERVAL_MS = 25_000

export interface DmNotificationMessage {
  id: number
  sender_id: number
  sender_name: string
  recipient_id: number
  recipient_name: string
  content: string
  title: string
  message_type: string
  created_at: string
  is_read: boolean
}

export function useDmNotificationsWs() {
  const notifications = ref<DmNotificationMessage[]>([])
  const maxStored = 50

  const ws = useWebSocket({
    path: 'ws/chat/dm/notifications/',
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelayMs: 2000,
  })

  let pingTimer: ReturnType<typeof setInterval> | null = null

  ws.onMessage((data) => {
    const type = data.type as string | undefined
    if (type === 'new_message') {
      const msg = data as unknown as DmNotificationMessage
      if (msg.id != null && msg.sender_id != null) {
        notifications.value = [{ ...msg }, ...notifications.value.slice(0, maxStored - 1)]
      }
    }
    // type === 'pong' is just keepalive response, ignore
  })

  function startPing() {
    stopPing()
    pingTimer = setInterval(() => {
      if (ws.status.value === 'open') {
        ws.send({ type: 'ping' })
      }
    }, PING_INTERVAL_MS)
  }

  function stopPing() {
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
  }

  watch(ws.status, (s) => {
    if (s === 'open') startPing()
    else stopPing()
  })

  onMounted(() => {
    ws.connect()
  })

  onBeforeUnmount(() => {
    stopPing()
    ws.disconnect()
  })

  return {
    status: ws.status,
    error: ws.error,
    notifications,
    connect: ws.connect,
    disconnect: ws.disconnect,
  }
}
