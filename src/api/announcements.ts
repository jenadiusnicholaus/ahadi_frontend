/**
 * Announcements API – GET/POST /api/v1/announcements/
 * Announcement CRUD: list (paginated), get, create, update, delete.
 */

import { getWithAuth, post, put, patch, del } from './client'
import { getAnnouncementsPrefix } from '@/api/env'

function announcementsPath(suffix: string): string {
  const base = getAnnouncementsPrefix()
  if (!suffix) return base ? `${base}/` : 'announcements/'
  return `${base}/${suffix}`.replace(/\/+/g, '/')
}

// --- Types (from API schema) ---

export interface Announcement {
  id: number
  event: number
  author: number
  author_name: string
  title: string
  content: string
  is_pinned: boolean
  send_notification: boolean
  created_at: string
  updated_at: string
}

export interface PaginatedAnnouncementsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Announcement[]
}

export interface AnnouncementCreatePayload {
  event: number
  title: string
  content: string
  is_pinned?: boolean
  send_notification?: boolean
}

export interface AnnouncementUpdatePayload {
  event?: number
  title?: string
  content?: string
  is_pinned?: boolean
  send_notification?: boolean
}

// --- Endpoints ---

/**
 * GET /api/v1/announcements/
 * List announcements. Params: page.
 */
export function fetchAnnouncements(params?: { page?: number; event?: number }): Promise<PaginatedAnnouncementsResponse> {
  const search: Record<string, string> = {}
  if (params?.page != null) search.page = String(params.page)
  if (params?.event != null) search.event = String(params.event)
  return getWithAuth<PaginatedAnnouncementsResponse>(
    announcementsPath(''),
    Object.keys(search).length ? search : undefined
  )
}

/**
 * POST /api/v1/announcements/
 * Create an announcement.
 */
export function createAnnouncement(payload: AnnouncementCreatePayload): Promise<Announcement> {
  return post<Announcement>(announcementsPath(''), payload)
}

/**
 * GET /api/v1/announcements/{id}/
 */
export function fetchAnnouncementById(id: number): Promise<Announcement> {
  return getWithAuth<Announcement>(announcementsPath(`${id}/`))
}

/**
 * PUT /api/v1/announcements/{id}/
 */
export function updateAnnouncement(id: number, payload: AnnouncementUpdatePayload): Promise<Announcement> {
  return put<Announcement>(announcementsPath(`${id}/`), payload)
}

/**
 * PATCH /api/v1/announcements/{id}/
 */
export function patchAnnouncement(id: number, payload: AnnouncementUpdatePayload): Promise<Announcement> {
  return patch<Announcement>(announcementsPath(`${id}/`), payload)
}

/**
 * DELETE /api/v1/announcements/{id}/
 */
export function deleteAnnouncement(id: number): Promise<void> {
  return del<void>(announcementsPath(`${id}/`))
}
