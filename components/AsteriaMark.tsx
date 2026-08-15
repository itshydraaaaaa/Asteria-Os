/**
 * Asteria Mark — Vector emblem for Asteria Freelance OS.
 * Designed with a four-pointed star and orbital ring.
 */
export function AsteriaMark({
  size = 34,
  color = '#06b6d4',
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Asteria OS"
    >
      <g fill="none" stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round">
        {/* Orbital Ring */}
        <ellipse cx={50} cy={50} rx={38} ry={18} transform="rotate(-25 50 50)" strokeWidth={4} opacity={0.85} />
        {/* Four-Point Asteria Star */}
        <path d="M 50 14 Q 50 50 86 50 Q 50 50 50 86 Q 50 50 14 50 Q 50 50 50 14 Z" fill={color} opacity={0.25} />
        <path d="M 50 14 Q 50 50 86 50 Q 50 50 50 86 Q 50 50 14 50 Q 50 50 50 14 Z" strokeWidth={5} />
        {/* Core Glow Center */}
        <circle cx={50} cy={50} r={5} fill={color} stroke="none" />
      </g>
    </svg>
  );
}
