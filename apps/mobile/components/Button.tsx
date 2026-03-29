import React from 'react'
import { Pressable, Text, ActivityIndicator } from 'react-native'

type ButtonVariant = 'primary' | 'secondary' | 'destructive'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  className?: string
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-violet-600 active:bg-violet-700',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-white border border-slate-300 active:bg-slate-50',
    text: 'text-slate-800',
  },
  destructive: {
    container: 'bg-red-600 active:bg-red-700',
    text: 'text-white',
  },
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const styles = variantStyles[variant]
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`rounded-xl py-3.5 px-6 items-center justify-center min-h-[48px] ${styles.container} ${
        isDisabled ? 'opacity-50' : ''
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? '#1e293b' : '#ffffff'}
          size="small"
        />
      ) : (
        <Text className={`text-base font-semibold ${styles.text}`}>{title}</Text>
      )}
    </Pressable>
  )
}
