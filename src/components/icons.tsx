/** Schlichte Strich-Icons – bewusst dezent, keine Bibliothek, kein Nachladen. */

const base = {
  width: 17,
  height: 17,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconHome = () => (
  <svg {...base} aria-hidden="true">
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20h13V9.5" />
  </svg>
);

export const IconMegaphone = () => (
  <svg {...base} aria-hidden="true">
    <path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1Z" />
    <path d="M18 9.5a3.5 3.5 0 0 1 0 5" />
  </svg>
);

export const IconInbox = () => (
  <svg {...base} aria-hidden="true">
    <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    <path d="M4.5 5.5 3 13v5.5h18V13l-1.5-7.5Z" />
  </svg>
);

export const IconUsers = () => (
  <svg {...base} aria-hidden="true">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.6a3.2 3.2 0 0 1 0 5.4" />
    <path d="M17.5 14.6a5.5 5.5 0 0 1 3 4.9" />
  </svg>
);

export const IconMail = () => (
  <svg {...base} aria-hidden="true">
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3.8 7 8.2 6 8.2-6" />
  </svg>
);

export const IconCalendar = () => (
  <svg {...base} aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
  </svg>
);

export const IconCheckCircle = () => (
  <svg {...base} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
  </svg>
);

export const IconSparkle = () => (
  <svg {...base} aria-hidden="true">
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9Z" />
    <path d="M18.5 16.5 19.2 18.6 21.3 19.3 19.2 20 18.5 22 17.8 20 15.7 19.3 17.8 18.6Z" />
  </svg>
);

export const IconArrow = () => (
  <svg {...base} width={16} height={16} aria-hidden="true">
    <path d="M5 12h13M13 7l5 5-5 5" />
  </svg>
);

export const IconCheck = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="3.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const IconLock = () => (
  <svg {...base} width={15} height={15} aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);
