import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { Card } from '../../components/Card'
import type { JournalEntry, Achievement, Goal } from '../../../../packages/shared/types'

const MOOD_EMOJI: Record<string, string> = {
  great: '🏆', good: '😊', okay: '😐', tough: '😔', rough: '😤',
}

export default function MeScreen() {
  const { user, signOut } = useAuth()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [stats, setStats] = useState({ streak: 0, tasksThisWeek: 0, journalCount: 0, totalWins: 0 })

  const fetchData = useCallback(async () => {
    if (!user) return

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [journalRes, achRes, goalsRes, tasksRes] = await Promise.all([
      supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('achievements').select('*').eq('user_id', user.id).order('achieved_at', { ascending: false }).limit(6),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active').order('progress_pct', { ascending: false }).limit(4),
      supabase.from('tasks').select('id').eq('user_id', user.id).eq('status', 'completed').gte('completed_at', weekAgo),
    ])

    setJournals((journalRes.data as JournalEntry[]) ?? [])
    setAchievements((achRes.data as Achievement[]) ?? [])
    setGoals((goalsRes.data as Goal[]) ?? [])
    setStats({
      streak: 0,
      tasksThisWeek: tasksRes.data?.length ?? 0,
      journalCount: (journalRes.data ?? []).length,
      totalWins: (achRes.data ?? []).length,
    })
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A5243D" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View className="items-center py-6">
          <View className="w-20 h-20 rounded-full bg-crimson-600 items-center justify-center mb-3">
            <Text className="text-white text-2xl font-bold">R</Text>
          </View>
          <Text className="text-xl font-bold text-slate-800">Roma Reddy</Text>
          <Text className="text-sm text-slate-500 mt-0.5">Troy Tech &apos;29 • 🏐 Setter</Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-6">
          {[
            { label: 'Tasks/Week', value: stats.tasksThisWeek, icon: 'checkmark-done' as const },
            { label: 'Wins', value: stats.totalWins, icon: 'trophy' as const },
            { label: 'Journals', value: stats.journalCount, icon: 'book' as const },
          ].map((stat) => (
            <Card key={stat.label} className="flex-1 items-center py-3">
              <Ionicons name={stat.icon} size={18} color="#A5243D" />
              <Text className="text-lg font-bold text-slate-800 mt-1">{stat.value}</Text>
              <Text className="text-[10px] text-slate-400 font-medium">{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Active Goals */}
        {goals.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Goals</Text>
            {goals.map((goal) => (
              <Card key={goal.id} className="mb-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-slate-800 flex-1 mr-2" numberOfLines={1}>
                    {goal.title}
                  </Text>
                  <Text className="text-xs font-semibold text-crimson-600">{goal.progress_pct}%</Text>
                </View>
                <View className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <View
                    className="h-full bg-crimson-600 rounded-full"
                    style={{ width: `${goal.progress_pct}%` }}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Recent Journal */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Recent Journal</Text>
          {journals.length > 0 ? (
            journals.slice(0, 3).map((entry) => (
              <Card key={entry.id} className="mb-2">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-base">{entry.mood ? MOOD_EMOJI[entry.mood] : '📓'}</Text>
                  <Text className="text-xs text-slate-400">
                    {new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text className="text-xs text-slate-600 leading-4" numberOfLines={3}>
                  {entry.content}
                </Text>
              </Card>
            ))
          ) : (
            <Card className="items-center py-4">
              <Text className="text-xs text-slate-400">No journal entries yet</Text>
            </Card>
          )}
        </View>

        {/* Trophy Case */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Trophy Case</Text>
          {achievements.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {achievements.map((ach) => (
                <Card key={ach.id} className="w-[47%]">
                  <Text className="text-lg mb-1">
                    {ach.category === 'academic' ? '📚' : ach.category === 'athletic' ? '🏐' : ach.category === 'leadership' ? '⭐' : '🏆'}
                  </Text>
                  <Text className="text-xs font-semibold text-slate-800" numberOfLines={2}>{ach.title}</Text>
                  <Text className="text-[10px] text-slate-400 mt-1">
                    {new Date(ach.achieved_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </Text>
                </Card>
              ))}
            </View>
          ) : (
            <Card className="items-center py-4">
              <Text className="text-xs text-slate-400">No achievements yet</Text>
            </Card>
          )}
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={signOut}
          className="bg-white border border-slate-200 rounded-xl py-3.5 items-center mt-4"
        >
          <Text className="text-sm font-medium text-slate-500">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
