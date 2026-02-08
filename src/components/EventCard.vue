<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '@/api/client'
import type { PublicEvent } from '@/types/events'

const props = defineProps<{
  event: PublicEvent
}>()

const emit = defineEmits<{
  click: [event: PublicEvent]
}>()

const coverImageUrl = computed(() => {
  const raw = props.event.cover_image
  return raw ? assetUrl(raw) : ''
})

const startDate = computed(() => {
  const s = props.event.start_date
  if (!s) return null
  try {
    return new Date(s)
  } catch {
    return null
  }
})

const dateDay = computed(() => {
  const d = startDate.value
  return d ? d.getDate() : '—'
})

const dateMonth = computed(() => {
  const d = startDate.value
  if (!d) return '—'
  return d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
})

const participantCount = computed(() => {
  const n = props.event.participant_count
  if (n === undefined || n === null || n === '') return 0
  const num = Number(n)
  return Number.isFinite(num) ? num : 0
})

const contributionTarget = computed(() => {
  const t = props.event.contribution_target
  if (t === undefined || t === null || t === '') return 0
  const num = Number(t)
  return Number.isFinite(num) && num > 0 ? num : 0
})

const totalContributions = computed(() => {
  const t = props.event.total_contributions
  if (t === undefined || t === null || t === '') return 0
  const num = Number(t)
  return Number.isFinite(num) ? num : 0
})

const progressPercent = computed(() => {
  const target = contributionTarget.value
  if (target <= 0) return 0
  const total = totalContributions.value
  return Math.min(100, Math.round((total / target) * 100))
})

function onClick() {
  emit('click', props.event)
}
</script>

<template>
  <article class="event-card" role="button" tabindex="0" @click="onClick" @keydown.enter="onClick" @keydown.space.prevent="onClick">
    <div class="card-image-wrap">
      <img
        v-if="coverImageUrl"
        :src="coverImageUrl"
        :alt="event.title"
        class="card-image"
        loading="lazy"
        @error="($event.target as HTMLImageElement)?.classList?.add('img-error')"
      />
      <div v-else class="card-image card-image-placeholder">
        <span class="placeholder-text">No image</span>
      </div>
      <div class="card-image-overlay" aria-hidden="true" />
      <div class="card-badge card-badge-date">
        <span class="date-day">{{ dateDay }}</span>
        <span class="date-month">{{ dateMonth }}</span>
      </div>
      <div v-if="event.event_type_name" class="card-badge card-badge-type">
        {{ event.event_type_name }}
      </div>
    </div>
    <div class="card-body">
      <h3 class="card-title">{{ event.title }}</h3>
      <p v-if="event.description" class="card-description">{{ event.description }}</p>
      <div v-if="event.location" class="card-meta card-location">
        <span class="meta-icon" aria-hidden="true">📍</span>
        <span class="meta-text">{{ event.location }}</span>
      </div>
      <div class="card-footer">
        <span class="card-participants">
          <span class="meta-icon" aria-hidden="true">👥</span>
          {{ participantCount }} participating
        </span>
        <div class="card-footer-right">
          <div v-if="contributionTarget > 0" class="card-progress">
            <span class="progress-label">{{ progressPercent }}%</span>
          </div>
          <slot name="actions" />
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.6) inset;
  cursor: pointer;
  transition: box-shadow 0.25s, transform 0.25s, border-color 0.25s;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 320px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  width: 100%;
}

@media (max-width: 768px) {
  .event-card {
    min-height: 280px;
    border-radius: 16px;
  }
}

.event-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.6) inset;
  transform: translateY(-3px);
  border-color: rgba(26, 26, 46, 0.1);
}

.card-image-wrap {
  position: relative;
  height: 200px;
  flex-shrink: 0;
  background: #f3f4f6;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-image.img-error {
  object-fit: none;
  background: #e5e7eb;
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
}

.placeholder-text {
  font-size: 14px;
  color: #9ca3af;
}

.card-image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  pointer-events: none;
}

.card-badge {
  position: absolute;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.card-badge-date {
  top: 12px;
  left: 12px;
  padding: 8px 12px;
  background: #fff;
  color: hsl(220, 12%, 18%);
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.date-day {
  font-size: 18px;
  font-weight: 700;
  color: hsl(220, 12%, 25%);
}

.date-month {
  color: #6b7280;
  font-weight: 600;
}

.card-badge-type {
  top: 12px;
  right: 12px;
  padding: 6px 10px;
  background: hsl(220, 12%, 18%);
  color: #fff;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.meta-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.meta-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.card-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-participants {
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-progress {
  font-size: 12px;
  font-weight: 600;
  color: hsl(220, 12%, 25%);
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
}

.progress-label {
  white-space: nowrap;
}
</style>
