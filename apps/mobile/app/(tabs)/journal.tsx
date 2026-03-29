import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { Card } from '../../components/Card'
import { MoodSelector } from '../../components/MoodSelector'
import { Button } from '../../components/Button'
import { getRandomPrompt, getNextPrompt } from '../../lib/prompts'
import type { JournalEntry, MoodType } from '../../../../packages/shared/types'

const MOOD_EMOJI: Record<MoodType, string> = {
  great: '\u{1F3C6}',
  good: '\u{1F60A}',
  okay: '\u{1F610}',
  tough: '\u{1F614}',
  rough: '\u{1F624}',
}

export default function JournalScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  // Editor state
  const [mood, setMood] = useState<MoodType | null>(null)
  const [prompt, setPrompt] = useState(() => getRandomPrompt())
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const draftIdRef = useRef<string | null>(null)

  const fetchEntries = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setEntries((data as JournalEntry[] | null) ?? [])
  }, [user])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchEntries()
    setRefreshing(false)
  }, [fetchEntries])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!showEditor || !user) return

    autoSaveTimerRef.current = setInterval(async () => {
      if (!content.trim()) return

      if (draftIdRef.current) {
        await supabase
          .from('journal_entries')
          .update({
            content: content.trim(),
            mood,
            prompt_used: prompt,
          })
          .eq('id', draftIdRef.current)
          .eq('user_id', user.id)
      }
    }, 30000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [showEditor, content, mood, prompt, user])

  const handleSave = useCallback(async () => {
    if (!user || !content.trim()) return

    setSaving(true)

    if (draftIdRef.current) {
      // Update existing draft
      await supabase
        .from('journal_entries')
        .update({
          content: content.trim(),
          mood,
          prompt_used: prompt,
        })
        .eq('id', draftIdRef.current)
        .eq('user_id', user.id)
    } else {
      // Create new entry
      const { data } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          content: content.trim(),
          mood,
          prompt_used: prompt,
          is_private: false,
          has_attachment: false,
        })
        .select()
        .single()

      if (data) {
        draftIdRef.current = (data as JournalEntry).id
      }
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setSaving(false)
    setShowEditor(false)
    resetEditor()
    fetchEntries()
  }, [user, content, mood, prompt, fetchEntries])

  const resetEditor = () => {
    setContent('')
    setMood(null)
    setPrompt(getRandomPrompt())
    draftIdRef.current = null
  }

  const handleCyclePrompt = () => {
    setPrompt((current) => getNextPrompt(current))
  }

  const openEditor = () => {
    resetEditor()
    setShowEditor(true)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-slate-500">{formatDate(item.created_at)}</Text>
        {item.mood && (
          <Text className="text-lg">{MOOD_EMOJI[item.mood]}</Text>
        )}
      </View>
      <Text className="text-base text-slate-800" numberOfLines={4}>
        {item.content}
      </Text>
      {item.prompt_used && (
        <Text className="text-xs text-slate-400 mt-2 italic" numberOfLines={1}>
          Prompt: {item.prompt_used}
        </Text>
      )}
    </Card>
  )

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pb-3">
        <Text className="text-2xl font-bold text-slate-800">Journal</Text>
      </View>

      {/* Entries list */}
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListEmptyComponent={
          <Card className="items-center py-8 mx-4">
            <Ionicons name="book-outline" size={48} color="#c4b5fd" />
            <Text className="text-slate-500 mt-3 text-base">No entries yet</Text>
            <Text className="text-slate-400 text-sm mt-1">
              Start writing about your day
            </Text>
          </Card>
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 80,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7c3aed"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable
        onPress={openEditor}
        className="absolute bottom-6 right-6 bg-violet-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ marginBottom: insets.bottom }}
      >
        <Ionicons name="create-outline" size={24} color="#ffffff" />
      </Pressable>

      {/* Journal editor modal */}
      <Modal
        visible={showEditor}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditor(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-slate-50"
          style={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top }}
        >
          {/* Modal header */}
          <View className="flex-row items-center justify-between px-4 pb-4 border-b border-slate-100">
            <Pressable
              onPress={() => setShowEditor(false)}
              className="min-w-[44px] min-h-[44px] justify-center"
            >
              <Text className="text-violet-600 text-base">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-semibold text-slate-800">New Entry</Text>
            <View className="min-w-[44px]" />
          </View>

          <View className="flex-1 px-4 pt-4">
            {/* Mood selector */}
            <Text className="text-sm font-medium text-slate-700 mb-2">
              How are you feeling?
            </Text>
            <MoodSelector selected={mood} onSelect={setMood} />

            {/* Prompt */}
            <Pressable
              onPress={handleCyclePrompt}
              className="mt-5 mb-3 flex-row items-center gap-2"
            >
              <Ionicons name="sparkles" size={16} color="#7c3aed" />
              <Text className="text-sm text-violet-600 flex-1" numberOfLines={2}>
                {prompt}
              </Text>
              <Ionicons name="refresh-outline" size={16} color="#94a3b8" />
            </Pressable>

            {/* Content input */}
            <TextInput
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 mb-4"
              placeholder="Write about your day..."
              placeholderTextColor="#94a3b8"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            <Button
              title="Save Entry"
              onPress={handleSave}
              loading={saving}
              disabled={!content.trim()}
              className="mb-4"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
