'use client'

import { useState, useEffect } from 'react'
import { Target, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Goal, GoalType, GoalStatus } from '@setter/shared/types'

const GOAL_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  academic: { label: 'Academic', color: 'bg-blue-100 text-blue-700' },
  athletic: { label: 'Athletic', color: 'bg-green-100 text-green-700' },
  personal: { label: 'Personal', color: 'bg-purple-100 text-purple-700' },
  college: { label: 'College', color: 'bg-amber-100 text-amber-700' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
  paused: { label: 'Paused', color: 'bg-gray-100 text-gray-600' },
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('academic')
  const [targetDate, setTargetDate] = useState('')

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    const res = await fetch('/api/goals')
    if (res.ok) setGoals(await res.json())
  }

  async function createGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        goal_type: goalType,
        target_date: targetDate || undefined,
      }),
    })

    if (res.ok) {
      setTitle('')
      setDescription('')
      setGoalType('academic')
      setTargetDate('')
      setShowForm(false)
      fetchGoals()
    }
  }

  async function updateProgress(id: string, progress: number) {
    const status: GoalStatus = progress >= 100 ? 'completed' : 'active'
    await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, progress_pct: Math.min(100, Math.max(0, progress)), status }),
    })
    fetchGoals()
  }

  const filtered = filter === 'all' ? goals : goals.filter((g) => g.goal_type === filter)
  const activeGoals = filtered.filter((g) => g.status === 'active')
  const completedGoals = filtered.filter((g) => g.status === 'completed')
  const pausedGoals = filtered.filter((g) => g.status === 'paused')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground">Track what you&apos;re working toward</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="animate-fade-in-scale">
          <CardContent className="pt-6">
            <form onSubmit={createGoal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal</Label>
                <Input
                  id="title"
                  placeholder="e.g., Maintain 3.8+ GPA"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Why this matters and how you'll get there..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="academic">Academic</option>
                    <option value="athletic">Athletic</option>
                    <option value="personal">Personal</option>
                    <option value="college">College</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Create Goal</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        {['all', 'academic', 'athletic', 'personal', 'college'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >
            {f === 'all' ? 'All' : GOAL_TYPE_CONFIG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdateProgress={updateProgress} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdateProgress={updateProgress} />
            ))}
          </div>
        </div>
      )}

      {/* Paused */}
      {pausedGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Paused</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pausedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdateProgress={updateProgress} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">No goals yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Set your first goal — whether it&apos;s acing AP World, making varsity, or preparing for college apps.
          </p>
        </div>
      )}
    </div>
  )
}

function GoalCard({
  goal,
  onUpdateProgress,
}: {
  goal: Goal
  onUpdateProgress: (id: string, progress: number) => void
}) {
  const typeConfig = GOAL_TYPE_CONFIG[goal.goal_type] ?? { label: goal.goal_type, color: '' }
  const statusConfig = STATUS_CONFIG[goal.status] ?? { label: goal.status, color: '' }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug">{goal.title}</h3>
          <Badge variant="outline" className={cn('text-[10px] px-1.5 shrink-0', typeConfig.color)}>
            {typeConfig.label}
          </Badge>
        </div>

        {goal.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{goal.description}</p>
        )}

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground">Progress</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateProgress(goal.id, goal.progress_pct - 10)}
                className="rounded p-0.5 hover:bg-muted"
                disabled={goal.progress_pct <= 0}
              >
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              <span className="text-xs font-semibold w-8 text-center">{goal.progress_pct}%</span>
              <button
                onClick={() => onUpdateProgress(goal.id, goal.progress_pct + 10)}
                className="rounded p-0.5 hover:bg-muted"
                disabled={goal.progress_pct >= 100}
              >
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                goal.progress_pct >= 100 ? 'bg-green-500' : 'bg-primary'
              )}
              style={{ width: `${goal.progress_pct}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          {goal.target_date && (
            <span>Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          )}
          <Badge variant="outline" className={cn('text-[10px] px-1.5', statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
