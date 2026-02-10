<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventById, patchEvent } from '@/api/event'
import { fetchEventTypes } from '@/api/event_type'
import InvitationTemplatePickerModal from '@/components/InvitationTemplatePickerModal.vue'
import { fetchInvitationTemplateById } from '@/api/invitation-templates'
import type { InvitationTemplate } from '@/api/invitation-templates'
import type { PublicEvent } from '@/types/events'
import type { EventType } from '@/types/events'

const route = useRoute()
const router = useRouter()
const event = ref<PublicEvent | null>(null)
const eventTypes = ref<EventType[]>([])
const typesLoading = ref(true)
const saving = ref(false)
const error = ref<Error | null>(null)
const submitError = ref<string | null>(null)

const form = reactive({
  title: '',
  description: '',
  eventTypeId: null as number | null,
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  location: '',
  venueName: '',
  contributionTarget: '',
  visibility: 'PRIVATE',
  status: 'ACTIVE',
  invitationCardTemplateId: null as number | null,
  weddingGroomName: '',
  weddingBrideName: '',
  weddingCeremonyTime: '',
  weddingReceptionTime: '',
  weddingReceptionVenue: '',
  weddingDressCode: '',
  weddingRsvpPhone: '',
})

const eventId = computed(() => {
  const id = route.params.id
  if (typeof id !== 'string') return 0
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : 0
})

function parseIsoToDate(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function parseIsoToTime(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const h = d.getHours()
    const m = d.getMinutes()
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  } catch {
    return ''
  }
}

async function loadEvent() {
  if (!eventId.value) return
  try {
    event.value = await fetchEventById(eventId.value)
    const e = event.value
    form.title = e.title ?? ''
    form.description = e.description ?? ''
    form.eventTypeId = e.event_type ?? null
    form.startDate = parseIsoToDate(e.start_date)
    form.startTime = parseIsoToTime(e.start_date)
    form.endDate = parseIsoToDate(e.end_date)
    form.endTime = parseIsoToTime(e.end_date)
    form.location = e.location ?? ''
    form.venueName = e.venue_name ?? ''
    form.contributionTarget = (e.contribution_target ?? '').toString().trim()
    form.visibility = e.visibility ?? 'PRIVATE'
    form.status = e.status ?? 'ACTIVE'
    form.invitationCardTemplateId = e.invitation_card_template ?? null
    selectedTemplate.value = null
    if (e.invitation_card_template != null) {
      try {
        selectedTemplate.value = await fetchInvitationTemplateById(e.invitation_card_template)
      } catch {
        selectedTemplate.value = null
      }
    }
    form.weddingGroomName = e.wedding_groom_name ?? ''
    form.weddingBrideName = e.wedding_bride_name ?? ''
    form.weddingCeremonyTime = e.wedding_ceremony_time ?? ''
    form.weddingReceptionTime = e.wedding_reception_time ?? ''
    form.weddingReceptionVenue = e.wedding_reception_venue ?? ''
    form.weddingDressCode = e.wedding_dress_code ?? ''
    form.weddingRsvpPhone = e.wedding_rsvp_phone ?? ''
    error.value = null
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load event')
    event.value = null
  }
}

async function loadTypes() {
  try {
    const res = await fetchEventTypes()
    eventTypes.value = res.results ?? []
  } catch {
    eventTypes.value = []
  } finally {
    typesLoading.value = false
  }
}

async function load() {
  if (!eventId.value) return
  await loadEvent()
  await loadTypes()
}

const selectedEventType = computed(() =>
  eventTypes.value.find((t) => t.id === form.eventTypeId) ?? null
)
const isWedding = computed(() => {
  const slug = selectedEventType.value?.slug
  return slug != null && slug.toLowerCase() === 'wedding'
})
const showTemplateModal = ref(false)
const selectedTemplate = ref<InvitationTemplate | null>(null)

function openTemplateModal() {
  showTemplateModal.value = true
}

