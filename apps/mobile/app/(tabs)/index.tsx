import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { Card } from '../../components/Card'
import { TaskCard } from '../../components/TaskCard'
import type { Task, DashboardSummary } from '../../../../packages/shared/types'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getMotivation(): string {
  const messages = [
    "Every set starts with reading the play. What's yours today?",
    "Warriors don't wait for greatness — they work for it.",
    "Small wins today, big results tomorrow.",
    "The best setters make everyone around them better.",
    "Consistency beats intensity. What will you crush today?",
    "Your future college app is being built right now.",
    "Troy Tech didn't choose you by accident.",
  ]
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return messages[dayOfYear % messages.length]
}

export default function HomeScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [quickTask, setQuickTask] = useState('')
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])
  const [summary, setSummary] = useState<DashboardSummary>({
    tasksToday: 0,
    tasksCompletedThisWeek: 0,
    currentStreak: 0,
    achievementsThisMonth: 0,
    activeGoals: 0,
  })

  const fetchData = useCallback(async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

    const [tasksResult, upcomingResult, completedResult, achievementsResult, goalsResult] =
      await Promise.all([
        supabase
          .from('tasks').select('*').eq('user_id', user.id)
          .eq('due_date', today).order('priority', { ascending: true }),
        supabase
          .from('tasks').select('*').eq('user_id', user.id)
          .in('status', ['pending', 'in_progress']).gt('due_date', today)
          .order('due_date', { ascending: true }).limit(5),
        supabase
          .from('tasks').select('id').eq('user_id', user.id)
          .eq('status', 'completed').gte('completed_at', weekAgo),
        supabase
          .from('achievements').select('id').eq('user_id', user.id)
          .gte('achieved_at', monthAgo),
        supabase
          .from('goals').select('id').eq('user_id', user.id)
          .eq('status', 'active'),
      ])

    const tasks = (tasksResult.data as Task[]) ?? []
    setTodayTasks(tasks)
    setUpcomingTasks((upcomingResult.data as Task[]) ?? [])

    setSummary({
      tasksToday: tasks.filter((t) => t.status !== 'completed').length,
      tasksCompletedThisWeek: completedResult.data?.length ?? 0,
      currentStreak: 0,
      achievementsThisMonth: achievementsResult.data?.length ?? 0,
      activeGoals: goalsResult.data?.length ?? 0,
    })
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  const handleCompleteTask = useCallback(async (taskId: string) => {
    if (!user) return
    setTodayTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: 'completed' as const, completed_at: new Date().toISOString() } : t
      )
    )
    setSummary((prev) => ({
      ...prev,
      tasksToday: prev.tasksToday - 1,
      tasksCompletedThisWeek: prev.tasksCompletedThisWeek + 1,
    }))
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', taskId).eq('user_id', user.id)
  }, [user])

  const handleQuickAdd = useCallback(async () => {
    if (!user || !quickTask.trim()) return
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('tasks').insert({
        user_id: user.id, title: quickTask.trim(), category: 'personal',
        priority: 'medium', status: 'pending', due_date: today,
      }).select().single()

    if (!error && data) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTodayTasks((prev) => [data as Task, ...prev])
      setSummary((prev) => ({ ...prev, tasksToday: prev.tasksToday + 1 }))
      setQuickTask('')
    }
  }, [user, quickTask])

  const pendingToday = todayTasks.filter((t) => t.status !== 'completed')
  const completedToday = todayTasks.filter((t) => t.status === 'completed')
  const nextUp = pendingToday[0]
  const todayProgress = todayTasks.length > 0
    ? Math.round((completedToday.length / todayTasks.length) * 100)
    : 0

  const greeting = getGreeting()
  const motivation = getMotivation()

  const summaryCards = [
    { label: 'Due Today', value: summary.tasksToday, icon: 'today-outline' as const, color: '#3B82F6' },
    { label: 'Done/Week', value: summary.tasksCompletedThisWeek, icon: 'checkmark-done-outline' as const, color: '#10B981' },
    { label: 'Wins', value: summary.achievementsThisMonth, icon: 'trophy-outline' as const, color: '#D4A843' },
    { label: 'Goals', value: summary.activeGoals, icon: 'flag-outline' as const, color: '#A5243D' },
  ]

  const renderHeader = () => (
    <View>
      {/* Hero greeting */}
      <View className="bg-crimson-600 rounded-2xl p-5 mb-5">
        <Text className="text-xl font-bold text-white">{greeting}, Roma</Text>
        <Text className="text-xs text-white/70 mt-1 leading-4">{motivation}</Text>
        <View className="flex-row gap-2 mt-3">
          <View className="bg-white/20 rounded-full px-3 py-1">
            <Text className="text-[10px] text-white font-semibold">Troy Tech &apos;29</Text>
          </View>
          <View className="bg-white/20 rounded-full px-3 py-1">
            <Text className="text-[10px] text-white font-semibold">🏐 Setter</Text>
          </View>
        </View>
      </View>

      {/* Summary cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5" contentContainerStyle={{ gap: 10 }}>
        {summaryCards.map((card) => (
          <Card key={card.label} className="min-w-[100px] items-center py-3">
            <Ionicons name={card.icon} size={18} color={card.color} />
            <Text className="text-xl font-bold text-slate-800 mt-1">{card.value}</Text>
            <Text className="text-[10px] text-slate-400 font-medium">{card.label}</Text>
          </Card>
        ))}
      </ScrollView>

      {/* Next Up card */}
      {nextUp && (
        <View className="mb-5">
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Next Up</Text>
          <Card className="border-l-4 border-l-crimson-600">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-base font-semibold text-slate-800">{nextUp.title}</Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  {nextUp.category} • {nextUp.priority} priority
                </Text>
              </View>
              <Pressable
                onPress={() => handleCompleteTask(nextUp.id)}
                className="bg-crimson-600 rounded-xl px-4 py-2.5"
              >
                <Text className="text-white text-xs font-semibold">Done</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      )}

      {/* Today's progress */}
      {todayTasks.length > 0 && (
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Lineup</Text>
            <Text className="text-xs font-semibold text-crimson-600">{todayProgress}%</Text>
          </View>
          <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <View className="h-full bg-crimson-600 rounded-full" style={{ width: `${todayProgress}%` }} />
          </View>
        </View>
      )}

      {/* Quick add */}
      <View className="flex-row items-center mb-4 gap-2">
        <View className="flex-1 bg-white border border-slate-200 rounded-xl flex-row items-center px-3">
          <Ionicons name="add-circle-outline" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 py-3 px-2 text-sm text-slate-800 min-h-[44px]"
            placeholder="Quick add a task..."
            placeholderTextColor="#94a3b8"
            value={quickTask}
            onChangeText={setQuickTask}
            onSubmitEditing={handleQuickAdd}
            returnKeyType="done"
          />
        </View>
        {quickTask.trim().length > 0 && (
          <Pressable onPress={handleQuickAdd} className="bg-crimson-600 rounded-xl p-3 min-w-[44px] min-h-[44px] items-center justify-center">
            <Ionicons name="arrow-up" size={18} color="#ffffff" />
          </Pressable>
        )}
      </View>

      {/* Tasks header */}
      <Text className="text-sm font-semibold text-slate-700 mb-2">
        {pendingToday.length > 0 ? 'Remaining Today' : 'Today\'s Tasks'}
      </Text>
    </View>
  )

  const renderFooter = () => (
    <View>
      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <View className="mt-6">
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Coming Up</Text>
          {upcomingTasks.map((task) => (
            <Card key={task.id} className="mb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-700 flex-1 mr-2" numberOfLines={1}>{task.title}</Text>
                <Text className="text-[10px] text-slate-400">
                  {new Date(task.due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  )

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <FlatList
        data={pendingToday.slice(1)} // Skip first (shown in Next Up)
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskCard task={item} onComplete={handleCompleteTask} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !nextUp ? (
            <Card className="items-center py-8">
              <Ionicons name="checkmark-circle" size={48} color="#D4A843" />
              <Text className="text-slate-500 mt-3 text-sm">All clear for today!</Text>
              <Text className="text-slate-400 text-xs mt-1">Add a task or enjoy your free time 🏐</Text>
            </Card>
          ) : null
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A5243D" />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
