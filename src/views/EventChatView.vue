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
  fetchEventChatRoom,
  fetchEventChatUnread,
  type ChatMessage,
  type ChatRoom,
} from '@/api/chat'
import {
  fetchInbox,
  fetchInboxUnreadCount,
  fetchInboxConversations,
  markInboxRead,
  markAllInboxRead,
  type InboxMessage,
  type InboxConversationItem,
} from '@/api/inbox'
import {
  sendDirectMessage,
  markConversationRead,
  fetchConversation,
  type ConversationMessage,
} from '@/api/direct-messages'
import { fetchMyEvents } from '@/api/event'
import { assetUrl } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import type { PublicEvent } from '@/types/events'

type TabId = 'personal' | 'event'

/** One conversation: messages with the same "other party" (sender or recipient). */
interface Conversation {
  otherPartyId: number
  otherPartyName: string
  lastMessage: string
  lastTime: string
  lastIso: string
  unreadCount: number
  messages: InboxMessage[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const activeTab = ref<TabId>('personal')
/** For WhatsApp-style inbox: selected conversation by other party id (null = none). */
const selectedConversationKey = ref<number | null>(null)
/** When opening by ?open=userId&name=… and that user is not in the list yet (new convo). */
const pendingOpenConversation = ref<{ userId: number; displayName: string } | null>(null)
/** True only during initial load of inbox (for loading overlay). */
const inboxInitialLoad = ref(false)
/** Inbox view: 'personal' = direct messages (inbox API), 'event' = event chats (chat API). */
const inboxFilter = ref<'personal' | 'event'>('personal')
/** When Event Chat filter is on: selected event id for right-panel chat (null = none). */
const selectedEventIdForChat = ref<number | null>(null)
/** Event chat messages for right panel when Event Chat + event selected (from chat API). */
const eventChatMessages = ref<ChatMessage[]>([])
const eventChatLoading = ref(false)
/** Per-event unread count for Event Chat list (event id -> count). */
const eventChatUnreadCounts = ref<Record<number, number>>({})
/** Room info for selected event chat (optional). */
const eventChatRoom = ref<ChatRoom | null>(null)
/** Next page for event chat "load older" (2, 3, …); null when no more. */
const eventChatNextPage = ref<number | null>(null)
const eventChatError = ref<string | null>(null)
const eventChatLoadingOlder = ref(false)
const eventChatLoadingNewer = ref(false)
const sendingEventChat = ref(false)
const eventChatInputText = ref('')
/** Reply text and sending state for inbox chat */
const inboxReplyText = ref('')
const sendingInbox = ref(false)
const inboxError = ref<string | null>(null)
/** DM thread from GET conversation API (when selected). */
const dmThreadMessages = ref<InboxMessage[]>([])
const dmThreadForUserId = ref<number | null>(null)
const dmThreadLoading = ref(false)
const event = ref<PublicEvent | null>(null)
const myEvents = ref<PublicEvent[]>([])
const messages = ref<ChatMessage[]>([])
const inboxMessages = ref<InboxMessage[]>([])
/** Conversations from GET inbox/conversations/ when available; used for left list. */
const inboxConversationsFromApi = ref<InboxConversationItem[] | null>(null)
const inboxUnreadCount = ref(0)
const searchQuery = ref('')
const loading = ref(true)
const inboxLoading = ref(false)
const eventsListLoading = ref(false)
const error = ref<string | null>(null)
const sending = ref(false)
const inputText = ref('')
const listRef = ref<HTMLElement | null>(null)
const inboxListRef = ref<HTMLElement | null>(null)

const eventId = computed(() => {
  // When on /messages, prefer ?eventId=... from query (used by redirect from /events/:id/chat)
  if (route.name === 'messages') {
    const q = route.query.eventId
    if (typeof q === 'string') {
      const n = Number(q)
      return Number.isFinite(n) && n > 0 ? n : 0
    }
    return 0
  }
  const id = route.params.id
  if (typeof id !== 'string') return 0
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : 0
})

/** Event-only layout is disabled; always use inbox layout (tabs + event list). */
const isEventChatOnlyView = computed(() => false)

/** No back button for now; we stay on /messages. */
const showBackButton = computed(() => false)

const currentUserId = computed(() => user.value?.id ?? 0)

async function loadEvent() {
  if (!eventId.value) return
  try {
    event.value = await fetchEventById(eventId.value)
  } catch {
    event.value = null
  }
}

/** Normalize conversation API message to InboxMessage shape for right panel. */
function normalizeConversationMessage(raw: ConversationMessage, otherPartyId: number, otherPartyName: string): InboxMessage {
  const sid = Number(raw.sender ?? raw.sender_id) ?? 0
  const rid = Number(raw.recipient ?? raw.recipient_id) ?? 0
  const isFromMe = sid === currentUserId.value
  return {
    id: Number(raw.id) || 0,
    sender: sid,
    sender_id: sid,
    sender_name: isFromMe ? (user.value?.full_name ?? 'Me') : otherPartyName,
    recipient: rid,
    recipient_id: rid,
    recipient_name: isFromMe ? otherPartyName : (user.value?.full_name ?? 'Me'),
    event: 0,
    event_title: '',
    message_type: 'direct',
    message_type_display: 'Direct',
    title: String(raw.title ?? '').trim(),
    content: String(raw.content ?? '').trim(),
    card_image_url: '',
    card_pdf_url: '',
    media_url: '',
    is_read: Boolean(raw.is_read),
    read_at: null,
    created_at: String(raw.created_at ?? new Date().toISOString()),
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

/** Map API conversation item to Conversation (for left list). Supports partner_* and other_* shapes. */
function mapInboxConversationItemToConversation(item: InboxConversationItem): Conversation {
  const otherId =
    Number(
      item.partner_id ??
        item.other_user_id ??
        item.other_party_id
    ) ?? 0
  const otherName =
    String(
      item.partner_name ??
        item.other_user_name ??
        item.other_party_name ??
        'Unknown'
    ).trim() || 'Unknown'
  const lastIso = String(
    item.last_message_time ??
      item.last_message_at ??
      item.last_created_at ??
      ''
  )
  const rawMessages = (item.messages ?? []) as InboxMessage[]
  const sorted = [...rawMessages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const last = sorted[0]
  const unreadCount = Number(item.unread_count) ?? 0
  return {
    otherPartyId: otherId,
    otherPartyName: otherName,
    lastMessage: String(item.last_message ?? last?.content ?? last?.title ?? '—').trim() || '—',
    lastTime: formatTime(lastIso || last?.created_at) || '',
    lastIso: lastIso || last?.created_at || '',
    unreadCount,
    messages: sorted.reverse(),
  }
}

async function loadInbox() {
  if (route.name === 'messages' && !inboxConversationsFromApi.value && inboxMessages.value.length === 0)
    inboxInitialLoad.value = true
  inboxLoading.value = true
  try {
    const [res, unreadRes, convRes] = await Promise.all([
      fetchInbox({ page: 1 }),
      fetchInboxUnreadCount().catch(() => ({ count: 0 })),
      fetchInboxConversations().catch(() => null),
    ])
    inboxMessages.value = res.results ?? []
    inboxUnreadCount.value = unreadRes?.count ?? 0
    const rawConv = convRes == null ? null : Array.isArray(convRes) ? convRes : (convRes as { results?: InboxConversationItem[] }).results
    if (rawConv && Array.isArray(rawConv) && rawConv.length > 0) {
      inboxConversationsFromApi.value = rawConv as InboxConversationItem[]
    } else {
      inboxConversationsFromApi.value = null
    }
  } catch {
    inboxMessages.value = []
    inboxUnreadCount.value = 0
    inboxConversationsFromApi.value = null
  } finally {
    inboxLoading.value = false
    inboxInitialLoad.value = false
  }
}

async function loadMyEvents() {
  eventsListLoading.value = true
  try {
    const res = await fetchMyEvents()
    myEvents.value = res.results ?? []
    const events = myEvents.value
    if (events.length > 0) {
      const counts = await Promise.all(
        events.map((ev) =>
          fetchEventChatUnread(ev.id).catch(() => ({ count: 0 }))
        )
      )
      const next: Record<number, number> = {}
      events.forEach((ev, i) => {
        next[ev.id] = counts[i]?.count ?? 0
      })
      eventChatUnreadCounts.value = next
    } else {
      eventChatUnreadCounts.value = {}
    }
  } catch {
    myEvents.value = []
    eventChatUnreadCounts.value = {}
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

/** True when we're on /messages (inbox page). */
const isInboxPage = computed(() => route.name === 'messages')

/** Inbox messages that are personal (direct) – no event or event 0. */
const personalInboxMessages = computed(() =>
  inboxMessages.value.filter((m) => !m.event || m.event === 0)
)

/** Build conversations from inbox messages: group by other party. Used for Personal filter. */
function buildConversationsFromMessages(messages: InboxMessage[]): Conversation[] {
  const myId = currentUserId.value
  const map = new Map<number, { name: string; messages: InboxMessage[] }>()
  for (const msg of messages) {
    const isFromMe = (msg.sender ?? msg.sender_id) === myId
    const otherId = isFromMe ? msg.recipient_id : (msg.sender_id ?? msg.sender)
    const otherName = isFromMe ? msg.recipient_name : (msg.sender_name || 'Unknown')
    if (!map.has(otherId)) map.set(otherId, { name: otherName, messages: [] })
    map.get(otherId)!.messages.push(msg)
  }
  const list: Conversation[] = []
  map.forEach((val, otherPartyId) => {
    const sorted = [...val.messages].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const last = sorted[0]
    const unreadCount = val.messages.filter((m) => !m.is_read && (m.sender ?? m.sender_id) !== myId).length
    list.push({
      otherPartyId,
      otherPartyName: val.name,
      lastMessage: last?.content?.trim() || last?.title || '—',
      lastTime: formatTime(last?.created_at) || '',
      lastIso: last?.created_at || '',
      unreadCount,
      messages: sorted.reverse(),
    })
  })
  list.sort((a, b) => new Date(b.lastIso).getTime() - new Date(a.lastIso).getTime())
  return list
}

const conversations = computed((): Conversation[] => buildConversationsFromMessages(inboxMessages.value))

/** Personal (direct) conversations – from GET inbox/conversations/ when available, else from inbox messages. */
const personalConversations = computed((): Conversation[] => {
  const fromApi = inboxConversationsFromApi.value
  if (fromApi && fromApi.length > 0) {
    return fromApi
      .map(mapInboxConversationItemToConversation)
      .filter((c) => c.otherPartyId > 0)
      .sort((a, b) => new Date(b.lastIso).getTime() - new Date(a.lastIso).getTime())
  }
  return buildConversationsFromMessages(personalInboxMessages.value)
})

/** Conversations for Personal filter, filtered by search. */
const filteredConversations = computed(() => {
  let list = personalConversations.value
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (c) =>
        c.otherPartyName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    )
  }
  return list
})

/** Currently selected conversation (for right panel) – only when Personal filter. */
const selectedConversation = computed(() => {
  if (inboxFilter.value !== 'personal') return null
  const id = selectedConversationKey.value
  if (id == null) return null
  return personalConversations.value.find((c) => c.otherPartyId === id) ?? null
})

/** True when we should show the personal chat right panel (existing convo or opened by ?open= for new convo). */
const showPersonalChatPanel = computed(
  () =>
    inboxFilter.value === 'personal' &&
    selectedConversationKey.value != null &&
    (selectedConversation.value != null || pendingOpenConversation.value != null)
)

/** Display name for the open conversation (from list or from ?name= for new convo). */
const openConversationDisplayName = computed(
  () =>
    selectedConversation.value?.otherPartyName ??
    pendingOpenConversation.value?.displayName ??
    'Unknown'
)

/** Messages to show in the right panel for the selected conversation (from DM API when loaded, else from inbox list). */
const selectedConversationMessages = computed(() => {
  const key = selectedConversationKey.value
  if (key == null) return []
  if (dmThreadForUserId.value === key && !dmThreadLoading.value) return dmThreadMessages.value
  return selectedConversation.value?.messages ?? []
})

/** Event selected in Event Chat filter (for right panel). */
const selectedEventForChat = computed(() => {
  const id = selectedEventIdForChat.value
  if (id == null) return null
  return myEvents.value.find((e) => e.id === id) ?? null
})

function applyOpenQuery() {
  if (route.name !== 'messages') return
  const open = route.query.open
  if (open == null) return
  const uid = Number(open)
  if (!Number.isFinite(uid) || uid < 1) return
  inboxFilter.value = 'personal'
  selectedConversationKey.value = uid
  const name = typeof route.query.name === 'string' ? route.query.name.trim() : ''
  pendingOpenConversation.value = { userId: uid, displayName: name || 'Unknown' }
}

onMounted(() => {
  // When opened from an event (/events/:id/chat), focus Event Chat tab and pre-select that event.
  if (eventId.value) {
    activeTab.value = 'event'
    inboxFilter.value = 'event'
    selectedEventIdForChat.value = eventId.value
  }
  if (route.name === 'messages') inboxInitialLoad.value = true
  load().then(() => applyOpenQuery())
})
watch(
  () => [route.params.id, route.name, route.query.open],
  () => {
    if (eventId.value) {
      activeTab.value = 'event'
      inboxFilter.value = 'event'
      selectedEventIdForChat.value = eventId.value
    }
    if (route.name === 'messages') inboxInitialLoad.value = true
    load().then(() => applyOpenQuery())
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

/** Local date key YYYY-MM-DD for grouping messages by day. */
function getDateKey(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return ''
  }
}

/** Display label for a date: "Today", "Yesterday", or formatted date (e.g. 2/6/2026). */
function getDateLabel(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const today = new Date()
    const key = getDateKey(iso)
    const todayKey = getDateKey(today.toISOString())
    if (key === todayKey) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = getDateKey(yesterday.toISOString())
    if (key === yesterdayKey) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
  } catch {
    return iso || ''
  }
}

/** Group messages by date (oldest first), with centered date labels. */
function groupMessagesByDate(msgs: ChatMessage[]): { dateLabel: string; dateKey: string; messages: ChatMessage[] }[] {
  if (!msgs.length) return []
  const sorted = [...msgs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const map = new Map<string, ChatMessage[]>()
  for (const msg of sorted) {
    const key = getDateKey(msg.created_at) || 'unknown'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(msg)
  }
  return Array.from(map.entries()).map(([dateKey, messages]) => ({
    dateKey,
    dateLabel: getDateLabel(messages[0]?.created_at) || dateKey,
    messages,
  }))
}

const eventChatMessagesGroupedByDate = computed(() =>
  groupMessagesByDate(eventChatMessages.value)
)

const messagesGroupedByDate = computed(() => groupMessagesByDate(messages.value))

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
    router.push({ name: 'event-public', params: { id: String(eventId.value) } })
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

/** Load DM thread from GET conversation API when a Personal conversation is selected. */
async function loadDmConversation(userId: number) {
  const conv = personalConversations.value.find((c) => c.otherPartyId === userId)
  const otherName = conv?.otherPartyName ?? 'Unknown'
  dmThreadForUserId.value = userId
  dmThreadLoading.value = true
  dmThreadMessages.value = []
  inboxError.value = null
  try {
    const data = await fetchConversation(userId)
    const rawList = Array.isArray(data) ? data : (data?.results ?? []) as ConversationMessage[]
    dmThreadMessages.value = rawList
      .map((m) => normalizeConversationMessage(m, userId, otherName))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  } catch (e) {
    inboxError.value = e instanceof Error ? e.message : 'Failed to load conversation'
    dmThreadMessages.value = []
  } finally {
    dmThreadLoading.value = false
  }
}

/** Mark conversation as read when opening it (Personal); mark inbox messages read; load DM thread from API. */
watch(selectedConversationKey, (key) => {
  if (key == null) {
    dmThreadForUserId.value = null
    dmThreadMessages.value = []
    pendingOpenConversation.value = null
    return
  }
  if (inboxFilter.value === 'personal') {
    markConversationRead(key).catch(() => {})
    const conv = personalConversations.value.find((c) => c.otherPartyId === key)
    if (conv) {
      pendingOpenConversation.value = null
      conv.messages
        .filter((m) => !m.is_read && (m.sender ?? m.sender_id) !== currentUserId.value)
        .forEach((m) => markInboxRead(m.id).catch(() => {}))
      fetchInboxUnreadCount().then((r) => { inboxUnreadCount.value = r.count }).catch(() => {})
    }
    inboxError.value = null
    loadDmConversation(key)
  }
})

/** Load event chat messages and room when an event is selected in Event Chat filter (chat API). */
async function loadEventChatForInbox() {
  const eid = selectedEventIdForChat.value
  if (!eid) {
    eventChatMessages.value = []
    eventChatRoom.value = null
    return
  }
  eventChatLoading.value = true
  eventChatError.value = null
  try {
    const [listRes, roomRes] = await Promise.all([
      (async () => {
        try {
          const list = await fetchEventMessages(eid)
          return { list, next: null }
        } catch {
          const res = await fetchEventChatMessages(eid, { limit: 200 })
          return { list: res.results ?? [], next: res.next }
        }
      })(),
      fetchEventChatRoom(eid).catch(() => null),
    ])
    const list = (listRes as { list: unknown[]; next: string | null }).list
    const next = (listRes as { list: unknown[]; next: string | null }).next
    eventChatMessages.value = list.map((raw) => normalizeMessage(raw, eid))
    eventChatRoom.value = roomRes
    eventChatNextPage.value = next ? 2 : null
    await markEventChatRead(eid).catch(() => {})
    eventChatUnreadCounts.value = { ...eventChatUnreadCounts.value, [eid]: 0 }
  } catch (e) {
    eventChatError.value = e instanceof Error ? e.message : 'Failed to load chat'
    eventChatMessages.value = []
    eventChatRoom.value = null
    eventChatNextPage.value = null
  } finally {
    eventChatLoading.value = false
  }
}

/** Load older event chat messages (paginate). */
async function loadEventChatOlder() {
  const eid = selectedEventIdForChat.value
  const page = eventChatNextPage.value
  if (!eid || page == null || eventChatLoadingOlder.value) return
  eventChatLoadingOlder.value = true
  try {
    const res = await fetchEventChatMessages(eid, { page, limit: 100 })
    const older = (res.results ?? []).map((raw) => normalizeMessage(raw, eid))
    eventChatMessages.value = [...older, ...eventChatMessages.value]
    eventChatNextPage.value = res.next ? page + 1 : null
  } catch {
    // leave eventChatNextPage as is so user can retry
  } finally {
    eventChatLoadingOlder.value = false
  }
}

/** Load newer event chat messages (since_id). */
async function loadEventChatNewer() {
  const eid = selectedEventIdForChat.value
  if (!eid || eventChatLoadingNewer.value) return
  const maxId = eventChatMessages.value.length
    ? Math.max(...eventChatMessages.value.map((m) => m.id))
    : 0
  if (maxId === 0) return
  eventChatLoadingNewer.value = true
  try {
    const res = await fetchEventChatMessages(eid, { since_id: maxId, limit: 100 })
    const newer = (res.results ?? []).map((raw) => normalizeMessage(raw, eid))
    if (newer.length > 0) {
      eventChatMessages.value = [...eventChatMessages.value, ...newer]
      await markEventChatRead(eid).catch(() => {})
      eventChatUnreadCounts.value = { ...eventChatUnreadCounts.value, [eid]: 0 }
    }
  } catch {
    // ignore
  } finally {
    eventChatLoadingNewer.value = false
  }
}

watch(selectedEventIdForChat, (eid) => {
  if (eid != null) loadEventChatForInbox()
  else {
    eventChatMessages.value = []
    eventChatError.value = null
    eventChatNextPage.value = null
    eventChatRoom.value = null
  }
})

/** Send message in Event Chat right panel (chat API). */
async function sendEventChatFromInbox() {
  const eid = selectedEventIdForChat.value
  const text = eventChatInputText.value.trim()
  if (!eid || !text || sendingEventChat.value) return
  sendingEventChat.value = true
  eventChatInputText.value = ''
  eventChatError.value = null
  try {
    const sent = await sendEventChatMessage(eid, { content: text })
    eventChatMessages.value = [...eventChatMessages.value, sent]
  } catch (e) {
    eventChatError.value = e instanceof Error ? e.message : 'Failed to send'
    eventChatInputText.value = text
  } finally {
    sendingEventChat.value = false
  }
}

function clearEventChatSelection() {
  selectedEventIdForChat.value = null
}

/** Send a direct message in the selected inbox conversation. */
async function sendInboxMessage() {
  const text = inboxReplyText.value.trim()
  const recipientId = selectedConversationKey.value
  if (!text || recipientId == null || sendingInbox.value) return
  sendingInbox.value = true
  inboxError.value = null
  inboxReplyText.value = ''
  try {
    await sendDirectMessage({
      recipient_id: recipientId,
      title: '',
      content: text,
    })
    await loadInbox()
    if (dmThreadForUserId.value === recipientId) await loadDmConversation(recipientId)
    await nextTick()
    if (inboxListRef.value) {
      const scrollParent = inboxListRef.value.parentElement
      if (scrollParent) scrollParent.scrollTop = scrollParent.scrollHeight
    }
  } catch (e) {
    inboxError.value = e instanceof Error ? e.message : 'Failed to send'
    inboxReplyText.value = text
  } finally {
    sendingInbox.value = false
  }
}

function clearInboxSelection() {
  selectedConversationKey.value = null
  pendingOpenConversation.value = null
}

/** Mark all inbox messages as read (POST inbox/mark_all_read/). */
const markingAllRead = ref(false)
async function markAllReadInbox() {
  if (markingAllRead.value) return
  markingAllRead.value = true
  try {
    await markAllInboxRead()
    await loadInbox()
  } catch {
    // ignore
  } finally {
    markingAllRead.value = false
  }
}
</script>

<template>
  <div class="chat-page">
    <WebNavbar />
    <!-- WhatsApp-style two-panel inbox at /messages -->
    <template v-if="isInboxPage">
      <!-- Show only loading until inbox is ready, then show inbox (no flash of empty layout) -->
      <Teleport to="body">
        <Transition name="inbox-loading-fade">
          <div
            v-if="inboxInitialLoad"
            class="inbox-loading-overlay"
            aria-live="polite"
            aria-busy="true"
          >
            <div class="inbox-loading-modal">
              <div class="inbox-loading-spinner" />
              <p class="inbox-loading-text">Loading inbox…</p>
              <p class="inbox-loading-hint">Fetching your conversations</p>
            </div>
          </div>
        </Transition>
      </Teleport>
      <main v-show="!inboxInitialLoad" class="inbox-outer">
        <div class="inbox-whatsapp-layout" :class="{ 'inbox-mobile-chat-open': showPersonalChatPanel || selectedEventForChat }">
        <aside class="inbox-left-panel">
          <header class="inbox-left-header">
            <h2 class="inbox-app-title">Inbox</h2>
            <button
              v-if="inboxUnreadCount > 0"
              type="button"
              class="inbox-mark-all-read"
              :disabled="markingAllRead"
              @click="markAllReadInbox"
            >
              {{ markingAllRead ? '…' : 'Mark all read' }}
            </button>
          </header>
          <div class="inbox-search-wrap">
            <span class="inbox-search-icon" aria-hidden="true">🔍</span>
            <input
              v-model="searchQuery"
              type="search"
              class="inbox-search-input"
              placeholder="Search or start a new chat"
              aria-label="Search or start a new chat"
            />
          </div>
          <div class="inbox-filters">
            <button
              type="button"
              class="inbox-filter-btn"
              :class="{ active: inboxFilter === 'personal' }"
              @click="inboxFilter = 'personal'; selectedEventIdForChat = null"
            >
              Personal
            </button>
            <button
              type="button"
              class="inbox-filter-btn"
              :class="{ active: inboxFilter === 'event' }"
              @click="inboxFilter = 'event'; selectedConversationKey = null"
            >
              Event Chat
            </button>
          </div>
          <!-- Personal: conversation list from inbox API -->
          <template v-if="inboxFilter === 'personal'">
            <div v-if="inboxLoading && inboxMessages.length === 0" class="inbox-state">
              <p>Loading…</p>
            </div>
            <ul v-else-if="filteredConversations.length === 0" class="inbox-conv-list">
              <li class="inbox-conv-empty">
                <span class="inbox-conv-empty-title">No conversations yet</span>
                <p class="inbox-conv-empty-hint">Direct messages will show up here. Start a conversation from an event or browse events.</p>
                <router-link to="/events" class="inbox-conv-empty-cta">Browse events</router-link>
              </li>
            </ul>
            <ul v-else class="inbox-conv-list">
              <li
                v-for="conv in filteredConversations"
                :key="conv.otherPartyId"
                class="inbox-conv-item"
                :class="{ selected: selectedConversationKey === conv.otherPartyId }"
                @click="selectedConversationKey = conv.otherPartyId"
              >
                <span class="inbox-conv-avatar">{{ (conv.otherPartyName || '?').charAt(0).toUpperCase() }}</span>
                <div class="inbox-conv-body">
                  <span class="inbox-conv-name">{{ conv.otherPartyName }}</span>
                  <p class="inbox-conv-preview">{{ conv.lastMessage }}</p>
                </div>
                <div class="inbox-conv-meta">
                  <span class="inbox-conv-time">{{ conv.lastTime }}</span>
                  <span v-if="conv.unreadCount > 0" class="inbox-conv-unread">{{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}</span>
                </div>
              </li>
            </ul>
          </template>
          <!-- Event Chat: event list (chat API per event) -->
          <template v-else>
            <div v-if="eventsListLoading && myEvents.length === 0" class="inbox-state">
              <p>Loading events…</p>
            </div>
            <ul v-else-if="myEvents.length === 0" class="inbox-conv-list">
              <li class="inbox-conv-empty">
                <span class="inbox-conv-empty-title">No events yet</span>
                <p class="inbox-conv-empty-hint">Join or create an event to see event chats here.</p>
                <router-link to="/events" class="inbox-conv-empty-cta">Browse events</router-link>
              </li>
            </ul>
            <ul v-else class="inbox-conv-list">
              <li
                v-for="ev in myEvents"
                :key="ev.id"
                class="inbox-conv-item"
                :class="{ selected: selectedEventIdForChat === ev.id }"
                @click="selectedEventIdForChat = ev.id"
              >
                <span class="inbox-conv-avatar inbox-conv-avatar-img">
                  <img v-if="ev.cover_image" :src="assetUrl(ev.cover_image)" :alt="ev.title" />
                  <span v-else>{{ (ev.title || '?').charAt(0).toUpperCase() }}</span>
                </span>
                <div class="inbox-conv-body">
                  <span class="inbox-conv-name">{{ ev.title }}</span>
                  <p class="inbox-conv-preview">Event chat</p>
                </div>
                <div class="inbox-conv-meta">
                  <span v-if="eventChatUnreadCounts[ev.id]" class="inbox-conv-unread">{{ (eventChatUnreadCounts[ev.id] ?? 0) > 99 ? '99+' : eventChatUnreadCounts[ev.id] }}</span>
                </div>
              </li>
            </ul>
          </template>
        </aside>
        <section class="inbox-right-panel" :class="{ 'has-chat': showPersonalChatPanel || selectedEventForChat }">
          <template v-if="inboxFilter === 'personal' && !showPersonalChatPanel">
            <div class="inbox-right-empty">
              <span class="inbox-right-empty-icon">💬</span>
              <p class="inbox-right-empty-title">Select a chat to start messaging</p>
              <p class="inbox-right-empty-hint">Direct messages with other users.</p>
              <router-link to="/events" class="inbox-right-empty-cta">Browse events</router-link>
            </div>
          </template>
          <template v-else-if="inboxFilter === 'event' && !selectedEventForChat">
            <div class="inbox-right-empty">
              <span class="inbox-right-empty-icon">📅</span>
              <p class="inbox-right-empty-title">Select an event to open its chat</p>
              <p class="inbox-right-empty-hint">Event chats are grouped by event.</p>
              <router-link to="/events" class="inbox-right-empty-cta">Browse events</router-link>
            </div>
          </template>
          <template v-else-if="inboxFilter === 'personal' && showPersonalChatPanel">
            <header class="inbox-chat-header">
              <button type="button" class="inbox-chat-back-mobile" aria-label="Back to list" @click="clearInboxSelection">←</button>
              <span class="inbox-chat-avatar">{{ (openConversationDisplayName || '?').charAt(0).toUpperCase() }}</span>
              <div class="inbox-chat-header-info">
                <span class="inbox-chat-name">{{ openConversationDisplayName }}</span>
              </div>
            </header>
            <div v-if="inboxError" class="inbox-chat-error" role="alert">{{ inboxError }}</div>
            <div v-if="dmThreadLoading && selectedConversationMessages.length === 0" class="inbox-state">
              <p>Loading conversation…</p>
            </div>
            <div class="inbox-chat-bg">
              <div class="inbox-chat-day-sep">Today</div>
              <ul ref="inboxListRef" class="inbox-message-list" role="list">
                <li
                  v-for="msg in selectedConversationMessages"
                  :key="msg.id"
                  class="inbox-msg-row"
                  :class="{ me: isInboxFromMe(msg) }"
                  role="listitem"
                >
                  <div class="inbox-bubble-wrap" :class="{ me: isInboxFromMe(msg) }">
                    <div class="inbox-bubble">
                      <span class="inbox-bubble-content">{{ msg.content || msg.title || '—' }}</span>
                      <span class="inbox-bubble-time">{{ formatTime(msg.created_at) }}</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <footer class="inbox-chat-footer">
              <input
                v-model="inboxReplyText"
                type="text"
                class="inbox-chat-input"
                placeholder="Type a message"
                :disabled="sendingInbox"
                aria-label="Message input"
                @keydown.enter.prevent="sendInboxMessage"
              />
              <button
                type="button"
                class="inbox-send-btn"
                aria-label="Send"
                :disabled="!inboxReplyText.trim() || sendingInbox"
                @click="sendInboxMessage"
              >
                <span v-if="sendingInbox" class="inbox-send-spinner" />
                <span v-else>➤</span>
              </button>
            </footer>
          </template>
          <!-- Event Chat right panel: event messages (chat API) -->
          <template v-else-if="inboxFilter === 'event' && selectedEventForChat">
            <header class="inbox-chat-header">
              <button type="button" class="inbox-chat-back" aria-label="Back to list" @click="clearEventChatSelection">←</button>
              <span class="inbox-chat-avatar inbox-chat-avatar-img">
                <img v-if="selectedEventForChat.cover_image" :src="assetUrl(selectedEventForChat.cover_image)" :alt="selectedEventForChat.title" />
                <span v-else>{{ (selectedEventForChat.title || '?').charAt(0).toUpperCase() }}</span>
              </span>
              <div class="inbox-chat-header-info">
                <span class="inbox-chat-name">{{ selectedEventForChat.title }}</span>
              </div>
            </header>
            <div v-if="eventChatError" class="inbox-chat-error" role="alert">{{ eventChatError }}</div>
            <div class="inbox-chat-bg">
<div v-if="eventChatLoading && eventChatMessages.length === 0" class="inbox-state">
              <p>Loading chat…</p>
              </div>
              <template v-else>
                <div v-if="eventChatNextPage != null" class="inbox-load-older">
                  <button
                    type="button"
                    class="inbox-load-older-btn"
                    :disabled="eventChatLoadingOlder"
                    @click="loadEventChatOlder"
                  >
                    {{ eventChatLoadingOlder ? 'Loading…' : 'Load older messages' }}
                  </button>
                </div>
                <template v-for="group in eventChatMessagesGroupedByDate" :key="group.dateKey">
                  <div class="inbox-chat-day-sep">{{ group.dateLabel }}</div>
                  <ul class="inbox-message-list" role="list">
                    <li
                      v-for="msg in group.messages"
                      :key="msg.id"
                      class="inbox-msg-row"
                      :class="{ me: isMe(msg) }"
                      role="listitem"
                    >
                      <div class="inbox-bubble-wrap" :class="{ me: isMe(msg) }">
                        <div class="inbox-bubble">
                          <span class="inbox-bubble-content">{{ msg.content || '—' }}</span>
                          <span class="inbox-bubble-time">{{ formatTime(msg.created_at) }}</span>
                        </div>
                      </div>
                    </li>
                  </ul>
                </template>
                <div v-if="eventChatMessages.length > 0" class="inbox-load-newer">
                  <button
                    type="button"
                    class="inbox-load-newer-btn"
                    :disabled="eventChatLoadingNewer"
                    @click="loadEventChatNewer"
                  >
                    {{ eventChatLoadingNewer ? 'Loading…' : 'Load newer messages' }}
                  </button>
                </div>
              </template>
            </div>
            <footer class="inbox-chat-footer">
              <input
                v-model="eventChatInputText"
                type="text"
                class="inbox-chat-input"
                placeholder="Type a message"
                :disabled="sendingEventChat"
                aria-label="Message input"
                @keydown.enter.prevent="sendEventChatFromInbox"
              />
              <button
                type="button"
                class="inbox-send-btn"
                aria-label="Send"
                :disabled="!eventChatInputText.trim() || sendingEventChat"
                @click="sendEventChatFromInbox"
              >
                <span v-if="sendingEventChat" class="inbox-send-spinner" />
                <span v-else>➤</span>
              </button>
            </footer>
          </template>
        </section>
        </div>
      </main>
    </template>
    <!-- Original layout for event chat -->
    <main v-else class="chat-main">
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
            <template v-for="group in messagesGroupedByDate" :key="group.dateKey">
              <li class="chat-day-sep-li" role="presentation">
                <span class="chat-day-sep">{{ group.dateLabel }}</span>
              </li>
              <li
                v-for="msg in group.messages"
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
            </template>
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
            <button
              v-if="inboxUnreadCount > 0"
              type="button"
              class="mark-all-read-link"
              :disabled="markingAllRead"
              @click="markAllReadInbox"
            >
              {{ markingAllRead ? '…' : 'Mark all read' }}
            </button>
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
              <template v-for="group in messagesGroupedByDate" :key="group.dateKey">
                <li class="chat-day-sep-li" role="presentation">
                  <span class="chat-day-sep">{{ group.dateLabel }}</span>
                </li>
                <li
                  v-for="msg in group.messages"
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
              </template>
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
  background: #fff;
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
  background: #fff;
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
  background: #fff;
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
  background: #fff;
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
.chat-day-sep-li {
  list-style: none;
  margin: 8px 0 4px;
  padding: 0;
  display: flex;
  justify-content: center;
  width: 100%;
}
.chat-day-sep {
  display: inline-block;
  width: fit-content;
  font-size: 12px;
  color: #667781;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 8px;
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

/* ========== WhatsApp-style inbox layout (/messages) ========== */
/* Push content below fixed navbar (navbar is ~52px + padding). Layout uses full width so chat panel occupies max space. */
.inbox-outer {
  flex: 1;
  display: flex;
  align-items: stretch;
  min-height: 0;
  background: #f3f4f6;
  padding: 0;
  padding-top: 72px;
  width: 100%;
}

.inbox-whatsapp-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  max-width: 100%;
  width: 100%;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.08);
}

.inbox-left-panel {
  width: 320px;
  min-width: 280px;
  max-width: 380px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #fff;
  flex-shrink: 0;
}

.inbox-left-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f0f2f5;
  border-bottom: 1px solid #e5e7eb;
}

.inbox-app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}
.inbox-mark-all-read {
  margin-left: auto;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #25d366;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.inbox-mark-all-read:hover:not(:disabled) {
  background: rgba(37, 211, 102, 0.15);
}
.inbox-mark-all-read:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.mark-all-read-link {
  margin-left: 8px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #1a283b;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}
.mark-all-read-link:hover:not(:disabled) {
  color: #0f172a;
}
.mark-all-read-link:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.inbox-app-tagline {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.3;
}

.inbox-left-actions {
  display: flex;
  gap: 4px;
}

.inbox-header-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  color: #54656f;
  cursor: pointer;
}

.inbox-header-icon:hover {
  background: rgba(0, 0, 0, 0.06);
}

.inbox-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 12px;
  padding: 8px 12px;
  background: #f0f2f5;
  border-radius: 8px;
}

.inbox-search-icon {
  font-size: 14px;
  opacity: 0.7;
}

.inbox-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}

.inbox-search-input::placeholder {
  color: #667781;
}

.inbox-filters {
  display: flex;
  gap: 4px;
  padding: 0 12px 8px;
}

.inbox-filter-btn {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #667781;
  background: transparent;
  border: none;
  border-radius: 18px;
  cursor: pointer;
}

.inbox-filter-btn:hover {
  background: #f0f2f5;
  color: #111827;
}

.inbox-filter-btn.active {
  background: #25d366;
  color: #fff;
}

.inbox-conv-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0;
}

.inbox-conv-empty {
  padding: 32px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.inbox-conv-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.inbox-conv-empty-hint {
  margin: 0;
  font-size: 14px;
  color: #667781;
  max-width: 260px;
  line-height: 1.4;
}

.inbox-conv-empty-cta {
  display: inline-block;
  margin-top: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #25d366;
  border-radius: 24px;
  text-decoration: none;
}

.inbox-conv-empty-cta:hover {
  background: #20bd5a;
}

.inbox-conv-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f2f5;
}

.inbox-conv-item:hover {
  background: #f5f6f6;
}

.inbox-conv-item.selected {
  background: #f0f2f5;
}

.inbox-conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #dfe5e8;
  color: #54656f;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.inbox-conv-avatar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.inbox-conv-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inbox-conv-name {
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inbox-conv-preview {
  margin: 0;
  font-size: 14px;
  color: #667781;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  line-clamp: 1;
}

.inbox-conv-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.inbox-conv-time {
  font-size: 12px;
  color: #667781;
}

.inbox-conv-unread {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #25d366;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inbox-right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #efeae2;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1c4b8' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.inbox-right-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
}

.inbox-right-empty-icon {
  font-size: 64px;
  opacity: 0.5;
}

.inbox-right-empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.inbox-right-empty-hint {
  margin: 0;
  font-size: 14px;
  color: #667781;
  max-width: 280px;
}

.inbox-right-empty-cta {
  display: inline-block;
  margin-top: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #25d366;
  border-radius: 24px;
  text-decoration: none;
}

.inbox-right-empty-cta:hover {
  background: #20bd5a;
}

.inbox-chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #f0f2f5;
  border-left: 1px solid #e5e7eb;
}

