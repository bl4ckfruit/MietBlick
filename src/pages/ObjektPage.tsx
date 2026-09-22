/**
 * Objektseite: die aktive Wohnung mit Kriterien und dem aktuellen Prozessstand.
 * Die Prozessschritte stehen bewusst nur noch links im Flow, nicht mehr hier.
 */

import { countsFor, useProperty, useStore } from '../state/store';
import { criteriaSummary } from '../lib/criteria';
import { buildSteps, flowProgress } from '../lib/flow';
import { HouseProgress } from '../brand/HouseProgress';
import { Funnel, Meter } from '../components/charts';
import { Badge, Banner, Card, CardHead, PageHead } from '../components/ui';
import { IconArrow } from '../components/icons';

export function ObjektPage() {
  const { navigate, state } = useStore();
  const property = useProperty();
  const counts = countsFor(property);
  const l = property.listing;

  const connected =
    state.connections.immoscout || state.connections.kleinanzeigen || state.connections.immowelt;

  const steps = buildSteps(property, connected);
  const progress = flowProgress(steps);
  const builtParts = steps.filter((step) => step.done).length;
  const nextStep = steps.find((step) => !step.done)?.label ?? null;

  return (
    <div className="page">
      <PageHead
        eyebrow="Objekt"
        title={l.title}
        sub={`${l.city} · ${l.district} · ${l.size} m² · ${l.rooms} Zimmer · Einzug ${l.moveIn}`}
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('wohnungen')}>
              Alle Wohnungen
            </button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('inserat')}>
              Weiter zum Inserat <IconArrow />
            </button>
          </>
        }
      />

      <Card className="property-hero">
        <div className="property-visual" data-property={property.id}>
          <div>
            <div className="property-city">
              {l.city} · {l.district}
            </div>
            <div className="property-meta">
              {l.size} m² · {l.rooms} Zimmer · {l.rent.toLocaleString('de-DE')} € kalt +{' '}
              {l.extraCosts} € NK
            </div>
            <div className="property-tags">
              <span className="property-tag">Gewünschter Einzug: {l.moveIn}</span>
              <span className="property-tag">Kaution {l.deposit.toLocaleString('de-DE')} €</span>
            </div>
          </div>
          <div className="property-meta" style={{ marginTop: 24 }}>
            {l.highlight}
          </div>
        </div>

        <div className="property-side">
          <div>
            <div className="card-title">Vermietungskriterien</div>
            <div className="card-sub">
              Nur objektbezogene Kriterien – keine persönlichen Merkmale.
            </div>
          </div>
          <div className="facts">
            <div className="fact">
              <span className="fact-key">Haustiere</span>
              <span className="fact-val">
                {l.criteria.petsAllowed ? 'erlaubt' : 'nicht erlaubt'}
              </span>
            </div>
            <div className="fact">
              <span className="fact-key">Rauchen</span>
              <span className="fact-val">
                {l.criteria.smokingAllowed ? 'keine Einschränkung' : 'Nichtraucherwohnung'}
              </span>
            </div>
            <div className="fact">
              <span className="fact-key">Belegung</span>
              <span className="fact-val">bis {l.criteria.maxPersons} Personen</span>
            </div>
            <div className="fact">
              <span className="fact-key">SCHUFA</span>
              <span className="fact-val">
                {l.criteria.schufaRequired ? 'erforderlich' : 'optional'}
              </span>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('inserat')}>
            Kriterien und Inserat bearbeiten
          </button>
        </div>
      </Card>

      <div className="divider" />

      <div className="grid grid-2">
        <Card>
          <CardHead
            title="Wo steht die Vermietung?"
            sub="Jede Stufe zeigt, wie viele Anfragen es bis dorthin geschafft haben."
          />
          <div className="card-pad">
            <Funnel
              stages={[
                { label: 'Anfragen', value: counts.total, hint: 'im Posteingang' },
                { label: 'Ausgewertet', value: counts.evaluated, hint: 'strukturiert' },
                { label: 'Angaben vollständig', value: counts.complete, hint: 'ohne Rückfrage' },
                { label: 'Kriterien erfüllt', value: counts.criteriaOk, hint: 'objektbezogen' },
                {
                  label: 'Besichtigung bestätigt',
                  value: counts.viewingsConfirmed,
                  hint: 'Termin steht',
                },
                { label: 'Entscheidung', value: counts.decided, hint: 'durch Sie' },
              ]}
            />
          </div>
        </Card>

        <div className="stack">
          <Card>
            <CardHead
              title="Ihr Vermietungsfortschritt"
              sub="Mit jedem erledigten Schritt kommt ein Bauteil dazu."
              right={
                <Badge tone={progress === 100 ? 'green' : 'navy'} dot>
                  {progress} %
                </Badge>
              }
            />
            <div className="card-pad">
              <HouseProgress
                built={builtParts}
                total={steps.length}
                nextLabel={nextStep}
              />
            </div>
          </Card>

          <Card>
            <CardHead title="Aktueller Stand" />
            <div className="card-pad stack" style={{ gap: 14 }}>
              <Meter label="Anfragen ausgewertet" value={counts.evaluated} max={Math.max(1, counts.total)} />
              <Meter
                label="Angaben vollständig"
                value={counts.complete}
                max={Math.max(1, counts.evaluated)}
              />
              <Meter
                label="Besichtigungen bestätigt"
                value={counts.viewingsConfirmed}
                max={Math.max(1, property.viewings.length)}
              />
            </div>
          </Card>

          <Card>
            <CardHead
              title="Nächster Schritt"
              right={
                connected ? (
                  <Badge tone="green" dot>
                    Portale verbunden
                  </Badge>
                ) : (
                  <Badge tone="amber" dot>
                    Portale offen
                  </Badge>
                )
              }
            />
            <div className="card-pad">
              {!property.evaluatedOnce ? (
                <>
                  <p className="muted" style={{ marginBottom: 14 }}>
                    Im Posteingang liegen {counts.total} Anfragen, die noch unstrukturiert sind.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('inbox')}
                  >
                    Zum Posteingang <IconArrow />
                  </button>
                </>
              ) : !property.selectedApplicantId ? (
                <>
                  <p className="muted" style={{ marginBottom: 14 }}>
                    {counts.criteriaOk} Bewerbungen erfüllen alle Kriterien, {counts.open} brauchen
                    noch eine Rückfrage.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('bewerber')}
                  >
                    Bewerber prüfen <IconArrow />
                  </button>
                </>
              ) : (
                <>
                  <p className="muted" style={{ marginBottom: 14 }}>
                    Entscheidung getroffen. Jetzt fehlt nur noch der Mietvertrag.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('vertrag')}
                  >
                    Zum Mietvertrag <IconArrow />
                  </button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="divider" />

      <Banner tone="soft" icon="ℹ️">
        <strong>MietBlick unterstützt, entscheidet aber nicht.</strong>
        <br />
        Geprüft wird nur, ob die nötigen Angaben da sind und ob sie zu den Kriterien dieses Objekts
        passen ({criteriaSummary(l.criteria).join(' · ')}). Wer die Wohnung bekommt, entscheiden
        Sie – und jede Nachricht geht erst nach Ihrer Freigabe raus.
      </Banner>
    </div>
  );
}
