/**
 * MietBlick-Logo: zweifarbiges Haus mit den beiden "Blick"-Augen,
 * nachgezeichnet nach dem Logo aus der Markenpräsentation
 * (Dunkelblau #13283B, Grün #3A9F75).
 */

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 112"
      role="img"
      aria-label="MietBlick"
      focusable="false"
    >
      <g fill="none" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 99 V52 L60 16" stroke="var(--navy)" />
        <path d="M60 16 L102 52 V99" stroke="var(--green)" />
      </g>
      <circle cx="44" cy="67" r="10.5" fill="var(--navy)" />
      <circle cx="47.6" cy="62.6" r="3.4" fill="#FFFFFF" />
      <circle cx="76" cy="67" r="10.5" fill="var(--green)" />
      <circle cx="79.6" cy="62.6" r="3.4" fill="#FFFFFF" />
    </svg>
  );
}

export function Wordmark({ size = 19 }: { size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      <span className="wordmark-a">Miet</span>
      <span className="wordmark-b">Blick</span>
    </span>
  );
}

export function Logo({ mark = 30, text = 19 }: { mark?: number; text?: number }) {
  return (
    <span className="logo">
      <LogoMark size={mark} />
      <Wordmark size={text} />
    </span>
  );
}
