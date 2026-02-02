import { get } from './client'
import type { PublicEvent } from '@/types/events'
import type { PaginatedResponse } from '@/types/events'

export interface PublicEventsParams {
  page?: string
  event_type?: string
  search?: string
}

export function fetchPublicEvents(params?: PublicEventsParams): Promise<PaginatedResponse<PublicEvent>> {
  const search: Record<string, string> = {}
  if (params?.page) search.page = params.page
  if (params?.event_type) search.event_type = params.event_type
  if (params?.search) search.search = params.search
  return get<PaginatedResponse<PublicEvent>>(
    'events/public_events/',
    Object.keys(search).length ? search : undefined
  )
}
