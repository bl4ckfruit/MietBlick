/**
 * Zentrale Inbox – hier beginnt der funktionale Kern.
 * Alle Anfragen aus allen Kanälen an einem Ort, zunächst unstrukturiert.
 */

import { useState } from 'react';
import { countsFor, useProperty, useStore } from '../state/store';
import type { Applicant, Source } from '../types';
import { ApplicantDetail } from '../components/ApplicantDetail';
import { statusTone } from '../components/ApplicantCard';
import { Badge, Banner, Card, CardHead, Modal, PageHead, Stat } from '../components/ui';
import { IconArrow } from '../components/icons';

const SOURCES: Source[] = ['ImmoScout24', 'Kleinanzeigen', 'Immowelt', 'E-Mail', 'Manuell erfasst'];

const EXAMPLE = `Hallo, ich heiße Max Mustermann. Sie erreichen mich unter max@example.de. Ich möchte die Wohnung zusammen mit meiner Freundin beziehen. Viele Grüße`;

function preview(message: string): string {
  return message.replace(/\s+/g, ' ').trim();
}

export function InboxPage() {
  const { dispatch, navigate, notify } = useStore();
  const property = useProperty();
  const counts = countsFor(property);

  const [open, setOpen] = useState<Applicant | null>(null);
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState('');
  const [source, setSource] = useState<Source>('Manuell erfasst');
  const [error, setError] = useState<string | null>(null);

  const selected = open ? (property.applicants.find((a) => a.id === open.id) ?? null) : null;

  const evaluate = () => {
    dispatch({ type: 'evaluateAll' });
    navigate('bewerber');
    notify(`${property.applicants.length} Bewerbungen ausgewertet.`);
  };

  const addApplicant = () => {
    const message = text.trim();
    if (message.length < 15) {
      setError('Bitte fügen Sie die vollständige Mietanfrage ein (mindestens 15 Zeichen).');
      return;
    }
    dispatch({ type: 'addApplicant', message, source });
    setComposing(false);
    setText('');
    setError(null);
    notify(
      property.evaluatedOnce
        ? 'Neue Anfrage hinzugefügt und direkt ausgewertet.'
        : 'Neue Anfrage im Posteingang.',
    );
  };

  return (
    <div className="page">
      <PageHead
        eyebrow="Posteingang"
        title="Alle Anfragen an einem Ort"
        sub={`Anfragen zu ${property.listing.title}, so wie sie geschrieben wurden. Klicken Sie eine Anfrage an, um die Originalnachricht zu lesen.`}
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              data-testid="new-request"
              onClick={() => {
                setComposing(true);
                setError(null);
              }}
            >
              + Neue Anfrage
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-testid="evaluate"
              onClick={evaluate}
            >
              Bewerbungen auswerten
            </button>
          </>
        }
      />

      <div className="stat-row" style={{ marginBottom: 20 }}>
        <Stat value={counts.total} label="Anfragen im Posteingang" />
        <Stat
          value={counts.evaluated}
          label="bereits ausgewertet"
          tone={counts.evaluated > 0 ? 'green' : undefined}
        />
        <Stat
          value={counts.pending}
          label="wartet auf Auswertung"
          tone={counts.pending > 0 ? 'amber' : undefined}
        />
      </div>

      {!property.evaluatedOnce && (
        <Banner tone="soft" icon="📥">
          So sieht der Alltag heute aus: {counts.total} einzelne Nachrichten, die Franz sonst von
          Hand durchgehen müsste. Ein Klick auf <strong>Bewerbungen auswerten</strong> macht daraus
          eine strukturierte Übersicht.
        </Banner>
      )}

      <Card style={{ marginTop: 18 }}>
        <CardHead
          title="Posteingang"
          sub={`${counts.total} Anfragen · ${new Set(property.applicants.map((a) => a.source)).size} Kanäle`}
          right={
            property.evaluatedOnce ? (
              <Badge tone="green" dot>
                Auswertung aktiv
              </Badge>
            ) : (
              <Badge tone="grey" dot>
                Noch unstrukturiert
              </Badge>
            )
          }
        />
        <div className="inbox-list" data-testid="inbox-list">
          {property.applicants.map((applicant) => (
            <button
              type="button"
              className="inbox-item"
              key={applicant.id}
              data-testid={`inbox-item-${applicant.id}`}
              onClick={() => setOpen(applicant)}
            >
              <div className="inbox-top">
                <span className="inbox-name">{applicant.displayName}</span>
                <Badge tone="outline">{applicant.source}</Badge>
                <span className="inbox-time">{applicant.receivedAt}</span>
              </div>
              <div className="inbox-preview">{preview(applicant.message)}</div>
              <div className="inbox-meta">
                {applicant.extraction ? (
                  <>
                    <Badge tone={statusTone(applicant)} dot>
                      {applicant.extraction.statusLabel}
                    </Badge>
                    <Badge tone="grey">Kontakt: {applicant.extraction.contact ?? 'fehlt'}</Badge>
                    <Badge tone="grey">Personen: {applicant.extraction.persons ?? 'fehlt'}</Badge>
                    <Badge tone="grey">
                      Einzug:{' '}
                      {applicant.extraction.moveIn ??
                        (applicant.extraction.moveInCandidates.length > 1
                          ? 'widersprüchlich'
                          : 'fehlt')}
                    </Badge>
                  </>
                ) : (
                  <Badge tone="grey" dot>
                    Neu · noch nicht ausgewertet
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="row" style={{ marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
        <button type="button" className="btn btn-primary" onClick={evaluate}>
          Bewerbungen auswerten <IconArrow />
        </button>
        <span className="hint">
          Läuft vollständig lokal im Browser – ohne externe Schnittstelle.
        </span>
      </div>

      {selected && <ApplicantDetail applicant={selected} onClose={() => setOpen(null)} />}

      {composing && (
        <Modal
          title="Neue Anfrage erfassen"
          sub="Nachricht einfügen – MietBlick liest die Angaben daraus aus."
          width={680}
          onClose={() => setComposing(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-primary"
                data-testid="submit-request"
                onClick={addApplicant}
              >
                Anfrage hinzufügen
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setComposing(false)}>
                Abbrechen
              </button>
              <span className="spacer" />
              <button
                type="button"
                className="btn btn-subtle btn-sm"
                onClick={() => {
                  setText(EXAMPLE);
                  setError(null);
                }}
              >
                Beispieltext einsetzen
              </button>
            </>
          }
        >
          <label className="field">
            <span className="field-label">Kanal</span>
            <select
              className="input"
              value={source}
              onChange={(event) => setSource(event.target.value as Source)}
            >
              {SOURCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Nachricht des Interessenten</span>
            <textarea
              className="input"
              data-testid="request-text"
              value={text}
              placeholder="Text der Mietanfrage hier einfügen …"
              onChange={(event) => {
                setText(event.target.value);
                if (error) setError(null);
              }}
            />
          </label>

          {error && <div className="note note-amber">{error}</div>}

          <p className="hint">
            MietBlick erkennt Name, Kontakt, Anzahl Personen, Einzugstermin sowie Angaben zu
            Rauchen, Haustieren und SCHUFA – und markiert, was fehlt oder sich widerspricht.
          </p>
        </Modal>
      )}
    </div>
  );
}
