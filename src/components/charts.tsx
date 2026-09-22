/**
 * Diagramme für MietBlick.
 *
 * Bewusst in schlichtem HTML statt SVG: bleibt bei jeder Fensterbreite
 * unverzerrt, braucht keine Bibliothek und funktioniert offline.
 *
 * Farbregeln (validierte Palette):
 *   erfüllt/vollständig  #3A9F75
 *   offen/Klärungsbedarf #B57D05
 *   nicht erfüllt        #A8322E
 *   neutral/Verlauf      #1C6A96
 * Status wird nie über Farbe allein transportiert – immer mit Punkt,
 * Symbol und Beschriftung.
 */

import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { CheckState } from '../types';

export type Tone = 'good' | 'warn' | 'bad' | 'info';
export type Slice = { label: string; value: number; tone: Tone };

const TONE_VAR: Record<Tone, string> = {
  good: 'var(--chart-good)',
  warn: 'var(--chart-warn)',
  bad: 'var(--chart-bad)',
  info: 'var(--chart-info)',
};

/* ------------------------------------------------------------- Tooltip */

interface TipState {
  text: string;
  x: number;
  y: number;
}

function useTooltip() {
  const host = useRef<HTMLElement | null>(null);
  const [tip, setTip] = useState<TipState | null>(null);

  const show = useCallback((event: React.MouseEvent, text: string) => {
    const box = host.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ text, x: event.clientX - box.left, y: event.clientY - box.top });
  }, []);

  const hide = useCallback(() => setTip(null), []);

  const node = tip ? (
    <span
      className="chart-tip"
      style={{ left: tip.x, top: tip.y }}
      role="presentation"
    >
      {tip.text}
    </span>
  ) : null;

  return { host, show, hide, node };
}

/* ----------------------------------------------------------- Rahmen */

function Figure({
  title,
  children,
  hostRef,
}: {
  title?: string;
  children: ReactNode;
  hostRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <figure
      className="chart"
      ref={(el) => {
        hostRef.current = el;
      }}
    >
      {title && <figcaption className="chart-title">{title}</figcaption>}
      {children}
    </figure>
  );
}

/* ---------------------------------------------------- Gestapelter Balken */

/**
 * Anteile an einer Gesamtmenge.
 * Zwei Pixel Abstand in Flächenfarbe trennen die Segmente.
 */
export function StackedBar({
  title,
  slices,
  emptyLabel = 'Noch keine Daten',
}: {
  title?: string;
  slices: Slice[];
  emptyLabel?: string;
}) {
  const { host, show, hide, node } = useTooltip();
  const shown = slices.filter((s) => s.value > 0);
  const total = shown.reduce((sum, s) => sum + s.value, 0);

  return (
    <Figure title={title} hostRef={host}>
      {total === 0 ? (
        <div className="chart-empty">{emptyLabel}</div>
      ) : (
        <div
          className="stackbar"
          role="img"
          aria-label={`${title ?? 'Verteilung'}: ${shown
            .map((s) => `${s.label} ${s.value}`)
            .join(', ')}`}
        >
          {shown.map((slice, index) => (
            <span
              key={slice.label}
              className="stackbar-seg"
              onMouseMove={(event) =>
                show(
                  event,
                  `${slice.label}: ${slice.value} von ${total} (${Math.round(
                    (slice.value / total) * 100,
                  )} %)`,
                )
              }
              onMouseLeave={hide}
              style={{
                width: `${(slice.value / total) * 100}%`,
                background: TONE_VAR[slice.tone],
                borderTopRightRadius: index === shown.length - 1 ? 4 : 0,
                borderBottomRightRadius: index === shown.length - 1 ? 4 : 0,
              }}
            />
          ))}
        </div>
      )}
      <ul className="chart-legend">
        {slices.map((slice) => (
          <li key={slice.label}>
            <span className="legend-dot" style={{ background: TONE_VAR[slice.tone] }} />
            <span className="legend-label">{slice.label}</span>
            <span className="legend-value">{slice.value}</span>
          </li>
        ))}
      </ul>
      {node}
    </Figure>
  );
}

/* ------------------------------------------------------------ Trichter */

export interface FunnelStage {
  label: string;
  value: number;
  hint?: string;
}

/**
 * Trichter über den Vermietungsprozess.
 * Eine Kennzahl über mehrere Stufen – deshalb eine Farbe, Wert am Balkenende.
 */
