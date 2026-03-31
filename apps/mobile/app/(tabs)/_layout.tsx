import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import * as Haptics from 'expo-haptics'

type IoniconsName = ComponentProps<typeof Ionicons>['name']

const PINK = '#E8A0BF'
const PINK_DARK = '#C77398'
const SLATE_500 = '#64748b'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PINK_DARK,
        tabBarInactiveTintColor: SLATE_500,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          paddingTop: 4,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="snap"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.snapButton}>
              <Ionicons name="camera" size={26} color="#ffffff" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* Hide old tabs */}
      <Tabs.Screen name="journal" options={{ href: null }} />
      <Tabs.Screen name="achievements" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  snapButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
})
