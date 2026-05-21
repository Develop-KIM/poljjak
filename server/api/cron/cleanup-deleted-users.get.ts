import { hardDeleteExpiredUsers } from '../../utils/deleted-users'
import { requireCronAuth } from '../../utils/cron'

export default defineEventHandler(async (event) => {
  requireCronAuth(event)

  const result = await hardDeleteExpiredUsers()

  return {
    data: {
      deleted: result.deleted,
      before: result.cutoff,
    },
  }
})
