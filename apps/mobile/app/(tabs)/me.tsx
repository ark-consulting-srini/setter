import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'

const PINK = '#E8A0BF'
const MOOD: Record<string, string> = { great: '🏆', good: '😊', okay: '😐', tough: '😔', rough: '😤' }

export default function MeScreen() {
  const { user, signOut } = useAuth()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [journals, setJournals] = useState<Array<{ id: string; content: string; mood: string; created_at: string }>>([])
  const [achievements, setAchievements] = useState<Array<{ id: string; title: string; category: string; achieved_at: string }>>([])

  const fetchData = useCallback(async () => {
    if (!user) return
    const [jRes, aRes] = await Promise.all([
      supabase.from('journal_entries').select('id, content, mood, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('achievements').select('id, title, category, achieved_at').eq('user_id', user.id).order('achieved_at', { ascending: false }).limit(6),
    ])
    setJournals((jRes.data as typeof journals) ?? [])
    setAchievements((aRes.data as typeof achievements) ?? [])
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchData(); setRefreshing(false) }} tintColor={PINK} />}>

        <View style={s.profileHeader}>
          <View style={s.avatar}><Text style={s.avatarText}>R</Text></View>
          <Text style={s.name}>Roma Reddy</Text>
          <Text style={s.subtitle}>Volleyball Setter • Class of &apos;29</Text>
        </View>

        <Text style={s.sectionTitle}>Recent Journal</Text>
        {journals.map(j => (
          <View key={j.id} style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text>{j.mood ? MOOD[j.mood] ?? '📓' : '📓'}</Text>
              <Text style={s.cardDate}>{new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            </View>
            <Text style={s.cardText} numberOfLines={3}>{j.content}</Text>
          </View>
        ))}

        <Text style={s.sectionTitle}>Trophy Case</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {achievements.map(a => (
            <View key={a.id} style={[s.card, { width: '47%' }]}>
              <Text style={{ fontSize: 18, marginBottom: 4 }}>{a.category === 'academic' ? '📚' : a.category === 'athletic' ? '🏐' : '🏆'}</Text>
              <Text style={s.cardTitle} numberOfLines={2}>{a.title}</Text>
              <Text style={s.cardDate}>{new Date(a.achieved_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={signOut} style={s.signOutBtn}>
          <Text style={s.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F7' },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  cardText: { fontSize: 12, color: '#64748b', lineHeight: 16 },
  cardDate: { fontSize: 10, color: '#94a3b8' },
  signOutBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  signOutText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
})
