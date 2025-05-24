"use client";

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg'; // Example size prop
}

export function Button({ children, className, size, ...props }: ButtonProps) {
  const sizeClasses = {
    sm: 'py-1 px-2 text-xs',
    md: 'py-2 px-4 text-sm',
    lg: 'py-3 px-6 text-base',
  };

  return (
    <button
      className={`font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 ${size ? sizeClasses[size] : sizeClasses.md} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
} 