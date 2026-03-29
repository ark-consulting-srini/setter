import React from 'react'
import { View, Text, Pressable } from 'react-native'
import type { MoodType } from '../../../packages/shared/types'

interface MoodSelectorProps {
  selected: MoodType | null
  onSelect: (mood: MoodType) => void
}

const MOODS: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'great', emoji: '🏆', label: 'Great' },
  { type: 'good', emoji: '😊', label: 'Good' },
  { type: 'okay', emoji: '😐', label: 'Okay' },
  { type: 'tough', emoji: '😔', label: 'Tough' },
  { type: 'rough', emoji: '😤', label: 'Rough' },
]

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <View className="flex-row justify-between px-2">
      {MOODS.map((mood) => {
        const isSelected = selected === mood.type
        return (
          <Pressable
            key={mood.type}
            onPress={() => onSelect(mood.type)}
            className={`items-center py-2 px-3 rounded-xl min-w-[56px] min-h-[56px] justify-center ${
              isSelected ? 'bg-violet-100 border-2 border-violet-400' : 'bg-slate-50'
            }`}
          >
            <Text className="text-2xl">{mood.emoji}</Text>
            <Text
              className={`text-xs mt-1 ${
                isSelected ? 'text-violet-700 font-semibold' : 'text-slate-500'
              }`}
            >
              {mood.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
