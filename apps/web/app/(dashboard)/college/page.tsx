'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Upload, Search, MapPin, AlertTriangle, CheckCircle2, ExternalLink,
  Trash2, FileText, Loader2, SlidersHorizontal, DollarSign, Send,
  GraduationCap, MessageCircle, BarChart3, BookOpen, Sparkles, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { MessageRenderer } from '../chat/message-renderer'

interface College {
  id: string; name: string; location: string; state: string; college_type: string
  acceptance_rate: number; sat_range_low: number; sat_range_high: number
  enrollment: number; tuition_in_state: number; tuition_out_state: number
  graduation_rate: number; stem_ranking: string; top_stem_programs: string[]
  notable_features: string[]; has_volleyball: boolean; volleyball_division: string | null; website: string
}

interface CollegeListEntry {
  id: string; college_id: string; fit_category: string; fit_score: number
  strengths: string[]; gaps: string[]; action_items: Record<string, string[]>
  ai_analysis: string; college: College
}

interface FitAnalysis {
  fit_category: string; fit_score: number; strengths: string[]; gaps: string[]
  action_items: Record<string, string[]>; analysis: string
}

interface StudentProfile {
  gpa_unweighted: number | null; gpa_weighted: number | null; sat_score: number | null
  ap_classes: Array<{ name: string }>; awards: Array<{ title: string }>
  extracurriculars: Array<{ name: string }>; ai_summary: string | null
  raw_uploads: Array<{ fileName: string; uploadedAt: string; summary: string }>
}

interface CounselorMessage {
  role: 'user' | 'assistant'
  content: string
}

const FIT_COLORS = {
  reach: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  target: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  safety: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
}

const TYPE_LABELS: Record<string, string> = { private: 'Private', public_uc: 'UC', public_csu: 'CSU', public: 'Public' }

function getLogoDomain(website: string): string {
  try { return new URL(website).hostname } catch { return website.replace('https://', '') }
}

const TABS = [
  { id: 'explore', label: 'Explore', icon: Search },
  { id: 'mylist', label: 'My List', icon: BookOpen },
  { id: 'profile', label: 'My Profile', icon: Users },
  { id: 'counselor', label: 'AI Counselor', icon: MessageCircle },
] as const

type TabId = typeof TABS[number]['id']