function onTemplateSelect(t: InvitationTemplate) {
  form.invitationCardTemplateId = t.id
  selectedTemplate.value = t
  showTemplateModal.value = false
}

function clearTemplate() {
  form.invitationCardTemplateId = null
  selectedTemplate.value = null
}

onMounted(() => load())
watch(() => route.params.id, () => load())

function toIsoDateTime(dateStr: string, timeStr: string): string | undefined {
  if (!dateStr) return undefined
  const [h = '0', m = '0'] = (timeStr || '0:0').split(':')
  const d = new Date(dateStr)
  d.setHours(Number(h), Number(m), 0, 0)
  return d.toISOString()
}

async function save() {
  submitError.value = null
  if (!form.title.trim()) {
    submitError.value = 'Please enter event title'
    return
  }
  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
      venue_name: form.venueName.trim() || undefined,
      visibility: form.visibility,
      status: form.status,
    }
    if (form.eventTypeId != null) payload.event_type = form.eventTypeId
    const start = toIsoDateTime(form.startDate, form.startTime)
    if (start) payload.start_date = start
    const end = form.endDate ? toIsoDateTime(form.endDate, form.endTime) : undefined
    if (end) payload.end_date = end
    const target = String(form.contributionTarget ?? '').trim()
    if (target) payload.contribution_target = target
    if (isWedding.value) {
      if (form.invitationCardTemplateId != null) payload.invitation_card_template = form.invitationCardTemplateId
      if (form.weddingGroomName.trim()) payload.wedding_groom_name = form.weddingGroomName.trim()
      if (form.weddingBrideName.trim()) payload.wedding_bride_name = form.weddingBrideName.trim()
      const ct = form.weddingCeremonyTime?.trim()
      if (ct) payload.wedding_ceremony_time = ct
      const rt = form.weddingReceptionTime?.trim()
      if (rt) payload.wedding_reception_time = rt
      if (form.weddingReceptionVenue.trim()) payload.wedding_reception_venue = form.weddingReceptionVenue.trim()
      if (form.weddingDressCode.trim()) payload.wedding_dress_code = form.weddingDressCode.trim()
      if (form.weddingRsvpPhone.trim()) payload.wedding_rsvp_phone = form.weddingRsvpPhone.trim()
    }
    await patchEvent(eventId.value, payload)
    router.push({ name: 'event-public', params: { id: String(eventId.value) } })
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : 'Failed to update event'
  } finally {
    saving.value = false
  }
}

function cancel() {
  router.push({ name: 'event-public', params: { id: String(eventId.value) } })
}

function goBack() {
  router.push({ name: 'event-public', params: { id: String(eventId.value) } })
}
</script>

