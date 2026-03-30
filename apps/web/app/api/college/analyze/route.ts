import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { collegeId } = await req.json()

  // Fetch college data
  const { data: college } = await supabase.from('colleges').select('*').eq('id', collegeId).single()
  if (!college) return NextResponse.json({ error: 'College not found' }, { status: 404 })

  // Fetch student profile
  const { data: profile } = await supabase.from('student_profile').select('*').eq('user_id', user.id).single()

  // Fetch achievements
  const { data: achievements } = await supabase
    .from('achievements').select('title, description, category, achieved_at')
    .eq('user_id', user.id).eq('source', 'manual').order('achieved_at', { ascending: true })

  // Fetch knowledge base stats
  const { data: knowledgeStats } = await supabase
    .from('knowledge_entries').select('subject, mastery_score')
    .eq('user_id', user.id)

  const profileContext = profile ? JSON.stringify(profile, null, 2) : 'No profile data uploaded yet.'
  const achievementsContext = achievements?.length
    ? achievements.map(a => `- ${a.title}: ${a.description} (${a.category}, ${a.achieved_at})`).join('\n')
    : 'No achievements recorded yet.'
  const knowledgeContext = knowledgeStats?.length
    ? `Quiz performance by subject: ${JSON.stringify(
        Object.entries(
          knowledgeStats.reduce((acc: Record<string, { total: number; avg: number }>, k) => {
            if (!acc[k.subject]) acc[k.subject] = { total: 0, avg: 0 }
            acc[k.subject].total++
            acc[k.subject].avg += k.mastery_score
            return acc
          }, {})
        ).map(([subj, s]) => `${subj}: ${Math.round((s.avg / s.total) * 100)}% mastery`)
      )}`
    : ''

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `You are a college admissions counselor analyzing a student's fit for a specific college. Be honest, specific, and actionable.

Student Profile:
${profileContext}

Achievements:
${achievementsContext}

${knowledgeContext}

College:
${JSON.stringify(college, null, 2)}

The student is currently a 9th grader (freshman) at Troy High School in the Troy Tech magnet program in Fullerton, CA. She is a volleyball setter, active in debate, robotics, and key club.

Return ONLY valid JSON:
{
  "fit_category": "reach" | "target" | "safety",
  "fit_score": 0-100,
  "strengths": ["specific strength 1", "specific strength 2", ...],
  "gaps": ["specific gap 1", "specific gap 2", ...],
  "action_items": {
    "9th": ["action for this year"],
    "10th": ["action for sophomore year"],
    "11th": ["action for junior year"],
    "12th": ["action for senior year"]
  },
  "analysis": "2-3 paragraph personalized analysis of this student's fit for this college, referencing specific achievements and programs"
}

Be specific to THIS student and THIS college. Reference her actual achievements (science fairs, debate rankings, clubs). Don't be generic.`,
    messages: [{ role: 'user', content: `Analyze my fit for ${college.name}.` }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json({ error: 'Analysis failed. Try again.' }, { status: 500 })
  }

  // Save to college list
  const { data: existingEntry } = await supabase
    .from('college_list')
    .select('id')
    .eq('user_id', user.id)
    .eq('college_id', collegeId)
    .single()

  const listData = {
    user_id: user.id,
    college_id: collegeId,
    fit_category: parsed.fit_category as string,
    fit_score: parsed.fit_score as number,
    strengths: parsed.strengths,
    gaps: parsed.gaps,
    action_items: parsed.action_items,
    ai_analysis: parsed.analysis as string,
    last_analyzed_at: new Date().toISOString(),
  }

  if (existingEntry) {
    await supabase.from('college_list').update(listData).eq('id', existingEntry.id)
  } else {
    await supabase.from('college_list').insert(listData)
  }

  return NextResponse.json({ analysis: parsed, college })
}
