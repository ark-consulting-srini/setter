export const JOURNAL_PROMPTS: string[] = [
  "What's one thing you crushed today — on the court or off?",
  "If you could replay one moment from today, what would it be and why?",
  "What's something that challenged you this week, and how did you handle it?",
  "Write about a teammate or friend who made your day better recently.",
  "What's one goal you're working toward right now? How does it feel?",
  "Describe a moment this week where you felt proud of yourself.",
  "If future-you could read this entry, what would you want her to know?",
  "What's something you're learning — in class, in volleyball, or about yourself?",
  "Write about a time you bounced back from something tough. What helped?",
  "What are three things you're grateful for today? Be specific.",
]

export function getRandomPrompt(): string {
  return JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]
}

export function getDailyPrompt(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return JOURNAL_PROMPTS[dayOfYear % JOURNAL_PROMPTS.length]
}
