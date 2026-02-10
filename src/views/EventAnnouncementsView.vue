<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventById } from '@/api/event'
import {
  fetchAnnouncements,
  createAnnouncement,
  patchAnnouncement,
  deleteAnnouncement,
  type Announcement,
} from '@/api/announcements'
import type { PublicEvent } from '@/types/events'

const route = useRoute()
const router = useRouter()
const event = ref<PublicEvent | null>(null)
const announcements = ref<Announcement[]>([])
const loading = ref(true)
const error = ref<Error | null>(null)
const showForm = ref(false)
const editingId = ref<number | null>(null)
const formTitle = ref('')
const formContent = ref('')
const formPinned = ref(false)
const formSendNotification = ref(true)
const saving = ref(false)
const formError = ref<string | null>(null)

const eventId = computed(() => {
  const id = route.params.id
  if (typeof id !== 'string') return 0
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : 0
})

async function loadEvent() {
  if (!eventId.value) return
  try {
    event.value = await fetchEventById(eventId.value)
  } catch {
    event.value = null
  }
}

async function loadAnnouncements() {
  if (!eventId.value) return
  loading.value = true
  error.value = null
  try {
    const res = await fetchAnnouncements({ page: 1, event: eventId.value })
    const list = res.results ?? []
    if (res.results && eventId.value) {
      announcements.value = list.filter((a) => a.event === eventId.value)
    } else {
      announcements.value = list
    }
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load announcements')
    announcements.value = []
  } finally {
    loading.value = false
  }
}

async function load() {
  if (!eventId.value) return
  await loadEvent()
  await loadAnnouncements()
}

onMounted(() => load())
watch(() => route.params.id, () => load())

const pinnedFirst = computed(() => {
  const list = [...announcements.value]
  return list.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
})

function openCreate() {
  editingId.value = null
  formTitle.value = ''
  formContent.value = ''
  formPinned.value = false
  formSendNotification.value = true
  formError.value = null
  showForm.value = true
}

function openEdit(a: Announcement) {
  editingId.value = a.id
  formTitle.value = a.title
  formContent.value = a.content
  formPinned.value = a.is_pinned
  formSendNotification.value = a.send_notification
  formError.value = null
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  formError.value = null
}

