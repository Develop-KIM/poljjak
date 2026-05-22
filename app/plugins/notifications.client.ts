export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const client = useSupabaseClient()
  const notifStore = useNotificationStore()

  let channel: ReturnType<typeof client.channel> | null = null

  function unsubscribe() {
    channel?.unsubscribe()
    channel = null
  }

  watch(
    () => user.value?.id,
    async (userId) => {
      unsubscribe()

      if (!userId) {
        notifStore.notifications = []
        return
      }

      // 초기 알림 목록 로드
      await notifStore.fetch()

      channel = client
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          // INSERT 이벤트만 구독해 새 알림만 앞에 추가 (전체 재조회 불필요)
          () => {
            notifStore.fetch()
          }
        )
        .subscribe()
    },
    { immediate: true }
  )
})
