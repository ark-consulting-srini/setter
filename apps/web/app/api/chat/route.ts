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
    max_tokens: 1024,
    system: systemPrompt,
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

      await supabase
        .from('chat_sessions')
        .update({
          messages: updatedMessages,
          context_snapshot: context,
        })
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
