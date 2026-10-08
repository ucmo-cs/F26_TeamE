import React from 'react';
import { TextInput, type TextInputProps } from './TextInput.tsx';

export type CurrencyInputProps = Omit<TextInputProps, 'prefixElement'>;

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, placeholder = '0.00', ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        type="text"
        inputMode="decimal"
        prefixElement="$"
        placeholder={placeholder}
        className={className}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
