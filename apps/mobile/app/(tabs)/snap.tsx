import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

export default function SnapScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Text style={s.title}>Snap It</Text>
      <Text style={s.sub}>Screenshot homework, grades, or slides</Text>

      <View style={s.content}>
        <Pressable style={s.bigBtn}>
          <Ionicons name="camera" size={40} color="#E8A0BF" />
          <Text style={s.btnTitle}>Take a Photo</Text>
          <Text style={s.btnSub}>Snap a worksheet or textbook page</Text>
        </Pressable>

        <Pressable style={s.smallBtn}>
          <Ionicons name="images" size={24} color="#C77398" />
          <Text style={s.btnTitle}>Choose from Photos</Text>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F7', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  sub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  content: { flex: 1, justifyContent: 'center', gap: 12 },
  bigBtn: { backgroundColor: '#fff', borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0', borderRadius: 16, paddingVertical: 40, alignItems: 'center' },
  smallBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingVertical: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginTop: 8 },
  btnSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
})
