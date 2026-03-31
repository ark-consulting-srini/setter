import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '../lib/auth-context'

function RootNavigator() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  React.useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [user, loading, segments, router])

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#E8A0BF" />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F7',
  },
})
