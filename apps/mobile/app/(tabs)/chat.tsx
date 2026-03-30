import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { sendChatMessage } from '../../lib/api'
import type { ChatMessage } from '../../../../packages/shared/types'

interface DisplayMessage extends ChatMessage {
  id: string
}

const SUBJECT_CHIPS = [
  { label: 'AP World', emoji: '🌍' },
  { label: 'Algebra 2', emoji: '📐' },
  { label: 'Honors Bio', emoji: '🧬' },
  { label: 'English', emoji: '📖' },
  { label: 'AP CSP', emoji: '💻' },
  { label: 'Español', emoji: '🇪🇸' },
]

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

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? inputText).trim()
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      const response = await sendChatMessage({ sessionId, message: text })
      setSessionId(response.sessionId)

      const assistantMessage: DisplayMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.message.content,
        timestamp: response.message.timestamp,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Something went wrong'
      setMessages((prev) => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content: `Sorry, I couldn't process that right now. ${errorMsg}`,
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setSending(false)
    }
  }, [inputText, sending, sessionId])

  function handleSubjectTap(label: string) {
    setInputText(`Help me with ${label}: `)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  function startNewChat() {
    setMessages([])
    setSessionId(null)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === 'user'
    return (
      <View className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
        {!isUser && (
          <View className="w-7 h-7 rounded-lg bg-crimson-600 items-center justify-center mt-0.5">
            <Text className="text-white text-[10px] font-bold">S</Text>
          </View>
        )}
        <View className={`max-w-[78%] px-4 py-3 rounded-2xl ${
          isUser ? 'bg-crimson-600 rounded-br-sm' : 'bg-white border border-slate-100 rounded-bl-sm'
        }`}>
          <Text className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-slate-800'}`}>
            {item.content}
          </Text>
        </View>
        {isUser && (
          <View className="w-7 h-7 rounded-lg bg-gold-500 items-center justify-center mt-0.5">
            <Text className="text-white text-[10px] font-bold">R</Text>
          </View>
        )}
      </View>
    )
  }

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-6">
      <View className="bg-crimson-100 w-16 h-16 rounded-2xl items-center justify-center mb-4">
        <Text className="text-2xl">🏐</Text>
      </View>
      <Text className="text-lg font-bold text-slate-800 text-center mb-2">
        What can I help you with?
      </Text>
      <Text className="text-xs text-slate-500 text-center leading-4 mb-6">
        I know your classes, goals, and achievements. Ask me anything — homework help, study tips, or just to think through your day.
      </Text>

      {/* Quick starters */}
      <View className="w-full gap-2">
        {[
          "Quiz me on Honors Bio vocabulary",
          "Help me plan my week",
          "Explain this math concept step by step",
        ].map((starter) => (
          <Pressable
            key={starter}
            onPress={() => handleSend(starter)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3"
          >
            <Text className="text-xs text-slate-600 font-medium">{starter}</Text>
          </Pressable>
        ))}
      </View>
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
        <View className="px-4 py-3 border-b border-slate-100 bg-white flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-bold text-slate-800">Talk to Setter</Text>
            <View className="flex-row items-center mt-0.5 gap-1">
              <View className="w-2 h-2 rounded-full bg-emerald-400" />
              <Text className="text-[10px] text-slate-400">Knows your classes, goals & wins</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <Pressable onPress={startNewChat} className="bg-slate-100 rounded-lg px-3 py-1.5">
              <Text className="text-[10px] font-semibold text-slate-500">New</Text>
            </Pressable>
          )}
        </View>

        {/* Subject chips */}
        {messages.length === 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="border-b border-slate-100 bg-white"
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}
          >
            {SUBJECT_CHIPS.map((chip) => (
              <Pressable
                key={chip.label}
                onPress={() => handleSubjectTap(chip.label)}
                className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5"
              >
                <Text className="text-xs">{chip.emoji}</Text>
                <Text className="text-[11px] font-medium text-slate-600">{chip.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingVertical: 12 }}
          onContentSizeChange={() => {
            if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: true })
          }}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing indicator */}
        {sending && (
          <View className="flex-row items-center px-4 py-2 gap-2">
            <View className="flex-row gap-1">
              <View className="w-1.5 h-1.5 rounded-full bg-crimson-400" />
              <View className="w-1.5 h-1.5 rounded-full bg-crimson-400" />
              <View className="w-1.5 h-1.5 rounded-full bg-crimson-400" />
            </View>
            <Text className="text-xs text-slate-400">Setter is thinking...</Text>
          </View>
        )}

        {/* Input bar */}
        <View
          className="flex-row items-end px-4 py-3 bg-white border-t border-slate-100 gap-2"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          {/* Mic button placeholder — Phase 2 */}
          <Pressable className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
            <Ionicons name="mic-outline" size={20} color="#64748b" />
          </Pressable>

          <TextInput
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 max-h-[120px] min-h-[44px]"
            placeholder="Message Setter..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            returnKeyType="default"
            editable={!sending}
          />

          {/* Paperclip — file upload */}
          <Pressable className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
            <Ionicons name="attach-outline" size={20} color="#64748b" />
          </Pressable>

          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim() || sending}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              inputText.trim() && !sending ? 'bg-crimson-600' : 'bg-slate-200'
            }`}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={inputText.trim() && !sending ? '#ffffff' : '#94a3b8'}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
