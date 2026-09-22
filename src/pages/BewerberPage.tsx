/**
 * Bewerber prüfen: aus unstrukturierten Nachrichten werden vergleichbare
 * Kurzprofile – mit Vollständigkeitsprüfung, Zusatzangaben und Abgleich
 * gegen die Kriterien des Objekts.
 */

import { useRef, useState } from 'react';
import { countsFor, useProperty, useStore } from '../state/store';
import type { Applicant, CheckState } from '../types';
import { evaluateCriteria, CRITERIA_LABEL } from '../lib/criteria';
import { useFlipGrid } from '../lib/flip';
import { ApplicantCard, statusTone } from '../components/ApplicantCard';
import { ApplicantDetail } from '../components/ApplicantDetail';
import { CriteriaMatrix, StackedBar } from '../components/charts';
import { Badge, Banner, Card, Empty, PageHead, Stat } from '../components/ui';
import { IconArrow } from '../components/icons';

type Filter = 'alle' | 'klaerung' | CheckState;
type View = 'karten' | 'vergleich' | 'matrix';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'alle', label: 'Alle' },
  { id: 'erfuellt', label: 'Kriterien erfüllt' },
  { id: 'offen', label: 'Kriterium offen' },
  { id: 'nicht_erfuellt', label: 'Kriterium nicht erfüllt' },
  { id: 'klaerung', label: 'Klärungsbedarf' },
];

