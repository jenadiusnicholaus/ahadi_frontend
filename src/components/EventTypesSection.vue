<script setup lang="ts">
import type { EventType } from '@/types/events'

defineProps<{
  eventTypes: EventType[]
  loading?: boolean
  selectedEventTypeId: number | null
}>()

const emit = defineEmits<{
  filterByType: [typeId: number | null]
}>()

const categoryIconMap: Record<string, string> = {
  wedding: '💒',
  funeral: '🕯️',
  fundraiser: '🤝',
  birthday: '🎂',
  graduation: '🎓',
  'church event': '⛪',
  'baby shower': '👶',
  anniversary: '🎉',
  'community event': '👥',
  corporate: '💼',
}

function getIconForType(name: string): string {
  const key = name.toLowerCase()
  return categoryIconMap[key] ?? '📅'
}

function selectType(typeId: number | null) {
  emit('filterByType', typeId)
}
</script>

<template>
  <section class="event-types-section">
    <div class="section-header">
      <h2 class="section-title">Browse by Category</h2>
      <span class="scroll-hint" aria-hidden="true">Scroll →</span>
    </div>
    <div class="chips-wrap">
      <template v-if="loading">
        <div class="chip chip-skeleton" v-for="i in 5" :key="'skeleton-' + i" />
      </template>
      <template v-else>
        <div class="chips-scroll">
          <button
            type="button"
            class="chip"
            :class="{ 'chip-selected': selectedEventTypeId === null }"
            @click="selectType(null)"
          >
            <span class="chip-icon" aria-hidden="true">📋</span>
            <span class="chip-label">All Events</span>
          </button>
          <button
            v-for="type in eventTypes"
            :key="type.id"
            type="button"
            class="chip"
            :class="{ 'chip-selected': selectedEventTypeId === type.id }"
            @click="selectType(type.id)"
          >
            <span class="chip-icon" aria-hidden="true">{{ getIconForType(type.name) }}</span>
            <span class="chip-label">{{ type.name }}</span>
          </button>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.event-types-section {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #f9fafb;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .event-types-section {
    padding: 16px 12px;
  }
  .section-header {
    margin-bottom: 8px;
    gap: 8px;
  }
  .section-title {
    font-size: 16px;
    font-weight: 600;
  }
  .scroll-hint {
    font-size: 11px;
  }
  .chips-wrap {
    min-height: 44px;
  }
  .chips-scroll {
    gap: 6px;
  }
  .chip {
    padding: 9px 12px;
    font-size: 13px;
    gap: 5px;
  }
  .chip-icon {
    font-size: 16px;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.scroll-hint {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
  flex-shrink: 0;
}

.chips-wrap {
  min-height: 52px;
}

.chips-scroll {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chips-scroll::-webkit-scrollbar {
  display: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 11px 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.chip:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.chip-selected {
  background: hsl(220, 12%, 18%);
  border-color: hsl(220, 12%, 18%);
  color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.chip-selected:hover {
  background: hsl(220, 12%, 14%);
  border-color: hsl(220, 12%, 14%);
}

.chip-icon {
  font-size: 20px;
  line-height: 1;
}

.chip-skeleton {
  width: 130px;
  height: 48px;
  border-radius: 12px;
  background: #e5e7eb;
  flex-shrink: 0;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