export default function CollegePage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [myList, setMyList] = useState<CollegeListEntry[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('explore')
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<{ analysis: FitAnalysis; college: College } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [acceptanceFilter, setAcceptanceFilter] = useState('all')
  const [volleyballFilter, setVolleyballFilter] = useState(false)
  const [satMatchFilter, setSatMatchFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Counselor chat
  const [counselorMessages, setCounselorMessages] = useState<CounselorMessage[]>([])
  const [counselorInput, setCounselorInput] = useState('')
  const [counselorSending, setCounselorSending] = useState(false)
  const [counselorSessionId, setCounselorSessionId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // GPA edit
  const [editingGpa, setEditingGpa] = useState(false)
  const [gpaUW, setGpaUW] = useState('')
  const [gpaW, setGpaW] = useState('')

  useEffect(() => { loadData() }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [counselorMessages])

  async function loadData() {
    const [cRes, lRes, pRes] = await Promise.all([
      fetch('/api/college/seed'), fetch('/api/college/list'), fetch('/api/college/profile'),
    ])
    if (cRes.ok) {
      const d = await cRes.json()
      setColleges(d.colleges ?? [])
      if (!d.colleges?.length) {
        setSeeding(true)
        await fetch('/api/college/seed', { method: 'POST' })
        const r = await fetch('/api/college/seed')
        if (r.ok) { const d2 = await r.json(); setColleges(d2.colleges ?? []) }
        setSeeding(false)
      }
    }
    if (lRes.ok) { const d = await lRes.json(); setMyList(d.list ?? []) }
    if (pRes.ok) { const d = await pRes.json(); setProfile(d.profile) }
  }

  async function analyzeCollege(collegeId: string) {
    setAnalyzing(collegeId)
    try {
      const res = await fetch('/api/college/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId }),
      })
      if (res.ok) { setAnalysis(await res.json()); loadData() }
    } catch {} finally { setAnalyzing(null) }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const uRes = await fetch('/api/chat/upload', { method: 'POST', body: fd })
      if (!uRes.ok) return
      const { extractedText, fileName } = await uRes.json()
      const pRes = await fetch('/api/college/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: extractedText, fileName }),
      })
      if (pRes.ok) { const d = await pRes.json(); setProfile(d.profile) }
    } catch {} finally { setUploading(false); e.target.value = '' }
  }

  async function saveGpa() {
    await fetch('/api/college/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText: `GPA: Unweighted ${gpaUW}, Weighted ${gpaW}`, fileName: 'Manual GPA' }),
    })
    loadData(); setEditingGpa(false)
  }

  async function removeFromList(id: string) {
    await fetch('/api/college/list', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setMyList(p => p.filter(e => e.id !== id))
  }

  // AI Counselor chat
  async function sendCounselorMessage(override?: string) {
    const text = (override ?? counselorInput).trim()
    if (!text || counselorSending) return
    setCounselorInput('')
    setCounselorMessages(p => [...p, { role: 'user', content: text }])
    setCounselorSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: counselorSessionId,
          message: `[COLLEGE COUNSELOR MODE] The student is asking about college admissions. Use the college research context. Question: ${text}`,
        }),
      })
      if (!res.ok) throw new Error()
      const sid = res.headers.get('X-Session-Id')
      if (sid) setCounselorSessionId(sid)

      const reader = res.body?.getReader()
      if (!reader) throw new Error()
      const decoder = new TextDecoder()
      let full = ''
      setCounselorMessages(p => [...p, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setCounselorMessages(p => { const u = [...p]; u[u.length - 1] = { role: 'assistant', content: full }; return u })
      }
    } catch {
      setCounselorMessages(p => [...p, { role: 'assistant', content: 'Sorry, something went wrong.' }])
    } finally { setCounselorSending(false) }
  }

  // Filters
  let filtered = colleges
  if (searchQuery) { const q = searchQuery.toLowerCase(); filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.top_stem_programs.some(p => p.toLowerCase().includes(q))) }
  if (stateFilter === 'CA') filtered = filtered.filter(c => c.state === 'CA')
  else if (stateFilter === 'national') filtered = filtered.filter(c => c.state !== 'CA')
  if (typeFilter !== 'all') filtered = filtered.filter(c => c.college_type === typeFilter)
  if (acceptanceFilter === 'under10') filtered = filtered.filter(c => c.acceptance_rate < 10)
  else if (acceptanceFilter === 'under25') filtered = filtered.filter(c => c.acceptance_rate < 25)
  else if (acceptanceFilter === 'under50') filtered = filtered.filter(c => c.acceptance_rate < 50)
  else if (acceptanceFilter === 'over50') filtered = filtered.filter(c => c.acceptance_rate >= 50)
  if (volleyballFilter) filtered = filtered.filter(c => c.has_volleyball)
  if (satMatchFilter !== 'all' && profile?.sat_score) {
    if (satMatchFilter === 'in_range') filtered = filtered.filter(c => profile.sat_score! >= c.sat_range_low)
    else if (satMatchFilter === 'above') filtered = filtered.filter(c => profile.sat_score! >= c.sat_range_high)
  }

  const reaches = myList.filter(e => e.fit_category === 'reach')
  const targets = myList.filter(e => e.fit_category === 'target')
  const safeties = myList.filter(e => e.fit_category === 'safety')

  const QUICK_QUESTIONS = [
    "What are my chances at UCLA?",
    "Compare UC Berkeley vs Georgia Tech for CS",
    "What should I do this summer for college prep?",
    "What SAT score do I need for my reach schools?",
    "How can I strengthen my application for Stanford?",
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">College Research</h1>
          <p className="text-sm text-muted-foreground">{colleges.length} colleges • {myList.length} on your list</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setAnalysis(null) }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === 'mylist' && myList.length > 0 && (
              <span className="ml-1 h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center">{myList.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ===== EXPLORE TAB ===== */}
      {activeTab === 'explore' && (
        <div className="space-y-4">
          {/* Analysis overlay */}
          {analysis && (
            <Card className="animate-fade-in-scale border-primary/20">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <img src={`https://www.google.com/s2/favicons?sz=128&domain=${getLogoDomain(analysis.college.website)}`} alt="" className="h-10 w-10 rounded-lg object-contain bg-white border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div>
                      <h3 className="text-lg font-bold">{analysis.college.name}</h3>
                      <p className="text-xs text-muted-foreground">{analysis.college.location} • {analysis.college.acceptance_rate}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn('px-3 py-1', FIT_COLORS[analysis.analysis.fit_category as keyof typeof FIT_COLORS]?.bg, FIT_COLORS[analysis.analysis.fit_category as keyof typeof FIT_COLORS]?.text)}>
                      {analysis.analysis.fit_category.toUpperCase()} {analysis.analysis.fit_score}%
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)}>×</Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-[10px] font-semibold text-emerald-700 uppercase mb-1">Strengths</p>
                    {analysis.analysis.strengths.map((s, i) => <p key={i} className="text-xs text-emerald-800">✓ {s}</p>)}
                  </div>
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-[10px] font-semibold text-red-700 uppercase mb-1">Gaps</p>
                    {analysis.analysis.gaps.map((g, i) => <p key={i} className="text-xs text-red-800">⚠ {g}</p>)}
                  </div>
                </div>
                <div className="text-sm"><MessageRenderer content={analysis.analysis.analysis} role="assistant" /></div>
                {analysis.analysis.action_items && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(analysis.analysis.action_items).map(([grade, actions]) => (
                      <div key={grade} className="rounded-lg border p-3">
                        <p className="text-xs font-semibold text-primary mb-1">{grade}</p>
                        {(Array.isArray(actions) ? actions : []).map((a, i) => <p key={i} className="text-[11px] text-muted-foreground">• {String(a)}</p>)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Search + Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search colleges, programs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> Filters
            </Button>
          </div>

          {showFilters && (
            <Card><CardContent className="p-3 flex flex-wrap gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <div className="flex gap-1">
                  {['all', 'CA', 'national'].map(f => <button key={f} onClick={() => setStateFilter(f)} className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', stateFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{f === 'all' ? 'All' : f === 'CA' ? 'California' : 'National'}</button>)}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <div className="flex gap-1">
                  {['all', 'private', 'public_uc', 'public_csu', 'public'].map(f => <button key={f} onClick={() => setTypeFilter(f)} className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', typeFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{f === 'all' ? 'All' : TYPE_LABELS[f] ?? f}</button>)}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Acceptance</Label>
                <div className="flex gap-1">
                  {['all', 'under10', 'under25', 'under50', 'over50'].map(f => <button key={f} onClick={() => setAcceptanceFilter(f)} className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', acceptanceFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{f === 'all' ? 'All' : f === 'under10' ? '<10%' : f === 'under25' ? '<25%' : f === 'under50' ? '<50%' : '50%+'}</button>)}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sports</Label>
                <button onClick={() => setVolleyballFilter(!volleyballFilter)} className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', volleyballFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>🏐 Volleyball</button>
              </div>
            </CardContent></Card>
          )}

          {/* College Grid */}
          <p className="text-xs text-muted-foreground">{filtered.length} colleges</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(c => {
              const entry = myList.find(e => e.college_id === c.id)
              const fit = entry ? FIT_COLORS[entry.fit_category as keyof typeof FIT_COLORS] : null
              return (
                <Card key={c.id} className={cn('group cursor-pointer hover:shadow-lg transition-all', entry && `border-l-3 ${fit?.border}`)} onClick={() => analyzeCollege(c.id)}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <img src={`https://www.google.com/s2/favicons?sz=128&domain=${getLogoDomain(c.website)}`} alt="" className="h-10 w-10 rounded-lg bg-white border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold leading-snug">{c.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{c.location}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-lg font-bold">{c.acceptance_rate}%</p><p className="text-[9px] text-muted-foreground">Acceptance</p></div>
                      <div>
                        <p className="text-lg font-bold">{c.sat_range_low}-{c.sat_range_high}</p>
                        <p className="text-[9px] text-muted-foreground">SAT Range</p>
                        {profile?.sat_score && (
                          <p className={cn('text-[9px] font-semibold', profile.sat_score >= c.sat_range_low ? 'text-emerald-600' : 'text-red-500')}>
                            {profile.sat_score >= c.sat_range_high ? '✓ Above' : profile.sat_score >= c.sat_range_low ? '~ In range' : `✗ Below (${profile.sat_score})`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{TYPE_LABELS[c.college_type] ?? c.college_type}</Badge>
                      {c.has_volleyball && <Badge variant="outline" className="text-[9px] px-1.5 py-0">🏐 {c.volleyball_division}</Badge>}
                      {entry && <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', fit?.bg, fit?.text)}>{entry.fit_category} {entry.fit_score}%</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{c.top_stem_programs.slice(0, 3).join(' • ')}</p>
                    <Button size="sm" variant={entry ? 'outline' : 'default'} className="w-full text-xs" disabled={analyzing === c.id} onClick={e => { e.stopPropagation(); analyzeCollege(c.id) }}>
                      {analyzing === c.id ? 'Analyzing...' : entry ? 'Re-analyze' : 'Analyze My Fit'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== MY LIST TAB ===== */}
      {activeTab === 'mylist' && (
        <div className="space-y-6">
          {myList.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold">No colleges on your list yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Go to Explore and click &quot;Analyze My Fit&quot; to add colleges.</p>
              <Button className="mt-4" onClick={() => setActiveTab('explore')}>Explore Colleges</Button>
            </div>
          ) : (
            <>
              {[{ label: 'Reach', items: reaches, color: 'text-red-500', dot: 'bg-red-400' },
                { label: 'Target', items: targets, color: 'text-amber-500', dot: 'bg-amber-400' },
                { label: 'Safety', items: safeties, color: 'text-emerald-500', dot: 'bg-emerald-400' },
              ].filter(g => g.items.length > 0).map(group => (
                <div key={group.label}>
                  <p className={cn('text-xs font-semibold mb-2 flex items-center gap-1', group.color)}>
                    <span className={cn('h-2 w-2 rounded-full', group.dot)} /> {group.label} ({group.items.length})
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map(entry => (
                      <Card key={entry.id} className="group">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start gap-3">
                            <img src={`https://www.google.com/s2/favicons?sz=128&domain=${getLogoDomain(entry.college.website)}`} alt="" className="h-8 w-8 rounded bg-white border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold">{entry.college.name}</h4>
                              <p className="text-[10px] text-muted-foreground">{entry.college.acceptance_rate}% acceptance • SAT {entry.college.sat_range_low}-{entry.college.sat_range_high}</p>
                            </div>
                            <button onClick={() => removeFromList(entry.id)} className="opacity-0 group-hover:opacity-100 p-1"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                          </div>
                          <Badge variant="outline" className={cn('text-[10px]', FIT_COLORS[entry.fit_category as keyof typeof FIT_COLORS]?.bg, FIT_COLORS[entry.fit_category as keyof typeof FIT_COLORS]?.text)}>
                            Fit: {entry.fit_score}%
                          </Badge>
                          {entry.strengths?.length > 0 && <p className="text-[10px] text-emerald-600">✓ {entry.strengths[0]}</p>}
                          {entry.gaps?.length > 0 && <p className="text-[10px] text-red-500">⚠ {entry.gaps[0]}</p>}
                          <a href={entry.college.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                            Visit website <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ===== PROFILE TAB ===== */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-2xl">
          <Card className="bg-gradient-to-r from-pink-50 to-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Your College Profile</h3>
                <div>
                  <input type="file" accept=".pdf,.docx,.pptx,.txt" onChange={handleUpload} className="hidden" id="profile-upload" />
                  <label htmlFor="profile-upload">
                    <Button asChild size="sm" variant={profile ? 'outline' : 'default'} disabled={uploading}>
                      <span>{uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}{uploading ? 'Processing...' : 'Upload Document'}</span>
                    </Button>
                  </label>
                </div>
              </div>

              {profile?.ai_summary && <p className="text-xs text-muted-foreground leading-relaxed">{profile.ai_summary}</p>}

              {/* GPA */}
              {!editingGpa ? (
                <div className="flex items-center gap-6">
                  <div className="text-center"><p className="text-2xl font-bold">{profile?.gpa_unweighted?.toFixed(2) ?? '—'}</p><p className="text-[9px] text-muted-foreground uppercase">Unweighted</p></div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center"><p className="text-2xl font-bold">{profile?.gpa_weighted?.toFixed(2) ?? '—'}</p><p className="text-[9px] text-muted-foreground uppercase">Weighted</p></div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center"><p className="text-2xl font-bold">{profile?.sat_score ?? '—'}</p><p className="text-[9px] text-muted-foreground uppercase">SAT</p></div>
                  <button onClick={() => { setEditingGpa(true); setGpaUW(profile?.gpa_unweighted?.toString() ?? ''); setGpaW(profile?.gpa_weighted?.toString() ?? '') }} className="text-[10px] text-primary hover:underline ml-auto">Edit</button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div><Label className="text-[10px]">UW GPA</Label><Input value={gpaUW} onChange={e => setGpaUW(e.target.value)} className="h-8 w-24 text-sm" /></div>
                  <div><Label className="text-[10px]">W GPA</Label><Input value={gpaW} onChange={e => setGpaW(e.target.value)} className="h-8 w-24 text-sm" /></div>
                  <Button size="sm" className="h-8" onClick={saveGpa}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingGpa(false)}>Cancel</Button>
                </div>
              )}

              {/* Stats badges */}
              <div className="flex flex-wrap gap-1.5">
                {profile?.ap_classes?.length ? <Badge variant="outline" className="text-[10px]">{profile.ap_classes.length} APs</Badge> : null}
                {profile?.awards?.length ? <Badge variant="outline" className="text-[10px]">{profile.awards.length} Awards</Badge> : null}
                {profile?.extracurriculars?.length ? <Badge variant="outline" className="text-[10px]">{profile.extracurriculars.length} Activities</Badge> : null}
              </div>

              {/* Uploaded docs */}
              {profile?.raw_uploads && profile.raw_uploads.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium mb-1">Uploaded Documents</p>
                  {profile.raw_uploads.map((u, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">📄 {u.fileName} — {new Date(u.uploadedAt).toLocaleDateString()}</p>
                  ))}
                </div>
              )}

              {!profile && <p className="text-xs text-muted-foreground">Upload transcripts, report cards, awards, or certificates to build your profile.</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== AI COUNSELOR TAB ===== */}
      {activeTab === 'counselor' && (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.52))]">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto">
            {counselorMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-center">College Counselor</h2>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
                  Ask me anything about college admissions, applications, or how to strengthen your profile. I know your classes, achievements, and goals.
                </p>
                <div className="grid gap-2 mt-6 w-full max-w-md">
                  {QUICK_QUESTIONS.map(q => (
                    <button key={q} onClick={() => sendCounselorMessage(q)} className="rounded-xl border bg-card px-4 py-3 text-left text-xs font-medium hover:bg-accent transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                {counselorMessages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-bold mt-0.5">C</div>
                    )}
                    <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-secondary/60 rounded-bl-md'
                    )}>
                      <MessageRenderer content={msg.content} role={msg.role} />
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t bg-card/80 px-4 py-3">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Input
                placeholder="Ask about college admissions..."
                value={counselorInput}
                onChange={e => setCounselorInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCounselorMessage() } }}
                disabled={counselorSending}
              />
              <Button size="icon" onClick={() => sendCounselorMessage()} disabled={!counselorInput.trim() || counselorSending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {seeding && <p className="text-center text-sm text-muted-foreground py-8">Loading colleges...</p>}
    </div>
  )
}
