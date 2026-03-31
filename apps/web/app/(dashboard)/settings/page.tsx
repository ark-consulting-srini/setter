'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, X, User, BookOpen, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserProfile {
  full_name: string
  grade_level: number | null
  sport: string
  position: string
  college_target: string | null
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({ full_name: '', grade_level: null, sport: '', position: '', college_target: '' })
  const [subjects, setSubjects] = useState<string[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const tasks = await res.json()
        // Extract unique categories/subjects from task titles
        const subs = new Set<string>()
        for (const t of tasks) {
          const match = t.title?.match(/^(.*?)[\s—–-]+/)
          if (match && match[1].length < 30) subs.add(match[1].trim())
        }
      }

      // Load user profile
      const profileRes = await fetch('/api/college/profile')
      if (profileRes.ok) {
        const d = await profileRes.json()
        if (d.profile) {
          setProfile(p => ({ ...p, ...d.profile }))
        }
      }

      // Load saved subjects from localStorage
      const savedSubs = localStorage.getItem('setter_subjects')
      if (savedSubs) setSubjects(JSON.parse(savedSubs))
      else setSubjects(['AP World History', 'Algebra 2', 'Honors Bio 3', 'English Honors', 'AP CSP', 'Español 2'])
    }
    load()
  }, [])

  function addSubject() {
    if (!newSubject.trim() || subjects.includes(newSubject.trim())) return
    const updated = [...subjects, newSubject.trim()]
    setSubjects(updated)
    localStorage.setItem('setter_subjects', JSON.stringify(updated))
    setNewSubject('')
  }

  function removeSubject(sub: string) {
    const updated = subjects.filter(s => s !== sub)
    setSubjects(updated)
    localStorage.setItem('setter_subjects', JSON.stringify(updated))
  }

  async function saveProfile() {
    setSaving(true)
    // Save to student_profile via college profile API
    await fetch('/api/college/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentText: `Profile update: Name: ${profile.full_name}, Grade: ${profile.grade_level}, Sport: ${profile.sport}, Position: ${profile.position}, College Target: ${profile.college_target}`,
        fileName: 'Profile Settings Update',
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your Setter experience</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Full Name</Label>
              <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Roma Reddy" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Grade Level</Label>
              <select value={profile.grade_level ?? ''} onChange={e => setProfile(p => ({ ...p, grade_level: parseInt(e.target.value) || null }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Select</option>
                <option value="9">9th (Freshman)</option>
                <option value="10">10th (Sophomore)</option>
                <option value="11">11th (Junior)</option>
                <option value="12">12th (Senior)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Sport</Label>
              <Input value={profile.sport} onChange={e => setProfile(p => ({ ...p, sport: e.target.value }))} placeholder="Volleyball" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Position</Label>
              <Input value={profile.position} onChange={e => setProfile(p => ({ ...p, position: e.target.value }))} placeholder="Setter" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">College Target</Label>
            <Input value={profile.college_target ?? ''} onChange={e => setProfile(p => ({ ...p, college_target: e.target.value }))} placeholder="Stanford, UCLA, UC Berkeley" />
          </div>
          <Button onClick={saveProfile} disabled={saving} size="sm">
            <Save className="mr-1 h-3.5 w-3.5" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> My Subjects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {subjects.map(sub => (
              <Badge key={sub} variant="outline" className="text-xs px-3 py-1.5 flex items-center gap-1.5">
                {sub}
                <button onClick={() => removeSubject(sub)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Add a subject..." onKeyDown={e => { if (e.key === 'Enter') addSubject() }} />
            <Button variant="outline" size="sm" onClick={addSubject} disabled={!newSubject.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
