<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import type { ToastItem } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

function close(item: ToastItem) {
  dismiss(item.id)
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" role="region" aria-label="Notifications">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div
          v-for="item in toasts"
          :key="String(item.id)"
          class="toast"
          :class="[`toast--${item.type}`]"
          role="alert"
        >
          <span class="toast__icon" :class="`toast__icon--${item.type}`" aria-hidden="true">
            <!-- success: check -->
            <svg v-if="item.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 15l-5-4" />
            </svg>
            <!-- error: X -->
            <svg v-else-if="item.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18" /><path d="m6 6 12 12" />
            </svg>
            <!-- info: circle-i -->
            <svg v-else-if="item.type === 'info'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
            <!-- warning: triangle -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
            </svg>
          </span>
          <p class="toast__message">{{ item.message }}</p>
          <button
            type="button"
            class="toast__close"
            aria-label="Dismiss"
            @click="close(item)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <span
            v-if="item.duration > 0"
            class="toast__progress"
            :style="{ animationDuration: `${item.duration}ms` }"
            aria-hidden="true"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: min(24rem, calc(100vw - 2rem));
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: auto;
}

.toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  padding-right: 2.25rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.08);
  border-left: 4px solid;
  overflow: hidden;
  pointer-events: auto;
}

.toast--success {
  border-left-color: #059669;
}
.toast--error {
  border-left-color: #dc2626;
}
.toast--info {
  border-left-color: #0284c7;
}
.toast--warning {
  border-left-color: #d97706;
}

.toast__icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}
.toast__icon--success { color: #059669; }
.toast__icon--error { color: #dc2626; }
.toast__icon--info { color: #0284c7; }
.toast__icon--warning { color: #d97706; }

.toast__message {
  flex: 1;
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.4;
  color: #1f2937;
  word-break: break-word;
}

.toast__close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.toast__close:hover {
  color: #374151;
  background: #f3f4f6;
}
.toast__close:focus-visible {
  outline: 2px solid #0284c7;
  outline-offset: 2px;
}

.toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.35;
  transform-origin: left;
  animation: toast-shrink linear forwards;
}
.toast--success .toast__progress { color: #059669; }
.toast--error .toast__progress { color: #dc2626; }
.toast--info .toast__progress { color: #0284c7; }
.toast--warning .toast__progress { color: #d97706; }

@keyframes toast-shrink {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* Enter/leave transitions */
.toast-enter-active {
  transition: transform 0.25s ease-out, opacity 0.25s ease-out;
}
.toast-leave-active {
  transition: transform 0.2s ease-in, opacity 0.2s ease-in;
}
.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.toast-move {
  transition: transform 0.25s ease;
}
</style>
