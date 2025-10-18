import React, { useState, useEffect, forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  validate?: (value: string) => string | null;
  showValidation?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  validate,
  showValidation = false,
  className = '',
  value,
  onChange,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    
    if (onChange) {
      onChange(e);
    }

    // Real-time validation
    if (validate && showValidation) {
      setIsValidating(true);
      const validationResult = validate(newValue);
      setValidationError(validationResult);
      setIsValidating(false);
    }
  };

  const displayError = error || validationError;
  const isValid = !displayError && internalValue && !isValidating;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
            displayError 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : isValid 
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                : 'border-gray-300'
          } ${className}`}
          value={internalValue}
          onChange={handleChange}
          {...props}
        />
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
        {isValid && !isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {displayError && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {displayError}
        </p>
      )}
      {helperText && !displayError && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});
