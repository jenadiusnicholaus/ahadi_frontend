/**
 * Event Chat WebSocket: ws/chat/event/{eventId}/
 * Real-time group chat for event participants. Connect when user opens an event chat.
 */

import { ref, watch, onBeforeUnmount } from 'vue'
import { useWebSocket } from './useWebSocket'

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

  const ws = useWebSocket({
    path: 'ws/chat/event/0/',
    getPath: () => {
      const id = idRef.value
      const num = id == null ? 0 : Number(id)
      return num > 0 ? `ws/chat/event/${num}/` : ''
    },
    autoReconnect: false,
  })

  ws.onMessage((data) => {
    const type = data.type as string | undefined
    if (type === 'chat_message') {
      const msg = (data as { message?: EventChatWsMessage }).message
      if (msg?.id != null) {
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
        joinedUsers.value = [...joinedUsers.value, { user_id: uid, user_name: uname }]
      }
    } else if (type === 'user_leave') {
      const uid = (data as { user_id?: number }).user_id
      const uname = (data as { user_name?: string }).user_name ?? ''
      if (uid != null) {
        leftUsers.value = [...leftUsers.value, { user_id: uid, user_name: uname }]
      }
    } else if (type === 'error') {
      wsError.value = (data as { message?: string }).message ?? 'Chat error'
    }
  })

  watch(ws.error, (e) => {
    wsError.value = e
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
      ws.send({ type: 'chat_message', content })
    },
    sendTyping: (isTyping: boolean) => {
      ws.send({ type: 'typing', is_typing: isTyping })
    },
    sendReadReceipt: () => {
      ws.send({ type: 'read_receipt' })
    },
  }
}
