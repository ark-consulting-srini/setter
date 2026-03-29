import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  Pressable,
  Modal,
  ScrollView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { Card } from '../../components/Card'
import { TaskCard } from '../../components/TaskCard'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import type {
  Task,
  TaskCategory,
  TaskPriority,
  CreateTaskRequest,
} from '../../../../packages/shared/types'

type FilterCategory = TaskCategory | 'all'

const CATEGORIES: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'school', label: 'School' },
  { key: 'personal', label: 'Personal' },
  { key: 'athletic', label: 'Athletic' },
  { key: 'extracurricular', label: 'Extra' },
  { key: 'college_prep', label: 'College' },
]

const PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
]

const TASK_CATEGORIES: { key: TaskCategory; label: string }[] = [
  { key: 'school', label: 'School' },
  { key: 'personal', label: 'Personal' },
  { key: 'athletic', label: 'Athletic' },
  { key: 'extracurricular', label: 'Extra' },
  { key: 'college_prep', label: 'College' },
]

interface SectionData {
  title: string
  data: Task[]
}

export default function TasksScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [tasks, setTasks] = useState<Task[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    title: '',
    category: 'personal',
    priority: 'medium',
  })
  const [saving, setSaving] = useState(false)

  const fetchTasks = useCallback(async () => {
    if (!user) return

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: true })

    if (filter !== 'all') {
      query = query.eq('category', filter)
    }

    const { data } = await query
    setTasks((data as Task[] | null) ?? [])
  }, [user, filter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchTasks()
    setRefreshing(false)
  }, [fetchTasks])

  const sections = useMemo((): SectionData[] => {
    const today = new Date().toISOString().split('T')[0]
    const todayTasks: Task[] = []
    const upcomingTasks: Task[] = []
    const completedTasks: Task[] = []

    for (const task of tasks) {
      if (task.status === 'completed') {
        completedTasks.push(task)
      } else if (!task.due_date || task.due_date <= today) {
        todayTasks.push(task)
      } else {
        upcomingTasks.push(task)
      }
    }

    const result: SectionData[] = []
    if (todayTasks.length > 0) result.push({ title: 'Today', data: todayTasks })
    if (upcomingTasks.length > 0) result.push({ title: 'Upcoming', data: upcomingTasks })
    if (completedTasks.length > 0) result.push({ title: 'Completed', data: completedTasks })
    return result
  }, [tasks])

  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      if (!user) return

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'completed' as const, completed_at: new Date().toISOString() }
            : t
        )
      )

      await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId)
        .eq('user_id', user.id)
    },
    [user]
  )

  const handleAddTask = useCallback(async () => {
    if (!user || !newTask.title.trim()) return

    setSaving(true)
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: newTask.title.trim(),
        description: null,
        category: newTask.category ?? 'personal',
        priority: newTask.priority ?? 'medium',
        status: 'pending',
        due_date: newTask.due_date ?? today,
      })
      .select()
      .single()

    setSaving(false)

    if (!error && data) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTasks((prev) => [data as Task, ...prev])
      setShowAddModal(false)
      setNewTask({ title: '', category: 'personal', priority: 'medium' })
    }
  }, [user, newTask])

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pb-3">
        <Text className="text-2xl font-bold text-slate-800 mb-3">Tasks</Text>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.key}
              onPress={() => setFilter(cat.key)}
              className={`px-4 py-2 rounded-full min-h-[36px] justify-center ${
                filter === cat.key
                  ? 'bg-violet-600'
                  : 'bg-white border border-slate-200'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  filter === cat.key ? 'text-white' : 'text-slate-600'
                }`}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Task list */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard task={item} onComplete={handleCompleteTask} />
        )}
        renderSectionHeader={({ section }) => (
          <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">
            {section.title}
          </Text>
        )}
        ListEmptyComponent={
          <Card className="items-center py-8 mx-4">
            <Ionicons name="clipboard-outline" size={48} color="#c4b5fd" />
            <Text className="text-slate-500 mt-3 text-base">No tasks yet</Text>
            <Text className="text-slate-400 text-sm mt-1">
              Tap + to add your first task
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
        stickySectionHeadersEnabled={false}
      />

      {/* FAB */}
      <Pressable
        onPress={() => setShowAddModal(true)}
        className="absolute bottom-6 right-6 bg-violet-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ marginBottom: insets.bottom }}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View
          className="flex-1 bg-slate-50"
          style={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top }}
        >
          {/* Modal header */}
          <View className="flex-row items-center justify-between px-4 pb-4 border-b border-slate-100">
            <Pressable
              onPress={() => setShowAddModal(false)}
              className="min-w-[44px] min-h-[44px] justify-center"
            >
              <Text className="text-violet-600 text-base">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-semibold text-slate-800">New Task</Text>
            <View className="min-w-[44px]" />
          </View>

          <ScrollView className="flex-1 px-4 pt-4">
            <Input
              label="What do you need to do?"
              placeholder="e.g., Study for AP Bio test"
              value={newTask.title}
              onChangeText={(text) => setNewTask((prev) => ({ ...prev, title: text }))}
              autoFocus
            />

            {/* Category picker */}
            <Text className="text-sm font-medium text-slate-700 mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {TASK_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  onPress={() => setNewTask((prev) => ({ ...prev, category: cat.key }))}
                  className={`px-4 py-2.5 rounded-xl min-h-[44px] justify-center ${
                    newTask.category === cat.key
                      ? 'bg-violet-600'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      newTask.category === cat.key ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Priority picker */}
            <Text className="text-sm font-medium text-slate-700 mb-2">Priority</Text>
            <View className="flex-row gap-2 mb-6">
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.key}
                  onPress={() => setNewTask((prev) => ({ ...prev, priority: p.key }))}
                  className={`flex-1 py-2.5 rounded-xl items-center min-h-[44px] justify-center ${
                    newTask.priority === p.key
                      ? 'bg-violet-600'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      newTask.priority === p.key ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Button
              title="Add Task"
              onPress={handleAddTask}
              loading={saving}
              disabled={!newTask.title.trim()}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}
