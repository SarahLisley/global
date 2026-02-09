import React from 'react';

export const Card = ({ children, className }: any) => (
  <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }} className={className}>
    {children}
  </div>
);

export const Badge = ({ children, className, variant }: any) => {
  const styles: React.CSSProperties = {
    padding: '0.125rem 0.625rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  };

  if (variant === 'success') {
    styles.backgroundColor = '#dcfce7'; // green-100
    styles.color = '#166534'; // green-800
  } else if (variant === 'info') {
    styles.backgroundColor = '#dbeafe'; // blue-100
    styles.color = '#1e40af'; // blue-800
  } else if (variant === 'warning') {
    styles.backgroundColor = '#fef3c7'; // amber-100
    styles.color = '#92400e'; // amber-800
  } else {
    styles.backgroundColor = '#f1f5f9'; // slate-100
    styles.color = '#475569'; // slate-600
  }

  return (
    <span style={styles} className={className}>
      {children}
    </span>
  );
};

export const Button = ({ children, className, variant, size, loading, ...props }: any) => (
  <button
    style={{ padding: '0.5rem 1rem', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
    className={className}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? 'Carregando...' : children}
  </button>
);

export const FormField = ({ children, className }: any) => (
  <div style={{ marginBottom: '1rem' }} className={className}>
    {children}
  </div>
);

export const Input = (props: any) => (
  <input style={{ padding: '0.5rem', width: '100%' }} {...props} />
);

export const Skeleton = ({ className, ...props }: any) => (
  <div
    className={`animate-pulse rounded-md bg-slate-200 ${className}`}
    {...props}
  />
);

export * from './Toast';
