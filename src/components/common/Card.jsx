export function Card({
  children,
  className = '',
  padding = 'lg',
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  };

  return (
    <div
      className={`card ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
