import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'error' | 'success' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let counter = 0

  function show(message: string, type: ToastType = 'info', duration = 4000) {
    const id = ++counter
    toasts.value.push({ id, type, message })
    setTimeout(() => remove(id), duration)
  }

  function error(message: string) {
    show(message, 'error', 5000)
  }

  function success(message: string) {
    show(message, 'success', 3000)
  }

  function remove(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return { toasts, show, error, success, remove }
})
