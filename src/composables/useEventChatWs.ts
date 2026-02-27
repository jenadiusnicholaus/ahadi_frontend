/**
 * Event Chat WebSocket: ws/chat/event/{eventId}/
 * Real-time group chat for event participants. Connect when user opens an event chat.
 */

import { ref, watch, onBeforeUnmount } from 'vue'
import { useWebSocket } from './useWebSocket'

const PING_INTERVAL_MS = 30_000

export interface EventChatWsMessage {
  id: number
  content: string
  message_type: string
  sender_id: number
  sender_name: string
  sender_phone?: string
  created_at: string
  is_deleted: boolean
  is_read: boolean
}

export function useEventChatWs(eventId: import('vue').Ref<number | null> | number) {
  const idRef = typeof eventId === 'number' ? ref(eventId) : eventId
  const messages = ref<EventChatWsMessage[]>([])
  const typingUserId = ref<number | null>(null)
  const typingUserName = ref<string | null>(null)
  const joinedUsers = ref<{ user_id: number; user_name: string }[]>([])
  const leftUsers = ref<{ user_id: number; user_name: string }[]>([])
  const wsError = ref<string | null>(null)

  let pingTimer: ReturnType<typeof setInterval> | null = null

  const ws = useWebSocket({
    path: 'ws/chat/event/0/',
    getPath: () => {
      const id = idRef.value
      const num = id == null ? 0 : Number(id)
      return num > 0 ? `ws/chat/event/${num}/` : ''
    },
    autoReconnect: false,
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

  ws.onMessage((data) => {
    console.log('🔄 Raw WebSocket data received:', data)
    const type = data.type as string | undefined
    if (type === 'chat_message') {
      const msg = (data as { message?: EventChatWsMessage }).message
      if (msg?.id != null) {
        console.log('🔥 New event chat message:', msg)
        messages.value = [...messages.value, { ...msg }]
      }
    } else if (type === 'typing') {
      const uid = (data as { user_id?: number }).user_id
      const uname = (data as { user_name?: string }).user_name
      const isTyping = (data as { is_typing?: boolean }).is_typing
      if (isTyping && uid != null) {
        typingUserId.value = uid
        typingUserName.value = uname ?? null
      } else {
        typingUserId.value = null
        typingUserName.value = null
      }
    } else if (type === 'user_join') {
      const uid = (data as { user_id?: number }).user_id
      const uname = (data as { user_name?: string }).user_name ?? ''
      if (uid != null) {
        console.log('👤 User joined event chat:', uname)
        joinedUsers.value = [...joinedUsers.value, { user_id: uid, user_name: uname }]
      }
    } else if (type === 'user_leave') {
      const uid = (data as { user_id?: number }).user_id
      const uname = (data as { user_name?: string }).user_name ?? ''
      if (uid != null) {
        console.log('👋 User left event chat:', uname)
        leftUsers.value = [...leftUsers.value, { user_id: uid, user_name: uname }]
      }
    } else if (type === 'pong') {
      // Server pong response - ignore, just for keepalive
    } else if (type === 'error') {
      console.error('❌ Event chat WebSocket error:', data)
      wsError.value = (data as { message?: string }).message ?? 'Chat error'
    } else {
      console.log('📨 Unknown event chat message type:', type, data)
    }
  })

  watch(ws.error, (e) => {
    wsError.value = e
  })

  watch(ws.status, (s) => {
    if (s === 'open') startPing()
    else stopPing()
  })

  watch(
    idRef,
    (id) => {
      const num = id == null ? 0 : Number(id)
      if (num > 0) {
        messages.value = []
        typingUserId.value = null
        typingUserName.value = null
        joinedUsers.value = []
        leftUsers.value = []
        wsError.value = null
        ws.disconnect()
        ws.connect()
      } else {
        ws.disconnect()
        messages.value = []
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    stopPing()
    ws.disconnect()
  })

  return {
    status: ws.status,
    error: ws.error,
    wsError,
    messages,
    typingUserId,
    typingUserName,
    joinedUsers,
    leftUsers,
    connect: ws.connect,
    disconnect: ws.disconnect,
    sendMessage: (content: string) => {
      console.log('📤 Sending message via WebSocket:', content)
      ws.send({ type: 'chat_message', content })
    },
    sendTyping: (isTyping: boolean) => {
      console.log('⌨️ Sending typing indicator:', isTyping)
      ws.send({ type: 'typing', is_typing: isTyping })
    },
    sendReadReceipt: () => {
      console.log('📖 Sending read receipt')
      ws.send({ type: 'read_receipt' })
    },
  }
}
