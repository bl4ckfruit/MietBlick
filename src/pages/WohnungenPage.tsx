/**
 * Übersicht über alle Wohnungen von Franz – mit Prozessstand je Objekt.
 */

import { countsFor, useStore } from '../state/store';
import { criteriaSummary } from '../lib/criteria';
import { buildSteps, flowProgress } from '../lib/flow';
import { Funnel, Meter, StackedBar } from '../components/charts';
import { Badge, Card, CardHead, PageHead } from '../components/ui';
import { IconArrow } from '../components/icons';

export function WohnungenPage() {
  const { state, dispatch, navigate, property } = useStore();
  const properties = state.propertyOrder.map((id) => state.properties[id]).filter(Boolean);
  const connected =
    state.connections.immoscout || state.connections.kleinanzeigen || state.connections.immowelt;

  const totals = properties.reduce(
    (acc, p) => {
      const c = countsFor(p);
      return {
        total: acc.total + c.total,
        complete: acc.complete + c.complete,
        open: acc.open + c.open,
        pending: acc.pending + c.pending,
      };
    },
    { total: 0, complete: 0, open: 0, pending: 0 },
  );

  return (
    <div className="page">
      <PageHead
        eyebrow="Meine Wohnungen"
        title="Ihre Objekte im Überblick"
        sub="Jede Wohnung hat ein eigenes Inserat, eigene Kriterien und einen eigenen Prozessstand."
        actions={
          <button type="button" className="btn btn-ghost" onClick={() => navigate('start')}>
            Zur Startseite
          </button>
        }
      />

      <Card>
        <CardHead
          title="Alle Anfragen zusammen"
          sub={`${totals.total} Anfragen über ${properties.length} Objekte`}
        />
        <div className="card-pad">
          <StackedBar
            slices={[
              { label: 'Angaben vollständig', value: totals.complete, tone: 'good' },
              { label: 'Klärungsbedarf', value: totals.open, tone: 'warn' },
              { label: 'Noch nicht ausgewertet', value: totals.pending, tone: 'info' },
            ]}
          />
        </div>
      </Card>

      <div style={{ height: 18 }} />

      <Card>
        <CardHead
          title="Vermietungsprozess im Vergleich"
          sub="Beide Objekte nebeneinander – gleiche Stufen, gleicher Maßstab."
        />
        <div className="card-pad grid grid-2" data-testid="funnel-compare">
          {/* Gemeinsame Obergrenze, damit die Balken wirklich vergleichbar sind. */}
          {properties.map((item) => {
            const c = countsFor(item);
            const steps = buildSteps(item, connected);
            return (
              <div key={item.id}>
                <div className="row" style={{ marginBottom: 12 }}>
                  <span className="card-title">{item.listing.title}</span>
                  <span className="spacer" />
                  <Badge tone="navy">{flowProgress(steps)} % erledigt</Badge>
                </div>
                <Funnel
                  compact
                  scale={Math.max(...properties.map((other) => countsFor(other).total))}
                  stages={[
                    { label: 'Anfragen', value: c.total },
                    { label: 'Ausgewertet', value: c.evaluated },
                    { label: 'Vollständig', value: c.complete },
                    { label: 'Kriterien erfüllt', value: c.criteriaOk },
                    { label: 'Besichtigung', value: c.viewingsConfirmed },
                    { label: 'Entscheidung', value: c.decided },
                  ]}
                />
                <div style={{ marginTop: 14 }}>
                  <Meter
                    label="Prozessschritte erledigt"
                    value={steps.filter((x) => x.done).length}
                    max={steps.length}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="divider" />

      <div className="grid grid-2" data-testid="property-list">
        {properties.map((item) => {
          const counts = countsFor(item);
          const isActive = property?.id === item.id;
          return (
            <Card key={item.id} className={isActive ? 'is-active-property' : ''}>
              <CardHead
                title={item.listing.title}
                sub={`${item.listing.city} · ${item.listing.district} · ${item.listing.size} m² · ${item.listing.rooms} Zimmer`}
                right={
                  isActive ? (
                    <Badge tone="green" dot>
                      Geöffnet
                    </Badge>
                  ) : (
                    <Badge tone="grey">Bereit</Badge>
                  )
                }
              />
              <div className="card-pad">
                <div className="facts" style={{ marginBottom: 16 }}>
                  <div className="fact">
                    <span className="fact-key">Miete</span>
                    <span className="fact-val">
                      {item.listing.rent.toLocaleString('de-DE')} € kalt ·{' '}
                      {item.listing.extraCosts} € NK
                    </span>
                  </div>
                  <div className="fact">
                    <span className="fact-key">Einzug</span>
                    <span className="fact-val">{item.listing.moveIn}</span>
                  </div>
                  <div className="fact">
                    <span className="fact-key">Anfragen</span>
                    <span className="fact-val">{counts.total}</span>
                  </div>
                  <div className="fact">
                    <span className="fact-key">Entscheidung</span>
                    <span className="fact-val">
                      {item.selectedApplicantId
                        ? (item.applicants.find((a) => a.id === item.selectedApplicantId)
                            ?.displayName ?? 'getroffen')
                        : 'offen'}
                    </span>
                  </div>
                </div>

                <div className="chips" style={{ marginBottom: 16 }}>
                  {criteriaSummary(item.listing.criteria).map((c) => (
                    <span className="chip" key={c}>
                      {c}
                    </span>
                  ))}
                </div>

                <StackedBar
                  title="Datenlage der Anfragen"
                  slices={[
                    { label: 'Angaben vollständig', value: counts.complete, tone: 'good' },
                    { label: 'Klärungsbedarf', value: counts.open, tone: 'warn' },
                    { label: 'Noch nicht ausgewertet', value: counts.pending, tone: 'info' },
                  ]}
                />

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  data-testid={`open-property-${item.id}`}
                  onClick={() => {
                    dispatch({ type: 'selectProperty', id: item.id });
                    navigate('objekt');
                  }}
                >
                  {isActive ? 'Weiterarbeiten' : 'Öffnen'} <IconArrow />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
