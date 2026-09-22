/**
 * Das Haus baut sich mit dem Vermietungsprozess auf.
 *
 * Jeder erledigte Schritt setzt ein Bauteil dazu: Boden, Wände, Dach, die
 * beiden „Blick"-Augen aus dem Logo, die Tür – und am Ende der Schlüssel.
 * Die Animation zeigt damit echten Zustand, sie ist keine Dekoration.
 *
 * Gezeichnet wird mit der Web Animations API des Browsers bzw. reinen
 * CSS-Übergängen – ohne zusätzliche Bibliothek.
 */

/**
 * Bauteile in fester Reihenfolge – von unten nach oben.
 *
 * Bewusst an die ANZAHL der erledigten Schritte gekoppelt, nicht an einzelne
 * Schritte: die Schritte werden selten der Reihe nach abgehakt, und ein Haus
 * mit schwebendem Dach ohne Wände wäre kein Fortschrittsbild.
 */
export const HOUSE_PARTS = [
  'Grundstück',
  'linke Wand',
  'Dach links',
  'Dach rechts',
  'rechte Wand',
  'linkes Auge',
  'rechtes Auge',
  'Tür',
  'Schlüssel',
];

function strokeStyle(done: boolean, index: number) {
  return {
    strokeDashoffset: done ? 0 : 1,
    transition: 'stroke-dashoffset 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
    transitionDelay: `${index * 0.09}s`,
  } as const;
}

function popStyle(done: boolean, index: number) {
  return {
    opacity: done ? 1 : 0,
    transform: done ? 'scale(1)' : 'scale(0.2)',
    transformBox: 'fill-box',
    transformOrigin: 'center',
    transition:
      'opacity 0.4s ease, transform 0.55s cubic-bezier(0.34, 1.45, 0.5, 1)',
    transitionDelay: `${index * 0.09}s`,
  } as const;
}

export function HouseProgress({
  built,
  total,
  nextLabel,
}: {
  built: number;
  total: number;
  nextLabel: string | null;
}) {
  const done = (i: number) => i < built;
  const complete = built >= total;

  return (
    <div className="house" data-testid="house-progress" data-built={built}>
      <svg
        viewBox="0 0 220 180"
        role="img"
        aria-label={`Vermietungsfortschritt: ${built} von ${total} Schritten`}
      >
        {/* 1 · Grundstück */}
        <path
          d="M24 152 H196"
          pathLength={1}
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="1"
          style={strokeStyle(done(0), 0)}
        />

        {/* 2 · linke Wand */}
        <path
          d="M52 152 V88"
          pathLength={1}
          fill="none"
          stroke="var(--navy)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray="1"
          style={strokeStyle(done(1), 1)}
        />

        {/* 3 · Dach links */}
        <path
          d="M52 88 L110 42"
          pathLength={1}
          fill="none"
          stroke="var(--navy)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1"
          style={strokeStyle(done(2), 2)}
        />

        {/* 4 · Dach rechts */}
        <path
          d="M110 42 L168 88"
          pathLength={1}
          fill="none"
          stroke="var(--green)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1"
          style={strokeStyle(done(3), 3)}
        />

        {/* 5 · rechte Wand */}
        <path
          d="M168 88 V152"
          pathLength={1}
          fill="none"
          stroke="var(--green)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray="1"
          style={strokeStyle(done(4), 4)}
        />

        {/* 6 · linkes Auge */}
        <g style={popStyle(done(5), 5)}>
          <circle cx="88" cy="106" r="11" fill="var(--navy)" />
          <circle cx="91.6" cy="101.6" r="3.6" fill="#ffffff" />
        </g>

        {/* 7 · rechtes Auge */}
        <g style={popStyle(done(6), 6)}>
          <circle cx="132" cy="106" r="11" fill="var(--green)" />
          <circle cx="135.6" cy="101.6" r="3.6" fill="#ffffff" />
        </g>

        {/* 8 · Tür */}
        <g style={popStyle(done(7), 7)}>
          <path
            d="M96 152 V140 a14 14 0 0 1 28 0 V152 Z"
            fill="var(--navy)"
            opacity="0.9"
          />
          <circle cx="118" cy="145" r="2.2" fill="var(--green)" />
        </g>

        {/* 9 · Schlüssel */}
        <g style={popStyle(done(8), 8)}>
          <circle
            cx="189"
            cy="100"
            r="7"
            fill="none"
            stroke="var(--green)"
            strokeWidth="4"
          />
          <path
            d="M189 107 V130 M189 120 H197 M189 126 H194"
            fill="none"
            stroke="var(--green)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </svg>

      <div className="house-caption">
        <span className="house-count">
          {built} <span className="house-count-of">von {total}</span>
        </span>
        <span className="house-hint">
          {complete
            ? 'Vermietung abgeschlossen – Schlüsselübergabe steht an.'
            : `Als Nächstes: ${nextLabel ?? '–'} · nächstes Bauteil: ${HOUSE_PARTS[Math.min(built, HOUSE_PARTS.length - 1)]}`}
        </span>
      </div>
    </div>
  );
}
