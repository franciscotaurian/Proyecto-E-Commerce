import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`animate-spin rounded-full border-b-2 border-black ${sizeClasses[size]}`}
            ></div>
        </div>
    );
};

export default Spinner;
