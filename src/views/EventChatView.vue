<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventById, fetchEventMessages } from '@/api/event'
import {
  fetchEventChatMessages,
  sendEventChatMessage,
  markEventChatRead,
  type ChatMessage,
} from '@/api/chat'
import { fetchInbox, fetchInboxUnreadCount, type InboxMessage } from '@/api/inbox'
import { fetchMyEvents } from '@/api/event'
import { useAuthStore } from '@/stores/auth'
import type { PublicEvent } from '@/types/events'

type TabId = 'personal' | 'event'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const activeTab = ref<TabId>('personal')
const event = ref<PublicEvent | null>(null)
const myEvents = ref<PublicEvent[]>([])
const messages = ref<ChatMessage[]>([])
const inboxMessages = ref<InboxMessage[]>([])
const inboxUnreadCount = ref(0)
const searchQuery = ref('')
const loading = ref(true)
const inboxLoading = ref(false)
const eventsListLoading = ref(false)
const error = ref<string | null>(null)
const sending = ref(false)
const inputText = ref('')
const listRef = ref<HTMLElement | null>(null)

const eventId = computed(() => {
  if (route.name === 'messages') return 0
  const id = route.params.id
  if (typeof id !== 'string') return 0
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : 0
})

/** True when opened from event detail (Message button) – show only event chat, no tabs, no "All event chats". */
const isEventChatOnlyView = computed(() => route.name === 'events-chat' && eventId.value > 0)

/** Show back button only on event chat route. Never show on Inbox (/messages). */
const showBackButton = computed(() => route.name === 'events-chat' && eventId.value > 0)

const currentUserId = computed(() => user.value?.id ?? 0)

async function loadEvent() {
  if (!eventId.value) return
  try {
    event.value = await fetchEventById(eventId.value)
  } catch {
    event.value = null
  }
}

/** Normalize raw API message to ChatMessage shape (handles both /events/.../messages/ and /chat/events/.../messages/). */
function normalizeMessage(raw: unknown, eventIdNum: number): ChatMessage {
  const o = raw as Record<string, unknown>
  return {
    id: Number(o?.id) || 0,
    event: eventIdNum,
    sender: Number(o?.sender ?? o?.sender_id) || 0,
    sender_name: String(o?.sender_name ?? (o?.sender && typeof o.sender === 'object' && 'full_name' in o.sender ? (o.sender as { full_name?: string }).full_name : null) ?? 'Unknown').trim() || 'Unknown',
    sender_phone: String(o?.sender_phone ?? '').trim(),
    content: String(o?.content ?? '').trim(),
    message_type: String(o?.message_type ?? 'TEXT').trim(),
    created_at: String(o?.created_at ?? new Date().toISOString()),
    updated_at: String(o?.updated_at ?? o?.created_at ?? ''),
    is_deleted: Boolean(o?.is_deleted),
    is_read: String(o?.is_read ?? ''),
  }
}

async function loadMessages() {
  if (!eventId.value) return
  loading.value = true
  error.value = null
  const eid = eventId.value
  try {
    let list: unknown[] = []
    try {
      list = await fetchEventMessages(eid)
    } catch {
      const res = await fetchEventChatMessages(eid, { limit: 200 })
      list = res.results ?? []
    }
    messages.value = list.map((raw) => normalizeMessage(raw, eid))
    await markEventChatRead(eid).catch(() => {})
    await nextTick()
    scrollToBottom()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Chat is not enabled') || msg.includes('403')) {
      error.value = 'Chat is not enabled for this event'
    } else if (msg.includes('404')) {
      error.value = 'Event not found'
    } else {
      error.value = 'Failed to load messages'
    }
    messages.value = []
  } finally {
    loading.value = false
  }
}

async function loadInbox() {
  inboxLoading.value = true
  try {
    const [res, unreadRes] = await Promise.all([
      fetchInbox({ page: 1 }),
      fetchInboxUnreadCount().catch(() => ({ count: 0 })),
    ])
    inboxMessages.value = res.results ?? []
    inboxUnreadCount.value = unreadRes?.count ?? 0
  } catch {
    inboxMessages.value = []
    inboxUnreadCount.value = 0
  } finally {
    inboxLoading.value = false
  }
}

