/**
 * F) Besichtigungen – leichte, funktionsfähige Terminübersicht.
 * Status lässt sich ändern; eine echte Kalenderintegration ist nicht Teil des MVP.
 */

import { useState } from 'react';
import { useProperty, useStore } from '../state/store';
import type { ViewingStatus } from '../types';
import { defaultViewingDate } from '../data/seed';
import { Badge, Banner, Card, CardHead, Modal, PageHead, Stat } from '../components/ui';
import { IconArrow } from '../components/icons';

const OPTIONS: Array<{ value: ViewingStatus; label: string; tone: string }> = [
  { value: 'bestaetigt', label: 'Bestätigt', tone: 'green' },
  { value: 'offen', label: 'Antwort offen', tone: 'amber' },
  { value: 'abgesagt', label: 'Abgesagt', tone: 'red' },
];

const LABEL: Record<ViewingStatus, string> = {
  bestaetigt: 'Bestätigt',
  offen: 'Antwort offen',
  abgesagt: 'Abgesagt',
};

const TONE: Record<ViewingStatus, 'green' | 'amber' | 'red'> = {
  bestaetigt: 'green',
  offen: 'amber',
  abgesagt: 'red',
};

export function BesichtigungenPage() {
  const { dispatch, navigate, notify } = useStore();
  const property = useProperty();
  const state = property;
  const [adding, setAdding] = useState(false);
  const [applicantId, setApplicantId] = useState('');
  const [time, setTime] = useState('18:30');

  const confirmed = state.viewings.filter((v) => v.status === 'bestaetigt').length;
  const openSlots = state.viewings.filter((v) => v.status === 'offen').length;

  const available = state.applicants.filter(
    (a) => a.evaluated && !state.viewings.some((v) => v.applicantId === a.id),
  );

  const date = state.viewings[0]?.date ?? defaultViewingDate(property.id);

  return (
    <div className="page">
      <PageHead
        eyebrow="Besichtigungen"
        title="Termine organisieren"
        sub="Alle Besichtigungen an einem Tag, mit klarem Status je Interessent. Ohne Kalenderintegration – die Abstimmung bleibt im MVP innerhalb von MietBlick."
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setAdding(true)}
              disabled={available.length === 0}
            >
              + Termin anlegen
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-testid="to-decision"
              onClick={() => navigate('entscheidung')}
            >
              Weiter zur Entscheidung <IconArrow />
            </button>
          </>
        }
      />

      <div className="stat-row" style={{ marginBottom: 20 }}>
        <Stat value={state.viewings.length} label="Termine geplant" />
        <Stat value={confirmed} label="bestätigt" tone="green" />
        <Stat value={openSlots} label="Antwort offen" tone={openSlots > 0 ? 'amber' : undefined} />
      </div>

      <Card>
        <CardHead
          title={date}
          sub="Halbstündliche Slots – Status per Klick anpassbar."
          right={<Badge tone="navy">{state.viewings.length} Termine</Badge>}
        />
        <div data-testid="viewing-list">
          {state.viewings.length === 0 && (
            <div className="card-pad muted">Noch keine Termine geplant.</div>
          )}
          {state.viewings.map((viewing) => (
            <div className="slot" key={viewing.id} data-testid={`viewing-${viewing.id}`}>
              <span className="slot-time">{viewing.time}</span>
              <span className="slot-name">{viewing.applicantName}</span>
              <Badge tone={TONE[viewing.status]} dot>
                {LABEL[viewing.status]}
              </Badge>
              <div className="segmented" role="group" aria-label={`Status für ${viewing.applicantName}`}>
                {OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    data-tone={option.tone}
                    data-testid={`status-${viewing.id}-${option.value}`}
                    className={viewing.status === option.value ? 'is-on' : ''}
                    aria-pressed={viewing.status === option.value}
                    onClick={() => {
                      if (viewing.status === option.value) return;
                      dispatch({
                        type: 'setViewingStatus',
                        id: viewing.id,
                        status: option.value,
                      });
                      notify(`${viewing.applicantName}: ${LABEL[option.value]}.`);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="divider" />

      <Banner tone="soft" icon="📅">
        <strong>Bewusst schlank gehalten.</strong> Eine echte Kalender- oder
        Terminbuchungs-Integration ist als spätere Ausbaustufe vorgesehen. Für den MVP genügt es,
        die Termine und ihren Status im Blick zu behalten.
      </Banner>

      {adding && (
        <Modal
          title="Besichtigungstermin anlegen"
          sub={date}
          width={520}
          onClose={() => setAdding(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const chosen = applicantId || available[0]?.id;
                  if (!chosen) return;
                  dispatch({ type: 'addViewing', applicantId: chosen, time });
                  const name = state.applicants.find((a) => a.id === chosen)?.displayName ?? '';
                  setAdding(false);
                  notify(`Termin um ${time} für ${name} angelegt.`);
                }}
              >
                Termin anlegen
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
                Abbrechen
              </button>
            </>
          }
        >
          <label className="field">
            <span className="field-label">Interessent</span>
            <select
              className="input"
              value={applicantId || available[0]?.id || ''}
              onChange={(event) => setApplicantId(event.target.value)}
            >
              {available.map((applicant) => (
                <option key={applicant.id} value={applicant.id}>
                  {applicant.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Uhrzeit</span>
            <input
              className="input"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </label>
          <p className="hint">
            Der Termin wird mit dem Status „Antwort offen“ angelegt und kann danach bestätigt
            werden.
          </p>
        </Modal>
      )}
    </div>
  );
}
