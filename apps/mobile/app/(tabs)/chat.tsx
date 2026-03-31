import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { sendChatMessage } from '../../lib/api'
import type { ChatMessage } from '../../../../packages/shared/types'

const PINK = '#E8A0BF'
const PINK_LIGHT = '#FFF5F7'
const PINK_DARK = '#C77398'

interface DisplayMessage extends ChatMessage { id: string }
let counter = 0
function msgId() { return `msg_${Date.now()}_${++counter}` }

const CHIPS = [
  { label: 'AP World', emoji: '🌍' }, { label: 'Algebra 2', emoji: '📐' },
  { label: 'Honors Bio', emoji: '🧬' }, { label: 'English', emoji: '📖' },
  { label: 'AP CSP', emoji: '💻' }, { label: 'Español', emoji: '🇪🇸' },
]

export default function ChatScreen() {
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const listRef = useRef<FlatList<DisplayMessage>>(null)

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim()
    if (!text || sending) return
    setMessages(p => [...p, { id: msgId(), role: 'user', content: text, timestamp: new Date().toISOString() }])
    setInput(''); setSending(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      const res = await sendChatMessage({ sessionId, message: text })
      setSessionId(res.sessionId)
      setMessages(p => [...p, { id: msgId(), role: 'assistant', content: res.message.content, timestamp: res.message.timestamp }])
    } catch (e) {
      setMessages(p => [...p, { id: msgId(), role: 'assistant', content: 'Sorry, something went wrong.', timestamp: new Date().toISOString() }])
    } finally { setSending(false) }
  }, [input, sending, sessionId])

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[s.flex, { backgroundColor: PINK_LIGHT }]}>
      <View style={[s.flex, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Talk to Setter</Text>
          <View style={s.statusRow}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>Knows your classes, goals & wins</Text>
          </View>
        </View>

        {messages.length === 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipBar} contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}>
            {CHIPS.map(c => (
              <Pressable key={c.label} onPress={() => setInput(`Help me with ${c.label}: `)} style={s.chip}>
                <Text style={{ fontSize: 12 }}>{c.emoji}</Text>
                <Text style={s.chipText}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <FlatList
          ref={listRef} data={messages} keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={[s.msgRow, item.role === 'user' ? s.msgRight : s.msgLeft]}>
              {item.role === 'assistant' && <View style={s.avatarS}><Text style={s.avatarText}>S</Text></View>}
              <View style={[s.bubble, item.role === 'user' ? s.bubbleUser : s.bubbleAssist]}>
                <Text style={[s.bubbleText, item.role === 'user' && { color: '#fff' }]}>{item.content}</Text>
              </View>
              {item.role === 'user' && <View style={s.avatarR}><Text style={s.avatarText}>R</Text></View>}
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>🏐</Text>
              <Text style={s.emptyTitle}>What can I help with?</Text>
              <Text style={s.emptySub}>Ask me about homework, study tips, or college prep.</Text>
            </View>
          }
          contentContainerStyle={{ flexGrow: 1, padding: 16 }}
          onContentSizeChange={() => messages.length > 0 && listRef.current?.scrollToEnd({ animated: true })}
        />

        {sending && (
          <View style={s.typing}><Text style={s.typingText}>Setter is thinking...</Text></View>
        )}

        <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={s.textInput} placeholder="Message Setter..." placeholderTextColor="#94a3b8"
            value={input} onChangeText={setInput} multiline editable={!sending}
          />
          <Pressable onPress={() => send()} disabled={!input.trim() || sending}
            style={[s.sendBtn, input.trim() && !sending ? { backgroundColor: PINK } : { backgroundColor: '#e2e8f0' }]}>
            <Ionicons name="arrow-up" size={18} color={input.trim() && !sending ? '#fff' : '#94a3b8'} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399' },
  statusText: { fontSize: 10, color: '#94a3b8' },
  chipBar: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff', paddingVertical: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 11, fontWeight: '500', color: '#64748b' },
  msgRow: { marginBottom: 12, flexDirection: 'row', gap: 8 },
  msgRight: { justifyContent: 'flex-end' },
  msgLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleUser: { backgroundColor: PINK, borderBottomRightRadius: 4 },
  bubbleAssist: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20, color: '#1e293b' },
  avatarS: { width: 28, height: 28, borderRadius: 8, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  avatarR: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FBBF24', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  avatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 },
  typing: { paddingHorizontal: 16, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  typingText: { fontSize: 12, color: '#94a3b8' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 8 },
  textInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1e293b', maxHeight: 120, minHeight: 44 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