async function loadMyEvents() {
  eventsListLoading.value = true
  try {
    const res = await fetchMyEvents()
    myEvents.value = res.results ?? []
  } catch {
    myEvents.value = []
  } finally {
    eventsListLoading.value = false
  }
}

async function load() {
  await loadMyEvents()
  if (eventId.value) {
    await loadEvent()
    await loadMessages()
  }
  await loadInbox()
}

const filteredInboxMessages = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return inboxMessages.value
  return inboxMessages.value.filter((msg) => {
    const from = (isInboxFromMe(msg) ? msg.recipient_name : msg.sender_name || '').toLowerCase()
    const to = (isInboxFromMe(msg) ? msg.sender_name : msg.recipient_name || '').toLowerCase()
    const title = (msg.title || '').toLowerCase()
    const content = (msg.content || '').toLowerCase()
    return from.includes(q) || to.includes(q) || title.includes(q) || content.includes(q)
  })
})

onMounted(() => {
  if (eventId.value) activeTab.value = 'event'
  load()
})
watch(
  () => [route.params.id, route.name],
  () => {
    if (eventId.value) activeTab.value = 'event'
    load()
  }
)

function isMe(msg: ChatMessage): boolean {
  const senderId = typeof msg.sender === 'number' ? msg.sender : Number((msg as unknown as { sender_id?: number }).sender_id)
  return senderId === currentUserId.value
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return iso
  }
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

