import React from 'react';

export const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    ...props
}) => {
    const baseClasses = 'font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-black text-white hover:bg-gray-800 active:scale-95',
        secondary: 'bg-white text-black border border-black hover:bg-gray-100 active:scale-95',
        outline: 'bg-transparent border border-gray-300 hover:border-black hover:bg-gray-50',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={classes}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
