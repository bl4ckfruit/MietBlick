/**
 * Startseite: Begrüßung, Kennzahlen über alle Objekte und die Auswahl,
 * mit welcher Wohnung weitergearbeitet werden soll.
 */

import { Logo } from '../brand/Logo';
import { LANDLORD } from '../data/seed';
import { countsFor, useStore } from '../state/store';
import type { Property } from '../types';
import { criteriaSummary } from '../lib/criteria';
import { StackedBar } from '../components/charts';
import { IconArrow, IconCheckCircle, IconHome, IconUsers } from '../components/icons';

function PropertyTile({
  property,
  index,
  onOpen,
}: {
  property: Property;
  index: number;
  onOpen: () => void;
}) {
  const counts = countsFor(property);
  const l = property.listing;

  return (
    <article className="pick" style={{ animationDelay: `${0.45 + index * 0.12}s` }}>
      <div className="pick-visual" data-property={property.id}>
        <span className="pick-index">Wohnung {index + 1}</span>
        <span className="pick-city">{l.city || 'Neue Wohnung'}</span>
        <span className="pick-district">{l.district || 'Inserat vervollständigen'}</span>
      </div>

      <div className="pick-body">
        <div className="pick-facts">
          <span>
            <strong>{l.size} m²</strong> Wohnfläche
          </span>
          <span>
            <strong>{l.rooms} Zimmer</strong>
          </span>
          <span>
            <strong>{l.rent.toLocaleString('de-DE')} €</strong> kalt
          </span>
          <span>
            Einzug <strong>{l.moveIn || 'offen'}</strong>
          </span>
        </div>

        <p className="pick-highlight">{l.highlight || 'Objektdaten und Inserat bearbeiten.'}</p>

        <ul className="pick-criteria">
          {criteriaSummary(l.criteria).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <StackedBar
          slices={[
            { label: 'Angaben vollständig', value: counts.complete, tone: 'good' },
            { label: 'Klärungsbedarf', value: counts.open, tone: 'warn' },
            { label: 'Noch nicht ausgewertet', value: counts.pending, tone: 'info' },
          ]}
          emptyLabel="Noch keine Anfragen"
        />

        <button
          type="button"
          className="btn btn-primary pick-cta"
          data-testid={`open-${property.id}`}
          onClick={onOpen}
        >
          {l.title} öffnen <IconArrow />
        </button>
      </div>
    </article>
  );
}

export function StartPage() {
  const { state, dispatch, navigate } = useStore();
  const properties = state.propertyOrder.map((id) => state.properties[id]).filter(Boolean);

  const totals = properties.reduce(
    (acc, property) => {
      const c = countsFor(property);
      return {
        applicants: acc.applicants + c.total,
        open: acc.open + c.open,
        viewings: acc.viewings + property.viewings.length,
      };
    },
    { applicants: 0, open: 0, viewings: 0 },
  );

  const open = (id: string) => {
    dispatch({ type: 'selectProperty', id });
    navigate('objekt');
  };

  return (
    <div className="start">
      <header className="start-top">
        <Logo mark={34} text={22} />
        <div className="start-user">
          <span className="avatar">{LANDLORD.initials}</span>
          <span className="user-text">
            <span className="user-name">{LANDLORD.name}</span>
            <span className="user-role">{LANDLORD.role}</span>
          </span>
        </div>
      </header>

      <section className="start-hero">
        <p className="start-eyebrow reveal" style={{ animationDelay: '0.05s' }}>
          Für private Vermieter
        </p>
        <h1 className="start-title reveal" style={{ animationDelay: '0.12s' }}>
          Weniger Mietstress.
          <br />
          <span className="accent">Mehr Überblick.</span>
        </h1>
        <p className="start-lead reveal" style={{ animationDelay: '0.2s' }}>
          Guten Tag, {LANDLORD.name.split(' ')[0]}. MietBlick bündelt Ihre Vermietung an einem
          Ort – vom Inserat über die Anfragen bis zum fertigen Mietvertrag. Mit welcher Wohnung
          möchten Sie weitermachen?
        </p>

        <div className="start-stats reveal" style={{ animationDelay: '0.28s' }}>
          <div className="start-stat">
            <IconHome />
            <span className="start-stat-value">{properties.length}</span>
            <span className="start-stat-label">Wohnungen</span>
          </div>
          <div className="start-stat">
            <IconUsers />
            <span className="start-stat-value">{totals.applicants}</span>
            <span className="start-stat-label">Anfragen gesamt</span>
          </div>
          <div className="start-stat">
            <IconCheckCircle />
            <span className="start-stat-value">{totals.viewings}</span>
            <span className="start-stat-label">Besichtigungen geplant</span>
          </div>
        </div>
      </section>

      <section className="start-picks">
        {properties.map((property, index) => (
          <PropertyTile
            key={property.id}
            property={property}
            index={index}
            onOpen={() => open(property.id)}
          />
        ))}
      </section>

      <footer className="start-foot reveal" style={{ animationDelay: '0.7s' }}>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('wohnungen')}>
          Alle Wohnungen im Überblick
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            dispatch({ type: 'createProperty' });
            navigate('inserat');
          }}
        >
          + Neue Wohnung inserieren
        </button>
        <span className="hint">
          MietBlick unterstützt bei der Organisation. Die Entscheidung, wer die Wohnung bekommt,
          treffen Sie.
        </span>
      </footer>
    </div>
  );
}
