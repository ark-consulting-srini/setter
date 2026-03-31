import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, FlatList, RefreshControl, TextInput, Pressable,
  ScrollView, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import type { Task, DashboardSummary } from '../../../../packages/shared/types'

const PINK = '#E8A0BF'
const PINK_LIGHT = '#FFF5F7'
const PINK_DARK = '#C77398'
const SLATE_800 = '#1e293b'
const SLATE_500 = '#64748b'
const SLATE_400 = '#94a3b8'
const SLATE_200 = '#e2e8f0'
const SLATE_100 = '#f1f5f9'

function getGreeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const MOTIVATIONS = [
  "What's the plan today? You've got this.",
  "Small wins add up. What's first?",
  "One thing at a time. What matters most?",
  "You're building something amazing.",
  "Consistency beats intensity.",
  "Future you will thank present you.",
  "Big goals, small steps. Let's go.",
]

export default function HomeScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [quickTask, setQuickTask] = useState('')
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [summary, setSummary] = useState<DashboardSummary>({
    tasksToday: 0, tasksCompletedThisWeek: 0, currentStreak: 0,
    achievementsThisMonth: 0, activeGoals: 0,
  })

  const fetchData = useCallback(async () => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

    const [tasksRes, completedRes, achRes, goalsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('due_date', today).order('priority', { ascending: true }),
      supabase.from('tasks').select('id').eq('user_id', user.id).eq('status', 'completed').gte('completed_at', weekAgo),
      supabase.from('achievements').select('id').eq('user_id', user.id).gte('achieved_at', monthAgo),
      supabase.from('goals').select('id').eq('user_id', user.id).eq('status', 'active'),
    ])

    const tasks = (tasksRes.data as Task[]) ?? []
    setTodayTasks(tasks)
    setSummary({
      tasksToday: tasks.filter(t => t.status !== 'completed').length,
      tasksCompletedThisWeek: completedRes.data?.length ?? 0,
      currentStreak: 0,
      achievementsThisMonth: achRes.data?.length ?? 0,
      activeGoals: goalsRes.data?.length ?? 0,
    })
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await fetchData(); setRefreshing(false)
  }, [fetchData])

  const completeTask = useCallback(async (id: string) => {
    if (!user) return
    setTodayTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' as const } : t))
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id)
  }, [user])

  const addQuickTask = useCallback(async () => {
    if (!user || !quickTask.trim()) return
    const { data } = await supabase.from('tasks').insert({
      user_id: user.id, title: quickTask.trim(), category: 'personal',
      priority: 'medium', status: 'pending', due_date: new Date().toISOString().split('T')[0],
    }).select().single()
    if (data) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTodayTasks(prev => [data as Task, ...prev])
      setQuickTask('')
    }
  }, [user, quickTask])

  const pending = todayTasks.filter(t => t.status !== 'completed')
  const completed = todayTasks.filter(t => t.status === 'completed')
  const progress = todayTasks.length > 0 ? Math.round((completed.length / todayTasks.length) * 100) : 0
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)

  const stats = [
    { label: 'Due Today', value: summary.tasksToday, color: '#3B82F6' },
    { label: 'Done/Week', value: summary.tasksCompletedThisWeek, color: '#10B981' },
    { label: 'Wins', value: summary.achievementsThisMonth, color: PINK },
    { label: 'Goals', value: summary.activeGoals, color: PINK_DARK },
  ]

  const renderHeader = () => (
    <View>
      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.heroTitle}>{getGreeting()}, Roma</Text>
        <Text style={s.heroSub}>{MOTIVATIONS[dayOfYear % MOTIVATIONS.length]}</Text>
      </View>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
        {stats.map(st => (
          <View key={st.label} style={s.statCard}>
            <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Progress */}
      {todayTasks.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={s.sectionLabel}>Today&apos;s Progress</Text>
            <Text style={[s.sectionLabel, { color: PINK_DARK }]}>{progress}%</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      {/* Quick Add */}
      <View style={s.quickAddRow}>
        <View style={s.quickAddInput}>
          <Ionicons name="add-circle-outline" size={20} color={SLATE_400} />
          <TextInput
            style={s.quickAddText}
            placeholder="Quick add a task..."
            placeholderTextColor={SLATE_400}
            value={quickTask}
            onChangeText={setQuickTask}
            onSubmitEditing={addQuickTask}
            returnKeyType="done"
          />
        </View>
        {quickTask.trim().length > 0 && (
          <Pressable onPress={addQuickTask} style={s.quickAddBtn}>
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </Pressable>
        )}
      </View>

      <Text style={[s.sectionLabel, { marginTop: 8, marginBottom: 8 }]}>
        {pending.length > 0 ? 'Tasks' : 'No tasks today'}
      </Text>
    </View>
  )

  const renderTask = ({ item }: { item: Task }) => {
    const done = item.status === 'completed'
    const priorityColor = item.priority === 'high' ? '#F87171' : item.priority === 'medium' ? '#FBBF24' : '#34D399'
    return (
      <View style={[s.taskCard, done && { opacity: 0.5 }]}>
        <Pressable onPress={() => !done && completeTask(item.id)} style={s.taskCheck}>
          <View style={[s.checkCircle, done && { backgroundColor: '#34D399', borderColor: '#34D399' }]}>
            {done && <Ionicons name="checkmark" size={12} color="#fff" />}
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.taskTitle, done && { textDecorationLine: 'line-through', color: SLATE_400 }]}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={[s.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={s.taskMeta}>{item.priority}</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <FlatList
        data={todayTasks}
        keyExtractor={item => item.id}
        renderItem={renderTask}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={{ fontSize: 40 }}>🏐</Text>
            <Text style={s.emptyText}>All clear for today!</Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PINK} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PINK_LIGHT },
  hero: { backgroundColor: '#FADADD', borderRadius: 16, padding: 20, marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: SLATE_800 },
  heroSub: { fontSize: 13, color: SLATE_500, marginTop: 4 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, minWidth: 90, alignItems: 'center', borderWidth: 1, borderColor: SLATE_100 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, color: SLATE_400, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: SLATE_400, textTransform: 'uppercase', letterSpacing: 0.5 },
  progressBg: { height: 6, backgroundColor: SLATE_200, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: PINK, borderRadius: 3 },
  quickAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  quickAddInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: SLATE_200, borderRadius: 12, paddingHorizontal: 12 },
  quickAddText: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14, color: SLATE_800, minHeight: 44 },
  quickAddBtn: { backgroundColor: PINK, borderRadius: 12, padding: 12, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  taskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: SLATE_100 },
  taskCheck: { marginRight: 12, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: SLATE_200, alignItems: 'center', justifyContent: 'center' },
  taskTitle: { fontSize: 14, fontWeight: '500', color: SLATE_800 },
  taskMeta: { fontSize: 11, color: SLATE_400, textTransform: 'capitalize' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: SLATE_500, marginTop: 12 },
})
