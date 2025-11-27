import {
  RectangleStackIcon,
  PaintBrushIcon,
  CodeBracketIcon,
  LightBulbIcon,
  MegaphoneIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline'

export const CATEGORIES = [
  { id: 'all', name: '전체', icon: RectangleStackIcon },
  { id: 'design', name: '디자인', icon: PaintBrushIcon },
  { id: 'dev', name: '개발', icon: CodeBracketIcon },
  { id: 'planning', name: '기획', icon: LightBulbIcon },
  { id: 'marketing', name: '마케팅', icon: MegaphoneIcon },
  { id: 'data', name: '데이터', icon: ChartBarIcon },
]

export const getCategoryName = (id) => {
  return CATEGORIES.find((c) => c.id === id)?.name || '전체'
}

export const getCategoryIcon = (id) => {
  return CATEGORIES.find((c) => c.id === id)?.icon || RectangleStackIcon
}
