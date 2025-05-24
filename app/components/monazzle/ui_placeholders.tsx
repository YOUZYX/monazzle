'use client';
import React from 'react';

// Placeholder for Button component
export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }
>(({ className, children, variant, ...props }, ref) => {
  // Basic styling, can be enhanced or mapped from variant
  const baseStyle = "px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50";
  let variantStyle = "bg-gray-500 text-white hover:bg-gray-600"; // Default variant
  if (variant === "destructive") {
    variantStyle = "bg-red-500 text-white hover:bg-red-600";
  } else if (variant === "outline") {
    variantStyle = "border border-gray-500 text-gray-700 hover:bg-gray-100";
  }
  // Combine className from props with placeholder styles
  const combinedClassName = `${baseStyle} ${variantStyle} ${className || ''}`.trim();
  return (
    <button className={combinedClassName} ref={ref} {...props}>
      {children}
    </button>
  );
});
Button.displayName = "Button";

// Placeholder for Card components
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div className={`border rounded-lg shadow ${className || ''}`.trim()} ref={ref} {...props}>
    {children}
  </div>
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div className={`p-4 border-b ${className || ''}`.trim()} ref={ref} {...props}>
    {children}
  </div>
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3 className={`text-lg font-semibold ${className || ''}`.trim()} ref={ref} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div className={`p-4 ${className || ''}`.trim()} ref={ref} {...props}>
    {children}
  </div>
));
CardContent.displayName = "CardContent";

// Placeholder for Input component
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={`border rounded px-3 py-2 w-full ${className || ''}`.trim()}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input"; 