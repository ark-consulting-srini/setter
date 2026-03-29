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

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { signUp } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) return
    setSubmitting(true)
    await signUp(email.trim(), password, fullName.trim())
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
          <Text className="text-4xl font-bold text-violet-600 mb-2">Join Setter</Text>
          <Text className="text-lg text-slate-500">
            Set up your account and start winning
          </Text>
        </View>

        <View className="mb-6">
          <Input
            label="Full Name"
            placeholder="Roma Reddy"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />

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
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />
        </View>

        <Button
          title="Sign Up"
          onPress={handleSignUp}
          loading={submitting}
          disabled={!fullName.trim() || !email.trim() || !password.trim()}
        />

        <View className="flex-row justify-center mt-6">
          <Text className="text-slate-500">Already have an account? </Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Text className="text-violet-600 font-semibold">Log in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
