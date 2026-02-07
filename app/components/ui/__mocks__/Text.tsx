import React from 'react';

interface TextProps {
  children: React.ReactNode;
  as?: React.ElementType;
  [key: string]: any;
}

// Mock Text component for testing
export default function Text({ children, as: Component = 'span', ...props }: TextProps) {
  return <Component {...props}>{children}</Component>;
}
