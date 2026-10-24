import type { ReactNode } from 'react'

export type IconName =
  | 'users'
  | 'score'
  | 'arrow-right'
  | 'arrow-left'
  | 'plus'
  | 'minus'
  | 'x'
  | 'trash'
  | 'dice'
  | 'trophy'
  | 'crown'
  | 'refresh'
  | 'settings'
  | 'check'
  | 'sparkles'
  | 'download'
  | 'flag'
  | 'target'
  | 'home'
  | 'shuffle'

const icons: Record<IconName, ReactNode> = {
  users: (
    <>
      <path d="M16 21v-1.8a4.2 4.2 0 0 0-4.2-4.2H6.2A4.2 4.2 0 0 0 2 19.2V21" />
      <circle cx="9" cy="7.5" r="3.5" />
      <path d="M17 11.2a3.4 3.4 0 0 0 0-6.6M22 21v-1.8a4.2 4.2 0 0 0-3.2-4.1" />
    </>
  ),
  score: (
    <>
      <rect x="3.5" y="3" width="17" height="18" rx="4" />
      <path d="M8 8h8M8 12h3M8 16h5" />
      <path d="M15.5 14.5v4M13.5 16.5h4" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M20 12H5" />
      <path d="m11 18-6-6 6-6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  trash: (
    <>
      <path d="M4 7h16M9.5 7V4.5h5V7M6 7l.8 13h10.4L18 7" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="8.3" cy="8.3" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="8.3" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="8.3" cy="15.7" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="15.7" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8M12 17v4" />
      <path d="M7 4h10v5.5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5.5H4v2a3 3 0 0 0 3 3M17 5.5h3v2a3 3 0 0 1-3 3" />
    </>
  ),
  crown: (
    <>
      <path d="m3.5 8 4.3 3L12 4l4.2 7 4.3-3-2 11H5.5l-2-11Z" />
      <path d="M5.5 19h13" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M19.2 12A7.5 7.5 0 1 1 17 6.3L20 9" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h7M15 7h5M4 17h4M12 17h8" />
      <circle cx="13" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  sparkles: (
    <>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
      <path d="M19 15l.7 2.1 2.3.9-2.3.8L19 21l-.7-2.2-2.3-.8 2.3-.9L19 15Z" />
      <path d="M5 14l.6 1.7 1.9.7-1.9.8L5 19l-.6-1.8-1.9-.8 1.9-.7L5 14Z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4 18v2h16v-2" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 5c4-2.5 7 2 14-1v9c-7 3-10-1.5-14 1" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </>
  ),
  shuffle: (
    <>
      <path d="M4 7h3.2c4.6 0 4.6 10 9.6 10H20" />
      <path d="M4 17h3.2c1.6 0 2.7-1.2 3.7-2.6M20 7h-3.2c-1.6 0-2.7 1.2-3.7 2.6" />
      <path d="m17.5 4.5 3 2.5-3 2.5M17.5 14.5l3 2.5-3 2.5" />
    </>
  ),
}

type IconProps = {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}

export function Icon({ name, size = 24, strokeWidth = 1.8, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {icons[name]}
    </svg>
  )
}
