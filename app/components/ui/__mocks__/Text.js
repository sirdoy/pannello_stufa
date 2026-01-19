// Mock Text component for testing
export default function Text({ children, as: Component = 'span', ...props }) {
  return <Component {...props}>{children}</Component>;
}
