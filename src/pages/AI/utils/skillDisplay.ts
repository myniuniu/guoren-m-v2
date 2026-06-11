import type { SkillSummaryItem } from '../../../services/skills'

export function filterSkillItems(items: SkillSummaryItem[], keyword: string): SkillSummaryItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return items
  }

  return items.filter((item) => (
    item.title.toLowerCase().includes(normalizedKeyword)
    || item.description.toLowerCase().includes(normalizedKeyword)
    || item.skillName.toLowerCase().includes(normalizedKeyword)
    || item.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword))
  ))
}

export function getSkillCardTags(skill: Pick<SkillSummaryItem, 'tags'>): string[] {
  return skill.tags.slice(0, 3)
}
