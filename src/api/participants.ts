/**
 * Participants API – GET /api/v1/participants/
 * Participant CRUD: list, get, create, update, delete.
 */

import { get, post, put, patch, del } from './client'

// --- Types (from Swagger schema) ---

export interface Participant {
  id: number
  event: number
  user: number
  name: string
  phone: string
  email: string
  status: string
  notes: string
  total_contributions: string
  created_at: string
  updated_at: string
}

export interface PaginatedParticipantsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Participant[]
}

export interface ParticipantCreatePayload {
  event?: number
  user?: number
  name?: string
  phone?: string
  email?: string
  status?: string
  notes?: string
  [key: string]: unknown
}

export interface ParticipantUpdatePayload extends Partial<ParticipantCreatePayload> {}

// --- Endpoints ---

/**
 * GET /api/v1/participants/
 * List participants. Params: page, page_size, search, event (event id).
 */
export function fetchParticipants(params?: {
  page?: number
  page_size?: number
  search?: string
  event?: number
}): Promise<PaginatedParticipantsResponse> {
  const search: Record<string, string> = {}
  if (params?.page != null) search.page = String(params.page)
  if (params?.page_size != null) search.page_size = String(params.page_size)
  if (params?.search != null && params.search !== '') search.search = params.search
  if (params?.event != null) search.event = String(params.event)
  return get<PaginatedParticipantsResponse>(
    'participants/',
    Object.keys(search).length ? search : undefined
  )
}

/**
 * POST /api/v1/participants/
 * Create participant (201).
 */
export function createParticipant(payload: ParticipantCreatePayload): Promise<Participant> {
  return post<Participant>('participants/', payload)
}

/**
 * GET /api/v1/participants/{id}/
 * Get participant by id.
 */
export function fetchParticipantById(id: number): Promise<Participant> {
  return get<Participant>(`participants/${id}/`)
}

/**
 * PUT /api/v1/participants/{id}/
 * Full update.
 */
export function updateParticipant(id: number, payload: ParticipantUpdatePayload): Promise<Participant> {
  return put<Participant>(`participants/${id}/`, payload)
}

/**
 * PATCH /api/v1/participants/{id}/
 * Partial update.
 */
export function patchParticipant(id: number, payload: ParticipantUpdatePayload): Promise<Participant> {
  return patch<Participant>(`participants/${id}/`, payload)
}

/**
 * DELETE /api/v1/participants/{id}/
 * Delete participant (204).
 */
export function deleteParticipant(id: number): Promise<void> {
  return del<void>(`participants/${id}/`)
}
