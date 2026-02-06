/**
 * Events API – GET /api/v1/events/ and nested resources.
 * List (public for anonymous, all accessible for authenticated), CRUD, report, participants, contributions, messages, announcements, admins, join by code.
 */

import { get, getWithAuth, post, put, patch, del } from './client'
import type { PublicEvent } from '@/types/events'
import type { PaginatedResponse } from '@/types/events'

// --- List & CRUD params / payloads ---

export interface EventsListParams {
  ordering?: string
  page?: number
  search?: string
}

export interface EventCreatePayload {
  title: string
  description?: string
  event_type?: number
  start_date?: string
  end_date?: string
  location?: string
  venue_name?: string
  status?: string
  visibility?: string
  contribution_target?: string
  currency?: string
  cover_image?: string
  [key: string]: unknown
}

export interface EventUpdatePayload extends Partial<EventCreatePayload> {}

export interface SendInvitationPayload {
  participant_ids?: number[]
  send_to_self?: boolean
}

export interface JoinByCodeRegisterPayload {
  name: string
  phone: string
  email?: string
}

// --- Main CRUD ---

/** GET /api/v1/events/ – List events (public for anonymous, all accessible when authenticated). Params: ordering, page, search. */
export function fetchEvents(params?: EventsListParams): Promise<PaginatedResponse<PublicEvent>> {
  const search: Record<string, string> = {}
  if (params?.ordering != null) search.ordering = params.ordering
  if (params?.page != null) search.page = String(params.page)
  if (params?.search != null && params.search !== '') search.search = params.search
  return get<PaginatedResponse<PublicEvent>>('events/', Object.keys(search).length ? search : undefined)
}

/** POST /api/v1/events/ – Create event (auth required). */
export function createEvent(payload: EventCreatePayload): Promise<PublicEvent> {
  return post<PublicEvent>('events/', payload)
}

/** GET /api/v1/events/{id}/ – Event detail. */
export function fetchEventById(id: number): Promise<PublicEvent> {
  return get<PublicEvent>(`events/${id}/`)
}

/** PUT /api/v1/events/{id}/ – Full update (owner/admin only). */
export function updateEvent(id: number, payload: EventUpdatePayload): Promise<PublicEvent> {
  return put<PublicEvent>(`events/${id}/`, payload)
}

/** PATCH /api/v1/events/{id}/ – Partial update (owner/admin only). */
export function patchEvent(id: number, payload: EventUpdatePayload): Promise<PublicEvent> {
  return patch<PublicEvent>(`events/${id}/`, payload)
}

/** DELETE /api/v1/events/{id}/ – Delete event (owner only). Returns 204. */
export function deleteEvent(id: number): Promise<void> {
  return del<void>(`events/${id}/`)
}

// --- Nested: send invitation ---

/** POST /api/v1/events/{event_id}/send-invitation/ – Send invitation card to participants. */
export function sendEventInvitation(eventId: number, payload?: SendInvitationPayload): Promise<void> {
  return post<void>(`events/${eventId}/send-invitation/`, payload ?? {})
}

// --- Nested: report, participants, contributions, messages, announcements ---

/** GET /api/v1/events/{id}/report/ – Event report/analytics. */
export function fetchEventReport(id: number): Promise<unknown> {
  return get<unknown>(`events/${id}/report/`)
}

/** GET /api/v1/events/{id}/participants/ – List participants. */
export function fetchEventParticipants(id: number): Promise<unknown> {
  return get<unknown>(`events/${id}/participants/`)
}

/** GET /api/v1/events/{id}/contributions/ – List contributions. */
export function fetchEventContributions(id: number): Promise<unknown> {
  return get<unknown>(`events/${id}/contributions/`)
}

