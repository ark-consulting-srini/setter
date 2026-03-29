import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  Modal,
  Switch,
  Animated,
  Platform,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import type {
  Achievement,
  AchievementCategory,
  CreateAchievementRequest,
} from '../../../../packages/shared/types'

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  academic: '\u{1F4DA}',
  athletic: '\u{1F3D0}',
  leadership: '\u{2B50}',
  community: '\u{1F91D}',
  personal: '\u{1F4AA}',
  streak: '\u{1F525}',
}

const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  academic: 'bg-blue-100 text-blue-700',
  athletic: 'bg-violet-100 text-violet-700',
  leadership: 'bg-amber-100 text-amber-700',
  community: 'bg-emerald-100 text-emerald-700',
  personal: 'bg-rose-100 text-rose-700',
  streak: 'bg-orange-100 text-orange-700',
}

const ACHIEVEMENT_CATEGORIES: { key: AchievementCategory; label: string }[] = [
  { key: 'academic', label: 'Academic' },
  { key: 'athletic', label: 'Athletic' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'community', label: 'Community' },
  { key: 'personal', label: 'Personal' },
  { key: 'streak', label: 'Streak' },
]

function AchievementCard({
  achievement,
  onToggleVisibility,
  index,
}: {
  achievement: Achievement
  onToggleVisibility: (id: string, visible: boolean) => void
  index: number
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 80,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim, index])

  const categoryStyle = CATEGORY_COLORS[achievement.category]

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="flex-1 m-1.5">
      <Card className="min-h-[160px]">
        <Text className="text-2xl mb-2">{CATEGORY_ICONS[achievement.category]}</Text>
        <Text className="text-sm font-semibold text-slate-800 mb-1" numberOfLines={2}>
          {achievement.title}
        </Text>
        {achievement.description && (
          <Text className="text-xs text-slate-500 mb-2" numberOfLines={2}>
            {achievement.description}
          </Text>
        )}
        <View
          className={`self-start px-2 py-0.5 rounded-full mb-2 ${
            categoryStyle.split(' ')[0]
          }`}
        >
          <Text className={`text-[10px] font-medium ${categoryStyle.split(' ')[1]}`}>
            {achievement.category}
          </Text>
        </View>
        <Text className="text-[10px] text-slate-400">
          {new Date(achievement.achieved_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>

        {/* Portfolio visibility toggle */}
        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-50">
          <Text className="text-[10px] text-slate-400">Portfolio</Text>
          <Switch
            value={achievement.is_portfolio_visible}
            onValueChange={(value) => onToggleVisibility(achievement.id, value)}
            trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
            thumbColor={achievement.is_portfolio_visible ? '#7c3aed' : '#f4f4f5'}
            style={{ transform: [{ scale: 0.7 }] }}
          />
        </View>
      </Card>
    </Animated.View>
  )
}

export default function AchievementsScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAchievement, setNewAchievement] = useState<CreateAchievementRequest>({
    title: '',
    description: '',
    category: 'personal',
  })
  const [saving, setSaving] = useState(false)

  const fetchAchievements = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('achieved_at', { ascending: false })

    setAchievements((data as Achievement[] | null) ?? [])
  }, [user])

  useEffect(() => {
    fetchAchievements()
  }, [fetchAchievements])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchAchievements()
    setRefreshing(false)
  }, [fetchAchievements])

  const handleToggleVisibility = useCallback(
    async (achievementId: string, visible: boolean) => {
      if (!user) return

      // Optimistic update
      setAchievements((prev) =>
        prev.map((a) =>
          a.id === achievementId ? { ...a, is_portfolio_visible: visible } : a
        )
      )

      await supabase
        .from('achievements')
        .update({ is_portfolio_visible: visible })
        .eq('id', achievementId)
        .eq('user_id', user.id)
    },
    [user]
  )

  const handleAdd = useCallback(async () => {
    if (!user || !newAchievement.title.trim()) return

    setSaving(true)
    const { data, error } = await supabase
      .from('achievements')
      .insert({
        user_id: user.id,
        title: newAchievement.title.trim(),
        description: newAchievement.description?.trim() || null,
        category: newAchievement.category ?? 'personal',
        source: 'manual',
        is_portfolio_visible: newAchievement.is_portfolio_visible ?? false,
        achieved_at: newAchievement.achieved_at ?? new Date().toISOString(),
      })
      .select()
      .single()

    setSaving(false)

    if (!error && data) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setAchievements((prev) => [data as Achievement, ...prev])
      setShowAddModal(false)
      setNewAchievement({ title: '', description: '', category: 'personal' })
    }
  }, [user, newAchievement])

  const renderItem = ({
    item,
    index,
  }: {
    item: Achievement
    index: number
  }) => (
    <AchievementCard
      achievement={item}
      onToggleVisibility={handleToggleVisibility}
      index={index}
    />
  )

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pb-3">
        <Text className="text-2xl font-bold text-slate-800">Achievements</Text>
        <Text className="text-sm text-slate-500 mt-0.5">
          {achievements.length} win{achievements.length !== 1 ? 's' : ''} so far
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={achievements}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        ListEmptyComponent={
          <View className="items-center py-12 px-4">
            <Ionicons name="trophy-outline" size={64} color="#c4b5fd" />
            <Text className="text-slate-500 mt-4 text-base text-center">
              No achievements yet
            </Text>
            <Text className="text-slate-400 text-sm mt-1 text-center">
              Add your wins — big or small, they all count
            </Text>
          </View>
        }
        contentContainerStyle={{
          paddingHorizontal: 12,
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
        onPress={() => setShowAddModal(true)}
        className="absolute bottom-6 right-6 bg-violet-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ marginBottom: insets.bottom }}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      {/* Add Achievement Modal */}
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
            <Text className="text-lg font-semibold text-slate-800">Add a Win</Text>
            <View className="min-w-[44px]" />
          </View>

          <ScrollView className="flex-1 px-4 pt-4">
            <Input
              label="What did you achieve?"
              placeholder="e.g., Made varsity team"
              value={newAchievement.title}
              onChangeText={(text) =>
                setNewAchievement((prev) => ({ ...prev, title: text }))
              }
              autoFocus
            />

            <Input
              label="Details (optional)"
              placeholder="Tell more about this win..."
              value={newAchievement.description ?? ''}
              onChangeText={(text) =>
                setNewAchievement((prev) => ({ ...prev, description: text }))
              }
              multiline
              inputClassName="min-h-[80px]"
            />

            {/* Category picker */}
            <Text className="text-sm font-medium text-slate-700 mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {ACHIEVEMENT_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  onPress={() =>
                    setNewAchievement((prev) => ({ ...prev, category: cat.key }))
                  }
                  className={`flex-row items-center gap-1.5 px-3 py-2.5 rounded-xl min-h-[44px] ${
                    newAchievement.category === cat.key
                      ? 'bg-violet-600'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <Text className="text-base">{CATEGORY_ICONS[cat.key]}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      newAchievement.category === cat.key
                        ? 'text-white'
                        : 'text-slate-600'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Button
              title="Add Achievement"
              onPress={handleAdd}
              loading={saving}
              disabled={!newAchievement.title.trim()}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}
