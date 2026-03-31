'use client'

import { useEffect, useState } from 'react'
import { Plus, Check, ChevronLeft, ChevronRight, Repeat, Clock, Trash2, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Task, TaskCategory, TaskPriority } from '@setter/shared/types'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
}

const PRIORITY_BG: Record<TaskPriority, string> = {
  high: 'border-l-red-400 bg-red-50',
  medium: 'border-l-amber-400 bg-amber-50',
  low: 'border-l-emerald-400 bg-emerald-50',
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'One-time' },
  { value: 'weekly', label: 'Every week' },
  { value: 'weekdays', label: 'Every weekday (Mon-Fri)' },
  { value: 'custom', label: 'Custom days...' },
]

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function dateToStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [showAddModal, setShowAddModal] = useState<{ date: string } | null>(null)
  const [showRecurring, setShowRecurring] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newCategory, setNewCategory] = useState<TaskCategory>('school')
  const [newTime, setNewTime] = useState('')
  const [recurrence, setRecurrence] = useState('none')
  const [customDays, setCustomDays] = useState<number[]>([])
  const [recurWeeks, setRecurWeeks] = useState(4)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const weekDates = getWeekDates(weekOffset)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  useEffect(() => { fetchTasks() }, [weekOffset])

  async function fetchTasks() {
    const res = await fetch('/api/tasks')
    if (res.ok) setTasks(await res.json())
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return

    const titleWithTime = newTime ? `${newTime} — ${newTitle.trim()}` : newTitle.trim()

    if (recurrence === 'none' && showAddModal) {
      // Single task
      await createTask(titleWithTime, showAddModal.date)
    } else {
      // Recurring — generate tasks for multiple weeks
      const datesToCreate = getRecurringDates()
      for (const date of datesToCreate) {
        await createTask(titleWithTime, date)
      }
    }

    resetForm()
    fetchTasks()
  }

  async function createTask(title: string, dueDate: string) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category: newCategory,
        priority: newPriority,
        due_date: dueDate,
      }),
    })
  }

  function getRecurringDates(): string[] {
    const dates: string[] = []
    const startDate = showAddModal ? new Date(showAddModal.date) : new Date()

    for (let week = 0; week < recurWeeks; week++) {
      if (recurrence === 'weekly') {
        const d = new Date(startDate)
        d.setDate(d.getDate() + week * 7)
        dates.push(dateToStr(d))
      } else if (recurrence === 'weekdays') {
        for (let day = 0; day < 5; day++) {
          const weekStart = new Date(startDate)
          const startDay = weekStart.getDay()
          const mondayOffset = startDay === 0 ? -6 : 1 - startDay
          weekStart.setDate(weekStart.getDate() + mondayOffset + week * 7 + day)
          if (weekStart >= startDate) {
            dates.push(dateToStr(weekStart))
          }
        }
      } else if (recurrence === 'custom') {
        for (const dayIdx of customDays) {
          const d = new Date(startDate)
          const startDay = d.getDay()
          const mondayOffset = startDay === 0 ? -6 : 1 - startDay
          d.setDate(d.getDate() + mondayOffset + week * 7 + dayIdx)
          if (d >= startDate) {
            dates.push(dateToStr(d))
          }
        }
      }
    }
    return dates
  }

  function resetForm() {
    setNewTitle('')
    setNewPriority('medium')
    setNewTime('')
    setRecurrence('none')
    setCustomDays([])
    setShowAddModal(null)
    setShowRecurring(false)
  }

  async function completeTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'completed' as const } : t)))
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function bulkDelete() {
    const ids = [...selectedIds]
    setTasks(prev => prev.filter(t => !selectedIds.has(t.id)))
    setSelectedIds(new Set())
    setSelectMode(false)
    for (const id of ids) {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    }
  }

  const tasksByDate: Record<string, Task[]> = {}
  for (const t of tasks) {
    if (t.due_date) {
      if (!tasksByDate[t.due_date]) tasksByDate[t.due_date] = []
      tasksByDate[t.due_date].push(t)
    }
  }

  const isToday = (d: Date) => dateToStr(d) === dateToStr(new Date())

  function toggleCustomDay(dayIdx: number) {
    setCustomDays((prev) => prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx])
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Game Plan</h1>
          <p className="text-sm text-muted-foreground">Your week at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
              <Button variant="destructive" size="sm" onClick={bulkDelete} disabled={selectedIds.size === 0}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete ({selectedIds.size})
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}>Cancel</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>
                <CheckSquare className="mr-1 h-3.5 w-3.5" /> Select
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowRecurring(true); setShowAddModal({ date: dateToStr(new Date()) }) }}>
                <Repeat className="mr-1 h-3.5 w-3.5" /> Recurring
              </Button>
            </>
          )}
          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <button onClick={() => setView('calendar')} className={cn('rounded-md px-3 py-1 text-xs font-medium', view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>Grid</button>
            <button onClick={() => setView('list')} className={cn('rounded-md px-3 py-1 text-xs font-medium', view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>List</button>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium">
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-[10px] text-primary hover:underline">Today</button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Priority Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> High</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Medium</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Low</span>
      </div>

      {/* Calendar Grid */}
      {view === 'calendar' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDates.map((d, i) => (
                <div key={i} className={cn('text-center py-2 rounded-lg text-xs font-medium', isToday(d) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                  <div>{SHORT_DAYS[i]}</div>
                  <div className="text-[10px]">{d.getDate()}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((d, dayIdx) => {
                const dateStr = dateToStr(d)
                const dayTasks = tasksByDate[dateStr] ?? []
                const pending = dayTasks.filter((t) => t.status !== 'completed')
                const completed = dayTasks.filter((t) => t.status === 'completed')

                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      'min-h-[350px] rounded-lg border p-1.5 transition-colors flex flex-col',
                      isToday(d) ? 'border-primary/30 bg-primary/5' : 'bg-card'
                    )}
                  >
                    <div className="space-y-1 flex-1">
                      {pending.map((task) => (
                        <div key={task.id} className={cn('group rounded-md border-l-2 px-1.5 py-1.5 text-[11px] leading-tight transition-colors hover:bg-accent/50', PRIORITY_BG[task.priority], selectMode && selectedIds.has(task.id) && 'ring-1 ring-primary bg-primary/10')}>
                          <div className="flex items-start gap-1">
                            {selectMode ? (
                              <input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleSelect(task.id)} className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            ) : (
                              <button onClick={() => completeTask(task.id)} className="mt-0.5 h-3 w-3 rounded-sm border border-muted-foreground/30 flex-shrink-0 hover:border-primary" />
                            )}
                            <span className="flex-1">{task.title}</span>
                            {!selectMode && <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive text-[10px]">×</button>}
                          </div>
                        </div>
                      ))}
                      {completed.map((task) => (
                        <div key={task.id} className="rounded-md px-1.5 py-1 text-[11px] leading-tight text-muted-foreground/40 line-through">
                          <div className="flex items-start gap-1">
                            <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" />
                            <span className="flex-1 line-clamp-1">{task.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => { setShowAddModal({ date: dateStr }); setShowRecurring(false) }}
                      className="mt-1 w-full rounded-md border border-dashed border-muted-foreground/20 py-1.5 text-[10px] text-muted-foreground/40 hover:border-primary/40 hover:text-primary/60 transition-colors"
                    >
                      + add
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {weekDates.map((d, i) => {
            const dateStr = dateToStr(d)
            const dayTasks = tasksByDate[dateStr] ?? []
            if (dayTasks.length === 0 && !isToday(d)) return null
            return (
              <div key={i}>
                <div className={cn('flex items-center justify-between mb-1.5 px-1', isToday(d) ? 'text-primary' : 'text-muted-foreground')}>
                  <span className="text-xs font-semibold">
                    {DAYS[i]} {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {isToday(d) && <Badge variant="outline" className="ml-2 text-[9px] px-1.5 bg-primary/10 text-primary border-primary/20">Today</Badge>}
                  </span>
                  <button onClick={() => { setShowAddModal({ date: dateStr }); setShowRecurring(false) }} className="text-[10px] text-primary hover:underline">+ Add</button>
                </div>
                {dayTasks.length > 0 ? (
                  <div className="space-y-1">
                    {dayTasks.map((task) => (
                      <div key={task.id} className={cn('flex items-center gap-2 rounded-lg border-l-3 px-3 py-2 text-sm', task.status === 'completed' ? 'opacity-50' : '', PRIORITY_BG[task.priority])}>
                        <button onClick={() => completeTask(task.id)} disabled={task.status === 'completed'} className={cn('h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center', task.status === 'completed' ? 'bg-emerald-400 border-emerald-400' : 'border-muted-foreground/30')}>
                          {task.status === 'completed' && <Check className="h-2.5 w-2.5 text-white" />}
                        </button>
                        <span className={cn('flex-1', task.status === 'completed' && 'line-through text-muted-foreground')}>{task.title}</span>
                        <button onClick={() => deleteTask(task.id)} className="text-muted-foreground/30 hover:text-destructive text-xs">×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/40 px-3 py-2">No tasks</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={resetForm}>
          <Card className="w-full max-w-md mx-4 mb-4 sm:mb-0 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {showRecurring ? 'Add Recurring Task' : `Add task for ${new Date(showAddModal.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
                </p>
                {!showRecurring && (
                  <button onClick={() => setShowRecurring(true)} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                    <Repeat className="h-3 w-3" /> Make recurring
                  </button>
                )}
              </div>

              <form onSubmit={addTask} className="space-y-3">
                <Input
                  placeholder="What needs to get done?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />

                {/* Time */}
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Time (optional)</Label>
                    <Input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Type</Label>
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as TaskCategory)} className="w-full rounded-md border bg-background px-2 py-2 text-xs">
                      <option value="school">School</option>
                      <option value="personal">Personal</option>
                      <option value="athletic">Athletic</option>
                      <option value="extracurricular">Extra</option>
                      <option value="college_prep">College</option>
                    </select>
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <Label className="text-xs">Priority</Label>
                  <div className="flex gap-1.5">
                    {(['high', 'medium', 'low'] as const).map((p) => (
                      <button key={p} type="button" onClick={() => setNewPriority(p)} className={cn('flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors', newPriority === p ? PRIORITY_BG[p] + ' border-current' : 'text-muted-foreground')}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* Recurrence */}
                {showRecurring && (
                  <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-primary" />
                      <Label className="text-xs font-semibold text-primary">Repeat</Label>
                    </div>

                    <div className="space-y-1">
                      {RECURRENCE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRecurrence(opt.value)}
                          className={cn(
                            'w-full text-left rounded-lg px-3 py-2 text-xs transition-colors',
                            recurrence === opt.value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom day picker */}
                    {recurrence === 'custom' && (
                      <div className="flex gap-1">
                        {SHORT_DAYS.map((day, idx) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleCustomDay(idx)}
                            className={cn(
                              'flex-1 rounded-md py-1.5 text-[10px] font-medium transition-colors',
                              customDays.includes(idx)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    )}

                    {recurrence !== 'none' && (
                      <div className="space-y-1">
                        <Label className="text-xs">For how many weeks?</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={1}
                            max={16}
                            value={recurWeeks}
                            onChange={(e) => setRecurWeeks(Number(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-xs font-medium w-16">{recurWeeks} week{recurWeeks !== 1 ? 's' : ''}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Creates {recurrence === 'weekdays' ? recurWeeks * 5 : recurrence === 'custom' ? recurWeeks * customDays.length : recurWeeks} tasks starting {new Date(showAddModal.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1" disabled={!newTitle.trim()}>
                    {recurrence !== 'none' ? 'Add Recurring Tasks' : 'Add Task'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
