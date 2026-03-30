import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildContext, buildSystemPrompt } from '@setter/shared/lib/context'
import type { ChatMessage, ChatRequest } from '@setter/shared/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body: ChatRequest = await req.json()
  const { sessionId, message } = body

  // ---- 1. Build AI Context ----
  const context = await buildContext(supabase, user.id)

  // ---- 2. Load or create chat session ----
  let session: { id: string; messages: ChatMessage[] } | null = null
  let history: ChatMessage[] = []

  if (sessionId) {
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, messages')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()
    if (data) {
      session = { id: data.id, messages: data.messages as ChatMessage[] }
      history = session.messages
    }
  }

  if (!session) {
    const { data } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        messages: [],
        context_snapshot: context,
      })
      .select('id, messages')
      .single()
    if (data) {
      session = { id: data.id, messages: [] }
    }
  }

  if (!session) {
    return new Response('Failed to create chat session', { status: 500 })
  }

  // ---- 3. Build messages for Claude ----
  const systemPrompt = buildSystemPrompt(context)

  const claudeMessages = [
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ]

  // ---- 4. Stream from Claude ----
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt + `

## Response formatting:
- Use markdown for structure: headers, bullet points, numbered steps, bold, italic
- For math: use clear notation and show step-by-step work
- For code: use fenced code blocks with language tags
- When explaining concepts, break them into digestible chunks
- Ask a follow-up question at the end to keep the conversation going and deepen understanding
- If the student seems stuck, offer to break the problem into smaller steps

## Safety:
- Keep all responses age-appropriate and academically focused
- Never do the student's homework for them — guide them to the answer
- If asked about inappropriate topics, redirect to academics kindly
- Encourage critical thinking over memorization`,
    messages: claudeMessages,
  })

  // ---- 5. Collect full response and save to session ----
  const encoder = new TextEncoder()
  const currentSessionId = session.id

  const readableStream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          const text = chunk.delta.text
          fullResponse += text
          controller.enqueue(encoder.encode(text))
        }
      }

      // Save updated messages to session
      const updatedMessages: ChatMessage[] = [
        ...history,
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() },
      ]

      // Auto-generate title from first user message if not set
      const updateData: Record<string, unknown> = {
        messages: updatedMessages,
        context_snapshot: context,
      }

      if (history.length === 0) {
        // First message — set title from user message
        updateData.title = message.slice(0, 60) + (message.length > 60 ? '...' : '')
      }

      await supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', currentSessionId)

      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Session-Id': currentSessionId,
    },
  })
}
