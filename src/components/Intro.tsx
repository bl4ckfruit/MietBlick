/**
 * Eröffnungsanimation beim Öffnen der Website.
 *
 * Das Haus zeichnet sich, die Augen erscheinen, der Schriftzug fährt ein,
 * dann fährt der Vorhang nach oben und gibt die Startseite frei.
 * Klick oder Escape überspringt; bei „prefers-reduced-motion" entfällt sie.
 */

import { useEffect, useState } from 'react';

const DURATION = 2300;

export function useIntro(): { visible: boolean; skip: () => void } {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [visible, setVisible] = useState(!reduced);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setTimeout(() => setVisible(false), DURATION);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === ' ') setVisible(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [visible]);

  return { visible, skip: () => setVisible(false) };
}

export function Intro({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="intro" onClick={onSkip} data-testid="intro" role="presentation">
      <div className="intro-inner">
        <svg className="intro-logo" viewBox="0 0 120 112" aria-hidden="true">
          <path
            className="intro-roof-a"
            d="M18 99 V52 L60 16"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="intro-roof-b"
            d="M60 16 L102 52 V99"
            fill="none"
            stroke="var(--green)"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="intro-eyes">
            <circle cx="44" cy="67" r="10.5" fill="#FFFFFF" />
            <circle cx="47.6" cy="62.6" r="3.4" fill="var(--navy)" />
            <circle cx="76" cy="67" r="10.5" fill="var(--green)" />
            <circle cx="79.6" cy="62.6" r="3.4" fill="#FFFFFF" />
          </g>
        </svg>

        <div className="intro-word">
          <span className="intro-word-a">Miet</span>
          <span className="intro-word-b">Blick</span>
        </div>

        <div className="intro-claim">Weniger Mietstress. Mehr Überblick.</div>
      </div>

      <button type="button" className="intro-skip" onClick={onSkip}>
        Überspringen
      </button>
      <div className="intro-curtain" />
    </div>
  );
}
