import React from 'react'
import { View } from 'react-native'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View
      className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 ${className}`}
    >
      {children}
    </View>
  )
}
