import VuePdfEmbed from 'vue-pdf-embed'
import { GlobalWorkerOptions } from 'pdfjs-dist'

export default defineNuxtPlugin((nuxtApp) => {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  nuxtApp.vueApp.component('vue-pdf-embed', VuePdfEmbed)
})
