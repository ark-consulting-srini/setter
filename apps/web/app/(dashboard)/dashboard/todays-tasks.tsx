'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import type { Task, TaskCategory } from '@setter/shared/types'

export function TodaysTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchTasks = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/tasks?status=pending&due_date=${today}`)
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

  async function completeTask(taskId: string) {
    // Optimistic update
    setTasks((prev) => prev.filter((t) => t.id !== taskId))

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })

      if (!res.ok) throw new Error('Failed to complete task')

      toast({ title: 'Task completed!', variant: 'success' })

      // Check for achievements in background
      fetch('/api/achievements/check', { method: 'POST' }).catch(() => {})

      router.refresh()
    } catch {
      fetchTasks() // Revert on error
      toast({ title: 'Failed to complete task', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing due today. Enjoy the free time or add something above!
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
                  onClick={() => completeTask(task.id)}
                >
                  <Check className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                </Button>
                <span className="flex-1 text-sm">{task.title}</span>
                <Badge variant={task.category as TaskCategory}>
                  {task.category}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
