'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BrainCircuit, Plus, Sparkles, RotateCcw, Trash2, BookOpen, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { QuizSet, QuestionType, QuizDifficulty } from '@setter/shared/types'
import { ROMA_SUBJECTS } from '@setter/shared/types'

interface EnrichedQuizSet extends QuizSet {
  bestScore: number | null
  attemptCount: number
}

const SUBJECT_COLORS: Record<string, string> = {
  'AP World History': 'bg-amber-100 text-amber-700',
  'Algebra 2': 'bg-blue-100 text-blue-700',
  'Honors Bio 3': 'bg-green-100 text-green-700',
  'English Honors': 'bg-purple-100 text-purple-700',
  'AP CSP': 'bg-cyan-100 text-cyan-700',
  'Español 2': 'bg-rose-100 text-rose-700',
}

// Major topics by subject — AP curriculum aligned
const SUBJECT_TOPICS: Record<string, string[]> = {
  'AP World History': [
    'Unit 1: The Global Tapestry (1200–1450)',
    'Unit 2: Networks of Exchange (1200–1450)',
    'Unit 3: Land-Based Empires (1450–1750)',
    'Unit 4: Transoceanic Interconnections (1450–1750)',
    'Unit 5: Revolutions (1750–1900)',
    'Unit 6: Consequences of Industrialization (1750–1900)',
    'Unit 7: Global Conflict (1900–present)',
    'Unit 8: Cold War & Decolonization (1900–present)',
    'Unit 9: Globalization (1900–present)',
    'Mongol Empire',
    'Ottoman Empire',
    'Safavid Empire',
    'Mughal Empire',
    'Ming Dynasty',
    'Columbian Exchange',
    'Atlantic Slave Trade',
    'French Revolution',
    'Industrial Revolution',
    'Imperialism & Colonialism',
    'World War I',
    'World War II',
    'Japanese Authoritarianism',
  ],
  'Algebra 2': [
    'Linear Equations & Inequalities',
    'Systems of Equations',
    'Quadratic Functions & Equations',
    'Polynomials & Polynomial Functions',
    'Radical Functions & Rational Exponents',
    'Exponential & Logarithmic Functions',
    'Rational Functions',
    'Sequences & Series',
    'Trigonometric Functions',
    'Trigonometric Identities & Equations',
    'Conic Sections',
    'Probability & Statistics',
    'Matrices',
    'Complex Numbers',
  ],
  'Honors Bio 3': [
    'Cell Structure & Function',
    'Cell Transport & Homeostasis',
    'Photosynthesis',
    'Cellular Respiration',
    'Cell Division (Mitosis & Meiosis)',
    'DNA Structure & Replication',
    'Protein Synthesis (Transcription & Translation)',
    'Gene Expression & Regulation',
    'Genetics & Heredity',
    'Evolution & Natural Selection',
    'Classification & Taxonomy',
    'Ecology & Ecosystems',
    'Population Ecology',
    'Communities & Biomes',
    'Human Body Systems',
    'Enzyme Activity & Kinetics',
  ],
  'English Honors': [
    'Literary Analysis & Close Reading',
    'Rhetorical Analysis',
    'Argumentative Writing',
    'Narrative Writing',
    'Poetry Analysis',
    'Shakespeare',
    'Novel Study & Themes',
    'Grammar & Sentence Structure',
    'Vocabulary in Context',
    'Research & Citation (MLA)',
    'Figurative Language & Literary Devices',
    'Essay Structure & Thesis Writing',
  ],
  'AP CSP': [
    'Unit 1: Creative Development',
    'Unit 2: Data',
    'Unit 3: Algorithms & Programming',
    'Unit 4: Computer Systems & Networks',
    'Unit 5: Impact of Computing',
    'Big Idea: Abstraction',
    'Big Idea: Data & Information',
    'Big Idea: Algorithms',
    'Big Idea: Programming',
    'Big Idea: The Internet',
    'Big Idea: Global Impact',
    'Create Task Prep',
    'Binary & Number Systems',
    'Boolean Logic',
    'Lists & Loops',
    'Functions & Procedures',
    'Cybersecurity',
  ],
  'Español 2': [
    'Preterite Tense (Regular & Irregular)',
    'Imperfect Tense',
    'Preterite vs. Imperfect',
    'Present Progressive',
    'Reflexive Verbs',
    'Direct & Indirect Object Pronouns',
    'Commands (Informal & Formal)',
    'Ser vs. Estar',
    'Por vs. Para',
    'Comparisons & Superlatives',
    'Subjunctive Mood (Intro)',
    'Vocabulary: Food & Restaurants',
    'Vocabulary: Health & Body',
    'Vocabulary: Travel & Transportation',
    'Vocabulary: Daily Routines',
    'Vocabulary: House & Chores',
    'Culture: Spanish-Speaking Countries',
  ],
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  flashcard: 'Flashcards',
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
}

