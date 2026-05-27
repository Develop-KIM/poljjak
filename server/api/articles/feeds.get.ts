import { FEED_SOURCES } from '../../utils/rss'

export default defineEventHandler(() => {
  const domestic = FEED_SOURCES
    .filter((f) => f.category === 'domestic')
    .map((f) => f.name)

  const international = FEED_SOURCES
    .filter((f) => f.category === 'international')
    .map((f) => f.name)

  return { data: { domestic, international } }
})
