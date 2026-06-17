export default function Logo({ variant = 'full', size = 'md' }) {
  const sizes = {
    sm: { icon: 28, text: '1rem' },
    md: { icon: 36, text: '1.25rem' },
    lg: { icon: 48, text: '1.75rem' },
  };
  const { icon, text } = sizes[size] || sizes.md;

  const iconSvg = (
    <svg width={icon} height={icon} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 18 C10 10, 14 26, 18 18 C22 10, 26 26, 30 18"
        stroke="url(#grad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M30 18 L32 20 L34 18" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );

  const textLogo = (
    <span style={{ fontWeight: 700, fontSize: text, letterSpacing: '-0.02em' }}>
      <span style={{ fontWeight: 300, color: 'var(--text-secondary)' }}>PSI</span>
      <span style={{ color: 'var(--text-primary)' }}>NOTE</span>
    </span>
  );

  if (variant === 'icon') {
    return <span>{iconSvg}</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {iconSvg}
      {textLogo}
    </div>
  );
}
