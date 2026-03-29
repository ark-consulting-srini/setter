// Re-export shared prompts and add mobile-specific helpers
export { JOURNAL_PROMPTS, getRandomPrompt } from '../../../packages/shared/lib/prompts'

import { JOURNAL_PROMPTS } from '../../../packages/shared/lib/prompts'

export function getNextPrompt(currentPrompt: string): string {
  const currentIndex = JOURNAL_PROMPTS.indexOf(currentPrompt)
  const nextIndex = (currentIndex + 1) % JOURNAL_PROMPTS.length
  return JOURNAL_PROMPTS[nextIndex]
}