export function Funnel({
  title,
  stages,
  compact = false,
  scale,
}: {
  title?: string;
  stages: FunnelStage[];
  compact?: boolean;
  /** Gemeinsame Obergrenze, wenn mehrere Trichter vergleichbar sein sollen. */
  scale?: number;
}) {
  const { host, show, hide, node } = useTooltip();
  const max = Math.max(1, scale ?? 0, ...stages.map((s) => s.value));
  const first = stages[0]?.value ?? 0;

  return (
    <Figure title={title} hostRef={host}>
      <div className={compact ? 'funnel is-compact' : 'funnel'}>
        {stages.map((stage) => (
          <div className="funnel-row" key={stage.label}>
            <span className="funnel-label">{stage.label}</span>
            <span className="funnel-track">
              <span
                className="funnel-bar"
                onMouseMove={(event) =>
                  show(
                    event,
                    first > 0
                      ? `${stage.label}: ${stage.value} von ${first} (${Math.round(
                          (stage.value / first) * 100,
                        )} %)`
                      : `${stage.label}: ${stage.value}`,
                  )
                }
                onMouseLeave={hide}
                style={{
                  width: `${Math.max(stage.value / max, stage.value > 0 ? 0.04 : 0) * 100}%`,
                }}
              />
              <span className="funnel-value">{stage.value}</span>
            </span>
            {!compact && <span className="funnel-hint">{stage.hint ?? ''}</span>}
          </div>
        ))}
      </div>
      {node}
    </Figure>
  );
}

/* --------------------------------------------------------------- Meter */

/** Ein Anteil gegen eine Obergrenze – schlichter Fortschrittsbalken. */
export function Meter({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="meter">
      <div className="meter-head">
        <span className="meter-label">{label}</span>
        <span className="meter-value">
          {value}
          {suffix ? ` ${suffix}` : ` von ${max}`}
        </span>
      </div>
      <div className="meter-track" role="img" aria-label={`${label}: ${pct} Prozent`}>
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------ Kriterienmatrix */

export interface MatrixRow {
  id: string;
  name: string;
  note: string;
  cells: Array<{ key: string; label: string; state: CheckState; detail: string }>;
}

const MARK: Record<CheckState, string> = {
  erfuellt: '✓',
  offen: '?',
  nicht_erfuellt: '✕',
};

const CELL_TEXT: Record<CheckState, string> = {
  erfuellt: 'erfüllt',
  offen: 'offen',
  nicht_erfuellt: 'nicht erfüllt',
};

/**
 * Alle Bewerbungen gegen alle Kriterien in einem Raster.
 * Jede Zelle trägt Symbol und Beschriftung – Farbe allein entscheidet nie.
 */
export function CriteriaMatrix({
  rows,
  columns,
}: {
  rows: MatrixRow[];
  columns: string[];
}) {
  const { host, show, hide, node } = useTooltip();

  if (rows.length === 0) {
    return <div className="chart-empty">Keine Bewerbung in diesem Filter.</div>;
  }

  return (
    <Figure hostRef={host}>
      <div className="matrix-scroll">
        <table className="matrix" data-testid="criteria-matrix">
          <thead>
            <tr>
              <th scope="col">Bewerbung</th>
              {columns.map((column) => (
                <th scope="col" key={column}>
                  {column}
                </th>
              ))}
              <th scope="col">Nächster Schritt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} data-testid={`matrix-${row.id}`}>
                <th scope="row">{row.name}</th>
                {row.cells.map((cell) => (
                  <td key={cell.key} className={`matrix-cell is-${cell.state}`}>
                    <span
                      className="matrix-mark"
                      onMouseMove={(event) => show(event, `${cell.label}: ${cell.detail}`)}
                      onMouseLeave={hide}
                    >
                      <span aria-hidden="true">{MARK[cell.state]}</span>
                      <span className="matrix-text">{CELL_TEXT[cell.state]}</span>
                    </span>
                  </td>
                ))}
                <td className="matrix-note">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="chart-legend">
        <li>
          <span className="legend-dot" style={{ background: TONE_VAR.good }} />
          <span className="legend-label">✓ erfüllt</span>
        </li>
        <li>
          <span className="legend-dot" style={{ background: TONE_VAR.warn }} />
          <span className="legend-label">? Angabe offen</span>
        </li>
        <li>
          <span className="legend-dot" style={{ background: TONE_VAR.bad }} />
          <span className="legend-label">✕ nicht erfüllt</span>
        </li>
      </ul>
      {node}
    </Figure>
  );
}
