<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventTypes } from '@/api/event_type'
import { createEvent } from '@/api/myEvents'
import InvitationTemplatePickerModal from '@/components/InvitationTemplatePickerModal.vue'
import type { InvitationTemplate } from '@/api/invitation-templates'
import { saveFormData, getFormData, clearFormData } from '@/utils/formPersistence'
import type { EventType } from '@/types/events'

const FORM_ID = 'create-event'

const router = useRouter()
const totalSteps = 4
const currentStep = ref(0)
const eventTypes = ref<EventType[]>([])
const eventTypesLoading = ref(true)
const submitting = ref(false)
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
  chatEnabled: true,
  coverImageBase64: null as string | null,
  invitationCardTemplateId: null as number | null,
  weddingGroomName: '',
  weddingBrideName: '',
  weddingCeremonyTime: '',
  weddingReceptionTime: '',
  weddingReceptionVenue: '',
  weddingDressCode: '',
  weddingRsvpPhone: '',
})

// Restore form data on mount
onMounted(async () => {
  // Restore saved form data if available
  const saved = getFormData(FORM_ID)
  if (saved) {
    Object.assign(form, saved)
    // Restore current step if saved
    if (typeof saved.currentStep === 'number') {
      currentStep.value = saved.currentStep
    }
  }

  try {
    const res = await fetchEventTypes()
    eventTypes.value = res.results ?? []
  } catch {
    eventTypes.value = []
  } finally {
    eventTypesLoading.value = false
  }
})

// Save form data whenever it changes
watch(
  () => [form, currentStep.value],
  () => {
    saveFormData(FORM_ID, {
      ...form,
      currentStep: currentStep.value,
    })
  },
  { deep: true }
)

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

const QUICK_AMOUNTS = [500000, 1000000, 2000000, 5000000, 10000000]

