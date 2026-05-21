import type { StateTree } from 'pinia'
import { createPinia, setActivePinia } from 'pinia'
import { toRaw } from 'vue'

type PiniaPayload = Record<string, StateTree>

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = createPinia()
  const payload = nuxtApp.payload as typeof nuxtApp.payload & { pinia?: PiniaPayload }

  nuxtApp.vueApp.use(pinia)
  setActivePinia(pinia)

  if (payload.pinia) {
    pinia.state.value = payload.pinia
  }

  if (import.meta.server) {
    nuxtApp.hook('app:rendered', () => {
      payload.pinia = toRaw(pinia.state.value)
      setActivePinia(undefined)
    })
  }

  return {
    provide: {
      pinia,
    },
  }
})
