const STORAGE_KEY = 'poljjak_guest_used'

export function useGuestLimit() {
  const hasUsedGuestAnalysis = (): boolean => {
    if (import.meta.server) return false
    return localStorage.getItem(STORAGE_KEY) === '1'
  }

  const markGuestAnalysisUsed = (): void => {
    if (import.meta.server) return
    localStorage.setItem(STORAGE_KEY, '1')
  }

  return { hasUsedGuestAnalysis, markGuestAnalysisUsed }
}
