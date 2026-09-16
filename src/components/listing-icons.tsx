type IconProps = { className?: string; style?: React.CSSProperties };

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BedIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M2.5 15V6.5A1.5 1.5 0 0 1 4 5h5a1.5 1.5 0 0 1 1.5 1.5V10" />
      <path d="M2.5 10h15a1 1 0 0 1 1 1v4" />
      <path d="M2.5 17v-2.5" />
      <path d="M17.5 17v-2.5" />
      <circle cx="5.75" cy="8" r="1.25" />
    </svg>
  );
}

export function BathIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M3 10V4.75A1.75 1.75 0 0 1 4.75 3c.7 0 1.32.42 1.6 1.05" />
      <path d="M2 10h16a1 1 0 0 1 1 1 5.5 5.5 0 0 1-5.5 5.5h-6A5.5 5.5 0 0 1 2 11a1 1 0 0 1 1-1Z" />
      <line x1="6" y1="17.5" x2="6" y2="19" />
      <line x1="14" y1="17.5" x2="14" y2="19" />
    </svg>
  );
}

export function RulerIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <rect x="2.5" y="2.5" width="15" height="15" rx="1" />
      <path d="M2.5 7h3" />
      <path d="M2.5 12h3" />
      <path d="M7 2.5v3" />
      <path d="M12 2.5v3" />
    </svg>
  );
}

export function CalendarIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <rect x="2.5" y="4" width="15" height="13.5" rx="1.5" />
      <path d="M2.5 8h15" />
      <path d="M6 2.5V5.5" />
      <path d="M14 2.5V5.5" />
    </svg>
  );
}

export function CarIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M3 12.5V9.8a1 1 0 0 1 .14-.5l1.72-3A1 1 0 0 1 5.72 5.8h8.56a1 1 0 0 1 .86.5l1.72 3a1 1 0 0 1 .14.5v2.7" />
      <path d="M2.5 12.5h15v3.25a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V15h-8.5v.75a.75.75 0 0 1-.75.75H3.25a.75.75 0 0 1-.75-.75Z" />
      <circle cx="6" cy="12.5" r="1" />
      <circle cx="14" cy="12.5" r="1" />
    </svg>
  );
}

export function PawIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <ellipse cx="10" cy="13.2" rx="4" ry="3.3" />
      <ellipse cx="4.3" cy="8.7" rx="1.6" ry="2" />
      <ellipse cx="8" cy="5.5" rx="1.6" ry="2" />
      <ellipse cx="12" cy="5.5" rx="1.6" ry="2" />
      <ellipse cx="15.7" cy="8.7" rx="1.6" ry="2" />
    </svg>
  );
}

export function ArmchairIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M5 11V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V11" />
      <path d="M3.5 11h13a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
      <path d="M4.5 15v2" />
      <path d="M15.5 15v2" />
    </svg>
  );
}

export function SmokeOffIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <circle cx="10" cy="10" r="7.5" />
      <line x1="5.3" y1="5.3" x2="14.7" y2="14.7" />
    </svg>
  );
}

export function ShieldIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M10 2.5 16.5 5v4.2c0 4-2.8 6.9-6.5 8.3-3.7-1.4-6.5-4.3-6.5-8.3V5Z" />
      <path d="M10 6.5v3.5" />
      <circle cx="10" cy="13" r="0.15" fill="currentColor" />
    </svg>
  );
}

export function MailIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
      <path d="M3 5.5 10 11l7-5.5" />
    </svg>
  );
}

export function PlayIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} style={style}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.3 6.8v6.4l5.2-3.2-5.2-3.2Z" fill="currentColor" />
    </svg>
  );
}

export function SparkleIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M10 2.5c.4 2.6 1.3 4.6 2.7 6C14.1 9.9 16 10.8 17.5 11c-1.5.3-3.4 1.1-4.8 2.5-1.4 1.4-2.3 3.4-2.7 6-.4-2.6-1.3-4.6-2.7-6C6 12.1 4.1 11.3 2.5 11c1.6-.2 3.5-1.1 4.8-2.5 1.4-1.4 2.3-3.4 2.7-6Z" />
    </svg>
  );
}

export function HomeIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M3 9.5 10 3l7 6.5" />
      <path d="M4.5 8.5V16a1 1 0 0 0 1 1H14a1 1 0 0 0 1-1V8.5" />
      <path d="M8 17v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V17" />
    </svg>
  );
}
