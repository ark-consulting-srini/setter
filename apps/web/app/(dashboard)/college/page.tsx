'use client'

import { useState, useEffect } from 'react'
import { Upload, Search, MapPin, Trophy, AlertTriangle, CheckCircle2, ExternalLink, Trash2, FileText, Loader2, SlidersHorizontal, X, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  graduation_rate: number
  stem_ranking: string
  top_stem_programs: string[]
  notable_features: string[]
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

const TYPE_LABELS: Record<string, string> = {
  private: 'Private',
  public_uc: 'UC',
  public_csu: 'CSU',
  public: 'Public',
}

function getLogoDomain(website: string): string {
  try {
    return new URL(website).hostname
  } catch {
    return website.replace('https://', '').replace('http://', '')
  }
}

export default function CollegePage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [myList, setMyList] = useState<CollegeListEntry[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null) // college id being analyzed
  const [analysis, setAnalysis] = useState<{ analysis: FitAnalysis; college: College } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [acceptanceFilter, setAcceptanceFilter] = useState<string>('all')
  const [volleyballFilter, setVolleyballFilter] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // View
  const [view, setView] = useState<'dashboard' | 'analyze'>('dashboard')

  useEffect(() => { loadData() }, [])

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

  async function analyzeCollege(collegeId: string) {
    setAnalyzing(collegeId)
    setAnalysis(null)
    setView('analyze')

    try {
      const res = await fetch('/api/college/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId }),
      })

      if (res.ok) {
        const data = await res.json()
        setAnalysis(data)
        loadData()
      } else {
        const err = await res.json()
        alert(err.error || 'Analysis failed')
      }
    } catch {
      alert('Analysis failed. Try again.')
    } finally {
      setAnalyzing(null)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/chat/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) { alert('Could not read file'); return }
      const { extractedText, fileName } = await uploadRes.json()

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

  // Apply filters
  let filtered = colleges
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.top_stem_programs.some((p) => p.toLowerCase().includes(q))
    )
  }
  if (stateFilter === 'CA') filtered = filtered.filter((c) => c.state === 'CA')
  else if (stateFilter === 'national') filtered = filtered.filter((c) => c.state !== 'CA')
  if (typeFilter !== 'all') filtered = filtered.filter((c) => c.college_type === typeFilter)
  if (acceptanceFilter === 'under10') filtered = filtered.filter((c) => c.acceptance_rate < 10)
  else if (acceptanceFilter === 'under25') filtered = filtered.filter((c) => c.acceptance_rate < 25)
  else if (acceptanceFilter === 'under50') filtered = filtered.filter((c) => c.acceptance_rate < 50)
  else if (acceptanceFilter === 'over50') filtered = filtered.filter((c) => c.acceptance_rate >= 50)
  if (volleyballFilter) filtered = filtered.filter((c) => c.has_volleyball)

  const myListIds = new Set(myList.map((e) => e.college_id))
  const getListEntry = (collegeId: string) => myList.find((e) => e.college_id === collegeId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">College Research</h1>
          <p className="text-sm text-muted-foreground">
            {colleges.length} STEM colleges • {myList.length} on your list
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view === 'analyze' && (
            <Button variant="outline" size="sm" onClick={() => { setView('dashboard'); setAnalysis(null) }}>
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Profile Upload */}
      <Card className="border-primary/20 bg-gradient-to-r from-pink-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Your Profile
              </h3>
              {profile?.ai_summary ? (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{profile.ai_summary}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Upload transcripts, report cards, awards — AI builds your college-ready profile.</p>
              )}
              {profile && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.gpa_unweighted && <Badge variant="outline" className="text-[10px]">GPA: {profile.gpa_unweighted}</Badge>}
                  {profile.sat_score && <Badge variant="outline" className="text-[10px]">SAT: {profile.sat_score}</Badge>}
                  {profile.ap_classes?.length > 0 && <Badge variant="outline" className="text-[10px]">{profile.ap_classes.length} APs</Badge>}
                  {profile.awards?.length > 0 && <Badge variant="outline" className="text-[10px]">{profile.awards.length} Awards</Badge>}
                  {profile.extracurriculars?.length > 0 && <Badge variant="outline" className="text-[10px]">{profile.extracurriculars.length} Activities</Badge>}
                </div>
              )}
              {profile?.raw_uploads && profile.raw_uploads.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">{profile.raw_uploads.length} document{profile.raw_uploads.length !== 1 ? 's' : ''} uploaded</p>
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

      {/* Analysis View */}
      {view === 'analyze' && (analyzing || analysis) && (
        <div className="space-y-4">
          {analyzing && !analysis && (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing your fit...</p>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <Card className="animate-fade-in-scale">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={`https://www.google.com/s2/favicons?sz=128&domain=${getLogoDomain(analysis.college.website)}`}
                    alt={analysis.college.name}
                    className="h-12 w-12 rounded-lg object-contain bg-white border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{analysis.college.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {analysis.college.location} • {analysis.college.acceptance_rate}% acceptance
                      {analysis.college.has_volleyball && <span> • 🏐 {analysis.college.volleyball_division}</span>}
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
        </div>
      )}

      {/* Dashboard View */}
      {view === 'dashboard' && (
        <>
          {/* My College List */}
          {myList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My College List ({myList.length})</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {myList.map((entry) => {
                  const fit = FIT_COLORS[entry.fit_category as keyof typeof FIT_COLORS] ?? FIT_COLORS.target
                  return (
                    <Card key={entry.id} className={cn('group cursor-pointer hover:shadow-md transition-all border-l-3', fit.border)} onClick={() => analyzeCollege(entry.college_id)}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <img
                            src={`https://www.google.com/s2/favicons?sz=128&domain=${getLogoDomain(entry.college.website)}`}
                            alt=""
                            className="h-8 w-8 rounded-md object-contain bg-white border flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = '' ; (e.target as HTMLImageElement).className = 'hidden' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-sm font-semibold truncate">{entry.college.name}</h4>
                              <button onClick={(e) => { e.stopPropagation(); removeFromList(entry.id) }} className="opacity-0 group-hover:opacity-100 p-0.5">
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{entry.college.acceptance_rate}% acceptance</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={cn('text-[9px] px-1', fit.bg, fit.text)}>
                                {entry.fit_category} {entry.fit_score}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search colleges, programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                Filters
                {(stateFilter !== 'all' || typeFilter !== 'all' || acceptanceFilter !== 'all' || volleyballFilter) && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center">!</span>
                )}
              </Button>
            </div>

            {showFilters && (
              <Card className="animate-fade-in-scale">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Location</Label>
                      <div className="flex gap-1">
                        {[{ value: 'all', label: 'All' }, { value: 'CA', label: 'California' }, { value: 'national', label: 'National' }].map((f) => (
                          <button key={f.value} onClick={() => setStateFilter(f.value)} className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', stateFilter === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{f.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <div className="flex gap-1">
                        {[{ value: 'all', label: 'All' }, { value: 'private', label: 'Private' }, { value: 'public_uc', label: 'UC' }, { value: 'public_csu', label: 'CSU' }, { value: 'public', label: 'Public' }].map((f) => (
                          <button key={f.value} onClick={() => setTypeFilter(f.value)} className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', typeFilter === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{f.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Acceptance Rate</Label>
                      <div className="flex gap-1">
                        {[{ value: 'all', label: 'All' }, { value: 'under10', label: '<10%' }, { value: 'under25', label: '<25%' }, { value: 'under50', label: '<50%' }, { value: 'over50', label: '50%+' }].map((f) => (
                          <button key={f.value} onClick={() => setAcceptanceFilter(f.value)} className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', acceptanceFilter === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{f.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Volleyball</Label>
                      <button
                        onClick={() => setVolleyballFilter(!volleyballFilter)}
                        className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', volleyballFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
                      >🏐 Has Volleyball</button>
                    </div>
                  </div>
                  {(stateFilter !== 'all' || typeFilter !== 'all' || acceptanceFilter !== 'all' || volleyballFilter) && (
                    <button onClick={() => { setStateFilter('all'); setTypeFilter('all'); setAcceptanceFilter('all'); setVolleyballFilter(false) }} className="mt-2 text-[10px] text-primary hover:underline">
                      Clear all filters
                    </button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* College Tiles */}
          <div>
            <p className="text-xs text-muted-foreground mb-3">{filtered.length} college{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((college) => {
                const listEntry = getListEntry(college.id)
                const fit = listEntry ? FIT_COLORS[listEntry.fit_category as keyof typeof FIT_COLORS] : null
                const isAnalyzing = analyzing === college.id

                return (
                  <Card
                    key={college.id}
                    className={cn(
                      'group cursor-pointer hover:shadow-lg transition-all',
                      listEntry && `border-l-3 ${fit?.border}`
                    )}
                    onClick={() => analyzeCollege(college.id)}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Logo + Name */}
                      <div className="flex items-start gap-3">
                        <img
                          src={`https://www.google.com/s2/favicons?sz=128&domain=${getLogoDomain(college.website)}`}
                          alt=""
                          className="h-10 w-10 rounded-lg object-contain bg-white border flex-shrink-0"
                          onError={(e) => {
                            const el = e.target as HTMLImageElement
                            el.style.display = 'none'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold leading-snug">{college.name}</h4>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5" /> {college.location}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-lg font-bold text-foreground">{college.acceptance_rate}%</p>
                          <p className="text-[9px] text-muted-foreground">Acceptance</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{college.sat_range_low}-{college.sat_range_high}</p>
                          <p className="text-[9px] text-muted-foreground">SAT Range</p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {TYPE_LABELS[college.college_type] ?? college.college_type}
                        </Badge>
                        {college.has_volleyball && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            🏐 {college.volleyball_division}
                          </Badge>
                        )}
                        {listEntry && (
                          <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', fit?.bg, fit?.text)}>
                            {listEntry.fit_category} {listEntry.fit_score}%
                          </Badge>
                        )}
                      </div>

                      {/* Top Programs */}
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {college.top_stem_programs.slice(0, 3).join(' • ')}
                      </p>

                      {/* Tuition */}
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        {college.state === 'CA'
                          ? `$${(college.tuition_in_state / 1000).toFixed(0)}k in-state`
                          : `$${(college.tuition_out_state / 1000).toFixed(0)}k/yr`}
                      </div>

                      {/* Analyze button */}
                      <Button
                        size="sm"
                        variant={listEntry ? 'outline' : 'default'}
                        className="w-full text-xs"
                        disabled={isAnalyzing}
                        onClick={(e) => { e.stopPropagation(); analyzeCollege(college.id) }}
                      >
                        {isAnalyzing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        {isAnalyzing ? 'Analyzing...' : listEntry ? 'Re-analyze Fit' : 'Analyze My Fit'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {seeding && <p className="text-center text-sm text-muted-foreground py-8">Loading colleges...</p>}
        </>
      )}
    </div>
  )
}
