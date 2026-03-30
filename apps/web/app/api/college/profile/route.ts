import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// GET — fetch student profile
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('student_profile')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ profile: data })
}

// POST — upload document, AI parses it, merges into profile
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentText, fileName } = await req.json()

  if (!documentText) {
    return NextResponse.json({ error: 'No document text provided' }, { status: 400 })
  }

  // Fetch existing profile
  const { data: existing } = await supabase
    .from('student_profile')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Also fetch achievements from the app
  const { data: achievements } = await supabase
    .from('achievements')
    .select('title, description, category, achieved_at')
    .eq('user_id', user.id)
    .eq('source', 'manual')
    .order('achieved_at', { ascending: true })

  const existingContext = existing ? `
Current profile data (merge new info, don't replace existing unless updated):
${JSON.stringify(existing, null, 2)}
` : 'No existing profile — create from scratch.'

  const achievementsContext = achievements?.length ? `
Known achievements from app:
${achievements.map(a => `- ${a.title}: ${a.description} (${a.category}, ${a.achieved_at})`).join('\n')}
` : ''

  // AI parses the document
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `You are a college admissions data extractor. Parse the uploaded document and extract student profile information for college applications.

${existingContext}
${achievementsContext}

Extract and return ONLY valid JSON with these fields (include only fields you can find or infer — null for unknown):
{
  "gpa_unweighted": number or null,
  "gpa_weighted": number or null,
  "sat_score": number or null,
  "act_score": number or null,
  "psat_score": number or null,
  "ap_classes": [{"name": "AP World History", "score": 4, "grade_taken": "9th"}],
  "honors_classes": [{"name": "Honors Biology", "grade_taken": "9th"}],
  "extracurriculars": [{"name": "Robotics Club", "role": "Member", "years": "9th-present", "description": "FRC team"}],
  "awards": [{"title": "1st Place OC Science Fair", "level": "county", "year": "2025", "description": "Environmental Engineering"}],
  "community_service": [{"org": "Pehlay Akshar", "role": "Story Recorder", "hours": 30, "description": "Literacy initiative"}],
  "leadership": [{"position": "Team Captain", "org": "Volleyball Club", "year": "2024"}],
  "sports": [{"sport": "Volleyball", "position": "Setter", "level": "club", "years": "7th-present"}],
  "intended_major": "Computer Science" or null,
  "interests": ["STEM", "Law", "Debate"],
  "summer_programs": [{"name": "Troy Cyber Basic Camp", "year": "2025"}],
  "work_experience": [],
  "special_circumstances": null,
  "ai_summary": "2-3 sentence summary of the student's profile strengths for college admissions"
}

Rules:
- MERGE with existing data, don't replace unless the new info is clearly an update
- For arrays, add new items that don't already exist (avoid duplicates)
- Infer grade levels from dates when possible
- Extract ANY relevant college admissions data: grades, test scores, activities, awards, service hours
- The summary should highlight what makes this student stand out`,
    messages: [{ role: 'user', content: `Parse this document:\n\nFile: ${fileName}\n\n${documentText.slice(0, 8000)}` }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json({ error: 'AI could not parse the document. Try a different file.' }, { status: 500 })
  }

  // Merge with existing profile
  const mergedProfile = mergeProfiles(existing, parsed)

  // Track upload
  const uploads = (existing?.raw_uploads as Array<Record<string, string>>) ?? []
  uploads.push({
    fileName: fileName ?? 'Unknown',
    uploadedAt: new Date().toISOString(),
    summary: (parsed.ai_summary as string) ?? 'Document processed',
  })

  const profileData = {
    ...mergedProfile,
    user_id: user.id,
    raw_uploads: uploads,
    ai_summary: (parsed.ai_summary as string) ?? existing?.ai_summary,
    last_analyzed_at: new Date().toISOString(),
  }

  if (existing) {
    await supabase.from('student_profile').update(profileData).eq('user_id', user.id)
  } else {
    await supabase.from('student_profile').insert(profileData)
  }

  // Fetch updated profile
  const { data: updated } = await supabase
    .from('student_profile')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    success: true,
    profile: updated,
    extracted: parsed,
  })
}

function mergeProfiles(existing: Record<string, unknown> | null, newData: Record<string, unknown>): Record<string, unknown> {
  if (!existing) return newData

  const merged: Record<string, unknown> = { ...existing }

  // Scalar fields — update if new data has a non-null value
  const scalarFields = ['gpa_unweighted', 'gpa_weighted', 'sat_score', 'act_score', 'psat_score', 'intended_major', 'special_circumstances']
  for (const field of scalarFields) {
    if (newData[field] !== null && newData[field] !== undefined) {
      merged[field] = newData[field]
    }
  }

  // Array fields — merge, deduplicate by name/title
  const arrayFields = ['ap_classes', 'honors_classes', 'extracurriculars', 'awards', 'community_service', 'leadership', 'sports', 'interests', 'summer_programs', 'work_experience']
  for (const field of arrayFields) {
    const existingArr = (existing[field] as Array<Record<string, unknown>>) ?? []
    const newArr = (newData[field] as Array<Record<string, unknown>>) ?? []

    if (field === 'interests') {
      // Simple string array dedup
      const combined = [...new Set([...(existingArr as unknown as string[]), ...(newArr as unknown as string[])])]
      merged[field] = combined
    } else {
      // Object array — dedup by name/title
      const existingKeys = new Set(existingArr.map(item => (item.name ?? item.title ?? '') as string))
      const uniqueNew = newArr.filter(item => {
        const key = (item.name ?? item.title ?? '') as string
        return key && !existingKeys.has(key)
      })
      merged[field] = [...existingArr, ...uniqueNew]
    }
  }

  return merged
}
