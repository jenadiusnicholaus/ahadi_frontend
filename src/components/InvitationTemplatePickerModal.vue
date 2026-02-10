<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  fetchInvitationTemplates,
  fetchFreeInvitationTemplates,
  fetchPremiumInvitationTemplates,
  fetchInvitationTemplatesByCategory,
  fetchInvitationTemplateCategories,
} from '@/api/invitation-templates'
import type { InvitationTemplate, InvitationTemplateCategoryOption } from '@/api/invitation-templates'

const props = withDefaults(
  defineProps<{
    open: boolean
    selectedTemplateId?: number | null
  }>(),
  { selectedTemplateId: null }
)

const emit = defineEmits<{
  close: []
  select: [template: InvitationTemplate]
}>()

type FilterTab = 'all' | 'free' | 'premium' | 'by_category'
type SortOption = 'name_asc' | 'name_desc' | 'category' | 'newest' | 'premium_first'

const templates = ref<InvitationTemplate[]>([])
const categories = ref<InvitationTemplateCategoryOption[]>([])
const selectedCategory = ref('')
const filterTab = ref<FilterTab>('all')
const loading = ref(false)
const error = ref('')
const sortBy = ref<SortOption>('name_asc')
const page = ref(1)
const hasMore = ref(true)
const loadingMore = ref(false)

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
  { value: 'category', label: 'Category' },
  { value: 'newest', label: 'Newest first' },
  { value: 'premium_first', label: 'Premium first' },
]

const categoryOptions = computed(() => {
  const list = categories.value
  const seen = new Set<string>()
  const out: { value: string; label: string }[] = []
  for (const c of list) {
    const val = (c.category ?? c.name ?? '').toString()
    const label = (c.category_display ?? c.category ?? c.name ?? val).toString()
    if (val && !seen.has(val)) {
      seen.add(val)
      out.push({ value: val, label })
    }
  }
  if (out.length === 0 && list.length === 0) return []
  return out
})

const sortedTemplates = computed(() => {
  const list = [...templates.value]
  switch (sortBy.value) {
    case 'name_asc':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'name_desc':
      return list.sort((a, b) => b.name.localeCompare(a.name))
    case 'category':
      return list.sort((a, b) =>
        (a.category_display || a.category).localeCompare(b.category_display || b.category)
      )
    case 'newest':
      return list.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
    case 'premium_first':
      return list.sort((a, b) => (b.is_premium ? 1 : 0) - (a.is_premium ? 1 : 0))
    default:
      return list
  }
})

async function loadCategories() {
  try {
    categories.value = await fetchInvitationTemplateCategories()
  } catch {
    categories.value = []
  }
}

async function loadTemplates(reset = true) {
  if (reset) {
    page.value = 1
    loading.value = true
    error.value = ''
    templates.value = []
    hasMore.value = false
  } else {
    loadingMore.value = true
  }
  try {
    if (filterTab.value === 'all') {
      const res = await fetchInvitationTemplates({ page: reset ? 1 : page.value })
      const list = res.results ?? []
      if (reset) templates.value = list
      else templates.value = [...templates.value, ...list]
      hasMore.value = !!res.next
      if (reset) page.value = 1
      else page.value += 1
    } else if (filterTab.value === 'free') {
      const list = await fetchFreeInvitationTemplates()
      templates.value = list
      hasMore.value = false
    } else if (filterTab.value === 'premium') {
      const list = await fetchPremiumInvitationTemplates()
      templates.value = list
      hasMore.value = false
    } else if (filterTab.value === 'by_category' && selectedCategory.value) {
      const list = await fetchInvitationTemplatesByCategory(selectedCategory.value)
      templates.value = list
      hasMore.value = false
    } else {
      templates.value = []
      hasMore.value = false
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load templates'
    if (reset) templates.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loadingMore.value || filterTab.value !== 'all') return
  loadTemplates(false)
}

function onFilterTab(tab: FilterTab) {
  filterTab.value = tab
  if (tab === 'by_category') loadCategories()
  loadTemplates(true)
}

watch(selectedCategory, () => {
  if (filterTab.value === 'by_category') loadTemplates(true)
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadCategories()
      loadTemplates(true)
    }
  },
  { immediate: true }
)

function onSelect(t: InvitationTemplate) {
  emit('select', t)
  emit('close')
}

function onClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="picker-backdrop" @click.self="onClose">
        <div class="picker-dialog">
          <button
            type="button"
            class="picker-close"
            aria-label="Close"
            @click="onClose"
          >
            <span aria-hidden="true">&times;</span>
          </button>
          <h2 class="picker-title">Choose Invitation Template</h2>
          <p class="picker-subtitle">Select a template for your wedding invitations</p>

          <div class="picker-filters">
            <div class="picker-tabs">
              <button
                type="button"
                class="picker-tab"
                :class="{ active: filterTab === 'all' }"
                @click="onFilterTab('all')"
              >
                All
              </button>
              <button
                type="button"
                class="picker-tab"
                :class="{ active: filterTab === 'free' }"
                @click="onFilterTab('free')"
              >
                Free
              </button>
              <button
                type="button"
                class="picker-tab"
                :class="{ active: filterTab === 'premium' }"
                @click="onFilterTab('premium')"
              >
                Premium
              </button>
              <button
                type="button"
                class="picker-tab"
                :class="{ active: filterTab === 'by_category' }"
                @click="onFilterTab('by_category')"
              >
                By category
              </button>
            </div>
            <div v-if="filterTab === 'by_category'" class="picker-category-wrap">
              <label class="picker-sort-label">
                Category
                <select v-model="selectedCategory" class="picker-sort-select picker-category-select">
                  <option value="">Select category</option>
                  <option
                    v-for="opt in categoryOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </label>
            </div>
          </div>

          <div class="picker-toolbar">
            <label class="picker-sort-label">
              Sort by
              <select v-model="sortBy" class="picker-sort-select">
                <option
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </label>
          </div>

          <div v-if="loading" class="picker-loading">Loading templates…</div>
          <p v-else-if="error" class="picker-error">{{ error }}</p>
          <div v-else class="picker-grid">
            <button
              v-for="t in sortedTemplates"
              :key="t.id"
              type="button"
              class="picker-card"
              :class="{ selected: selectedTemplateId === t.id }"
              @click="onSelect(t)"
            >
              <div
                class="picker-card-image"
                :style="{
                  background: t.primary_color
                    ? `linear-gradient(135deg, ${t.primary_color}, ${t.secondary_color || t.primary_color})`
                    : '#f3f4f6',
                }"
              >
                <img
                  v-if="t.preview_image || t.preview_image_url"
                  :src="t.preview_image || t.preview_image_url"
                  :alt="t.name"
                  class="picker-card-img"
                />
                <span v-else class="picker-card-placeholder">🎴</span>
              </div>
              <div class="picker-card-body">
                <span class="picker-card-name">{{ t.name }}</span>
                <span class="picker-card-category">{{ t.category_display || t.category }}</span>
                <span v-if="t.is_premium" class="picker-card-badge">Premium</span>
              </div>
            </button>
          </div>

          <div v-if="hasMore && !loading && templates.length > 0 && filterTab === 'all'" class="picker-load-more">
            <button
              type="button"
              class="btn-load-more"
              :disabled="loadingMore"
              @click="loadMore"
            >
              {{ loadingMore ? 'Loading…' : 'Load more' }}
            </button>
          </div>

          <button type="button" class="picker-cancel" @click="onClose">
            Cancel
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}

.picker-dialog {
  position: relative;
  width: 100%;
  max-width: min(1100px, 95vw);
  max-height: 88vh;
  min-height: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.picker-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-close:hover {
  background: #e5e7eb;
}

.picker-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
}

.picker-subtitle {
  margin: 0 0 20px;
  font-size: 0.875rem;
  color: #6b7280;
}

.picker-filters {
  margin-bottom: 16px;
}
.picker-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.picker-tab {
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}
.picker-tab:hover {
  background: #e5e7eb;
}
.picker-tab.active {
  background: #1a283b;
  color: #fff;
  border-color: #1a283b;
}
.picker-category-wrap {
  margin-top: 4px;
}
.picker-category-select {
  min-width: 180px;
}
.picker-toolbar {
  margin-bottom: 16px;
}

.picker-sort-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #374151;
}

.picker-sort-select {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  background: #fff;
}

.picker-loading,
.picker-error {
  padding: 32px;
  text-align: center;
  color: #6b7280;
}

.picker-error {
  color: #dc2626;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 18px;
  overflow-y: auto;
  flex: 1;
  min-height: 280px;
}

.picker-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.picker-card:hover {
  border-color: #1a283b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.picker-card.selected {
  border-color: #1a283b;
  box-shadow: 0 0 0 2px rgba(26, 40, 59, 0.2);
}

.picker-card-image {
  height: 120px;
  border-radius: 10px 10px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.picker-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picker-card-placeholder {
  font-size: 2rem;
}

.picker-card-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.picker-card-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a1a2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-card-category {
  font-size: 0.75rem;
  color: #6b7280;
}

.picker-card-badge {
  font-size: 0.625rem;
  font-weight: 600;
  color: #b45309;
  margin-top: 2px;
}

.picker-load-more {
  margin-top: 16px;
  text-align: center;
}

.btn-load-more {
  padding: 8px 20px;
  font-size: 0.875rem;
  color: #1a283b;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}

.btn-load-more:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.picker-cancel {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 0.875rem;
  color: #6b7280;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  align-self: center;
}

.picker-cancel:hover {
  background: #f9fafb;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .picker-dialog,
.modal-leave-active .picker-dialog {
  transition: transform 0.2s ease;
}
.modal-enter-from .picker-dialog,
.modal-leave-to .picker-dialog {
  transform: scale(0.98);
}
</style>
