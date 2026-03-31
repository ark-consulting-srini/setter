import React, { useState } from 'react'
import { View, Text, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, ActivityIndicator, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth-context'

const PINK = '#E8A0BF'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Please fill in all fields'); return }
    setLoading(true)
    try { await signIn(email, password) } catch (e) {
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Unknown error')
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[s.flex, { backgroundColor: '#FFF5F7' }]}>
      <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
        <View style={{ marginBottom: 40 }}>
          <Text style={s.logo}>Setter</Text>
          <Text style={s.tagline}>Your personal companion</Text>
        </View>

        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#94a3b8" value={password} onChangeText={setPassword}
          secureTextEntry autoComplete="password" />

        <Pressable onPress={handleLogin} disabled={loading} style={[s.button, loading && { opacity: 0.5 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Sign In</Text>}
        </Pressable>

        <View style={s.footer}>
          <Text style={{ color: '#64748b' }}>Don&apos;t have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text style={{ color: PINK, fontWeight: '600' }}>Sign up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  logo: { fontSize: 36, fontWeight: '700', color: PINK },
  tagline: { fontSize: 16, color: '#64748b', marginTop: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1e293b', marginBottom: 12, minHeight: 48 },
  button: { backgroundColor: PINK, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, minHeight: 48 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
})
