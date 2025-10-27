'use client';

import { useState, ChangeEvent } from 'react';

interface NumberInputProps {
  value: number | string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

export default function NumberInput({
  value,
  onChange,
  className = '',
  placeholder = '0',
  required = false,
  min,
  max,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(
    value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    
    // Only allow numbers
    if (rawValue && !/^\d+$/.test(rawValue)) {
      return;
    }

    // Check min/max
    if (rawValue) {
      const numValue = parseInt(rawValue);
      if (min !== undefined && numValue < min) return;
      if (max !== undefined && numValue > max) return;
    }

    // Format with thousands separator
    const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setDisplayValue(formatted);
    onChange(rawValue);
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      required={required}
      inputMode="numeric"
    />
  );
}
