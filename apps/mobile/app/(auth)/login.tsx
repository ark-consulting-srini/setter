import React, { useState } from 'react'
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth-context'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { signIn } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) return
    setSubmitting(true)
    await signIn(email.trim(), password)
    setSubmitting(false)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10">
          <Text className="text-4xl font-bold text-violet-600 mb-2">Setter</Text>
          <Text className="text-lg text-slate-500">
            Your personal game plan for success
          </Text>
        </View>

        <View className="mb-6">
          <Input
            label="Email"
            placeholder="roma@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Input
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
          />
        </View>

        <Button
          title="Sign In"
          onPress={handleSignIn}
          loading={submitting}
          disabled={!email.trim() || !password.trim()}
        />

        <View className="flex-row justify-center mt-6">
          <Text className="text-slate-500">Don't have an account? </Text>
          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            hitSlop={8}
          >
            <Text className="text-violet-600 font-semibold">Sign up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
