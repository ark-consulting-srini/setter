import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const supabase = createClient()

  // Support both cookie and Bearer auth
  const authHeader = req.headers.get('Authorization')
  let user
  if (authHeader?.startsWith('Bearer ')) {
    const { createClient: createJsClient } = await import('@supabase/supabase-js')
    const tokenClient = createJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data } = await tokenClient.auth.getUser()
    user = data.user
  } else {
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { image, mimeType, fileName } = await req.json()

  if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: (mimeType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: image,
            },
          },
          {
            type: 'text',
            text: `Analyze this image from a high school student's phone. Extract actionable items.

Return ONLY valid JSON (no markdown fences):
{
  "items": [
    {
      "type": "task" | "calendar" | "note" | "knowledge",
      "title": "short clear title",
      "details": "additional context if any",
      "dueDate": "YYYY-MM-DD or null"
    }
  ]
}

Rules:
- "task": homework assignments, things to do, action items
- "calendar": scheduled events, meetings, deadlines with specific dates
- "note": personal notes, reminders, ideas
- "knowledge": study material, concepts to remember, formulas, vocabulary
- Extract dates when visible (convert relative dates to absolute)
- If it's a screenshot of Google Classroom, extract assignments with due dates
- If it's a schedule/calendar, extract events
- If it's study material, create knowledge entries
- If it's a personal note or reminder, capture as note
- Be specific with titles — don't be vague
- Include 1-5 items typically`,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed: { items: Array<{ type: string; title: string; details?: string; dueDate?: string }> }
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ items: [{ type: 'note', title: 'Image captured', details: text }] })
    }

    return NextResponse.json({ items: parsed.items })
  } catch (error) {
    console.error('Capture error:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
