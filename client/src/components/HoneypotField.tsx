interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <div 
      aria-hidden="true" 
      style={{ 
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        opacity: 0,
        height: 0,
        width: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <label htmlFor="website_url">Website URL</label>
      <input
        type="text"
        id="website_url"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="input-honeypot"
      />
    </div>
  );
}