.inbox-chat-back-mobile {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  color: #54656f;
  cursor: pointer;
  flex-shrink: 0;
}
.inbox-chat-back-mobile:hover {
  background: rgba(0, 0, 0, 0.06);
}

.inbox-chat-error {
  padding: 8px 16px;
  font-size: 13px;
  color: #b91c1c;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
}

.inbox-chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #dfe5e8;
  color: #54656f;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.inbox-chat-avatar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.inbox-chat-header-info {
  flex: 1;
  min-width: 0;
}

.inbox-chat-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.inbox-chat-header-actions {
  display: flex;
  gap: 4px;
}

.inbox-chat-bg {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inbox-chat-day-sep {
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  margin: 8px auto 4px;
  align-self: center;
  font-size: 12px;
  color: #667781;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.inbox-message-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inbox-msg-row {
  display: flex;
  justify-content: flex-start;
}

.inbox-msg-row.me {
  justify-content: flex-end;
}

.inbox-bubble-wrap {
  max-width: 65%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.inbox-bubble-wrap.me {
  align-items: flex-end;
}

.inbox-bubble {
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inbox-bubble-wrap:not(.me) .inbox-bubble {
  background: #fff;
  border-top-left-radius: 2px;
}

.inbox-bubble-wrap.me .inbox-bubble {
  background: #d9fdd3;
  border-top-right-radius: 2px;
}

.inbox-bubble-content {
  font-size: 14px;
  color: #111827;
  word-break: break-word;
  white-space: pre-wrap;
}

.inbox-bubble-time {
  font-size: 11px;
  color: #667781;
  align-self: flex-end;
}

.inbox-chat-footer {
  padding: 8px 16px 16px;
  background: #f0f2f5;
  border-left: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
}

.inbox-chat-input {
  flex: 1;
  padding: 10px 16px;
  font-size: 15px;
  border: none;
  border-radius: 24px;
  background: #fff;
  outline: none;
}

.inbox-send-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #25d366;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.inbox-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.inbox-send-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: login-spin 0.6s linear infinite;
}

/* Inbox initial loading overlay */
.inbox-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.inbox-loading-modal {
  background: #fff;
  border-radius: 16px;
  padding: 32px 40px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 260px;
}
.inbox-loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e5e7eb;
  border-top-color: #25d366;
  border-radius: 50%;
  animation: inbox-load-spin 0.8s linear infinite;
}
@keyframes inbox-load-spin {
  to { transform: rotate(360deg); }
}
.inbox-loading-text {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}
.inbox-loading-hint {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}
.inbox-loading-fade-enter-active,
.inbox-loading-fade-leave-active {
  transition: opacity 0.2s ease;
}
.inbox-loading-fade-enter-from,
.inbox-loading-fade-leave-to {
  opacity: 0;
}

.inbox-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-size: 14px;
  color: #667781;
}
.inbox-load-older,
.inbox-load-newer {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
.inbox-load-older-btn,
.inbox-load-newer-btn {
  padding: 6px 14px;
  font-size: 13px;
  color: #25d366;
  background: transparent;
  border: 1px solid #25d366;
  border-radius: 8px;
  cursor: pointer;
}
.inbox-load-older-btn:hover:not(:disabled),
.inbox-load-newer-btn:hover:not(:disabled) {
  background: rgba(37, 211, 102, 0.1);
}
.inbox-load-older-btn:disabled,
.inbox-load-newer-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive: mobile – back button to list, single panel when chat open */
@media (max-width: 768px) {
  .inbox-left-panel {
    max-width: none;
  }

  .inbox-chat-back-mobile {
    display: flex;
  }

  .inbox-whatsapp-layout .inbox-right-panel:not(.has-chat) {
    display: none;
  }

  .inbox-whatsapp-layout.inbox-mobile-chat-open .inbox-left-panel {
    display: none;
  }
}
</style>
