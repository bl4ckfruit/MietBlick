/** Wiederverwendbare UI-Bausteine – überall gleiche Badges, Karten, Buttons. */

import { useEffect, type CSSProperties, type ReactNode } from 'react';

export type Tone = 'green' | 'amber' | 'red' | 'navy' | 'grey' | 'outline';

export function Badge({
  tone = 'grey',
  dot = false,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function Card({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={`card ${className}`.trim()} style={style}>
      {children}
    </section>
  );
}

export function CardHead({
  title,
  sub,
  right,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="card-head">
      <div>
        <div className="card-title">{title}</div>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {right && <div className="row">{right}</div>}
    </header>
  );
}

export function PageHead({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: string;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Stat({
  value,
  label,
  tone,
}: {
  value: ReactNode;
  label: string;
  tone?: 'green' | 'amber';
}) {
  const cls = tone === 'green' ? 'stat is-green' : tone === 'amber' ? 'stat is-amber' : 'stat';
  return (
    <div className={cls}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function Fact({
  label,
  value,
  missing = false,
}: {
  label: string;
  value: ReactNode;
  missing?: boolean;
}) {
  return (
    <div className="fact">
      <span className="fact-key">{label}</span>
      <span className={missing ? 'fact-val is-missing' : 'fact-val'}>{value}</span>
    </div>
  );
}

export function Modal({
  title,
  sub,
  onClose,
  children,
  footer,
  width,
}: {
  title: ReactNode;
  sub?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        style={width ? { width: `min(${width}px, 100%)` } : undefined}
      >
        <header className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            {sub && <div className="modal-sub">{sub}</div>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Banner({
  tone = 'soft',
  icon,
  children,
}: {
  tone?: 'navy' | 'soft' | 'green' | 'amber';
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`banner banner-${tone}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {children}
    </div>
  );
}
