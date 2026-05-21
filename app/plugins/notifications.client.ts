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

      await notifStore.fetch()

      channel = client
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            notifStore.fetch()
          }
        )
        .subscribe()
    },
    { immediate: true }
  )
})
