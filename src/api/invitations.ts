/**
 * Invitations API – GET /api/v1/invitations/
 * Invitation CRUD: list, get, create, update, delete, send.
 */

import { getWithAuth, post, put, patch, del } from './client'
import { getInvitationsPrefix } from '@/api/env'

const invitationsPath = (suffix: string) => `${getInvitationsPrefix()}/${suffix}`

// --- Types (from Swagger schema) ---

export interface Invitation {
  id: number
  event: number
  participant: number
  participant_name: string
  participant_phone: string
  message: string
  template: string
  status: string
  sent_via: string
  sent_at: string | null
  viewed_at: string | null
  pdf_url: string
  share_link: string
  short_code: string
  created_at: string
}

export interface PaginatedInvitationsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Invitation[]
}

export interface InvitationCreatePayload {
  event?: number
  participant?: number
  message?: string
  template?: string
  status?: string
  sent_via?: string
  sent_at?: string
  viewed_at?: string
  pdf_url?: string
  share_link?: string
  short_code?: string
  [key: string]: unknown
}

export interface InvitationUpdatePayload extends Partial<InvitationCreatePayload> {}

// --- Endpoints ---

export interface FetchInvitationsParams {
  page?: number
  event?: number
}

/**
 * GET /api/v1/invitations/
 * List invitations. Params: page, event (filter by event id).
 */
export function fetchInvitations(params?: FetchInvitationsParams): Promise<PaginatedInvitationsResponse> {
  const search: Record<string, string> = {}
  if (params?.page != null) search.page = String(params.page)
  if (params?.event != null) search.event = String(params.event)
  return getWithAuth<PaginatedInvitationsResponse>(
    invitationsPath(''),
    Object.keys(search).length ? search : undefined
  )
}

/**
 * POST /api/v1/invitations/
 * Create invitation (201).
 */
export function createInvitation(payload: InvitationCreatePayload): Promise<Invitation> {
  return post<Invitation>(invitationsPath(''), payload)
}

/**
 * GET /api/v1/invitations/{id}/
 * Get invitation by id.
 */
export function fetchInvitationById(id: number): Promise<Invitation> {
  return getWithAuth<Invitation>(invitationsPath(`${id}/`))
}

/**
 * PUT /api/v1/invitations/{id}/
 * Full update.
 */
export function updateInvitation(id: number, payload: InvitationUpdatePayload): Promise<Invitation> {
  return put<Invitation>(invitationsPath(`${id}/`), payload)
}

/**
 * PATCH /api/v1/invitations/{id}/
 * Partial update.
 */
export function patchInvitation(id: number, payload: InvitationUpdatePayload): Promise<Invitation> {
  return patch<Invitation>(invitationsPath(`${id}/`), payload)
}

/**
 * DELETE /api/v1/invitations/{id}/
 * Delete invitation (204).
 */
export function deleteInvitation(id: number): Promise<void> {
  return del<void>(invitationsPath(`${id}/`))
}

/**
 * POST /api/v1/invitations/{id}/send/
 * Send invitation via specified channel.
 */
export function sendInvitation(id: number, body?: InvitationUpdatePayload): Promise<Invitation> {
  return post<Invitation>(invitationsPath(`${id}/send/`), body ?? {})
}
