/**
 * Linke Navigation als Prozessablauf.
 *
 * Jeder Schritt zeigt, ob er erledigt, gerade dran oder noch offen ist –
 * damit sofort sichtbar ist, wo im Vermietungsprozess man steht.
 * Das Logo oben links führt zurück zur Startseite.
 */

import { useState } from 'react';
import { Logo } from '../brand/Logo';
import { LANDLORD } from '../data/seed';
import { countsFor, useStore } from '../state/store';
import { buildSteps, flowProgress, type FlowStep } from '../lib/flow';
import { Modal } from './ui';

export function Sidebar() {
  const { state, property, route, navigate, dispatch, notify } = useStore();
  const [switching, setSwitching] = useState(false);

  if (!property) return null;

  const connected =
    state.connections.immoscout || state.connections.kleinanzeigen || state.connections.immowelt;
  const steps = buildSteps(property, connected);
  const progress = flowProgress(steps);
  const currentIndex = steps.findIndex((s) => !s.done);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-head">
        <button
          type="button"
          className="sidebar-logo"
          data-testid="logo-home"
          onClick={() => navigate('start')}
          title="Zur Startseite"
          aria-label="Zur Startseite"
        >
          <Logo mark={24} text={16} />
        </button>
      </div>

      <button
        type="button"
        className="property-switch"
        data-testid="property-switch"
        onClick={() => setSwitching(true)}
      >
        <span className="property-switch-label">Aktuelles Objekt</span>
        <span className="property-switch-name">{property.listing.title}</span>
        <span className="property-switch-meta">
          {property.listing.size} m² · {property.listing.rooms} Zimmer · wechseln
        </span>
      </button>

      <div className="flow-progress">
        <div className="flow-progress-head">
          <span>Vermietungsprozess</span>
          <span>{progress} %</span>
        </div>
        <div className="flow-progress-track">
          <div className="flow-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Prozessablauf">
        <ol className="flow" data-testid="flow">
          {steps.map((step, index) => {
            const isActive = route === step.route;
            const isCurrent = index === currentIndex;
            const cls = [
              'flow-step',
              step.done ? 'is-done' : '',
              isActive ? 'is-active' : '',
              isCurrent && !isActive ? 'is-current' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <li key={step.route} className={cls}>
                <button
                  type="button"
                  className="flow-btn"
                  onClick={() => navigate(step.route)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="flow-marker" aria-hidden="true">
                    {step.done ? '✓' : index + 1}
                  </span>
                  <span className="flow-text">
                    <span className="flow-label">
                      {step.label}
                      {typeof step.count === 'number' && step.count > 0 && (
                        <span className="flow-count">{step.count}</span>
                      )}
                    </span>
                    <span className="flow-hint">{step.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="sidebar-foot">
        <div className="user">
          <span className="avatar">{LANDLORD.initials}</span>
          <span className="user-text">
            <span className="user-name">{LANDLORD.name}</span>
            <span className="user-role">{LANDLORD.role}</span>
          </span>
        </div>
      </div>

      {switching && (
        <Modal
          title="Objekt wechseln"
          sub="Jede Wohnung hat ihr eigenes Inserat, ihre eigenen Anfragen und ihren eigenen Prozessstand."
          width={560}
          onClose={() => setSwitching(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setSwitching(false)}>
                Abbrechen
              </button>
              <span className="spacer" />
              <button
                type="button"
                className="btn btn-subtle"
                onClick={() => {
                  setSwitching(false);
                  navigate('wohnungen');
                }}
              >
                Alle Wohnungen ansehen
              </button>
            </>
          }
        >
          <div className="stack" style={{ gap: 12 }}>
            {state.propertyOrder.map((id) => {
              const item = state.properties[id];
              if (!item) return null;
              const counts = countsFor(item);
              return (
                <button
                  key={id}
                  type="button"
                  className={`switch-option${id === property.id ? ' is-on' : ''}`}
                  data-testid={`switch-${id}`}
                  onClick={() => {
                    dispatch({ type: 'selectProperty', id });
                    setSwitching(false);
                    navigate('objekt');
                    notify(`${item.listing.title} geöffnet.`);
                  }}
                >
                  <span className="switch-name">{item.listing.title}</span>
                  <span className="switch-meta">
                    {item.listing.city} · {item.listing.district} · {item.listing.size} m² ·{' '}
                    {item.listing.rooms} Zimmer
                  </span>
                  <span className="switch-meta">
                    {counts.total} Anfragen · {counts.open} offen
                  </span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

    </aside>
  );
}
