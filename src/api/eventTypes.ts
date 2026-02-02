import { get } from './client'
import type { EventType } from '@/types/events'
import type { PaginatedResponse } from '@/types/events'

export function fetchEventTypes(params?: { page?: string }): Promise<PaginatedResponse<EventType>> {
  const search: Record<string, string> = {}
  if (params?.page) search.page = params.page
  return get<PaginatedResponse<EventType>>('event-types/', Object.keys(search).length ? search : undefined)
}
