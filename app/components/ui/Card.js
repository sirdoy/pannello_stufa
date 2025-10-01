export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-soft border border-neutral-200/50 backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}