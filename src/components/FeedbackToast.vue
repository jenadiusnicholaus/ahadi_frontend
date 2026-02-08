<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

const props = withDefaults(
  defineProps<{
    message: string
    type?: ToastType
    duration?: number
    show?: boolean
  }>(),
  {
    type: 'info',
    duration: 4000,
    show: false,
  }
)

const emit = defineEmits<{
  close: []
}>()

const visible = ref(props.show)
let timeoutId: ReturnType<typeof setTimeout> | null = null

function dismiss() {
  visible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  emit('close')
}

watch(
  () => props.show,
  (show) => {
    visible.value = show
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (show && props.duration > 0) {
      timeoutId = setTimeout(dismiss, props.duration)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
})

const icons: Record<ToastType, string> = {
  success:
    '<path d="M20 6L9 15l-5-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  error:
    '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  info: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  warning:
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="feedback-toast">
      <div
        v-show="visible"
        class="feedback-toast"
        :class="`feedback-toast--${type}`"
        role="alert"
        aria-live="polite"
      >
        <span class="feedback-toast__icon" :class="`feedback-toast__icon--${type}`" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" v-html="icons[type]" />
        </span>
        <p class="feedback-toast__message">{{ message }}</p>
        <button
          type="button"
          class="feedback-toast__close"
          aria-label="Dismiss"
          @click="dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.feedback-toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem 0.75rem 1rem;
  padding-right: 2.25rem;
  max-width: min(22rem, calc(100vw - 2rem));
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  pointer-events: auto;
}

.feedback-toast--success {
  border-left: 4px solid #10b981;
}
.feedback-toast--error {
  border-left: 4px solid #ef4444;
}
.feedback-toast--info {
  border-left: 4px solid #3b82f6;
}
.feedback-toast--warning {
  border-left: 4px solid #f59e0b;
}

.feedback-toast__icon {
  flex-shrink: 0;
}
.feedback-toast__icon--success { color: #10b981; }
.feedback-toast__icon--error { color: #ef4444; }
.feedback-toast__icon--info { color: #3b82f6; }
.feedback-toast__icon--warning { color: #f59e0b; }

.feedback-toast__message {
  flex: 1;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  color: #1f2937;
  word-break: break-word;
}

.feedback-toast__close {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.feedback-toast__close:hover {
  color: #4b5563;
  background: #f3f4f6;
}
.feedback-toast__close:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Enter/leave */
.feedback-toast-enter-active,
.feedback-toast-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.feedback-toast-enter-from,
.feedback-toast-leave-to {
  transform: translate(-50%, 1rem);
  opacity: 0;
}
.feedback-toast-enter-to,
.feedback-toast-leave-from {
  transform: translate(-50%, 0);
  opacity: 1;
}
</style>
