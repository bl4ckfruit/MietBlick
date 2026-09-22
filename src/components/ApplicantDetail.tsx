/**
 * Detailansicht einer Bewerbung: Originalanfrage, ausgelesene Angaben,
 * Kriterienabgleich, Rücksprache-Notiz und der vorbereitete Rückfrage-Entwurf.
 */

import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import type { Applicant, Criteria } from '../types';
import { evaluateCriteria, CRITERIA_LABEL, CRITERIA_TONE } from '../lib/criteria';
import { personsLabel, petsLabel, schufaLabel, smokerLabel } from '../lib/extract';
import { DraftEditor } from './DraftEditor';
import { statusTone } from './ApplicantCard';
import { Badge, Fact, Modal } from './ui';

export function ApplicantDetail({
  applicant,
  onClose,
  focusDraft = false,
  criteria,
}: {
  applicant: Applicant;
  onClose: () => void;
  focusDraft?: boolean;
  criteria?: Criteria;
}) {
  const { dispatch, navigate, property, notify } = useStore();
  const ex = applicant.extraction;
  const rules = criteria ?? property?.listing.criteria;
  const extendedChecked = property?.extendedChecked ?? false;

  const [note, setNote] = useState(applicant.consultation);
  const needsDraft = Boolean(focusDraft && ex && !applicant.inquiry);
  const draftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (needsDraft) dispatch({ type: 'prepareInquiry', id: applicant.id });
  }, [needsDraft, applicant.id, dispatch]);

  useEffect(() => {
    if (focusDraft && applicant.inquiry && draftRef.current) {
      draftRef.current.scrollIntoView({ block: 'start' });
    }
  }, [focusDraft, applicant.inquiry]);

  const result = rules ? evaluateCriteria(ex, rules) : null;

  const saveNote = () => {
    dispatch({ type: 'setConsultation', id: applicant.id, text: note });
    notify(
      note.trim()
        ? `Rücksprache zu ${applicant.displayName} vermerkt.`
        : 'Rücksprache-Notiz gelöscht.',
    );
  };

  return (
    <Modal
      title={applicant.displayName}
      sub={`${applicant.source} · eingegangen ${applicant.receivedAt}`}
      width={780}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Schließen
          </button>
          <span className="spacer" />
          <button
            type="button"
            className="btn btn-subtle"
            onClick={() => {
              onClose();
              navigate('entscheidung');
            }}
          >
            Zur Entscheidung
          </button>
        </>
      }
    >
      <div className="stack">
        <div>
          <div className="section-title">Originalanfrage</div>
          <p className="section-sub">
            Genau so, wie die Nachricht über {applicant.source} eingegangen ist.
          </p>
          <div className="original" data-testid="original-message">
            {applicant.message}
          </div>
        </div>

        <div>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="section-title">Von MietBlick ausgelesen</span>
            <span className="spacer" />
            {ex ? (
              <Badge tone={statusTone(applicant)} dot>
                {ex.statusLabel}
              </Badge>
            ) : (
              <Badge tone="grey" dot>
                Noch nicht ausgewertet
              </Badge>
            )}
          </div>

          {ex ? (
            <div className="facts">
              <Fact label="Name" value={ex.name ?? 'nicht erkannt'} missing={!ex.name} />
              <Fact label="Kontakt" value={ex.contact ?? 'fehlt'} missing={!ex.contact} />
              <Fact
                label="Personen"
                value={
                  ex.persons !== null
                    ? `${personsLabel(ex.persons)}${ex.personsEvidence ? ` · erkannt aus ${ex.personsEvidence}` : ''}`
                    : 'fehlt'
                }
                missing={ex.persons === null}
              />
              <Fact
                label="Gewünschter Einzug"
                value={
                  ex.moveIn ??
                  (ex.moveInCandidates.length > 1
                    ? ex.moveInCandidates.map((c) => c.label).join('  ·  ')
                    : 'fehlt')
                }
                missing={!ex.moveIn}
              />
              <Fact label="Rauchen" value={smokerLabel(ex.smoker)} missing={ex.smoker === null} />
              <Fact label="Haustiere" value={petsLabel(ex.pets)} missing={ex.pets === null} />
              <Fact label="SCHUFA" value={schufaLabel(ex.schufa)} missing={ex.schufa === null} />
              <Fact
                label="Status"
                value={ex.state === 'vollstaendig' ? 'Angaben vollständig' : 'Klärungsbedarf'}
                missing={ex.state === 'klaerung'}
              />
              <Fact label="Nächster Schritt" value={ex.nextStep} />
            </div>
          ) : (
            <div className="banner banner-soft">
              Diese Anfrage ist noch unstrukturiert. Über „Bewerbungen auswerten“ im Posteingang
              liest MietBlick die Angaben aus.
            </div>
          )}

          {applicant.portalImported && applicant.portal && (
            <div className="note note-green" style={{ marginTop: 14 }}>
              <span className="note-title">Aus dem Portalprofil ergänzt</span>
              Angaben, die in der Nachricht fehlten, wurden aus dem {applicant.source}-Profil
              übernommen
              {applicant.portal.employment ? ` (Beschäftigung: ${applicant.portal.employment})` : ''}
              .
            </div>
          )}

          {ex && ex.conflicts.length > 0 && (
            <div className="note note-red" style={{ marginTop: 14 }}>
              <span className="note-title">Widerspruch beim Einzugstermin</span>
              In der Nachricht stehen {ex.moveInCandidates.length} unterschiedliche Termine:{' '}
              {ex.moveInCandidates.map((c) => c.label).join(' und ')}. MietBlick meldet den
              Widerspruch, statt einen der beiden einfach zu übernehmen.
            </div>
          )}

          {ex && ex.missing.length > 0 && (
            <div className="note note-amber" style={{ marginTop: 14 }}>
              <span className="note-title">Fehlende Pflichtangaben</span>
              {ex.missing.join(' · ')}
            </div>
          )}
        </div>

        {result && extendedChecked && (
          <div>
            <div className="row" style={{ marginBottom: 10 }}>
              <span className="section-title">Abgleich mit den Objektkriterien</span>
              <span className="spacer" />
              <Badge tone={CRITERIA_TONE[result.state]} dot>
                {CRITERIA_LABEL[result.state]}
              </Badge>
            </div>
            <ul className="criteria-list is-detail" data-testid="criteria-list">
              {result.checks.map((check) => (
                <li key={check.key} className={`criteria-${check.state}`}>
                  <span className="criteria-mark" aria-hidden="true">
                    {check.state === 'erfuellt' ? '✓' : check.state === 'offen' ? '?' : '✕'}
                  </span>
                  <span className="criteria-label">{check.label}</span>
                  <span className="criteria-detail">{check.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="section-title">Rücksprache</div>
          <p className="section-sub">
            Was am Telefon oder bei der Besichtigung besprochen wurde – bleibt bei der Bewerbung
            und landet auf Wunsch im Mietvertrag.
          </p>
          <textarea
            className="input"
            style={{ minHeight: 90 }}
            data-testid={`consultation-${applicant.id}`}
            placeholder="z. B. Einzug wäre auch zum 15.11. möglich, Kaution kann sofort hinterlegt werden."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="row" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              data-testid={`save-consultation-${applicant.id}`}
              onClick={saveNote}
              disabled={note === applicant.consultation}
            >
              Rücksprache speichern
            </button>
            {applicant.consultationAt && (
              <span className="hint">Zuletzt vermerkt: {applicant.consultationAt}</span>
            )}
          </div>
        </div>

        {applicant.inquiry && (
          <div ref={draftRef}>
            <div className="section-title">Rückfrage</div>
            <p className="section-sub">
              MietBlick bereitet den Text vor. Sie entscheiden, was davon rausgeht.
            </p>
            <DraftEditor applicant={applicant} draft={applicant.inquiry} kind="inquiry" />
          </div>
        )}
      </div>
    </Modal>
  );
}
