/**
 * Event type from GET /api/v1/event-types/
 */
export interface EventType {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  color: string
  is_active: boolean
}

/**
 * Public event from GET /api/v1/events/public_events/
 */
export interface PublicEvent {
  id: number
  title: string
  description: string
  event_type: number
  event_type_name: string
  start_date: string
  end_date: string
  location: string
  venue_name: string
  status: string
  visibility: string
  contribution_target: string
  currency: string
  total_contributions: string
  participant_count: string
  confirmed_participants: string
  contribution_stats: string
  cover_image: string
  chat_enabled: boolean
  invitations_enabled: boolean
  reminders_enabled: boolean
  reports_enabled: boolean
  join_code: string
  allow_public_join: boolean
  join_url: string
  owner: number
  owner_name: string
  created_at: string
  updated_at: string
  invitation_card_template: number | null
  custom_invitation_image: string
  wedding_groom_name?: string
  wedding_bride_name?: string
  wedding_ceremony_time?: string
  wedding_reception_time?: string
  wedding_reception_venue?: string
  wedding_dress_code?: string
  wedding_rsvp_phone?: string
}

/**
 * Paginated list response (event-types and public_events)
 */
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