<template>
  <div class="edit-event-page">
    <WebNavbar />
    <main class="edit-main">
      <nav v-if="event" class="edit-breadcrumbs" aria-label="Breadcrumb">
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'home' })">Home</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'events' })">Events</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="goBack">{{ event.title }}</button>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Edit</span>
      </nav>

      <template v-if="event">
        <header class="page-header">
          <h1 class="page-title">Edit Event</h1>
          <p class="page-subtitle">Update your event details</p>
        </header>

        <form class="edit-form" @submit.prevent="save">
          <section class="form-section card">
            <h2 class="section-title">Basic Information</h2>
            <div class="form-group">
              <label class="label">Event Type</label>
              <div v-if="typesLoading" class="loading-types">Loading types…</div>
              <div v-else class="chip-row">
                <button
                  v-for="type in eventTypes"
                  :key="type.id"
                  type="button"
                  class="chip"
                  :class="{ selected: form.eventTypeId === type.id }"
                  @click="form.eventTypeId = form.eventTypeId === type.id ? null : type.id"
                >
                  {{ type.name }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="label">Event Title *</label>
              <input v-model="form.title" type="text" class="input" placeholder="Event title" required />
            </div>
            <div class="form-group">
              <label class="label">Description</label>
              <textarea v-model="form.description" class="input textarea" rows="4" placeholder="Description" />
            </div>
            <template v-if="isWedding">
              <div class="wedding-divider" />
              <h3 class="wedding-heading">Wedding Details</h3>
              <div class="form-row">
                <div class="form-group">
                  <label class="label">Groom's Name</label>
                  <input v-model="form.weddingGroomName" type="text" class="input" placeholder="e.g. John" />
                </div>
                <div class="form-group">
                  <label class="label">Bride's Name</label>
                  <input v-model="form.weddingBrideName" type="text" class="input" placeholder="e.g. Jane" />
                </div>
              </div>
              <div class="form-group">
                <label class="label">Invitation Card Template</label>
                <div class="template-picker-trigger">
                  <button
                    type="button"
                    class="input template-picker-btn"
                    @click="openTemplateModal"
                  >
                    <span v-if="selectedTemplate">{{ selectedTemplate.name }}</span>
                    <span v-else class="template-placeholder">Choose a template (optional)</span>
                  </button>
                  <button
                    v-if="selectedTemplate"
                    type="button"
                    class="template-clear-btn"
                    aria-label="Clear template"
                    @click="clearTemplate"
                  >
                    Clear
                  </button>
                </div>
                <InvitationTemplatePickerModal
                  :open="showTemplateModal"
                  :selected-template-id="form.invitationCardTemplateId"
                  @close="showTemplateModal = false"
                  @select="onTemplateSelect"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="label">Ceremony Time</label>
                  <input v-model="form.weddingCeremonyTime" type="time" class="input" />
                </div>
                <div class="form-group">
                  <label class="label">Reception Time</label>
                  <input v-model="form.weddingReceptionTime" type="time" class="input" />
                </div>
              </div>
              <div class="form-group">
                <label class="label">Reception Venue</label>
                <input
                  v-model="form.weddingReceptionVenue"
                  type="text"
                  class="input"
                  placeholder="e.g. Grand Ballroom"
                />
              </div>
              <div class="form-group">
                <label class="label">Dress Code</label>
                <input
                  v-model="form.weddingDressCode"
                  type="text"
                  class="input"
                  placeholder="e.g. Formal"
                />
              </div>
              <div class="form-group">
                <label class="label">RSVP Phone</label>
                <input
                  v-model="form.weddingRsvpPhone"
                  type="tel"
                  class="input"
                  placeholder="e.g. 0712345678"
                />
              </div>
            </template>
          </section>

          <section class="form-section card">
            <h2 class="section-title">Date & Location</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="label">Start Date</label>
                <input v-model="form.startDate" type="date" class="input" />
              </div>
              <div class="form-group">
                <label class="label">Start Time</label>
                <input v-model="form.startTime" type="time" class="input" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="label">End Date</label>
                <input v-model="form.endDate" type="date" class="input" />
              </div>
              <div class="form-group">
                <label class="label">End Time</label>
                <input v-model="form.endTime" type="time" class="input" />
              </div>
            </div>
            <div class="form-group">
              <label class="label">Location</label>
              <input v-model="form.location" type="text" class="input" placeholder="Location" />
            </div>
            <div class="form-group">
              <label class="label">Venue Name</label>
              <input v-model="form.venueName" type="text" class="input" placeholder="Venue" />
            </div>
          </section>

          <section class="form-section card">
            <h2 class="section-title">Contribution & Settings</h2>
            <div class="form-group">
              <label class="label">Target Amount (TZS)</label>
              <input
                v-model="form.contributionTarget"
                type="number"
                class="input"
                placeholder="Optional"
                min="0"
              />
            </div>
            <div class="form-group">
              <label class="label">Visibility</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input v-model="form.visibility" type="radio" value="PRIVATE" />
                  <span>Private</span>
                </label>
                <label class="radio-label">
                  <input v-model="form.visibility" type="radio" value="INVITE_ONLY" />
                  <span>Invite Only</span>
                </label>
                <label class="radio-label">
                  <input v-model="form.visibility" type="radio" value="PUBLIC" />
                  <span>Public</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="label">Status</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input v-model="form.status" type="radio" value="DRAFT" />
                  <span>Draft</span>
                </label>
                <label class="radio-label">
                  <input v-model="form.status" type="radio" value="ACTIVE" />
                  <span>Active</span>
                </label>
                <label class="radio-label">
                  <input v-model="form.status" type="radio" value="COMPLETED" />
                  <span>Completed</span>
                </label>
                <label class="radio-label">
                  <input v-model="form.status" type="radio" value="CANCELLED" />
                  <span>Cancelled</span>
                </label>
              </div>
            </div>
          </section>

          <p v-if="submitError" class="submit-error">{{ submitError }}</p>
          <p v-if="error" class="submit-error">{{ error.message }}</p>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="cancel">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </template>
      <div v-else-if="error" class="state-error">
        <p>{{ error.message }}</p>
        <button type="button" class="btn-retry" @click="loadEvent">Retry</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.edit-event-page { min-height: 100vh; background: #fff; }
.edit-main { max-width: 640px; margin: 0 auto; padding: 96px 24px 48px; }
@media (max-width: 768px) {
  .edit-main { padding: 88px 16px 32px; }
}
.edit-breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}
.edit-breadcrumbs .breadcrumb-link {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  text-decoration: underline;
}
.edit-breadcrumbs .breadcrumb-link:hover { color: #2563eb; }
.edit-breadcrumbs .breadcrumb-sep { color: #9ca3af; }
.edit-breadcrumbs .breadcrumb-current { color: #111827; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
.page-subtitle { font-size: 14px; color: #6b7280; margin: 0; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
.form-section .section-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0 0 16px; }
.wedding-divider { height: 1px; background: #e5e7eb; margin: 24px 0 16px; }
.wedding-heading { font-size: 1rem; font-weight: 600; color: #1a1a2e; margin: 0 0 16px; }
.template-picker-trigger { display: flex; gap: 8px; align-items: stretch; }
.template-picker-btn { flex: 1; text-align: left; cursor: pointer; appearance: none; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; font-size: 1rem; font-family: inherit; }
.template-picker-btn:hover { border-color: #3b82f6; }
.template-placeholder { color: #9ca3af; }
.template-clear-btn { padding: 8px 14px; font-size: 0.875rem; color: #6b7280; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
.template-clear-btn:hover { background: #e5e7eb; color: #374151; }
.form-group { margin-bottom: 16px; }
.form-group:last-child { margin-bottom: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
.input { width: 100%; padding: 10px 14px; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 10px; box-sizing: border-box; }
.textarea { resize: vertical; min-height: 80px; }
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 8px 14px; font-size: 13px; border-radius: 20px; border: 1px solid #e5e7eb; background: #fff; color: #6b7280; cursor: pointer; }
.chip.selected { border-color: #1a283b; background: rgba(26,40,59,0.08); color: #1a283b; font-weight: 600; }
.radio-group { display: flex; flex-direction: column; gap: 8px; }
.radio-label { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #374151; cursor: pointer; }
.radio-label input { width: 18px; height: 18px; }
.loading-types { font-size: 14px; color: #6b7280; }
.submit-error { color: #dc2626; font-size: 14px; margin: 0 0 16px; }
.state-error { text-align: center; padding: 48px 24px; color: #6b7280; }
.btn-retry { margin-top: 12px; padding: 10px 20px; font-size: 14px; font-weight: 500; color: #1a283b; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
.form-actions { display: flex; gap: 12px; margin-top: 24px; }
.btn { padding: 12px 24px; font-size: 14px; font-weight: 600; border-radius: 12px; cursor: pointer; }
.btn-outline { background: #fff; color: #1a283b; border: 1px solid #e5e7eb; }
.btn-primary { background: #1a283b; color: #fff; border: none; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
