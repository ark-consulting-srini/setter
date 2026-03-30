'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Upload, Search, MapPin, Trophy, AlertTriangle, CheckCircle2, ChevronDown, ExternalLink, Trash2, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface College {
  id: string
  name: string
  location: string
  state: string
  college_type: string
  acceptance_rate: number
  sat_range_low: number
  sat_range_high: number
  enrollment: number
  tuition_in_state: number
  tuition_out_state: number
  top_stem_programs: string[]
  has_volleyball: boolean
  volleyball_division: string | null
  website: string
}

interface CollegeListEntry {
  id: string
  college_id: string
  fit_category: string
  fit_score: number
  strengths: string[]
  gaps: string[]
  action_items: Record<string, string[]>
  ai_analysis: string
  college: College
}

interface FitAnalysis {
  fit_category: string
  fit_score: number
  strengths: string[]
  gaps: string[]
  action_items: Record<string, string[]>
  analysis: string
}

interface StudentProfile {
  gpa_unweighted: number | null
  gpa_weighted: number | null
  sat_score: number | null
  ap_classes: Array<{ name: string }>
  awards: Array<{ title: string }>
  extracurriculars: Array<{ name: string }>
  ai_summary: string | null
  raw_uploads: Array<{ fileName: string; uploadedAt: string; summary: string }>
}

const FIT_COLORS = {
  reach: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-400' },
  target: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-400' },
  safety: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-400' },
}