export default function QuizPage() {
  const router = useRouter()
  const [sets, setSets] = useState<EnrichedQuizSet[]>([])
  const [reviewDue, setReviewDue] = useState(0)
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Create form state
  const [subject, setSubject] = useState<string>(ROMA_SUBJECTS[0])
  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState<QuizDifficulty | 'mixed'>('mixed')
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['multiple_choice', 'true_false'])
  const [documentText, setDocumentText] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchSets() }, [])

  async function fetchSets() {
    const res = await fetch('/api/quiz/sets')
    if (res.ok) {
      const data = await res.json()
      setSets(data.sets)
      setReviewDue(data.reviewDue)
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!subject || selectedTypes.length === 0) return

    setGenerating(true)
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic: topic || undefined,
          questionTypes: selectedTypes,
          questionCount,
          difficulty: difficulty === 'mixed' ? undefined : difficulty,
          documentText: documentText || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setShowCreate(false)
        setTopic('')
        setDocumentText('')
        fetchSets()
        router.push(`/quiz/${data.quizSet.id}`)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to generate quiz')
      }
    } catch {
      alert('Failed to generate quiz. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/chat/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setDocumentText(data.extractedText)
      }
    } catch { /* ignore */ }
    finally { setUploading(false) }
  }

  async function deleteSet(id: string) {
    await fetch('/api/quiz/sets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSets((prev) => prev.filter((s) => s.id !== id))
  }

  function toggleType(type: QuestionType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const filtered = filter === 'all' ? sets : sets.filter((s) => s.subject === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz Zone</h1>
          <p className="text-sm text-muted-foreground">AI-powered quizzes for your classes</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Create Quiz
        </Button>
      </div>

      {/* Review Due Banner */}
      {reviewDue > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">{reviewDue} cards due for review</p>
                <p className="text-xs text-muted-foreground">Spaced repetition keeps knowledge fresh</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => router.push('/quiz/review')}>
              Review Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Quiz Form */}
      {showCreate && (
        <Card className="animate-fade-in-scale">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Generate Quiz with AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <select
                    value={subject}
                    onChange={(e) => { setSubject(e.target.value); setTopic('') }}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {ROMA_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Topic</Label>
                  {SUBJECT_TOPICS[subject] ? (
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">General review (all topics)</option>
                      {SUBJECT_TOPICS[subject].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="__custom__">Custom topic...</option>
                    </select>
                  ) : (
                    <Input placeholder="e.g., Unit 5 Vocabulary" value={topic} onChange={(e) => setTopic(e.target.value)} />
                  )}
                  {topic === '__custom__' && (
                    <Input
                      placeholder="Type your topic..."
                      onChange={(e) => {
                        if (e.target.value) setTopic(e.target.value)
                      }}
                      onBlur={(e) => {
                        if (e.target.value) setTopic(e.target.value)
                      }}
                      className="mt-2"
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Question Types */}
              <div className="space-y-2">
                <Label>Question Types</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        selectedTypes.includes(type)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Questions: {questionCount}</Label>
                  <input
                    type="range"
                    min={5}
                    max={25}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as QuizDifficulty | 'mixed')}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* File upload */}
              <div className="space-y-2">
                <Label>Study Material (optional)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt"
                    onChange={handleFileUpload}
                    className="text-xs"
                  />
                  {uploading && <span className="text-xs text-muted-foreground">Processing...</span>}
                  {documentText && <Badge variant="outline" className="text-xs">Document loaded</Badge>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={generating || selectedTypes.length === 0}>
                  {generating ? 'Generating...' : 'Generate Quiz'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Subject Filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
          )}
        >All</button>
        {ROMA_SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >{s}</button>
        ))}
      </div>

      {/* Quiz Sets Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((set) => (
            <Card key={set.id} className="group cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/quiz/${set.id}`)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">{set.title}</h3>
                    {set.subject && (
                      <Badge variant="outline" className={cn('text-[10px] mt-1', SUBJECT_COLORS[set.subject] || '')}>
                        {set.subject}
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSet(set.id) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {set.question_count} questions
                  </span>
                  {set.attemptCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {set.attemptCount} attempt{set.attemptCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {set.bestScore !== null && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', set.bestScore >= 90 ? 'bg-green-500' : set.bestScore >= 70 ? 'bg-primary' : 'bg-amber-500')}
                        style={{ width: `${set.bestScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold">{set.bestScore}%</span>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">
                  {new Date(set.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BrainCircuit className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">No quizzes yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Create your first AI-powered quiz — pick a subject and Setter will generate questions for you.
          </p>
        </div>
      )}
    </div>
  )
}
