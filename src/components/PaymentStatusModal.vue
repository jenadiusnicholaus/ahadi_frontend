<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  variant?: 'success' | 'error'
  title: string
  message: string
  primaryLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'primary'): void
}>()

const close = () => {
  emit('update:modelValue', false)
}

const onPrimary = () => {
  emit('primary')
}
</script>

<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="modelValue" class="psm-backdrop" role="dialog" aria-modal="true">
        <div class="psm-modal">
          <div class="psm-icon-wrap" :class="variant === 'error' ? 'psm-icon-error' : 'psm-icon-success'">
            <span v-if="variant !== 'error'">✓</span>
            <span v-else>!</span>
          </div>
          <h2 class="psm-title">
            {{ title }}
          </h2>
          <p class="psm-message">
            {{ message }}
          </p>
          <div class="psm-actions">
            <button type="button" class="psm-btn psm-btn-secondary" @click="close">
              Close
            </button>
            <button
              v-if="primaryLabel"
              type="button"
              class="psm-btn psm-btn-primary"
              @click="onPrimary"
            >
              {{ primaryLabel }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.psm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.psm-modal {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 18px;
  padding: 1.75rem 1.75rem 1.5rem;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.28);
  text-align: center;
}

.psm-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  margin: 0 auto 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.psm-icon-success {
  background: #ecfdf3;
  color: #16a34a;
}

.psm-icon-error {
  background: #fef2f2;
  color: #dc2626;
}

.psm-title {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.psm-message {
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
  color: #4b5563;
}

.psm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.psm-btn {
  padding: 0.6rem 1.1rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
}

.psm-btn-secondary {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #374151;
}

.psm-btn-secondary:hover {
  background: #f3f4f6;
}

.psm-btn-primary {
  background: #111827;
  color: #ffffff;
}

.psm-btn-primary:hover {
  background: #1f2937;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

