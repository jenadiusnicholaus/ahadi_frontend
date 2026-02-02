import { ref, computed, watch } from 'vue'
import { fetchEventTypes } from '@/api/eventTypes'
import { fetchPublicEvents } from '@/api/publicEvents'
import type { EventType } from '@/types/events'
import type { PublicEvent } from '@/types/events'

const PAGE_SIZE = 12

export function usePublicEvents() {
  const eventTypes = ref<EventType[]>([])
  const eventTypesLoading = ref(false)
  const eventTypesError = ref<Error | null>(null)

  const selectedEventTypeId = ref<number | null>(null)
  const searchQuery = ref('')

  const events = ref<PublicEvent[]>([])
  const eventsTotal = ref(0)
  const eventsLoading = ref(false)
  const eventsError = ref<Error | null>(null)
  const eventsPage = ref(1)
  const hasNextPage = ref(false)
  const hasPreviousPage = ref(false)

  async function loadEventTypes() {
    eventTypesLoading.value = true
    eventTypesError.value = null
    try {
      const data = await fetchEventTypes({ page: '1' })
      eventTypes.value = data.results ?? []
    } catch (e) {
      eventTypesError.value = e instanceof Error ? e : new Error(String(e))
      eventTypes.value = []
    } finally {
      eventTypesLoading.value = false
    }
  }

  async function loadEvents(page = 1, append = false) {
    eventsLoading.value = true
    eventsError.value = null
    try {
      const params: { page: string; event_type?: string; search?: string } = { page: String(page) }
      if (selectedEventTypeId.value != null) params.event_type = String(selectedEventTypeId.value)
      if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
      const data = await fetchPublicEvents(params)
      const list = data.results ?? []
      eventsTotal.value = data.count ?? 0
      hasNextPage.value = Boolean(data.next)
      hasPreviousPage.value = Boolean(data.previous)
      eventsPage.value = page
      events.value = append ? [...events.value, ...list] : list
    } catch (e) {
      eventsError.value = e instanceof Error ? e : new Error(String(e))
      if (!append) events.value = []
    } finally {
      eventsLoading.value = false
    }
  }

  function filterByEventType(typeId: number | null) {
    selectedEventTypeId.value = typeId
  }

  function clearFilters() {
    selectedEventTypeId.value = null
    searchQuery.value = ''
  }

  function setSearchQuery(q: string) {
    searchQuery.value = q
  }

  const hasActiveFilters = computed(
    () => searchQuery.value.trim() !== '' || selectedEventTypeId.value != null
  )

  watch(
    [selectedEventTypeId, searchQuery],
    () => {
      loadEvents(1, false)
    },
    { deep: true }
  )

  return {
    eventTypes,
    eventTypesLoading,
    eventTypesError,
    selectedEventTypeId,
    searchQuery,
    events,
    eventsTotal,
    eventsLoading,
    eventsError,
    eventsPage,
    hasNextPage,
    hasPreviousPage,
    hasActiveFilters,
    loadEventTypes,
    loadEvents,
    filterByEventType,
    clearFilters,
    setSearchQuery,
  }
}