export default function CollegePage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [myList, setMyList] = useState<CollegeListEntry[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [selectedCollege, setSelectedCollege] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<{ analysis: FitAnalysis; college: College } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [collegesRes, listRes, profileRes] = await Promise.all([
      fetch('/api/college/seed'),
      fetch('/api/college/list'),
      fetch('/api/college/profile'),
    ])

    if (collegesRes.ok) {
      const data = await collegesRes.json()
      setColleges(data.colleges ?? [])
      if (!data.colleges?.length) {
        // Seed colleges on first load
        setSeeding(true)
        const seedRes = await fetch('/api/college/seed', { method: 'POST' })
        if (seedRes.ok) {
          const refetch = await fetch('/api/college/seed')
          if (refetch.ok) {
            const d = await refetch.json()
            setColleges(d.colleges ?? [])
          }
        }
        setSeeding(false)
      }
    }

    if (listRes.ok) {
      const data = await listRes.json()
      setMyList(data.list ?? [])
    }

    if (profileRes.ok) {
      const data = await profileRes.json()
      setProfile(data.profile)
    }
  }

  async function analyzeCollege() {
    if (!selectedCollege || analyzing) return
    setAnalyzing(true)
    setAnalysis(null)

    try {
      const res = await fetch('/api/college/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId: selectedCollege }),
      })

      if (res.ok) {
        const data = await res.json()
        setAnalysis(data)
        loadData() // Refresh list
      } else {
        const err = await res.json()
        alert(err.error || 'Analysis failed')
      }
    } catch {
      alert('Analysis failed. Try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      // Extract text
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/chat/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) { alert('Could not read file'); return }
      const { extractedText, fileName } = await uploadRes.json()

      // Send to profile AI parser
      const profileRes = await fetch('/api/college/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: extractedText, fileName }),
      })

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.profile)
      }
    } catch {
      alert('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function removeFromList(id: string) {
    await fetch('/api/college/list', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMyList((prev) => prev.filter((e) => e.id !== id))
  }

  const filteredColleges = stateFilter === 'all'
    ? colleges
    : stateFilter === 'CA'
    ? colleges.filter((c) => c.state === 'CA')
    : colleges.filter((c) => c.state !== 'CA')

  const reaches = myList.filter((e) => e.fit_category === 'reach')
  const targets = myList.filter((e) => e.fit_category === 'target')
  const safeties = myList.filter((e) => e.fit_category === 'safety')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">College Research</h1>
          <p className="text-sm text-muted-foreground">Your virtual counselor for college prep</p>
        </div>
      </div>

      {/* Profile Upload Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-pink-50 to-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Your Profile
              </h3>
              {profile?.ai_summary ? (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{profile.ai_summary}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Upload transcripts, report cards, awards, or certificates — AI will build your profile automatically.</p>
              )}

              {profile && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.gpa_unweighted && <Badge variant="outline" className="text-[10px]">GPA: {profile.gpa_unweighted}</Badge>}
                  {profile.sat_score && <Badge variant="outline" className="text-[10px]">SAT: {profile.sat_score}</Badge>}
                  {profile.ap_classes?.length > 0 && <Badge variant="outline" className="text-[10px]">{profile.ap_classes.length} AP Classes</Badge>}
                  {profile.awards?.length > 0 && <Badge variant="outline" className="text-[10px]">{profile.awards.length} Awards</Badge>}
                  {profile.extracurriculars?.length > 0 && <Badge variant="outline" className="text-[10px]">{profile.extracurriculars.length} Activities</Badge>}
                </div>
              )}

              {profile?.raw_uploads && profile.raw_uploads.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Uploaded Documents:</p>
                  {profile.raw_uploads.map((u, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">📄 {u.fileName} — {new Date(u.uploadedAt).toLocaleDateString()}</p>
                  ))}
                </div>
              )}
            </div>
            <div>
              <input type="file" accept=".pdf,.docx,.pptx,.txt,.xlsx" onChange={handleUpload} className="hidden" id="profile-upload" />
              <label htmlFor="profile-upload">
                <Button asChild size="sm" variant={profile ? 'outline' : 'default'} disabled={uploading}>
                  <span>
                    {uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
                    {uploading ? 'Processing...' : profile ? 'Add More' : 'Upload'}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* College Selector */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Explore Colleges
          </h3>

          <div className="flex gap-1.5 mb-2">
            {['all', 'CA', 'national'].map((f) => (
              <button key={f} onClick={() => setStateFilter(f)} className={cn('rounded-full px-3 py-1 text-xs font-medium', stateFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {f === 'all' ? 'All 50' : f === 'CA' ? 'California' : 'National'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCollege}
              onChange={(e) => { setSelectedCollege(e.target.value); setAnalysis(null) }}
              className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm"
            >
              <option value="">Select a college...</option>
              {stateFilter === 'all' && <optgroup label="California (12)">
                {colleges.filter(c => c.state === 'CA').map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.acceptance_rate}% acceptance</option>
                ))}
              </optgroup>}
              {stateFilter === 'all' && <optgroup label="National">
                {colleges.filter(c => c.state !== 'CA').map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.acceptance_rate}% acceptance</option>
                ))}
              </optgroup>}
              {stateFilter !== 'all' && filteredColleges.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.acceptance_rate}% acceptance</option>
              ))}
            </select>
            <Button onClick={analyzeCollege} disabled={!selectedCollege || analyzing}>
              {analyzing ? 'Analyzing...' : 'Analyze Fit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Result */}
      {analysis && (
        <Card className="animate-fade-in-scale">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">{analysis.college.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {analysis.college.location} • {analysis.college.acceptance_rate}% acceptance
                  {analysis.college.has_volleyball && <span> • 🏐 {analysis.college.volleyball_division} Volleyball</span>}
                </p>
              </div>
              <Badge className={cn('text-sm px-3 py-1', FIT_COLORS[analysis.analysis.fit_category as keyof typeof FIT_COLORS]?.bg, FIT_COLORS[analysis.analysis.fit_category as keyof typeof FIT_COLORS]?.text)}>
                {analysis.analysis.fit_category.toUpperCase()} — {analysis.analysis.fit_score}%
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-[10px] font-semibold text-emerald-700 uppercase mb-1.5">Your Strengths</p>
                <ul className="space-y-1">
                  {analysis.analysis.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-emerald-800 flex items-start gap-1">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-[10px] font-semibold text-red-700 uppercase mb-1.5">Gaps to Close</p>
                <ul className="space-y-1">
                  {analysis.analysis.gaps.map((g, i) => (
                    <li key={i} className="text-xs text-red-800 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" /> {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {analysis.analysis.analysis}
            </div>

            {/* Grade-by-Grade Actions */}
            {analysis.analysis.action_items && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Your Roadmap</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(analysis.analysis.action_items).map(([grade, actions]) => {
                    const actionList = Array.isArray(actions) ? actions : []
                    return (
                      <div key={grade} className="rounded-lg border p-3">
                        <p className="text-xs font-semibold text-primary mb-1">{grade} Grade</p>
                        <ul className="space-y-0.5">
                          {actionList.map((a, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground">• {String(a)}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <a href={analysis.college.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Visit {analysis.college.name} <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      )}

      {/* My College List */}
      {myList.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My College List</h3>

          {reaches.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-2 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-400" /> Reach ({reaches.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {reaches.map((entry) => <CollegeCard key={entry.id} entry={entry} onRemove={removeFromList} />)}
              </div>
            </div>
          )}

          {targets.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-500 mb-2 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Target ({targets.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {targets.map((entry) => <CollegeCard key={entry.id} entry={entry} onRemove={removeFromList} />)}
              </div>
            </div>
          )}

          {safeties.length > 0 && (
            <div>
              <p className="text-xs font-medium text-emerald-500 mb-2 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Safety ({safeties.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {safeties.map((entry) => <CollegeCard key={entry.id} entry={entry} onRemove={removeFromList} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {seeding && <p className="text-center text-sm text-muted-foreground">Loading 50 STEM colleges...</p>}
    </div>
  )
}

function CollegeCard({ entry, onRemove }: { entry: CollegeListEntry; onRemove: (id: string) => void }) {
  const fit = FIT_COLORS[entry.fit_category as keyof typeof FIT_COLORS] ?? FIT_COLORS.target

  return (
    <Card className={cn('group border-l-3', fit.border)}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold">{entry.college.name}</h4>
            <p className="text-[10px] text-muted-foreground">{entry.college.location} • {entry.college.acceptance_rate}%</p>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className={cn('text-[10px]', fit.bg, fit.text)}>{entry.fit_score}%</Badge>
            <button onClick={() => onRemove(entry.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10">
              <Trash2 className="h-3 w-3 text-destructive" />
            </button>
          </div>
        </div>
        {entry.strengths?.length > 0 && (
          <p className="text-[10px] text-emerald-600 line-clamp-1">✓ {entry.strengths[0]}</p>
        )}
        {entry.gaps?.length > 0 && (
          <p className="text-[10px] text-red-500 line-clamp-1">⚠ {entry.gaps[0]}</p>
        )}
      </CardContent>
    </Card>
  )
}