function scrollToBottom() {
  nextTick(() => {
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || !eventId.value || sending.value) return
  sending.value = true
  inputText.value = ''
  try {
    const sent = await sendEventChatMessage(eventId.value, { content: text })
    messages.value = [...messages.value, sent]
    await nextTick()
    scrollToBottom()
  } catch {
    inputText.value = text
    error.value = 'Failed to send message'
  } finally {
    sending.value = false
  }
}

function goBack() {
  if (eventId.value) {
    router.push({ name: 'events-detail', params: { id: String(eventId.value) } })
  } else {
    router.push({ name: 'events' })
  }
}

function openEventChat(ev: PublicEvent) {
  activeTab.value = 'event'
  router.push({ name: 'events-chat', params: { id: String(ev.id) } })
}

function isInboxFromMe(msg: InboxMessage): boolean {
  return (msg.sender ?? msg.sender_id) === currentUserId.value
}
</script>

<template>
  <div class="chat-page">
    <WebNavbar />
    <main class="chat-main">
      <header class="chat-header">
        <button v-if="showBackButton" type="button" class="back-btn" aria-label="Back" @click="goBack">
          <span class="back-icon">←</span>
        </button>
        <h1 class="chat-title">{{ eventId && event ? event.title : (eventId ? 'Event Chat' : 'Messages') }}</h1>
      </header>

      <!-- Event chat only (from event detail Message): no tabs, no "All event chats" -->
      <template v-if="isEventChatOnlyView">
        <div v-if="loading && messages.length === 0" class="state state-loading">
          <div class="loader" />
          <p>Loading messages…</p>
        </div>
        <div v-else-if="error && messages.length === 0" class="state state-error">
          <span class="error-icon">⚠️</span>
          <p class="error-text">{{ error }}</p>
          <button type="button" class="btn-retry" @click="loadMessages">Retry</button>
        </div>
        <template v-else>
          <div v-if="messages.length === 0" class="state state-empty">
            <span class="empty-icon">💬</span>
            <p>No messages yet</p>
            <p class="hint">Start the conversation!</p>
          </div>
          <ul
            v-else
            ref="listRef"
            class="message-list"
            role="list"
          >
            <li
              v-for="msg in messages"
              :key="msg.id"
              class="message-row"
              :class="{ me: isMe(msg) }"
              role="listitem"
            >
              <template v-if="!isMe(msg)">
                <span class="bubble-avatar">{{ (msg.sender_name || 'U').charAt(0).toUpperCase() }}</span>
                <div class="bubble-wrap other">
                  <span class="bubble-sender">{{ msg.sender_name || 'Unknown' }}</span>
                  <div class="bubble">
                    <span class="bubble-content">{{ msg.content }}</span>
                    <span class="bubble-time">{{ formatTime(msg.created_at) }}</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="bubble-wrap me">
                  <div class="bubble">
                    <span class="bubble-content">{{ msg.content }}</span>
                    <span class="bubble-time">{{ formatTime(msg.created_at) }}</span>
                  </div>
                </div>
              </template>
            </li>
          </ul>
        </template>
        <footer class="chat-footer">
          <input
            v-model="inputText"
            type="text"
            class="chat-input"
            placeholder="Type a message"
            :disabled="!!error || sending"
            @keydown.enter.prevent="sendMessage"
          />
          <button
            type="button"
            class="send-btn"
            :disabled="!inputText.trim() || sending"
            aria-label="Send"
            @click="sendMessage"
          >
            <span class="send-icon">➤</span>
          </button>
        </footer>
      </template>

      <!-- Messages view (Inbox from nav): tabs + Inbox / Event Chats -->
      <template v-else>
      <!-- Tabs: Inbox | Event Chats (Flutter-style) -->
      <div class="tabs-bar">
        <button
          type="button"
          class="tab"
          :class="{ active: activeTab === 'personal' }"
          @click="activeTab = 'personal'"
        >
          <span class="tab-icon" aria-hidden="true">✉️</span>
          <span class="tab-label">Inbox</span>
          <span v-if="inboxUnreadCount > 0" class="tab-badge">{{ inboxUnreadCount > 99 ? '99+' : inboxUnreadCount }}</span>
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: activeTab === 'event' }"
          @click="activeTab = 'event'"
        >
          <span class="tab-icon" aria-hidden="true">👥</span>
          <span class="tab-label">Event Chats</span>
        </button>
      </div>

      <!-- Tab: Inbox (search on top + Recent Messages) -->
      <template v-if="activeTab === 'personal'">
        <div class="inbox-tab-wrap">
          <!-- Search bar on top -->
          <div class="search-wrap">
            <span class="search-icon" aria-hidden="true">🔍</span>
            <input
              v-model="searchQuery"
              type="search"
              class="search-input"
              placeholder="Search messages..."
              aria-label="Search messages"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear"
              aria-label="Clear search"
              @click="searchQuery = ''"
            >
              ✕
            </button>
          </div>

          <!-- Recent Messages section header -->
          <div v-if="inboxMessages.length > 0" class="section-header">
            <span class="section-title">Recent Messages</span>
            <span v-if="inboxUnreadCount > 0" class="unread-badge">{{ inboxUnreadCount }} unread</span>
          </div>

          <div v-if="inboxLoading && inboxMessages.length === 0" class="state state-loading">
            <div class="loader" />
            <p>Loading messages…</p>
          </div>
          <div v-else-if="filteredInboxMessages.length === 0" class="state state-empty">
            <span class="empty-icon">✉️</span>
            <p>{{ searchQuery ? 'No messages match your search' : 'No messages yet' }}</p>
            <p class="hint">{{ searchQuery ? 'Try a different search' : 'Your inbox is empty' }}</p>
          </div>
          <ul v-else class="inbox-list">
            <li v-for="msg in filteredInboxMessages" :key="msg.id" class="inbox-item">
              <span class="inbox-avatar">{{ ((isInboxFromMe(msg) ? msg.recipient_name : msg.sender_name) || '?').charAt(0).toUpperCase() }}</span>
              <div class="inbox-body">
                <span class="inbox-from">{{ isInboxFromMe(msg) ? `To: ${msg.recipient_name}` : msg.sender_name }}</span>
                <p v-if="msg.title" class="inbox-title">{{ msg.title }}</p>
                <p class="inbox-content">{{ msg.content || '—' }}</p>
                <span class="inbox-meta">{{ msg.event_title ? `Event: ${msg.event_title}` : '' }} · {{ formatDate(msg.created_at) }}</span>
              </div>
            </li>
          </ul>
        </div>
      </template>

      <!-- Tab: Event Chats – list of events, or current event chat when eventId is set -->
      <template v-else>
        <!-- No event in URL: show list of event chats -->
        <template v-if="!eventId">
          <div class="event-chats-list-wrap">
            <div v-if="eventsListLoading" class="state state-loading">
              <div class="loader" />
              <p>Loading events…</p>
            </div>
            <div v-else-if="myEvents.length === 0" class="state state-empty">
              <span class="empty-icon">💬</span>
              <p>No Event Chats Yet</p>
              <p class="hint">Join or create an event to start chatting with participants</p>
            </div>
            <ul v-else class="event-chats-list">
              <li
                v-for="ev in myEvents"
                :key="ev.id"
                class="event-chat-tile"
                @click="openEventChat(ev)"
              >
                <span class="event-chat-avatar">{{ (ev.title || 'E').charAt(0).toUpperCase() }}</span>
                <div class="event-chat-body">
                  <span class="event-chat-title">{{ ev.title }}</span>
                  <span class="event-chat-meta">{{ ev.event_type_name || 'Event' }} · {{ ev.start_date ? formatDate(ev.start_date) : '' }}</span>
                </div>
                <span class="event-chat-chevron">›</span>
              </li>
            </ul>
          </div>
        </template>
        <!-- Event in URL: show this event's chat (header already shows event name) -->
        <template v-else>
          <div class="event-chat-back-bar">
            <router-link :to="{ name: 'messages' }" class="event-chat-back-link">← All event chats</router-link>
          </div>
          <div v-if="loading && messages.length === 0" class="state state-loading">
            <div class="loader" />
            <p>Loading messages…</p>
          </div>
          <div v-else-if="error && messages.length === 0" class="state state-error">
            <span class="error-icon">⚠️</span>
            <p class="error-text">{{ error }}</p>
            <button type="button" class="btn-retry" @click="loadMessages">Retry</button>
          </div>
          <template v-else>
            <div v-if="messages.length === 0" class="state state-empty">
              <span class="empty-icon">💬</span>
              <p>No messages yet</p>
              <p class="hint">Start the conversation!</p>
            </div>

            <ul
              v-else
              ref="listRef"
              class="message-list"
              role="list"
            >
              <li
                v-for="msg in messages"
                :key="msg.id"
                class="message-row"
                :class="{ me: isMe(msg) }"
                role="listitem"
              >
                <template v-if="!isMe(msg)">
                  <span class="bubble-avatar">{{ (msg.sender_name || 'U').charAt(0).toUpperCase() }}</span>
                  <div class="bubble-wrap other">
                    <span class="bubble-sender">{{ msg.sender_name || 'Unknown' }}</span>
                    <div class="bubble">
                      <span class="bubble-content">{{ msg.content }}</span>
                      <span class="bubble-time">{{ formatTime(msg.created_at) }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="bubble-wrap me">
                    <div class="bubble">
                      <span class="bubble-content">{{ msg.content }}</span>
                      <span class="bubble-time">{{ formatTime(msg.created_at) }}</span>
                    </div>
                  </div>
                </template>
              </li>
            </ul>

            <footer class="chat-footer">
              <input
                v-model="inputText"
                type="text"
                class="chat-input"
                placeholder="Type a message"
                :disabled="!!error || sending"
                @keydown.enter.prevent="sendMessage"
              />
              <button
                type="button"
                class="send-btn"
                :disabled="!inputText.trim() || sending"
                aria-label="Send"
                @click="sendMessage"
              >
                <span class="send-icon">➤</span>
              </button>
            </footer>
          </template>
        </template>
      </template>
      </template>
    </main>
  </div>
</template>

<style scoped>
.chat-page {
  min-height: 100vh;
  background: #ece5dd;
  display: flex;
  flex-direction: column;
}
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  padding: 0 0 0;
}
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #1a283b;
  color: #fff;
}
.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 8px;
}
.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
.back-icon {
  font-size: 20px;
}
.chat-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Tabs */
.tabs-bar {
  display: flex;
  background: #1a283b;
  padding: 0 16px;
  gap: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.tab {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  margin-bottom: -1px;
}
.tab:hover {
  color: #fff;
}
.tab.active {
  color: #fff;
  border-bottom-color: #fff;
}
.tab-icon {
  margin-right: 6px;
  font-size: 1em;
}
.tab-label {
  font-size: 14px;
  font-weight: 600;
}
.tab-badge {
  margin-left: 6px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #ef4444;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Inbox tab: search + section */
.inbox-tab-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f8fafc;
}
.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px;
  padding: 0 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.search-wrap:focus-within {
  border-color: #1a283b;
  background: #fff;
}
.search-icon {
  font-size: 16px;
  opacity: 0.7;
}
.search-input {
  flex: 1;
  padding: 12px 0;
  font-size: 15px;
  border: none;
  background: transparent;
  outline: none;
}
.search-input::placeholder {
  color: #94a3b8;
}
.search-clear {
  padding: 4px 8px;
  font-size: 14px;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 6px;
}
.search-clear:hover {
  color: #1a283b;
  background: #e2e8f0;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 8px;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}
.unread-badge {
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: #ef4444;
  border-radius: 12px;
}

/* Event Chats list */
.event-chats-list-wrap {
  flex: 1;
  overflow-y: auto;
  background: #f8fafc;
}
.event-chats-list {
  list-style: none;
  margin: 0;
  padding: 8px 0;
}
.event-chat-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
}
.event-chat-tile:hover {
  background: #f1f5f9;
}
.event-chat-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(26, 40, 59, 0.1);
  color: #1a283b;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.event-chat-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.event-chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a283b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-chat-meta {
  font-size: 13px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-chat-chevron {
  font-size: 20px;
  color: #94a3b8;
  flex-shrink: 0;
}

.event-chat-back-bar {
  padding: 8px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.event-chat-back-link {
  font-size: 14px;
  font-weight: 500;
  color: #1a283b;
  text-decoration: none;
}
.event-chat-back-link:hover {
  text-decoration: underline;
}

.state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: #6b7280;
}
.state-loading .loader {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #1a283b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-icon, .empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}
.error-text { color: #dc2626; margin: 0 0 12px; }
.btn-retry {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #1a283b;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}
.hint { font-size: 14px; color: #9ca3af; margin: 8px 0 0; }

/* Inbox list (Personal tab) */
.inbox-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 8px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8fafc;
}
.inbox-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
}
.inbox-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(26, 40, 59, 0.15);
  color: #1a283b;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.inbox-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.inbox-from {
  font-size: 13px;
  font-weight: 600;
  color: #1a283b;
}
.inbox-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}
.inbox-content {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.inbox-meta {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 12px 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.message-row.me {
  flex-direction: row-reverse;
}
.bubble-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(26, 40, 59, 0.15);
  color: #1a283b;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bubble-wrap {
  max-width: 75%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.bubble-wrap.me {
  align-items: flex-end;
}
.bubble-sender {
  font-size: 12px;
  font-weight: 600;
  color: #1a283b;
  margin-bottom: 2px;
}
.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 100%;
}
.bubble-wrap.other .bubble {
  background: #fff;
  border-top-left-radius: 4px;
}
.bubble-wrap.me .bubble {
  background: #dcf8c6;
  border-top-right-radius: 4px;
}
.bubble-content {
  font-size: 15px;
  color: #1a1a2e;
  word-break: break-word;
  white-space: pre-wrap;
}
.bubble-time {
  font-size: 11px;
  color: #6b7280;
  align-self: flex-end;
}
.chat-footer {
  padding: 8px 16px 16px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  background: #f3f4f6;
  outline: none;
}
.chat-input:focus {
  border-color: #1a283b;
  background: #fff;
}
.send-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1a283b;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) {
  background: #2d3a4f;
}
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.send-icon {
  font-size: 18px;
  line-height: 1;
}
</style>