/** GET /api/v1/events/{id}/messages/ – List chat messages. Backend may return { data: [...] }, { results: [...] }, { messages: [...] }, or a direct array. */
export async function fetchEventMessages(id: number): Promise<unknown[]> {
  const res = await getWithAuth<Record<string, unknown> | unknown[]>(`events/${id}/messages/`)
  if (Array.isArray(res)) return res
  const r = res as Record<string, unknown>
  for (const key of ['data', 'results', 'messages']) {
    const val = r?.[key]
    if (Array.isArray(val)) return val
  }
  return []
}

/** GET /api/v1/events/{id}/announcements/ – List announcements. */
export function fetchEventAnnouncements(id: number): Promise<unknown> {
  return get<unknown>(`events/${id}/announcements/`)
}

// --- My events (auth required) ---

/** Backend may return { success, message, data } or paginated { count, next, previous, results }. */
interface MyEventsRawResponse {
  success?: boolean
  message?: string
  data?: PublicEvent[]
  count?: number
  next?: string | null
  previous?: string | null
  results?: PublicEvent[]
}

/** GET /api/v1/events/my_events/ – User's events (auth required). Normalizes { data } to { results }. */
export async function fetchMyEvents(params?: { page?: number }): Promise<PaginatedResponse<PublicEvent>> {
  const search: Record<string, string> = {}
  if (params?.page != null) search.page = String(params.page)
  const res = await getWithAuth<MyEventsRawResponse>(
    'events/my_events/',
    Object.keys(search).length ? search : undefined
  )
  if (Array.isArray(res.data) && res.results == null) {
    return {
      count: res.data.length,
      next: null,
      previous: null,
      results: res.data,
    }
  }
  return {
    count: res.count ?? res.results?.length ?? 0,
    next: res.next ?? null,
    previous: res.previous ?? null,
    results: res.results ?? [],
  }
}

// --- Admins ---

/** GET /api/v1/events/{id}/admins/ – List event admins. */
export function fetchEventAdmins(id: number): Promise<unknown> {
  return get<unknown>(`events/${id}/admins/`)
}

/** POST /api/v1/events/{id}/admins/ – Add event admin (body per backend). */
export function addEventAdmin(id: number, body: unknown): Promise<unknown> {
  return post<unknown>(`events/${id}/admins/`, body)
}

/** DELETE /api/v1/events/{id}/admins/ – Remove event admin (204). */
export function removeEventAdmins(id: number): Promise<void> {
  return del<void>(`events/${id}/admins/`)
}

// --- Public: contribute & join by code ---

/** GET /api/v1/events/contribute/{join_code}/ – Event details for public contribution page. */
export function fetchEventByContributeCode(joinCode: string): Promise<PublicEvent | unknown> {
  return get<PublicEvent | unknown>(`events/contribute/${encodeURIComponent(joinCode)}/`)
}

/** GET /api/v1/events/join/{join_code}/ – Public event details by join code. */
export function fetchEventByJoinCode(joinCode: string): Promise<PublicEvent | unknown> {
  return get<PublicEvent | unknown>(`events/join/${encodeURIComponent(joinCode)}/`)
}

/** POST /api/v1/events/join/{join_code}/register/ – Join event using public join code. */
export function registerEventByJoinCode(joinCode: string, payload: JoinByCodeRegisterPayload): Promise<unknown> {
  return post<unknown>(`events/join/${encodeURIComponent(joinCode)}/register/`, payload)
}

// --- Public events (no auth) ---

/** GET /api/v1/events/public_events/ – List public events. Params: page, event_type, search (if supported). */
export interface PublicEventsListParams {
  page?: number | string
  event_type?: number | string
  search?: string
}

export function fetchPublicEvents(params?: PublicEventsListParams): Promise<PaginatedResponse<PublicEvent>> {
  const search: Record<string, string> = {}
  if (params?.page != null) search.page = String(params.page)
  if (params?.event_type != null) search.event_type = String(params.event_type)
  if (params?.search != null && params.search !== '') search.search = params.search
  return get<PaginatedResponse<PublicEvent>>(
    'events/public_events/',
    Object.keys(search).length ? search : undefined
  )
}
