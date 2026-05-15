import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  planned: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  running: 'bg-blue-100 text-blue-800 animate-pulse dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  passed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 16 16',
  className: 'w-3 h-3 shrink-0',
  stroke: 'currentColor',
  strokeWidth: 2,
  fill: 'none',
} as const;

const STATUS_ICONS: Record<string, ReactNode> = {
  // --- Run / execution states ---
  pending: (
    <svg {...svgProps}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  planned: (
    <svg {...svgProps}>
      <rect x="3" y="2" width="10" height="12" rx="1" />
      <path d="M6 1v2M10 1v2M3 6h10" strokeLinecap="round" />
    </svg>
  ),
  running: (
    <svg {...svgProps} className="w-3 h-3 shrink-0 animate-spin">
      <circle cx="8" cy="8" r="6" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
    </svg>
  ),
  completed: (
    <svg {...svgProps}>
      <circle cx="8" cy="8" r="6" />
      <path d="M5.5 8l1.5 2 3.5-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  passed: (
    <svg {...svgProps}>
      <path d="M3 8.5l3 3 7-7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  failed: (
    <svg {...svgProps}>
      <circle cx="8" cy="8" r="6" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg {...svgProps} fill="currentColor" stroke="none">
      <circle cx="8" cy="8" r="7" />
      <text
        x="8"
        y="12"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill="currentColor"
        className="fill-yellow-100 dark:fill-red-950"
      >
        !
      </text>
    </svg>
  ),
  warning: (
    <svg {...svgProps}>
      <path d="M8 1.5l6.5 12H1.5L8 1.5z" strokeLinejoin="round" />
      <path d="M8 6v3" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  skipped: (
    <svg {...svgProps}>
      <path d="M4 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 3v10" strokeLinecap="round" />
    </svg>
  ),
  cancelled: (
    <svg {...svgProps}>
      <circle cx="8" cy="8" r="6" />
      <path d="M12.24 3.76L3.76 12.24" strokeLinecap="round" />
    </svg>
  ),

  // --- Test types ---
  render: (
    <svg {...svgProps}>
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  ),
  form: (
    <svg {...svgProps}>
      <rect x="2" y="2" width="12" height="12" rx="1.5" />
      <path d="M5 5.5h6M5 8h6M5 10.5h4" strokeLinecap="round" />
    </svg>
  ),
  form_negative: (
    <svg {...svgProps}>
      <rect x="2" y="2" width="12" height="12" rx="1.5" />
      <path d="M5 5.5h6M5 8h3" strokeLinecap="round" />
      <path d="M10 10l2.5 2.5M12.5 10L10 12.5" strokeLinecap="round" />
    </svg>
  ),
  form_correction: (
    <svg {...svgProps}>
      <rect x="2" y="2" width="12" height="12" rx="1.5" />
      <path d="M5 5.5h6M5 8h3" strokeLinecap="round" />
      <path d="M9.5 11l1 1.5 2.5-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  navigation: (
    <svg {...svgProps}>
      <path d="M8 1.5l5.5 13-5.5-3.5-5.5 3.5z" strokeLinejoin="round" />
    </svg>
  ),
  interaction: (
    <svg {...svgProps}>
      <path
        d="M4 1l0 9.5 2.5-2.5 2 4.5 1.5-.5-2-4.5H11.5L4 1z"
        strokeLinejoin="round"
        fill="currentColor"
        strokeWidth={1}
      />
    </svg>
  ),
  e2e: (
    <svg {...svgProps}>
      <path d="M5 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM11 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z" />
      <path d="M7.5 8h1" strokeLinecap="round" />
    </svg>
  ),
  dialog: (
    <svg {...svgProps}>
      <path d="M2 3h12v8H6l-3 2.5V11H2V3z" strokeLinejoin="round" />
      <path d="M5 6.5h6M5 8.5h4" strokeLinecap="round" />
    </svg>
  ),
  keyboard: (
    <svg {...svgProps}>
      <rect x="1" y="4" width="14" height="9" rx="1.5" />
      <path d="M4 7h1M7.5 7h1M11 7h1M5 9.5h6" strokeLinecap="round" />
    </svg>
  ),
  variant: (
    <svg {...svgProps}>
      <rect x="2" y="5" width="12" height="6" rx="3" />
      <circle cx="11" cy="8" r="2" fill="currentColor" />
    </svg>
  ),
  login: (
    <svg {...svgProps}>
      <rect x="5" y="1.5" width="6" height="7" rx="1.5" />
      <path d="M3 14v-1a5 5 0 0 1 4-4.9" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0" />
      <path d="M8 9v2.5M6.5 10.5h3" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg {...svgProps}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  ),
  scaffold: (
    <svg {...svgProps}>
      <rect x="1.5" y="1.5" width="13" height="13" rx="1" />
      <path d="M1.5 5.5h13M6 5.5v9" />
    </svg>
  ),
  'semantic-journey': (
    <svg {...svgProps}>
      <circle cx="3" cy="13" r="1.5" fill="currentColor" />
      <circle cx="13" cy="3" r="1.5" fill="currentColor" />
      <path d="M4.5 11.5Q8 8 8 8Q8 8 11.5 4.5" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  password: (
    <svg {...svgProps}>
      <rect x="2.5" y="7" width="11" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
      <circle cx="8" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),

  // --- Size classes ---
  desktop: (
    <svg {...svgProps}>
      <rect x="1.5" y="2" width="13" height="9" rx="1" />
      <path d="M5.5 14h5M8 11v3" strokeLinecap="round" />
    </svg>
  ),
  mobile: (
    <svg {...svgProps}>
      <rect x="4" y="1" width="8" height="14" rx="1.5" />
      <path d="M7 12.5h2" strokeLinecap="round" />
    </svg>
  ),

  // --- Action types ---
  click: (
    <svg {...svgProps}>
      <path
        d="M4 1l0 9.5 2.5-2.5 2 4.5 1.5-.5-2-4.5H11.5L4 1z"
        strokeLinejoin="round"
        fill="currentColor"
        strokeWidth={1}
      />
    </svg>
  ),
  hover: (
    <svg {...svgProps}>
      <path d="M4 1l0 9.5 2.5-2.5H11.5L4 1z" strokeLinejoin="round" />
      <path d="M6 13h6" strokeLinecap="round" strokeDasharray="1.5 1.5" />
    </svg>
  ),
  type: (
    <svg {...svgProps}>
      <rect x="1" y="4" width="14" height="9" rx="1.5" />
      <path d="M4 7h1M7.5 7h1M11 7h1M5 9.5h6" strokeLinecap="round" />
    </svg>
  ),
  pressKey: (
    <svg {...svgProps}>
      <rect x="3" y="3" width="10" height="10" rx="2" />
      <path d="M8 6v4M6 8h4" strokeLinecap="round" />
    </svg>
  ),
  select: (
    <svg {...svgProps}>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M10 7l-2 2.5L6 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  navigate: (
    <svg {...svgProps}>
      <path d="M3 8h10M9.5 4.5L13 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colors =
    STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  const icon = STATUS_ICONS[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colors} ${sizeClass}`}
    >
      {icon}
      {status}
    </span>
  );
}
