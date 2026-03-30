import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import type { Task, TaskCategory, TaskPriority } from '../../../packages/shared/types'
import { Card } from './Card'

interface TaskCardProps {
  task: Task
  onComplete: (taskId: string) => void
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  school: 'bg-blue-100 text-blue-700',
  personal: 'bg-emerald-100 text-emerald-700',
  extracurricular: 'bg-amber-100 text-amber-700',
  athletic: 'bg-violet-100 text-violet-700',
  college_prep: 'bg-rose-100 text-rose-700',
}

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  school: 'School',
  personal: 'Personal',
  extracurricular: 'Extra',
  athletic: 'Athletic',
  college_prep: 'College',
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const isCompleted = task.status === 'completed'
  const categoryStyle = CATEGORY_COLORS[task.category]
  const priorityColor = PRIORITY_COLORS[task.priority]

  const handleComplete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onComplete(task.id)
  }

  return (
    <Card className={`mb-3 ${isCompleted ? 'opacity-60' : ''}`}>
      <View className="flex-row items-center">
        <Pressable
          onPress={handleComplete}
          disabled={isCompleted}
          className="min-w-[44px] min-h-[44px] items-center justify-center mr-3"
          hitSlop={8}
        >
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              isCompleted ? 'bg-crimson-600 border-crimson-600' : 'border-slate-300'
            }`}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            )}
          </View>
        </Pressable>

        <View className="flex-1">
          <Text
            className={`text-base font-medium ${
              isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
            }`}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          <View className="flex-row items-center mt-1.5 gap-2">
            <View className={`px-2 py-0.5 rounded-full ${categoryStyle.split(' ')[0]}`}>
              <Text className={`text-xs font-medium ${categoryStyle.split(' ')[1]}`}>
                {CATEGORY_LABELS[task.category]}
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <View className={`w-2 h-2 rounded-full ${priorityColor}`} />
              <Text className="text-xs text-slate-500 capitalize">{task.priority}</Text>
            </View>

            {task.due_date && (
              <Text className="text-xs text-slate-400">
                {new Date(task.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  )
}
