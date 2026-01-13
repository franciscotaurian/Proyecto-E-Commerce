import React from 'react';

export const Input = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    error,
    placeholder,
    required = false,
    disabled = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label htmlFor={name} className="block text-sm font-medium mb-2">
                    {label}
                    {required && <span className="text-red-600 ml-1">*</span>}
                </label>
            )}
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition ${error ? 'border-red-500' : 'border-gray-300'
                    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                {...props}
            />
            {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
        </div>
    );
};

export default Input;
