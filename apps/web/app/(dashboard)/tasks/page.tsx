'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { Task, TaskCategory, TaskPriority } from '@setter/shared/types'
import { CATEGORY_LABELS } from '@setter/shared/types'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
}

type FilterCategory = TaskCategory | 'all'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<FilterCategory>('all')
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TaskCategory>('school')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data: Task[] = await res.json()
        setTasks(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          priority,
          due_date: dueDate || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to create task')

      const newTask: Task = await res.json()
      setTasks((prev) => [newTask, ...prev])
      setTitle('')
      setDueDate('')
      setShowForm(false)
      toast({ title: 'Task created', variant: 'success' })
    } catch {
      toast({ title: 'Failed to create task', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  async function completeTask(taskId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed' as const, completed_at: new Date().toISOString() }
          : t
      )
    )

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (!res.ok) throw new Error('Failed')

      toast({ title: 'Task completed!', variant: 'success' })
      fetch('/api/achievements/check', { method: 'POST' }).catch(() => {})
    } catch {
      fetchTasks()
      toast({ title: 'Failed to complete task', variant: 'destructive' })
    }
  }

  async function deleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Task deleted' })
    } catch {
      fetchTasks()
      toast({ title: 'Failed to delete task', variant: 'destructive' })
    }
  }

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.category === filter)

  const today = new Date().toISOString().split('T')[0]
  const todayTasks = filtered.filter(
    (t) => t.status !== 'completed' && t.due_date && t.due_date <= today
  )
  const upcomingTasks = filtered.filter(
    (t) => t.status !== 'completed' && (!t.due_date || t.due_date > today)
  )
  const completedTasks = filtered.filter((t) => t.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Stay on top of your game.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Create Task Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  placeholder="What needs to get done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="task-category">Category</Label>
                  <Select
                    id="task-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select
                    id="task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-due">Due Date</Label>
                  <Input
                    id="task-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating || !title.trim()}>
                  {creating ? 'Creating...' : 'Create Task'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <Button
            key={value}
            variant={filter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(value as TaskCategory)}
          >
            {label}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading tasks...</p>
      ) : (
        <div className="space-y-6">
          <TaskGroup
            title="Today & Overdue"
            tasks={todayTasks}
            onComplete={completeTask}
            onDelete={deleteTask}
          />
          <TaskGroup
            title="Upcoming"
            tasks={upcomingTasks}
            onComplete={completeTask}
            onDelete={deleteTask}
          />
          <TaskGroup
            title="Completed"
            tasks={completedTasks}
            onComplete={completeTask}
            onDelete={deleteTask}
            isCompleted
          />
        </div>
      )}
    </div>
  )
}

function TaskGroup({
  title,
  tasks,
  onComplete,
  onDelete,
  isCompleted = false,
}: {
  title: string
  tasks: Task[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  isCompleted?: boolean
}) {
  if (tasks.length === 0) return null

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title} ({tasks.length})
      </h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 transition-colors',
              isCompleted && 'opacity-60'
            )}
          >
            {!isCompleted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
                onClick={() => onComplete(task.id)}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            {isCompleted && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm', isCompleted && 'line-through')}>
                {task.title}
              </p>
              {task.due_date && (
                <p className="text-xs text-muted-foreground">
                  Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  PRIORITY_COLORS[task.priority]
                )}
                title={`${task.priority} priority`}
              />
              <Badge variant={task.category as TaskCategory}>
                {CATEGORY_LABELS[task.category]}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
