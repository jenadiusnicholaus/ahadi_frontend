/**
 * Chat API – GET /api/v1/chat/events/{event_id}/
 * Event chat: messages (list/send), room details, mark read, unread count.
 */

import { get, getWithAuth, post } from './client'
import { getChatPrefix } from '@/api/env'

const chatPath = (suffix: string) => `${getChatPrefix()}/${suffix}`

// --- Types (from Swagger schema) ---

export interface ChatMessage {
  id: number
  event: number
  sender: number
  sender_name: string
  sender_phone: string
  content: string
  message_type: string
  created_at: string
  updated_at: string
  is_deleted: boolean
  is_read: string
}

export interface PaginatedChatMessagesResponse {
  count: number
  next: string | null
  previous: string | null
  results: ChatMessage[]
}

export interface ChatRoom {
  id: number
  event_id: number
  event_title: string
  created_at: string
  is_active: boolean
  participant_count: string
  message_count: string
}

export interface SendChatMessagePayload {
  content: string
  is_deleted?: boolean
  [key: string]: unknown
}

export interface ChatMessagesParams {
  page?: number
  since_id?: number
  since_timestamp?: string
  limit?: number
}

// --- Endpoints ---

/**
 * GET /api/v1/chat/events/{event_id}/messages/
 * Get chat message history for an event.
 * Params: page, since_id, since_timestamp, limit (default 100, max 200).
 */
export function fetchEventChatMessages(
  eventId: number,
  params?: ChatMessagesParams
): Promise<PaginatedChatMessagesResponse> {
  const search: Record<string, string> = {}
  if (params?.page != null) search.page = String(params.page)
  if (params?.since_id != null) search.since_id = String(params.since_id)
  if (params?.since_timestamp != null) search.since_timestamp = params.since_timestamp
  if (params?.limit != null) search.limit = String(params.limit)
  return getWithAuth<PaginatedChatMessagesResponse>(
    `chat/events/${eventId}/messages/`,
    Object.keys(search).length ? search : undefined
  )
}

/**
 * POST /api/v1/chat/events/{event_id}/messages/
 * Send a new message to the event chat (also broadcasts to WebSocket).
 * Body: { content, is_deleted? }
 */
export function sendEventChatMessage(
  eventId: number,
  payload: SendChatMessagePayload
): Promise<ChatMessage> {
  return post<ChatMessage>(chatPath(`events/${eventId}/messages/`), payload)
}

/**
 * POST /api/v1/chat/events/{event_id}/read/
 * Mark all messages in the chat room as read.
 */
export function markEventChatRead(eventId: number): Promise<unknown> {
  return post<unknown>(chatPath(`events/${eventId}/read/`), {})
}

/**
 * GET /api/v1/chat/events/{event_id}/room/
 * Get chat room details for an event.
 */
export function fetchEventChatRoom(eventId: number): Promise<ChatRoom> {
  return getWithAuth<ChatRoom>(chatPath(`events/${eventId}/room/`))
}

/** GET event chat unread response (e.g. { count: number }). */
export interface EventChatUnreadResponse {
  count?: number
  [key: string]: unknown
}

/**
 * GET /api/v1/chat/events/{event_id}/unread/
 * Get unread message count for the event chat.
 */
export function fetchEventChatUnread(eventId: number): Promise<EventChatUnreadResponse> {
  return getWithAuth<EventChatUnreadResponse>(chatPath(`events/${eventId}/unread/`))
}
