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

export default function HomeScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [quickTask, setQuickTask] = useState('')
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
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
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const [tasksResult, completedResult, achievementsResult, goalsResult] =
      await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('due_date', today)
          .order('priority', { ascending: true }),
        supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', weekAgo),
        supabase
          .from('achievements')
          .select('id')
          .eq('user_id', user.id)
          .gte('achieved_at', monthAgo),
        supabase
          .from('goals')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active'),
      ])

    const tasks = (tasksResult.data as Task[] | null) ?? []
    setTodayTasks(tasks)

    setSummary({
      tasksToday: tasks.filter((t) => t.status !== 'completed').length,
      tasksCompletedThisWeek: completedResult.data?.length ?? 0,
      currentStreak: 0, // Streak calculation would need more logic
      achievementsThisMonth: achievementsResult.data?.length ?? 0,
      activeGoals: goalsResult.data?.length ?? 0,
    })
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      if (!user) return

      // Optimistic update
      setTodayTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'completed' as const, completed_at: new Date().toISOString() }
            : t
        )
      )
      setSummary((prev) => ({
        ...prev,
        tasksToday: prev.tasksToday - 1,
        tasksCompletedThisWeek: prev.tasksCompletedThisWeek + 1,
      }))

      await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId)
        .eq('user_id', user.id)
    },
    [user]
  )

  const handleQuickAdd = useCallback(async () => {
    if (!user || !quickTask.trim()) return

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: quickTask.trim(),
        category: 'personal',
        priority: 'medium',
        status: 'pending',
        due_date: today,
      })
      .select()
      .single()

    if (!error && data) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTodayTasks((prev) => [data as Task, ...prev])
      setSummary((prev) => ({ ...prev, tasksToday: prev.tasksToday + 1 }))
      setQuickTask('')
    }
  }, [user, quickTask])

  const summaryCards = [
    { label: 'Due Today', value: summary.tasksToday, icon: 'today-outline' as const },
    { label: 'Done This Week', value: summary.tasksCompletedThisWeek, icon: 'checkmark-done-outline' as const },
    { label: 'Streak', value: `${summary.currentStreak}d`, icon: 'flame-outline' as const },
    { label: 'Wins This Month', value: summary.achievementsThisMonth, icon: 'trophy-outline' as const },
  ]

  const renderHeader = () => (
    <View>
      {/* Greeting */}
      <View className="mb-5">
        <Text className="text-2xl font-bold text-slate-800">Hey, Roma</Text>
        <Text className="text-base text-slate-500 mt-0.5">
          Here's your game plan for today
        </Text>
      </View>

      {/* Quick add */}
      <View className="flex-row items-center mb-5 gap-2">
        <View className="flex-1 bg-white border border-slate-200 rounded-xl flex-row items-center px-3">
          <Ionicons name="add-circle-outline" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 py-3 px-2 text-base text-slate-800 min-h-[48px]"
            placeholder="Quick add a task..."
            placeholderTextColor="#94a3b8"
            value={quickTask}
            onChangeText={setQuickTask}
            onSubmitEditing={handleQuickAdd}
            returnKeyType="done"
          />
        </View>
        {quickTask.trim().length > 0 && (
          <Pressable
            onPress={handleQuickAdd}
            className="bg-violet-600 rounded-xl p-3 min-w-[48px] min-h-[48px] items-center justify-center"
          >
            <Ionicons name="arrow-up" size={20} color="#ffffff" />
          </Pressable>
        )}
      </View>

      {/* Summary cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-5"
        contentContainerStyle={{ gap: 10 }}
      >
        {summaryCards.map((card) => (
          <Card key={card.label} className="min-w-[140px]">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name={card.icon} size={16} color="#7c3aed" />
              <Text className="text-xs text-slate-500 font-medium">{card.label}</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-800">{card.value}</Text>
          </Card>
        ))}
      </ScrollView>

      {/* Today's tasks header */}
      <Text className="text-lg font-semibold text-slate-800 mb-3">Today's Tasks</Text>
    </View>
  )

  return (
    <View
      className="flex-1 bg-slate-50"
      style={{ paddingTop: insets.top }}
    >
      <FlatList
        data={todayTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard task={item} onComplete={handleCompleteTask} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Card className="items-center py-8">
            <Ionicons name="checkmark-circle" size={48} color="#c4b5fd" />
            <Text className="text-slate-500 mt-3 text-base">No tasks for today</Text>
            <Text className="text-slate-400 text-sm mt-1">
              Add one above or enjoy your free time!
            </Text>
          </Card>
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 20,
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
    </View>
  )
}