export function BewerberPage() {
  const { dispatch, navigate, notify } = useStore();
  const property = useProperty();
  const counts = countsFor(property);

  const [open, setOpen] = useState<{ id: string; focusDraft: boolean } | null>(null);
  const [filter, setFilter] = useState<Filter>('alle');
  const [view, setView] = useState<View>('karten');
  const gridRef = useRef<HTMLDivElement>(null);

  const selected = open ? (property.applicants.find((a) => a.id === open.id) ?? null) : null;
  const evaluated = property.applicants.filter((a) => a.evaluated);

  const matches = (applicant: Applicant): boolean => {
    if (filter === 'alle') return true;
    if (filter === 'klaerung') return applicant.extraction?.state === 'klaerung';
    return evaluateCriteria(applicant.extraction, property.listing.criteria).state === filter;
  };

  const shown = evaluated.filter(matches);

  // Beim Filtern gleiten die verbleibenden Karten an ihre neue Position,
  // statt hart umzuspringen. Muss vor dem frühen Return stehen – Hooks
  // laufen bei jedem Rendern in derselben Reihenfolge.
  useFlipGrid(gridRef, `${view}|${filter}|${shown.map((a) => a.id).join(',')}`);

  if (!property.evaluatedOnce) {
    return (
      <div className="page">
        <PageHead
          eyebrow="Bewerber prüfen"
          title="Noch keine Auswertung"
          sub="Werten Sie die Anfragen im Posteingang aus – danach steht hier die strukturierte Übersicht."
        />
        <Card>
          <Empty title="Die Bewerbungen sind noch unstrukturiert">
            <p style={{ marginBottom: 18 }}>
              Im Posteingang liegen {counts.total} Anfragen für {property.listing.title}.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              data-testid="goto-inbox"
              onClick={() => navigate('inbox')}
            >
              Zum Posteingang <IconArrow />
            </button>
          </Empty>
        </Card>
      </div>
    );
  }

  const planViewing = (applicant: Applicant) => {
    const existing = property.viewings.find((v) => v.applicantId === applicant.id);
    if (!existing) {
      dispatch({ type: 'addViewing', applicantId: applicant.id, time: '' });
      notify(`Besichtigungstermin für ${applicant.displayName} angelegt.`);
    }
    navigate('besichtigungen');
  };

  return (
    <div className="page">
      <PageHead
        eyebrow="Bewerber prüfen"
        title="Aus Nachrichten wird Überblick"
        sub={`Dieselben Anfragen wie im Posteingang – jetzt als vergleichbare Kurzprofile, abgeglichen mit den Kriterien für ${property.listing.title}.`}
        actions={
          <>
            {!property.extendedChecked && (
              <button
                type="button"
                className="btn btn-navy"
                data-testid="check-extended"
                onClick={() => {
                  dispatch({ type: 'checkExtended' });
                  notify('Zusatzangaben geprüft und mit den Objektkriterien abgeglichen.');
                }}
              >
                Mehr Angaben prüfen
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('besichtigungen')}
            >
              Weiter zu Besichtigungen <IconArrow />
            </button>
          </>
        }
      />

      <div className="stat-row" style={{ marginBottom: 18 }}>
        <Stat value={`${counts.evaluated}`} label="Bewerbungen ausgewertet" />
        <Stat value={`${counts.complete}`} label="Angaben vollständig" tone="green" />
        <Stat value={`${counts.open}`} label="mit Klärungsbedarf" tone="amber" />
      </div>

      {!property.extendedChecked ? (
        <Banner tone="amber" icon="🔎">
          <strong>Nur die Pflichtangaben sind geprüft.</strong> Für dieses Objekt gelten zusätzlich
          Kriterien zu Haustieren, Rauchen, Belegung und SCHUFA. Mit{' '}
          <strong>„Mehr Angaben prüfen“</strong> liest MietBlick diese Angaben aus den Nachrichten
          und gleicht sie mit dem Inserat ab.
        </Banner>
      ) : (
        <div className="grid grid-2" style={{ marginBottom: 18 }}>
          <Card className="card-pad">
            <StackedBar
              title="Datenlage der Bewerbungen"
              slices={[
                { label: 'Angaben vollständig', value: counts.complete, tone: 'good' },
                { label: 'Klärungsbedarf', value: counts.open, tone: 'warn' },
              ]}
            />
          </Card>
          <Card className="card-pad">
            <StackedBar
              title="Abgleich mit den Objektkriterien"
              slices={[
                { label: 'Kriterien erfüllt', value: counts.criteriaOk, tone: 'good' },
                { label: 'Kriterium offen', value: counts.criteriaOpen, tone: 'warn' },
                { label: 'Kriterium nicht erfüllt', value: counts.criteriaFail, tone: 'bad' },
              ]}
            />
          </Card>
        </div>
      )}

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Filter">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`filter-${item.id}`}
              className={filter === item.id ? 'is-on' : ''}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="spacer" />
        <div className="segmented" role="group" aria-label="Ansicht">
          <button
            type="button"
            data-testid="view-karten"
            className={view === 'karten' ? 'is-on' : ''}
            aria-pressed={view === 'karten'}
            onClick={() => setView('karten')}
          >
            Karten
          </button>
          <button
            type="button"
            data-testid="view-matrix"
            className={view === 'matrix' ? 'is-on' : ''}
            aria-pressed={view === 'matrix'}
            onClick={() => setView('matrix')}
          >
            Matrix
          </button>
          <button
            type="button"
            data-testid="view-vergleich"
            className={view === 'vergleich' ? 'is-on' : ''}
            aria-pressed={view === 'vergleich'}
            onClick={() => setView('vergleich')}
          >
            Vorher / Nachher
          </button>
        </div>
      </div>

      {view === 'matrix' ? (
        <Card className="card-pad">
          <CriteriaMatrix
            columns={['Haustiere', 'Rauchen', 'Belegung', 'SCHUFA']}
            rows={shown.map((applicant) => {
              const result = evaluateCriteria(
                applicant.extraction,
                property.listing.criteria,
              );
              return {
                id: applicant.id,
                name: applicant.displayName,
                note: applicant.extraction?.nextStep ?? '',
                cells: result.checks.map((check) => ({
                  key: check.key,
                  label: check.label,
                  state: check.state,
                  detail: check.detail,
                })),
              };
            })}
          />
        </Card>
      ) : view === 'karten' ? (
        <>
          <div className="applicant-grid" data-testid="applicant-grid" ref={gridRef}>
            {shown.map((applicant) => (
              <ApplicantCard
                key={applicant.id}
                applicant={applicant}
                criteria={property.listing.criteria}
                extendedChecked={property.extendedChecked}
                selected={property.selectedApplicantId === applicant.id}
                onDetails={() => setOpen({ id: applicant.id, focusDraft: false })}
                onInquiry={() => setOpen({ id: applicant.id, focusDraft: true })}
                onViewing={
                  applicant.extraction?.state === 'vollstaendig'
                    ? () => planViewing(applicant)
                    : undefined
                }
              />
            ))}
          </div>

          {shown.length === 0 && (
            <Card>
              <Empty title="Keine Bewerbung in diesem Filter">
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: 12 }}
                  onClick={() => setFilter('alle')}
                >
                  Filter zurücksetzen
                </button>
              </Empty>
            </Card>
          )}
        </>
      ) : (
        <div className="magic-grid" data-testid="compare-grid">
          <div>
            <div className="magic-col-head">
              <Badge tone="grey" dot>
                Vorher
              </Badge>
              <span className="magic-col-title">jede Nachricht einzeln</span>
            </div>
            {shown.map((applicant) => (
              <div className="magic-before" key={applicant.id}>
                <span className="magic-before-name">
                  {applicant.displayName} · {applicant.source}
                </span>
                {applicant.message}
              </div>
            ))}
          </div>

          <div>
            <div className="magic-col-head">
              <Badge tone="green" dot>
                Nachher
              </Badge>
              <span className="magic-col-title">strukturiert in MietBlick</span>
            </div>
            {shown.map((applicant) => {
              const ex = applicant.extraction!;
              const result = evaluateCriteria(ex, property.listing.criteria);
              return (
                <div className="magic-after" key={applicant.id} data-testid={`compare-${applicant.id}`}>
                  <div className="magic-after-head">
                    <span className="magic-after-name">{applicant.displayName}</span>
                    <Badge tone={statusTone(applicant)} dot>
                      {ex.statusLabel}
                    </Badge>
                  </div>
                  <div className="magic-chips">
                    <span className="chip">
                      Kontakt: <strong>{ex.contact ?? 'fehlt'}</strong>
                    </span>
                    <span className="chip">
                      Personen: <strong>{ex.persons ?? 'fehlt'}</strong>
                    </span>
                    <span className="chip">
                      Einzug:{' '}
                      <strong>
                        {ex.moveIn ??
                          (ex.moveInCandidates.length > 1
                            ? ex.moveInCandidates.map((c) => c.label).join(' / ')
                            : 'fehlt')}
                      </strong>
                    </span>
                    {property.extendedChecked && (
                      <span className="chip">
                        Kriterien: <strong>{CRITERIA_LABEL[result.state]}</strong>
                      </span>
                    )}
                    <span className="chip">
                      Nächster Schritt: <strong>{ex.nextStep}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="divider" />

      <Banner tone="navy" icon="🛡️">
        <strong>Kein Ranking nach persönlichen Merkmalen.</strong>
        <br />
        MietBlick prüft, ob die nötigen Angaben vorhanden und widerspruchsfrei sind, und gleicht
        sie mit den objektbezogenen Kriterien dieses Inserats ab. Herkunft, Geschlecht, Alter,
        Religion oder Familienstand fließen an keiner Stelle ein – und die Auswahl treffen
        ausschließlich Sie.
      </Banner>

      {selected && (
        <ApplicantDetail
          applicant={selected}
          focusDraft={open?.focusDraft}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
