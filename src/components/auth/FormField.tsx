import React from 'react';
import { forwardRef } from 'react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div>
        <label className="block text-sm font-medium text-sand-300 mb-2">
          {label}
        </label>
        <input
          ref={ref}
          className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';