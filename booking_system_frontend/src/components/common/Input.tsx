/**
 * Input component using Carbon Design System TextInput
 * Maintains compatibility with existing Input API
 */
import { TextInput } from '@carbon/react';
import type { ComponentProps } from 'react';

type TextInputProps = ComponentProps<typeof TextInput>;

interface InputProps extends Omit<TextInputProps, 'id' | 'labelText' | 'invalid' | 'invalidText'> {
  id?: string;
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, id, ...props }: InputProps) => {
  // Generate ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <TextInput
      id={inputId}
      labelText={label || ''}
      invalid={!!error}
      invalidText={error}
      className={className}
      {...props}
    />
  );
};

// Made with Bob
