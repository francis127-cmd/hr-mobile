import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

/**
 * App-wide text input with guaranteed-readable defaults.
 *
 * Some devices (notably with system dark mode on) render bare RN
 * TextInputs with white/unstyled text on our light backgrounds, making
 * typing look broken or laggy. Centralizing the defaults here fixes every
 * screen at once — explicit dark text, muted placeholder, brand cursor.
 */
export function AppTextInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#94a3b8"
      selectionColor="#2563eb"
      {...props}
      style={[{ color: '#0f172a' }, props.style]}
    />
  );
}
