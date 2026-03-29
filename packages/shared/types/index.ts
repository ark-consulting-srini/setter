// ============================================
// Setter App — Shared TypeScript Types
// packages/shared/types/index.ts
// ============================================

// ---- Enums ----

export type TaskCategory = 'school' | 'personal' | 'extracurricular' | 'athletic' | 'college_prep'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export type MoodType = 'great' | 'good' | 'okay' | 'tough' | 'rough'

export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned'
export type GoalType = 'college' | 'personal' | 'athletic' | 'academic'

export type AchievementSource = 'auto' | 'manual'
export type AchievementCategory = 'academic' | 'athletic' | 'leadership' | 'community' | 'personal' | 'streak'

export type LinkedEntityType = 'task' | 'journal_entry' | 'achievement' | 'goal'

// ---- Database Entities ----

export interface User {
  id: string
  full_name: string
  grade_level: 9 | 10 | 11 | 12 | null
  sport: string
  position: string
  college_target: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  content: string
  mood: MoodType | null
  prompt_used: string | null
  is_private: boolean
  has_attachment: boolean
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  goal_type: GoalType
  status: GoalStatus
  target_date: string | null
  progress_pct: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  user_id: string
  title: string
  description: string | null
  source: AchievementSource
  category: AchievementCategory
  is_portfolio_visible: boolean
  achieved_at: string
  created_at: string
}

export interface Upload {
  id: string
  user_id: string
  file_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  linked_entity_type: LinkedEntityType | null
  linked_entity_id: string | null
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  messages: ChatMessage[]
  context_snapshot: AIContext | null
  created_at: string
  updated_at: string
}

// ---- Chat / AI Types ----

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AIContext {
  user: Pick<User, 'full_name' | 'grade_level' | 'sport' | 'position' | 'college_target'>
  recentTasks: {
    completed: Pick<Task, 'title' | 'category' | 'completed_at'>[]
    pending: Pick<Task, 'title' | 'category' | 'priority' | 'due_date'>[]
  }
  recentJournal: Pick<JournalEntry, 'content' | 'mood' | 'created_at'>[]
  activeGoals: Pick<Goal, 'title' | 'goal_type' | 'progress_pct' | 'target_date'>[]
  recentAchievements: Pick<Achievement, 'title' | 'category' | 'achieved_at'>[]
  allAchievements: Pick<Achievement, 'title' | 'description' | 'category' | 'achieved_at'>[]
}

// ---- API Request/Response Types ----

export interface ChatRequest {
  sessionId: string | null
  message: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  category?: TaskCategory
  priority?: TaskPriority
  due_date?: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  category?: TaskCategory
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string
}

export interface CreateJournalEntryRequest {
  content: string
  mood?: MoodType
  prompt_used?: string
  is_private?: boolean
}

export interface CreateGoalRequest {
  title: string
  description?: string
  goal_type?: GoalType
  target_date?: string
}

export interface CreateAchievementRequest {
  title: string
  description?: string
  category?: AchievementCategory
  achieved_at?: string
  is_portfolio_visible?: boolean
}

// ---- UI Helper Types ----

export interface DashboardSummary {
  tasksToday: number
  tasksCompletedThisWeek: number
  currentStreak: number
  achievementsThisMonth: number
  activeGoals: number
}

export const GRADE_LABELS: Record<number, string> = {
  9: '9th Grade (Freshman)',
  10: '10th Grade (Sophomore)',
  11: '11th Grade (Junior)',
  12: '12th Grade (Senior)',
}

export const MOOD_EMOJI: Record<MoodType, string> = {
  great: '🏆',
  good: '😊',
  okay: '😐',
  tough: '😔',
  rough: '😤',
}

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  school: 'School',
  personal: 'Personal',
  extracurricular: 'Extracurricular',
  athletic: 'Athletic',
  college_prep: 'College Prep',
}
