<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import { fetchEventById } from '@/api/event'
import { fetchParticipants, type Participant } from '@/api/participants'
import {
  fetchInvitations,
  createInvitation,
  patchInvitation,
  deleteInvitation,
  sendInvitation,
  type Invitation,
  type InvitationCreatePayload,
} from '@/api/invitations'
import type { PublicEvent } from '@/types/events'

const route = useRoute()
const router = useRouter()
const event = ref<PublicEvent | null>(null)
const invitations = ref<Invitation[]>([])
const participants = ref<Participant[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const editingId = ref<number | null>(null)
const formParticipant = ref<number | ''>('')
const formMessage = ref('')
const formTemplate = ref('')
const formStatus = ref('DRAFT')
const saving = ref(false)
const formError = ref<string | null>(null)
const sendingId = ref<number | null>(null)
const page = ref(1)
const hasNext = ref(false)

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

async function loadParticipants() {
  if (!eventId.value) return
  try {
    const res = await fetchParticipants({ event: eventId.value, page_size: 500 })
    participants.value = res.results ?? []
  } catch {
    participants.value = []
  }
}

async function loadInvitations() {
  if (!eventId.value) return
  loading.value = true
  error.value = null
  try {
    const res = await fetchInvitations({ page: 1, event: eventId.value })
    const raw = res.results ?? []
    invitations.value = raw.filter((inv) => inv.event === eventId.value)
    hasNext.value = !!res.next
    page.value = 1
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load invitations'
    invitations.value = []
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!eventId.value || !hasNext.value) return
  const nextPage = page.value + 1
  try {
    const res = await fetchInvitations({ page: nextPage, event: eventId.value })
    const raw = (res.results ?? []).filter((inv) => inv.event === eventId.value)
    invitations.value = [...invitations.value, ...raw]
    hasNext.value = !!res.next
    page.value = nextPage
  } catch {
    // ignore
  }
}

async function load() {
  if (!eventId.value) return
  await loadEvent()
  await loadParticipants()
  await loadInvitations()
}

onMounted(() => load())
watch(() => route.params.id, () => load())

function openCreate() {
  editingId.value = null
  formParticipant.value = ''
  formMessage.value = ''
  formTemplate.value = ''
  formStatus.value = 'DRAFT'
  formError.value = null
  showForm.value = true
}

function openEdit(inv: Invitation) {
  editingId.value = inv.id
  formParticipant.value = inv.participant
  formMessage.value = inv.message ?? ''
  formTemplate.value = inv.template ?? ''
  formStatus.value = inv.status ?? 'DRAFT'
  formError.value = null
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  formError.value = null
}

async function saveInvitation() {
  if (!eventId.value) return
  const participantId = typeof formParticipant.value === 'number' ? formParticipant.value : Number(formParticipant.value)
  if (!participantId) {
    formError.value = 'Please select a participant'
    return
  }
  saving.value = true
  formError.value = null
  try {
    const payload: InvitationCreatePayload = {
      event: eventId.value,
      participant: participantId,
      message: formMessage.value.trim() || undefined,
      template: formTemplate.value.trim() || undefined,
      status: formStatus.value || undefined,
    }
    if (editingId.value != null) {
      await patchInvitation(editingId.value, payload)
    } else {
      await createInvitation(payload)
    }
    closeForm()
    await loadInvitations()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function doSend(inv: Invitation) {
  if (sendingId.value != null) return
  sendingId.value = inv.id
  try {
    await sendInvitation(inv.id)
    await loadInvitations()
  } catch {
    // could toast
  } finally {
    sendingId.value = null
  }
}

async function confirmDelete(inv: Invitation) {
  if (!confirm(`Delete invitation for ${inv.participant_name}?`)) return
  try {
    await deleteInvitation(inv.id)
    await loadInvitations()
  } catch {
    // could toast
  }
}

function formatDate(iso?: string | null): string {
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

function participantName(id: number): string {
  const p = participants.value.find((x) => x.id === id)
  return p?.name ?? `Participant #${id}`
}
</script>

<template>
  <div class="invitations-page">
    <WebNavbar />
    <main class="invitations-main">
      <nav v-if="event" class="invitations-breadcrumbs" aria-label="Breadcrumb">
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'home' })">Home</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="router.push({ name: 'events' })">Events</button>
        <span class="breadcrumb-sep">/</span>
        <button type="button" class="breadcrumb-link" @click="goBack">{{ event.title }}</button>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Invitations</span>
      </nav>

      <template v-if="event">
        <header class="page-header">
          <h1 class="page-title">Invitations</h1>
          <p class="page-subtitle">{{ event.title }}</p>
          <div class="header-actions">
            <button type="button" class="btn-add" @click="openCreate">+ New invitation</button>
          </div>
        </header>

        <div v-if="loading" class="state-loading">
          <div class="loader" />
          <p>Loading invitations…</p>
        </div>
        <div v-else-if="error" class="state-error">
          <p>{{ error }}</p>
          <button type="button" class="btn-retry" @click="loadInvitations">Retry</button>
        </div>
        <div v-else-if="invitations.length === 0" class="state-empty">
          <span class="empty-icon">✉️</span>
          <p>No invitations yet</p>
          <p class="hint">Create an invitation for a participant to send via your chosen channel.</p>
          <button type="button" class="btn-add" @click="openCreate">+ New invitation</button>
        </div>
        <ul v-else class="invitations-list">
          <li v-for="inv in invitations" :key="inv.id" class="card invitation-card">
            <div class="invitation-body">
              <div class="invitation-top">
                <div class="invitation-head">
                  <h3 class="invitation-title">{{ inv.participant_name || participantName(inv.participant) }}</h3>
                  <div class="invitation-badges">
                    <span class="badge" :class="'badge-' + (inv.status?.toLowerCase() ?? 'draft')">{{ inv.status || 'DRAFT' }}</span>
                    <span v-if="inv.sent_via" class="badge badge-via">{{ inv.sent_via }}</span>
                  </div>
                </div>
                <div class="invitation-actions">
                  <button
                    v-if="inv.status !== 'SENT'"
                    type="button"
                    class="btn-icon btn-send"
                    title="Send"
                    :disabled="sendingId === inv.id"
                    @click="doSend(inv)"
                  >
                    {{ sendingId === inv.id ? '…' : '📤' }}
                  </button>
                  <button type="button" class="btn-icon" title="Edit" @click="openEdit(inv)">✏️</button>
                  <button type="button" class="btn-icon btn-remove" title="Delete" @click="confirmDelete(inv)">🗑️</button>
                </div>
              </div>
              <p v-if="inv.message" class="invitation-message">{{ inv.message }}</p>
              <div class="invitation-meta">
                <span v-if="inv.participant_phone">{{ inv.participant_phone }}</span>
                <span v-if="inv.sent_at" class="meta-sep">· Sent {{ formatDate(inv.sent_at) }}</span>
                <span v-if="inv.viewed_at" class="meta-sep">· Viewed {{ formatDate(inv.viewed_at) }}</span>
                <span class="meta-sep">· Created {{ formatDate(inv.created_at) }}</span>
              </div>
              <div v-if="inv.share_link" class="invitation-links">
                <a v-if="inv.share_link" :href="inv.share_link" target="_blank" rel="noopener" class="link-small">Share link</a>
                <a v-if="inv.pdf_url" :href="inv.pdf_url" target="_blank" rel="noopener" class="link-small">PDF</a>
              </div>
            </div>
          </li>
        </ul>
        <div v-if="hasNext && invitations.length > 0" class="load-more">
          <button type="button" class="btn-outline" @click="loadMore">Load more</button>
        </div>

        <!-- Form modal -->
        <Teleport to="body">
          <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
            <div class="modal-card">
              <h2 class="modal-title">{{ editingId ? 'Edit invitation' : 'New invitation' }}</h2>
              <form @submit.prevent="saveInvitation">
                <div class="form-group">
                  <label class="label">Participant</label>
                  <select
                    v-model="formParticipant"
                    class="input"
                    required
                    :disabled="!!editingId"
                  >
                    <option value="">Select participant</option>
                    <option v-for="p in participants" :key="p.id" :value="p.id">
                      {{ p.name }} {{ p.phone ? `(${p.phone})` : '' }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="label">Message</label>
                  <textarea v-model="formMessage" class="input textarea" placeholder="Optional message" rows="3" />
                </div>
                <div class="form-group">
                  <label class="label">Template</label>
                  <input v-model="formTemplate" type="text" class="input" placeholder="Optional template name" />
                </div>
                <div v-if="editingId" class="form-group">
                  <label class="label">Status</label>
                  <select v-model="formStatus" class="input">
                    <option value="DRAFT">DRAFT</option>
                    <option value="SENT">SENT</option>
                    <option value="VIEWED">VIEWED</option>
                  </select>
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
.invitations-page { min-height: 100vh; background: #fff; }
.invitations-main { max-width: 720px; margin: 0 auto; padding: 96px 24px 48px; }
@media (max-width: 768px) {
  .invitations-main { padding: 88px 16px 32px; }
}
.invitations-breadcrumbs {
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
.invitations-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.invitation-card { display: flex; align-items: stretch; }
.invitation-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.invitation-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 2px; }
.invitation-head { flex: 1; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.invitation-title { margin: 0; font-size: 15px; font-weight: 700; color: #1a1a2e; line-height: 1.3; word-break: break-word; }
.invitation-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
.badge-draft { background: #f3f4f6; color: #374151; }
.badge-sent { background: #d1fae5; color: #065f46; }
.badge-viewed { background: #dbeafe; color: #1e40af; }
.badge-via { background: #e0e7ff; color: #3730a3; }
.invitation-message { margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.invitation-meta { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.meta-sep { margin: 0 6px; }
.invitation-links { display: flex; gap: 12px; margin-top: 4px; }
.link-small { font-size: 12px; color: #3b82f6; text-decoration: none; }
.link-small:hover { text-decoration: underline; }
.invitation-actions { display: flex; gap: 6px; flex-shrink: 0; }
.btn-icon { padding: 8px; border: none; background: #f3f4f6; border-radius: 8px; cursor: pointer; font-size: 14px; }
.btn-icon:hover { background: #e5e7eb; }
.btn-icon:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-send:hover { background: #d1fae5; }
.btn-remove:hover { background: #fee2e2; }
.load-more { text-align: center; margin-top: 20px; }
.btn-outline { padding: 10px 18px; font-size: 14px; font-weight: 600; color: #1a283b; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; cursor: pointer; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
.modal-card { background: #fff; border-radius: 12px; padding: 24px; max-width: 480px; width: 100%; max-height: 90vh; overflow-y: auto; }
.modal-title { margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #111827; }
.form-group { margin-bottom: 16px; }
.form-group.row { margin-bottom: 12px; }
.label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
.input { width: 100%; padding: 10px 14px; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 10px; box-sizing: border-box; }
.textarea { resize: vertical; min-height: 80px; font-family: inherit; }
.form-error { margin: 0 0 12px; font-size: 13px; color: #dc2626; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
.btn-primary { padding: 10px 18px; font-size: 14px; font-weight: 600; color: #fff; background: #1a283b; border: none; border-radius: 10px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
