/**
 * FLIP-Animation für Listen, die sich neu sortieren oder filtern.
 *
 * First – Last – Invert – Play: vor dem Neuzeichnen werden die Positionen
 * gemerkt, danach die neuen gelesen. Die Differenz wird als Transform gesetzt
 * und auf null animiert. Die Karte gleitet also an ihren neuen Platz, statt
 * dorthin zu springen.
 *
 * Nutzt die Web Animations API des Browsers – keine zusätzliche Bibliothek.
 */

import { useLayoutEffect, useRef, type RefObject } from 'react';

const MOVE_MS = 420;
const ENTER_MS = 320;
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Animiert alle Kinder mit `data-flip-id` innerhalb von `ref`,
 * sobald sich `key` ändert.
 */
export function useFlipGrid(ref: RefObject<HTMLElement | null>, key: string): void {
  const previous = useRef<Map<string, DOMRect>>(new Map());
  const initialised = useRef(false);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    const items = Array.from(
      container.querySelectorAll<HTMLElement>('[data-flip-id]'),
    );

    const current = new Map<string, DOMRect>();
    for (const item of items) {
      const id = item.dataset.flipId;
      if (id) current.set(id, item.getBoundingClientRect());
    }

    // Beim ersten Durchlauf gibt es nichts zu animieren – nur merken.
    if (!initialised.current || prefersReducedMotion()) {
      initialised.current = true;
      previous.current = current;
      return;
    }

    for (const item of items) {
      const id = item.dataset.flipId;
      if (!id) continue;
      const before = previous.current.get(id);
      const after = current.get(id);
      if (!after) continue;

      if (!before) {
        // Neu in der Liste: sanft einblenden.
        item.animate(
          [
            { opacity: 0, transform: 'translateY(12px) scale(0.97)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: ENTER_MS, easing: EASING },
        );
        continue;
      }

      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;

      item.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0px, 0px)' },
        ],
        { duration: MOVE_MS, easing: EASING },
      );
    }

    previous.current = current;
  }, [ref, key]);
}
