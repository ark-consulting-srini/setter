import { supabase } from './supabase'
import type { ChatMessage } from '../../../packages/shared/types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_BASE_URL environment variable')
}

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`API error ${response.status}: ${errorBody}`)
  }

  return response
}

export interface SendChatMessageParams {
  sessionId: string | null
  message: string
}

export interface ChatResponse {
  sessionId: string
  message: ChatMessage
}

export async function sendChatMessage(
  params: SendChatMessageParams
): Promise<ChatResponse> {
  const response = await apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: params.sessionId,
      message: params.message,
    }),
  })

  const data = (await response.json()) as ChatResponse
  return data
}
