/**
 * DM Chat WebSocket: ws/chat/dm/{recipientId}/
 * One-on-one private chat. Connect when user opens a DM conversation.
 */

import { ref, watch, onBeforeUnmount } from 'vue'
import { useWebSocket } from './useWebSocket'

export interface DmChatMessage {
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

export function useDmChatWs(recipientId: import('vue').Ref<number | null> | number) {
  const idRef = typeof recipientId === 'number' ? ref(recipientId) : recipientId
  const messages = ref<DmChatMessage[]>([])
  const typingUserId = ref<number | null>(null)
  const typingUserName = ref<string | null>(null)

  const ws = useWebSocket({
    path: 'ws/chat/dm/0/',
    getPath: () => {
      const id = idRef.value
      const num = id == null ? 0 : Number(id)
      return num > 0 ? `ws/chat/dm/${num}/` : ''
    },
    autoReconnect: false,
  })

  ws.onMessage((data) => {
    const type = data.type as string | undefined
    if (type === 'chat_message') {
      const msg = (data as { message?: DmChatMessage }).message
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
    }
  })

  watch(
    idRef,
    (id) => {
      const num = id == null ? 0 : Number(id)
      if (num > 0) {
        messages.value = []
        typingUserId.value = null
        typingUserName.value = null
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
    messages,
    typingUserId,
    typingUserName,
    connect: ws.connect,
    disconnect: ws.disconnect,
    sendMessage: (content: string, title = 'Direct Message') => {
      ws.send({ type: 'chat_message', content, title })
    },
    sendTyping: (isTyping: boolean) => {
      ws.send({ type: 'typing', is_typing: isTyping })
    },
    sendReadReceipt: () => {
      ws.send({ type: 'read_receipt' })
    },
  }
}
