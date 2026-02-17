/**
 * Group/Event Notifications WebSocket: ws/chat/group/notifications/
 * Connect when Messages page opens. Receives new_message for event chats; sends ping for keepalive.
 */

import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useWebSocket } from './useWebSocket'

const PING_INTERVAL_MS = 25_000

export interface GroupNotificationMessage {
  event_id: string
  message_id: number
  sender_id: number
  sender_name: string
  content: string
  created_at: string
}

export function useGroupNotificationsWs() {
  const notifications = ref<GroupNotificationMessage[]>([])
  const maxStored = 50

  const ws = useWebSocket({
    path: 'ws/chat/group/notifications/',
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelayMs: 2000,
  })

  let pingTimer: ReturnType<typeof setInterval> | null = null

  ws.onMessage((data) => {
    const type = data.type as string | undefined
    if (type === 'new_message') {
      const msg = data as unknown as GroupNotificationMessage
      if (msg.event_id != null && msg.message_id != null) {
        notifications.value = [{ ...msg }, ...notifications.value.slice(0, maxStored - 1)]
      }
    }
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
