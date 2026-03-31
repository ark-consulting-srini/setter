'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task, TaskCategory, TaskPriority } from '@setter/shared/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newCategory, setNewCategory] = useState<TaskCategory>('school')
  const [newTime, setNewTime] = useState('')

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    const res = await fetch('/api/tasks')
    if (res.ok) setTasks(await res.json())
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !selectedDate) return
    const title = newTime ? `${newTime} — ${newTitle.trim()}` : newTitle.trim()
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category: newCategory, priority: newPriority, due_date: selectedDate }),
    })
    setNewTitle(''); setNewTime(''); setShowAdd(false)
    fetchTasks()
  }

  async function toggleTask(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    setTasks(p => p.map(t => t.id === id ? { ...t, status: newStatus } : t))
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  // Build calendar grid
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = dateToStr(new Date())

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i)
  while (calendarDays.length % 7 !== 0) calendarDays.push(null)

  // Group tasks by date
  const tasksByDate: Record<string, Task[]> = {}
  for (const t of tasks) {
    if (t.due_date) {
      if (!tasksByDate[t.due_date]) tasksByDate[t.due_date] = []
      tasksByDate[t.due_date].push(t)
    }
  }

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  function goToday() {
    setCurrentMonth(new Date())
    setSelectedDate(today)
  }

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] ?? []) : []
  const selectedPending = selectedTasks.filter(t => t.status !== 'completed')
  const selectedCompleted = selectedTasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
        <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
        <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Priority Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> High</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Medium</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Low</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}

        {/* Calendar cells */}
        {calendarDays.map((day, idx) => {
          if (day === null) return <div key={idx} className="min-h-[80px]" />

          const dateStr = dateToStr(new Date(year, month, day))
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const dayTasks = tasksByDate[dateStr] ?? []
          const pendingCount = dayTasks.filter(t => t.status !== 'completed').length
          const completedCount = dayTasks.filter(t => t.status === 'completed').length

          return (
            <div
              key={idx}
              onClick={() => { setSelectedDate(dateStr); setShowAdd(false) }}
              className={cn(
                'min-h-[80px] rounded-lg border p-1.5 cursor-pointer transition-all hover:shadow-sm',
                isToday ? 'border-primary/40 bg-primary/5' : 'bg-card',
                isSelected && 'ring-2 ring-primary/40',
              )}
            >
              <div className={cn(
                'text-xs font-medium mb-1',
                isToday ? 'text-primary font-bold' : 'text-foreground'
              )}>
                {day}
              </div>

              {/* Task dots */}
              {dayTasks.length > 0 && (
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map(t => (
                    <div key={t.id} className="flex items-center gap-1">
                      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', t.status === 'completed' ? 'bg-muted-foreground/30' : PRIORITY_DOT[t.priority])} />
                      <span className={cn('text-[9px] truncate leading-tight', t.status === 'completed' && 'line-through text-muted-foreground/40')}>
                        {t.title.replace(/^\d{1,2}:\d{2}\s*[—–-]\s*/, '')}
                      </span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[8px] text-muted-foreground">+{dayTasks.length - 3} more</span>
                  )}
                </div>
              )}

              {/* Summary badge */}
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {pendingCount > 0 && <span className="text-[8px] bg-pink-100 text-pink-600 rounded px-1">{pendingCount}</span>}
                  {completedCount > 0 && <span className="text-[8px] bg-emerald-100 text-emerald-600 rounded px-1">{completedCount}✓</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected Date Detail */}
      {selectedDate && (
        <Card className="animate-slide-up">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedDate(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Add task form */}
            {showAdd && (
              <form onSubmit={addTask} className="space-y-2 p-3 rounded-lg bg-muted/50">
                <Input placeholder="What needs to get done?" value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus />
                <div className="flex gap-2">
                  <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-28 text-xs" />
                  <div className="flex gap-1 flex-1">
                    {(['high', 'medium', 'low'] as const).map(p => (
                      <button key={p} type="button" onClick={() => setNewPriority(p)} className={cn('flex-1 rounded-md border py-1 text-[10px] font-medium capitalize', newPriority === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{p}</button>
                    ))}
                  </div>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value as TaskCategory)} className="rounded-md border bg-background px-2 text-[10px]">
                    <option value="school">School</option>
                    <option value="personal">Personal</option>
                    <option value="athletic">Athletic</option>
                    <option value="extracurricular">Extra</option>
                    <option value="college_prep">College</option>
                  </select>
                </div>
                <Button type="submit" size="sm" disabled={!newTitle.trim()}>Add Task</Button>
              </form>
            )}

            {/* Tasks for selected date */}
            {selectedTasks.length > 0 ? (
              <div className="space-y-1.5">
                {selectedPending.map(task => (
                  <div key={task.id} className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm border-l-3', task.priority === 'high' ? 'border-l-red-400 bg-red-50' : task.priority === 'medium' ? 'border-l-amber-400 bg-amber-50' : 'border-l-emerald-400 bg-emerald-50')}>
                    <button onClick={() => toggleTask(task.id)} className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0 hover:border-primary" />
                    <span className="flex-1">{task.title}</span>
                    <Badge variant="outline" className="text-[9px]">{task.category}</Badge>
                  </div>
                ))}
                {selectedCompleted.map(task => (
                  <div key={task.id} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm opacity-50">
                    <button onClick={() => toggleTask(task.id)} className="h-4 w-4 rounded-full bg-emerald-400 border-2 border-emerald-400 flex-shrink-0 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </button>
                    <span className="flex-1 line-through text-muted-foreground">{task.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No tasks for this day</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
