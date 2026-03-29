import React from 'react'
import { View, Text, TextInput, type TextInputProps } from 'react-native'

interface InputProps extends Omit<TextInputProps, 'className'> {
  label?: string
  error?: string
  containerClassName?: string
  inputClassName?: string
}

export function Input({
  label,
  error,
  containerClassName = '',
  inputClassName = '',
  ...props
}: InputProps) {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-sm font-medium text-slate-700 mb-1.5">{label}</Text>
      )}
      <TextInput
        className={`bg-white border rounded-xl px-4 py-3.5 text-base text-slate-800 min-h-[48px] ${
          error ? 'border-red-400' : 'border-slate-300'
        } ${inputClassName}`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && <Text className="text-sm text-red-500 mt-1">{error}</Text>}
    </View>
  )
}