async function saveAnnouncement() {
  if (!eventId.value) return
  const title = formTitle.value.trim()
  if (!title) {
    formError.value = 'Title is required'
    return
  }
  saving.value = true
  formError.value = null
  try {
    if (editingId.value != null) {
      await patchAnnouncement(editingId.value, {
        title,
        content: formContent.value.trim(),
        is_pinned: formPinned.value,
        send_notification: formSendNotification.value,
      })
    } else {
      await createAnnouncement({
        event: eventId.value,
        title,
        content: formContent.value.trim(),
        is_pinned: formPinned.value,
        send_notification: formSendNotification.value,
      })
    }
    closeForm()
    await loadAnnouncements()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function confirmDelete(a: Announcement) {
  if (!confirm(`Delete "${a.title}"?`)) return
  try {
    await deleteAnnouncement(a.id)
    await loadAnnouncements()
  } catch {
    // could toast
  }
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function goBack() {
  router.push({ name: 'event-public', params: { id: String(eventId.value) } })
}
</script>

<template>
  <div class="announcements-page">
    <WebNavbar />
    <main class="announcements-main">
      <nav v-if="event" class="announcements-breadcrumbs" aria-label="Breadcrumb">
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'home' })">Home</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'events' })">Events</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="goBack">{{ event.title }}</button>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Notifications</span>
      </nav>

      <template v-if="event">
        <header class="page-header">
          <h1 class="page-title">Notifications</h1>
          <p class="page-subtitle">{{ event.title }}</p>
          <div class="header-actions">
            <button type="button" class="btn-add" @click="openCreate">+ New announcement</button>
          </div>
        </header>

        <div v-if="loading" class="state-loading">
          <div class="loader" />
          <p>Loading announcements…</p>
        </div>
        <div v-else-if="error" class="state-error">
          <p>{{ error.message }}</p>
          <button type="button" class="btn-retry" @click="loadAnnouncements">Retry</button>
        </div>
        <div v-else-if="pinnedFirst.length === 0" class="state-empty">
          <span class="empty-icon">🔔</span>
          <p>No announcements yet</p>
          <p class="hint">Create one to notify participants.</p>
          <button type="button" class="btn-add" @click="openCreate">+ New announcement</button>
        </div>
        <ul v-else class="announcements-list">
          <li v-for="a in pinnedFirst" :key="a.id" class="card announcement-card">
            <div class="announcement-body">
              <div class="announcement-top">
                <div class="announcement-head">
                  <h3 class="announcement-title">{{ a.title }}</h3>
                  <div class="announcement-badges">
                    <span v-if="a.is_pinned" class="badge badge-pinned">Pinned</span>
                    <span v-if="a.send_notification" class="badge badge-notify">Notification sent</span>
                  </div>
                </div>
                <div class="announcement-actions">
                  <button type="button" class="btn-icon" title="Edit" @click="openEdit(a)">✏️</button>
                  <button type="button" class="btn-icon btn-remove" title="Delete" @click="confirmDelete(a)">🗑️</button>
                </div>
              </div>
              <p v-if="a.content" class="announcement-content">{{ a.content }}</p>
              <div class="announcement-meta">
                <span>{{ a.author_name }}</span>
                <span class="meta-sep">·</span>
                <span>{{ formatDate(a.created_at) }}</span>
              </div>
            </div>
          </li>
        </ul>

        <!-- Form modal -->
        <Teleport to="body">
          <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
            <div class="modal-card">
              <h2 class="modal-title">{{ editingId ? 'Edit announcement' : 'New announcement' }}</h2>
              <form @submit.prevent="saveAnnouncement">
                <div class="form-group">
                  <label class="label">Title</label>
                  <input v-model="formTitle" type="text" class="input" placeholder="Announcement title" required />
                </div>
                <div class="form-group">
                  <label class="label">Content</label>
                  <textarea v-model="formContent" class="input textarea" placeholder="Message to participants" rows="4" />
                </div>
                <div class="form-group row">
                  <label class="checkbox-label">
                    <input v-model="formPinned" type="checkbox" />
                    Pin to top
                  </label>
                </div>
                <div class="form-group row">
                  <label class="checkbox-label">
                    <input v-model="formSendNotification" type="checkbox" />
                    Send notification to participants
                  </label>
                </div>
                <p v-if="formError" class="form-error">{{ formError }}</p>
                <div class="modal-actions">
                  <button type="button" class="btn-outline" @click="closeForm">Cancel</button>
                  <button type="submit" class="btn-primary" :disabled="saving">
                    {{ saving ? 'Saving…' : (editingId ? 'Update' : 'Create') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Teleport>
      </template>
    </main>
  </div>
</template>

<style scoped>
.announcements-page { min-height: 100vh; background: #fff; }
.announcements-main { max-width: 720px; margin: 0 auto; padding: 96px 24px 48px; }
@media (max-width: 768px) {
  .announcements-main { padding: 88px 16px 32px; }
}
.announcements-breadcrumbs {
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
  margin-bottom: 1.5rem; font-size: 0.875rem;
}
.breadcrumb-link { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 0; font: inherit; text-decoration: underline; }
.breadcrumb-link:hover { color: #2563eb; }
.breadcrumb-sep { color: #9ca3af; }
.breadcrumb-current { color: #111827; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
.page-subtitle { font-size: 14px; color: #6b7280; margin: 0 0 16px; }
.header-actions { margin-top: 8px; }
.btn-add { padding: 10px 18px; font-size: 14px; font-weight: 600; color: #fff; background: #1a283b; border: none; border-radius: 10px; cursor: pointer; }
.btn-add:hover { background: #2d3a4f; }
.state-loading, .state-error, .state-empty { text-align: center; padding: 48px 24px; color: #6b7280; }
.loader { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #1a283b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.btn-retry { margin-top: 12px; padding: 10px 20px; font-size: 14px; font-weight: 500; color: #1a283b; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.hint { font-size: 13px; color: #9ca3af; margin-top: 4px; margin-bottom: 16px; }
.announcements-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.announcement-card { display: flex; align-items: stretch; }
.announcement-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.announcement-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 2px; }
.announcement-head { flex: 1; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.announcement-title { margin: 0; font-size: 15px; font-weight: 700; color: #1a1a2e; line-height: 1.3; word-break: break-word; }
.announcement-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
.badge-pinned { background: #fef3c7; color: #92400e; }
.badge-notify { background: #d1fae5; color: #065f46; }
.announcement-content {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}
.announcement-meta { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.meta-sep { margin: 0 6px; }
.announcement-actions { display: flex; gap: 6px; flex-shrink: 0; }
.btn-icon { padding: 8px; border: none; background: #f3f4f6; border-radius: 8px; cursor: pointer; font-size: 14px; }
.btn-icon:hover { background: #e5e7eb; }
.btn-remove:hover { background: #fee2e2; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
.modal-card { background: #fff; border-radius: 12px; padding: 24px; max-width: 480px; width: 100%; max-height: 90vh; overflow-y: auto; }
.modal-title { margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #111827; }
.form-group { margin-bottom: 16px; }
.form-group.row { margin-bottom: 12px; }
.label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
.input { width: 100%; padding: 10px 14px; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 10px; box-sizing: border-box; }
.textarea { resize: vertical; min-height: 100px; font-family: inherit; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; cursor: pointer; }
.form-error { margin: 0 0 12px; font-size: 13px; color: #dc2626; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
.btn-outline { padding: 10px 18px; font-size: 14px; font-weight: 600; color: #1a283b; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; cursor: pointer; }
.btn-primary { padding: 10px 18px; font-size: 14px; font-weight: 600; color: #fff; background: #1a283b; border: none; border-radius: 10px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
