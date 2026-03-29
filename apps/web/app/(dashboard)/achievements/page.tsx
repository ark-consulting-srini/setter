'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Eye, EyeOff, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { Achievement, AchievementCategory } from '@setter/shared/types'

const CATEGORY_OPTIONS: { value: AchievementCategory; label: string }[] = [
  { value: 'academic', label: 'Academic' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'community', label: 'Community' },
  { value: 'personal', label: 'Personal' },
  { value: 'streak', label: 'Streak' },
]

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<AchievementCategory>('academic')
  const [achievedAt, setAchievedAt] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [creating, setCreating] = useState(false)

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch('/api/achievements')
      if (res.ok) {
        const data: Achievement[] = await res.json()
        setAchievements(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAchievements()
  }, [fetchAchievements])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)

    try {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          achieved_at: achievedAt,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const newAch: Achievement = await res.json()
      setAchievements((prev) => [newAch, ...prev])
      setTitle('')
      setDescription('')
      setShowForm(false)
      toast({ title: 'Achievement added!', variant: 'success' })
    } catch {
      toast({ title: 'Failed to add achievement', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  async function toggleVisibility(id: string, currentVisible: boolean) {
    setAchievements((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, is_portfolio_visible: !currentVisible } : a
      )
    )

    try {
      const res = await fetch(`/api/achievements`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_portfolio_visible: !currentVisible }),
      })
      if (!res.ok) throw new Error('Failed')
    } catch {
      fetchAchievements()
      toast({ title: 'Failed to update visibility', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">Every win counts. Track them all.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Achievement
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ach-title">Title</Label>
                <Input
                  id="ach-title"
                  placeholder="What did you achieve?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ach-desc">Description (optional)</Label>
                <Textarea
                  id="ach-desc"
                  placeholder="Tell the story..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ach-cat">Category</Label>
                  <Select
                    id="ach-cat"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as AchievementCategory)
                    }
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ach-date">Date</Label>
                  <Input
                    id="ach-date"
                    type="date"
                    value={achievedAt}
                    onChange={(e) => setAchievedAt(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating || !title.trim()}>
                  {creating ? 'Adding...' : 'Add Achievement'}
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

      {loading ? (
        <p className="text-muted-foreground">Loading achievements...</p>
      ) : achievements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Trophy className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="mb-4 text-muted-foreground">
              No achievements yet. Complete tasks, write journal entries, and keep your streak going!
            </p>
            <Button onClick={() => setShowForm(true)}>Add your first achievement</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((ach) => (
            <Card key={ach.id} className="animate-fade-in-scale">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant={ach.category as AchievementCategory}>
                        {ach.category}
                      </Badge>
                      {ach.source === 'auto' && (
                        <Badge variant="outline" className="text-[10px]">
                          Auto
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold">{ach.title}</h3>
                    {ach.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ach.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(ach.achieved_at + 'T00:00:00').toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric', year: 'numeric' }
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 shrink-0',
                      ach.is_portfolio_visible
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                    onClick={() =>
                      toggleVisibility(ach.id, ach.is_portfolio_visible)
                    }
                    title={
                      ach.is_portfolio_visible
                        ? 'Visible on portfolio'
                        : 'Hidden from portfolio'
                    }
                  >
                    {ach.is_portfolio_visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