function formatQuickAmount(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)}M`
  return `${(amount / 1000).toFixed(0)}K`
}

const coverFileInput = ref<HTMLInputElement | null>(null)
const isCoverDragOver = ref(false)

function loadCoverFile(file: File) {
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = () => {
    const data = reader.result as string
    form.coverImageBase64 = data
  }
  reader.readAsDataURL(file)
}

function setCoverImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return
  loadCoverFile(file)
}

function clearCoverImage() {
  form.coverImageBase64 = null
}

function onCoverDragOver(e: DragEvent) {
  e.preventDefault()
  isCoverDragOver.value = true
}

function onCoverDragLeave(e: DragEvent) {
  e.preventDefault()
  isCoverDragOver.value = false
}

function onCoverDrop(e: DragEvent) {
  e.preventDefault()
  isCoverDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) loadCoverFile(file)
}

function triggerCoverFile() {
  coverFileInput.value?.click()
}

function toIsoDateTime(dateStr: string, timeStr: string): string | undefined {
  if (!dateStr) return undefined
  const [h = '0', m = '0'] = timeStr.split(':')
  const d = new Date(dateStr)
  d.setHours(Number(h), Number(m), 0, 0)
  return d.toISOString()
}

async function submit(asDraft = false) {
  submitError.value = null
  if (!form.title.trim()) {
    submitError.value = 'Please enter event title'
    return
  }

  const timeToHHmm = (t: string) => {
    if (!t || !t.trim()) return undefined
    const [h, m] = t.trim().split(':')
    if (h == null) return undefined
    return `${String(h).padStart(2, '0')}:${String(m ?? '0').padStart(2, '0')}`
  }

  // Save form data before API call (in case of 401)
  saveFormData(FORM_ID, {
    ...form,
    currentStep: currentStep.value,
  })

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      event_type: form.eventTypeId ?? undefined,
      start_date: toIsoDateTime(form.startDate, form.startTime),
      end_date:
        form.endDate ? toIsoDateTime(form.endDate, form.endTime) : undefined,
      location: form.location.trim() || undefined,
      venue_name: form.venueName.trim() || undefined,
      contribution_target: String(form.contributionTarget ?? '').trim() || undefined,
      visibility: form.visibility,
      chat_enabled: form.chatEnabled,
      status: asDraft ? 'DRAFT' : 'ACTIVE',
    }
    if (form.coverImageBase64) payload.cover_image = form.coverImageBase64
    if (isWedding.value) {
      if (form.invitationCardTemplateId != null) payload.invitation_card_template = form.invitationCardTemplateId
      if (form.weddingGroomName.trim()) payload.wedding_groom_name = form.weddingGroomName.trim()
      if (form.weddingBrideName.trim()) payload.wedding_bride_name = form.weddingBrideName.trim()
      const ct = timeToHHmm(form.weddingCeremonyTime)
      if (ct) payload.wedding_ceremony_time = ct
      const rt = timeToHHmm(form.weddingReceptionTime)
      if (rt) payload.wedding_reception_time = rt
      if (form.weddingReceptionVenue.trim()) payload.wedding_reception_venue = form.weddingReceptionVenue.trim()
      if (form.weddingDressCode.trim()) payload.wedding_dress_code = form.weddingDressCode.trim()
      if (form.weddingRsvpPhone.trim()) payload.wedding_rsvp_phone = form.weddingRsvpPhone.trim()
    }
    await createEvent(payload as import('@/api/event').EventCreatePayload)
    // Clear saved form data on success
    clearFormData(FORM_ID)
    router.push({ name: 'events' })
  } catch (e) {
    submitError.value =
      e instanceof Error ? e.message : 'Failed to create event'
    // Form data is already saved, so it will persist if user gets redirected
  } finally {
    submitting.value = false
  }
}

function next() {
  if (currentStep.value === 0 && !form.title.trim()) return
  if (currentStep.value < totalSteps - 1) {
    currentStep.value++
  } else {
    submit()
  }
}

function back() {
  if (currentStep.value > 0) currentStep.value--
}
</script>

<template>
  <div class="create-event-page">
    <WebNavbar />
    <main class="create-main">
      <nav class="create-breadcrumbs" aria-label="Breadcrumb">
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'home' })">Home</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'events' })">Events</button>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Create</span>
      </nav>
      <header class="create-header">
        <h1 class="create-title">Create Event</h1>
        <div class="header-actions">
          <button
            type="button"
            class="btn btn-outline btn-sm"
            :disabled="submitting"
            @click="submit(true)"
          >
            Save Draft
          </button>
        </div>
      </header>

      <!-- Progress -->
      <div class="progress-row">
        <template v-for="(_, i) in totalSteps" :key="i">
          <div
            class="progress-dot"
            :class="{
              active: i <= currentStep,
              completed: i < currentStep,
            }"
          >
            <span v-if="i < currentStep">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <div
            v-if="i < totalSteps - 1"
            class="progress-line"
            :class="{ filled: i < currentStep }"
          />
        </template>
      </div>

      <!-- Step 1: Basic Info -->
      <section v-show="currentStep === 0" class="step-section">
        <h2 class="step-title">Basic Information</h2>
        <p class="step-subtitle">Tell us about your event</p>
        <div class="form-group">
          <label class="label">Event Type</label>
          <div v-if="eventTypesLoading" class="loading-types">Loading types…</div>
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
          <input
            v-model="form.title"
            type="text"
            class="input"
            placeholder="e.g. John & Jane Wedding"
          />
        </div>
        <div class="form-group">
          <label class="label">Description</label>
          <textarea
            v-model="form.description"
            class="input textarea"
            rows="4"
            placeholder="Tell guests about your event…"
          />
        </div>
        <div class="form-group">
          <label class="label">Cover Image (optional)</label>
          <div
            class="cover-dropzone"
            :class="{ 'is-drag-over': isCoverDragOver }"
            @dragover.prevent="onCoverDragOver"
            @dragenter.prevent="onCoverDragOver"
            @dragleave.prevent="onCoverDragLeave"
            @drop="onCoverDrop"
            @click="triggerCoverFile"
          >
            <p class="cover-drop-main">Click to upload or drag and drop</p>
            <p class="cover-drop-hint">PNG or JPG, up to 5MB</p>
            <input
              ref="coverFileInput"
              type="file"
              accept="image/*"
              class="input-file"
              @change="setCoverImage"
            />
          </div>
          <div v-if="form.coverImageBase64" class="cover-preview">
            <img :src="form.coverImageBase64" alt="Cover" class="cover-img" />
            <button type="button" class="cover-remove" @click="clearCoverImage">Remove</button>
          </div>
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

      <!-- Step 2: Date & Location -->
      <section v-show="currentStep === 1" class="step-section">
        <h2 class="step-title">Date & Location</h2>
        <p class="step-subtitle">When and where is your event?</p>
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
            <label class="label">End Date (optional)</label>
            <input v-model="form.endDate" type="date" class="input" />
          </div>
          <div class="form-group">
            <label class="label">End Time (optional)</label>
            <input v-model="form.endTime" type="time" class="input" />
          </div>
        </div>
        <div class="form-group">
          <label class="label">Location</label>
          <input
            v-model="form.location"
            type="text"
            class="input"
            placeholder="Address or area"
          />
        </div>
        <div class="form-group">
          <label class="label">Venue Name</label>
          <input
            v-model="form.venueName"
            type="text"
            class="input"
            placeholder="e.g. Grand Hotel Ballroom"
          />
        </div>
      </section>

      <!-- Step 3: Contribution -->
      <section v-show="currentStep === 2" class="step-section">
        <h2 class="step-title">Contribution Goal</h2>
        <p class="step-subtitle">Set a target for contributions (optional)</p>
        <div class="form-group">
          <label class="label">Target Amount (TZS)</label>
          <input
            v-model="form.contributionTarget"
            type="number"
            class="input"
            placeholder="e.g. 5000000"
            min="0"
          />
          <p class="hint">Leave empty if you don't want to set a target</p>
        </div>
        <div class="form-group">
          <label class="label">Quick Select</label>
          <div class="chip-row">
            <button
              v-for="amt in QUICK_AMOUNTS"
              :key="amt"
              type="button"
              class="chip"
              :class="{ selected: Number(form.contributionTarget) === amt }"
              @click="form.contributionTarget = String(amt)"
            >
              TZS {{ formatQuickAmount(amt) }}
            </button>
          </div>
        </div>
      </section>

      <!-- Step 4: Settings -->
      <section v-show="currentStep === 3" class="step-section">
        <h2 class="step-title">Event Settings</h2>
        <p class="step-subtitle">Configure how your event works</p>
        <div class="form-group">
          <label class="label">Visibility</label>
          <div class="radio-group">
            <label class="radio-label">
              <input v-model="form.visibility" type="radio" value="PRIVATE" />
              <span>Private – only invited participants</span>
            </label>
            <label class="radio-label">
              <input v-model="form.visibility" type="radio" value="INVITE_ONLY" />
              <span>Invite Only – anyone with link can view</span>
            </label>
            <label class="radio-label">
              <input v-model="form.visibility" type="radio" value="PUBLIC" />
              <span>Public – anyone can find and join</span>
            </label>
          </div>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Enable event chat</span>
          <label class="toggle">
            <input v-model="form.chatEnabled" type="checkbox" />
            <span class="toggle-slider" />
          </label>
        </div>
      </section>

      <p v-if="submitError" class="submit-error">{{ submitError }}</p>

      <div class="nav-buttons">
        <button
          v-if="currentStep > 0"
          type="button"
          class="btn btn-outline"
          @click="back"
        >
          Back
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="submitting"
          @click="currentStep === totalSteps - 1 ? submit(false) : next()"
        >
          <span v-if="submitting">Creating…</span>
          <span v-else>{{ currentStep === totalSteps - 1 ? 'Create Event' : 'Next' }}</span>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.create-event-page {
  min-height: 100vh;
  background: #fff;
}

.create-main {
  max-width: 640px;
  margin: 0 auto;
  padding: 96px 24px 48px;
}
@media (max-width: 768px) {
  .create-main { padding: 88px 16px 32px; }
}

.create-breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}
.create-breadcrumbs .breadcrumb-link {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  text-decoration: underline;
}
.create-breadcrumbs .breadcrumb-link:hover { color: #2563eb; }
.create-breadcrumbs .breadcrumb-sep { color: #9ca3af; }
.create-breadcrumbs .breadcrumb-current { color: #111827; }

.create-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.875rem;
}

.create-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.input-file {
  display: none;
}

.cover-dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: center;
  background: #f9fafb;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.cover-dropzone:hover {
  border-color: #9ca3af;
}

.cover-dropzone.is-drag-over {
  border-color: #1d4ed8;
  background: #eff6ff;
}

.cover-drop-main {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.cover-drop-hint {
  margin-top: 4px;
  font-size: 0.8rem;
  color: #6b7280;
}

.cover-preview {
  margin-top: 8px;
  position: relative;
  display: inline-block;
}

.cover-img {
  max-width: 200px;
  max-height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.cover-remove {
  display: block;
  margin-top: 6px;
  font-size: 0.8125rem;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.cover-remove:hover {
  color: #111827;
}

.wedding-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 24px 0 16px;
}

.wedding-heading {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 16px;
}

.template-picker-trigger {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.template-picker-btn {
  flex: 1;
  text-align: left;
  cursor: pointer;
  appearance: none;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 1rem;
  font-family: inherit;
}
.template-picker-btn:hover {
  border-color: #3b82f6;
}
.template-placeholder {
  color: #9ca3af;
}
.template-clear-btn {
  padding: 8px 14px;
  font-size: 0.875rem;
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}
.template-clear-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.progress-row {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.progress-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.progress-dot.active {
  background: #1a283b;
  color: #fff;
}

.progress-dot.completed {
  background: #1a283b;
  color: #fff;
}

.progress-line {
  flex: 1;
  max-width: 48px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 4px;
}

.progress-line.filled {
  background: #1a283b;
}

.step-section {
  margin-bottom: 32px;
}

.step-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.step-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.input {
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #1a283b;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 6px 0 0;
}

.loading-types {
  font-size: 14px;
  color: #6b7280;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 8px 16px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
}

.chip:hover {
  border-color: #1a283b;
}

.chip.selected {
  background: #1a283b;
  color: #fff;
  border-color: #1a283b;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.radio-label input {
  width: 18px;
  height: 18px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  margin-top: 16px;
}

.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #d1d5db;
  border-radius: 24px;
  transition: 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}

.toggle input:checked + .toggle-slider {
  background: #1a283b;
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.submit-error {
  color: #b91c1c;
  font-size: 14px;
  margin: 0 0 16px;
}

.nav-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  border: none;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-outline {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-outline:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #1a283b;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #2d3a4f;
}
</style>
