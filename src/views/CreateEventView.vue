<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventTypes } from '@/api/event_type'
import { createEvent } from '@/api/myEvents'
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

function toIsoDateTime(dateStr: string, timeStr: string): string | undefined {
  if (!dateStr) return undefined
  const [h = '0', m = '0'] = timeStr.split(':')
  const d = new Date(dateStr)
  d.setHours(Number(h), Number(m), 0, 0)
  return d.toISOString()
}

async function submit() {
  submitError.value = null
  if (!form.title.trim()) {
    submitError.value = 'Please enter event title'
    return
  }
  
  // Save form data before API call (in case of 401)
  saveFormData(FORM_ID, {
    ...form,
    currentStep: currentStep.value,
  })
  
  submitting.value = true
  try {
    await createEvent({
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
      status: 'ACTIVE',
    })
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
      <header class="create-header">
        <button type="button" class="btn-back" @click="router.push({ name: 'events' })">
          ← Back
        </button>
        <h1 class="create-title">Create Event</h1>
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
          @click="next"
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
  background: #f8fafc;
}

.create-main {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.create-header {
  margin-bottom: 24px;
}

.btn-back {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 8px;
}

.btn-back:hover {
  color: #1a1a2e;
}

.create-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
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
