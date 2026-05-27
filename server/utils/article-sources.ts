const SOURCE_GROUPS: Record<string, string[]> = {
  네이버: ['네이버 D2', '네이버 클라우드'],
  카카오: ['카카오 기술 블로그', '카카오페이 기술 블로그', '카카오엔터 기술 블로그'],
}

export function getArticleSourceLabel(feedName: string) {
  for (const [label, names] of Object.entries(SOURCE_GROUPS)) {
    if (label === feedName || names.includes(feedName)) return label
  }
  return feedName
}

export function getArticleSourceNames(label: string) {
  return SOURCE_GROUPS[label] ?? [label]
}

export function isArticleSourceMatch(subscriptionFeedName: string | null, articleFeedName: string) {
  if (!subscriptionFeedName) return false
  return getArticleSourceNames(subscriptionFeedName).includes(articleFeedName)
    || getArticleSourceLabel(articleFeedName) === getArticleSourceLabel(subscriptionFeedName)
}
