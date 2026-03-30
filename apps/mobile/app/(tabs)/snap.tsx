import React, { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../../lib/auth-context'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'

interface ExtractedItem {
  type: 'task' | 'achievement' | 'reminder'
  title: string
  details?: string
  class?: string
  dueDate?: string
  priority?: string
}

export default function SnapScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([])

  async function pickImage(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to continue.')
      return
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          quality: 0.8,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          quality: 0.8,
          base64: true,
        })

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setImageUri(asset.uri)
      setExtractedItems([])
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      // Process with AI vision
      await processImage(asset.base64 ?? '', asset.mimeType ?? 'image/jpeg')
    }
  }

  async function processImage(base64: string, mimeType: string) {
    setProcessing(true)
    try {
      // For now, show a preview — Vision API integration comes in Phase 3
      // This creates the UI flow that will be connected to Claude Vision
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Placeholder items to demonstrate the flow
      setExtractedItems([
        {
          type: 'task',
          title: 'Screenshot captured',
          details: 'Vision AI analysis will be connected in the next update. For now, you can share this image in Chat for Setter to help you.',
        },
      ])
    } catch {
      Alert.alert('Error', 'Could not process image. Try again.')
    } finally {
      setProcessing(false)
    }
  }

  function clearImage() {
    setImageUri(null)
    setExtractedItems([])
  }

  const ITEM_ICONS = {
    task: 'clipboard-outline' as const,
    achievement: 'trophy-outline' as const,
    reminder: 'alarm-outline' as const,
  }

  const ITEM_COLORS = {
    task: '#A5243D',
    achievement: '#D4A843',
    reminder: '#3B82F6',
  }

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 pb-4">
        <Text className="text-2xl font-bold text-slate-800">Snap It</Text>
        <Text className="text-sm text-slate-500 mt-0.5">
          Screenshot homework, grades, or slides — Setter reads it
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {!imageUri ? (
          <>
            {/* Camera button */}
            <Pressable
              onPress={() => pickImage(true)}
              className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-12 items-center mb-3"
            >
              <View className="w-16 h-16 rounded-full bg-gold-100 items-center justify-center mb-3">
                <Ionicons name="camera" size={32} color="#D4A843" />
              </View>
              <Text className="text-base font-semibold text-slate-700">Take a Photo</Text>
              <Text className="text-xs text-slate-400 mt-1">Snap a worksheet or textbook page</Text>
            </Pressable>

            {/* Photo library button */}
            <Pressable
              onPress={() => pickImage(false)}
              className="bg-white border border-slate-200 rounded-2xl py-8 items-center mb-3"
            >
              <View className="w-12 h-12 rounded-full bg-crimson-100 items-center justify-center mb-2">
                <Ionicons name="images" size={24} color="#A5243D" />
              </View>
              <Text className="text-base font-semibold text-slate-700">Choose from Photos</Text>
              <Text className="text-xs text-slate-400 mt-1">Pick a screenshot or saved image</Text>
            </Pressable>

            {/* Tips */}
            <Card className="mt-4">
              <Text className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">What Setter can read</Text>
              <View className="gap-2">
                {[
                  '📋 Google Classroom assignments → creates tasks',
                  '📊 Aeries grade reports → tracks achievements',
                  '📖 Textbook pages → summarizes for study',
                  '📝 Teacher slides → creates study notes',
                  '🗓 Schedules → adds reminders',
                ].map((tip) => (
                  <Text key={tip} className="text-xs text-slate-500 leading-4">{tip}</Text>
                ))}
              </View>
            </Card>
          </>
        ) : (
          <>
            {/* Image preview */}
            <View className="rounded-2xl overflow-hidden mb-4 bg-white shadow-sm">
              <Image
                source={{ uri: imageUri }}
                className="w-full h-52"
                resizeMode="cover"
              />
              <Pressable
                onPress={clearImage}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#ffffff" />
              </Pressable>
            </View>

            {/* Processing state */}
            {processing && (
              <Card className="items-center py-6">
                <ActivityIndicator size="large" color="#A5243D" />
                <Text className="text-sm text-slate-500 mt-3">Setter is reading your image...</Text>
              </Card>
            )}

            {/* Extracted items */}
            {extractedItems.length > 0 && !processing && (
              <View className="gap-3">
                <Text className="text-sm font-semibold text-slate-600">
                  Found {extractedItems.length} item{extractedItems.length !== 1 ? 's' : ''}:
                </Text>
                {extractedItems.map((item, i) => (
                  <Card key={i}>
                    <View className="flex-row items-start gap-3">
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: ITEM_COLORS[item.type] + '15' }}
                      >
                        <Ionicons
                          name={ITEM_ICONS[item.type]}
                          size={20}
                          color={ITEM_COLORS[item.type]}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: ITEM_COLORS[item.type] }}>
                          {item.type}
                        </Text>
                        <Text className="text-sm font-semibold text-slate-800 mt-0.5">{item.title}</Text>
                        {item.details && (
                          <Text className="text-xs text-slate-500 mt-1">{item.details}</Text>
                        )}
                        {item.class && (
                          <Text className="text-xs text-slate-400 mt-1">{item.class}</Text>
                        )}
                      </View>
                    </View>
                    <View className="flex-row gap-2 mt-3">
                      <Pressable className="flex-1 bg-crimson-600 rounded-xl py-2.5 items-center">
                        <Text className="text-white text-xs font-semibold">Add</Text>
                      </Pressable>
                      <Pressable className="flex-1 border border-slate-200 rounded-xl py-2.5 items-center">
                        <Text className="text-slate-500 text-xs font-semibold">Skip</Text>
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {/* Action buttons */}
            <View className="mt-4">
              <Button title="Snap Another" onPress={clearImage} variant="secondary" />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
