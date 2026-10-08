import React from 'react';
import { TextInput, type TextInputProps } from './TextInput.tsx';

export type PercentageInputProps = Omit<TextInputProps, 'suffixElement'>;

export const PercentageInput = React.forwardRef<HTMLInputElement, PercentageInputProps>(
  ({ className, placeholder = '0.00', ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        type="text"
        inputMode="decimal"
        suffixElement="%"
        placeholder={placeholder}
        className={className}
        {...props}
      />
    );
  }
);

PercentageInput.displayName = 'PercentageInput';
