/**
 * Reusable toast: show success, error, info, warning messages.
 * Use with ToastContainer in the app (e.g. in App.vue).
 *
 * Example (after ToastContainer is mounted):
 *   const toast = useToast()
 *   toast.success('Event created')
 *   toast.error('Something went wrong')
 */

import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: symbol
  type: ToastType
  message: string
  duration: number
  createdAt: number
}

const toasts = ref<ToastItem[]>([])
const defaultDuration = 5000

function addToast(type: ToastType, message: string, duration = defaultDuration): symbol {
  const id = Symbol('toast')
  toasts.value = [
    ...toasts.value,
    {
      id,
      type,
      message,
      duration,
      createdAt: Date.now(),
    },
  ]
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }
  return id
}

function removeToast(id: symbol): void {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    success: (message: string, duration = defaultDuration) => addToast('success', message, duration),
    error: (message: string, duration = defaultDuration) => addToast('error', message, duration),
    info: (message: string, duration = defaultDuration) => addToast('info', message, duration),
    warning: (message: string, duration = defaultDuration) => addToast('warning', message, duration),
    show: (message: string, type: ToastType = 'info', duration = defaultDuration) =>
      addToast(type, message, duration),
    dismiss: removeToast,
  }
}
