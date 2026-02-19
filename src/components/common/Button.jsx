export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  className = '',
  ...props
}) {
  const baseStyles = 'font-semibold transition-all duration-200 focus:outline-none flex items-center justify-center';

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
  };

  const sizes = {
    sm: 'px-4 py-3 text-base rounded-xl',
    md: 'px-5 py-4 text-base rounded-2xl',
    lg: 'px-6 py-4 text-lg rounded-2xl h-14',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
