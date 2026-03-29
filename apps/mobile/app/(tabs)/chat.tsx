import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { sendChatMessage } from '../../lib/api'
import type { ChatMessage } from '../../../../packages/shared/types'

interface DisplayMessage extends ChatMessage {
  id: string
}

let messageCounter = 0
function generateMessageId(): string {
  messageCounter += 1
  return `msg_${Date.now()}_${messageCounter}`
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const flatListRef = useRef<FlatList<DisplayMessage>>(null)

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || sending) return

    const userMessage: DisplayMessage = {
      id: generateMessageId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setSending(true)

    try {
      const response = await sendChatMessage({
        sessionId,
        message: text,
      })

      setSessionId(response.sessionId)

      const assistantMessage: DisplayMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.message.content,
        timestamp: response.message.timestamp,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Something went wrong'

      const errorMessage: DisplayMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `Sorry, I couldn't process that right now. ${errorMsg}`,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }, [inputText, sending, sessionId])

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === 'user'

    return (
      <View
        className={`mb-3 max-w-[80%] ${isUser ? 'self-end' : 'self-start'}`}
      >
        <View
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-violet-600 rounded-br-sm'
              : 'bg-white border border-slate-100 rounded-bl-sm'
          }`}
        >
          <Text
            className={`text-base ${
              isUser ? 'text-white' : 'text-slate-800'
            }`}
          >
            {item.content}
          </Text>
        </View>
        <Text
          className={`text-[10px] text-slate-400 mt-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {new Date(item.timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </View>
    )
  }

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="bg-violet-100 w-16 h-16 rounded-full items-center justify-center mb-4">
        <Ionicons name="chatbubble-ellipses" size={28} color="#7c3aed" />
      </View>
      <Text className="text-lg font-semibold text-slate-800 text-center mb-2">
        Hey Roma! I'm Setter.
      </Text>
      <Text className="text-sm text-slate-500 text-center leading-5">
        I know about your tasks, journal, and goals from the last 7 days.
        Ask me anything — about school, volleyball, college prep, or just
        to talk through your day.
      </Text>
    </View>
  )

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
      keyboardVerticalOffset={0}
    >
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-4 py-3 border-b border-slate-100 bg-white">
          <Text className="text-lg font-semibold text-slate-800">Chat with Setter</Text>
          <View className="flex-row items-center mt-1 gap-1">
            <View className="w-2 h-2 rounded-full bg-emerald-400" />
            <Text className="text-xs text-slate-400">
              I know about your last 7 days
            </Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          }}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing indicator */}
        {sending && (
          <View className="flex-row items-center px-4 py-2 gap-2">
            <ActivityIndicator size="small" color="#7c3aed" />
            <Text className="text-sm text-slate-400">Setter is thinking...</Text>
          </View>
        )}

        {/* Input bar */}
        <View
          className="flex-row items-end px-4 py-3 bg-white border-t border-slate-100 gap-2"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TextInput
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-800 max-h-[120px] min-h-[48px]"
            placeholder="Ask me anything..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            returnKeyType="default"
            editable={!sending}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              inputText.trim() && !sending
                ? 'bg-violet-600'
                : 'bg-slate-200'
            }`}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={inputText.trim() && !sending ? '#ffffff' : '#94a3b8'}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
