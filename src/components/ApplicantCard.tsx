/**
 * Bewerberkarte.
 *
 * Bewusst ohne verschachtelte Klickflächen: der Name und jede Aktion sind
 * eigenständige Buttons nebeneinander. Damit landet jeder Klick zuverlässig
 * dort, wo er hingehört.
 */

import type { Applicant, CriteriaResult, Criteria } from '../types';
import { evaluateCriteria, CRITERIA_SHORT, CRITERIA_TONE } from '../lib/criteria';
import { personsLabel, petsLabel, schufaLabel, smokerLabel } from '../lib/extract';
import { Badge, type Tone } from './ui';

export function statusTone(applicant: Applicant): Tone {
  const ex = applicant.extraction;
  if (!ex) return 'grey';
  if (ex.conflicts.length > 0) return 'red';
  if (ex.state === 'klaerung') return 'amber';
  return 'green';
}

export function cardEdge(applicant: Applicant, criteria: CriteriaResult): string {
  const ex = applicant.extraction;
  if (!ex) return '';
  if (ex.conflicts.length > 0 || criteria.state === 'nicht_erfuellt') return ' is-conflict';
  if (ex.state === 'klaerung' || criteria.state === 'offen') return ' is-open';
  return ' is-complete';
}

interface Props {
  applicant: Applicant;
  criteria: Criteria;
  extendedChecked: boolean;
  selected: boolean;
  onDetails: () => void;
  onInquiry: () => void;
  onViewing?: () => void;
  extraActions?: React.ReactNode;
}

export function ApplicantCard({
  applicant,
  criteria,
  extendedChecked,
  selected,
  onDetails,
  onInquiry,
  onViewing,
  extraActions,
}: Props) {
  const ex = applicant.extraction;
  if (!ex) return null;

  const result = evaluateCriteria(ex, criteria);

  return (
    <article
      className={`applicant-card${cardEdge(applicant, result)}${selected ? ' is-selected' : ''}`}
      data-testid={`applicant-${applicant.id}`}
      data-flip-id={applicant.id}
      data-status={ex.state}
      data-criteria={result.state}
    >
      <header className="ac-head">
        <div className="ac-id">
          <button
            type="button"
            className="ac-name"
            data-testid={`name-${applicant.id}`}
            onClick={onDetails}
          >
            {applicant.displayName}
          </button>
          <div className="ac-source">
            {applicant.source}
            {applicant.portalImported && ' · Profil übernommen'}
          </div>
        </div>
        <Badge tone={statusTone(applicant)} dot>
          {ex.statusLabel}
        </Badge>
      </header>

      <div className="ac-body">
        <div className="mini-fact">
          <span className="mini-key">Kontakt</span>
          <span className={ex.contact ? 'mini-val' : 'mini-val is-missing'}>
            {ex.contact ?? 'fehlt'}
          </span>
        </div>
        <div className="mini-fact">
          <span className="mini-key">Personen</span>
          <span className={ex.persons !== null ? 'mini-val' : 'mini-val is-missing'}>
            {ex.persons !== null ? personsLabel(ex.persons) : 'fehlt'}
          </span>
        </div>
        <div className="mini-fact">
          <span className="mini-key">Einzug</span>
          <span className={ex.moveIn ? 'mini-val' : 'mini-val is-missing'}>
            {ex.moveIn ??
              (ex.moveInCandidates.length > 1
                ? ex.moveInCandidates.map((c) => c.label).join(' / ')
                : 'fehlt')}
          </span>
        </div>
        <div className="mini-fact">
          <span className="mini-key">Status</span>
          <span className="mini-val">
            {ex.state === 'vollstaendig' ? 'Angaben vollständig' : 'Klärungsbedarf'}
          </span>
        </div>
      </div>

      {extendedChecked && (
        <div className="ac-extra" data-testid={`extra-${applicant.id}`}>
          <div className="ac-extra-head">
            <span>Zusatzangaben</span>
            <Badge tone={CRITERIA_TONE[result.state]} dot>
              Kriterien {CRITERIA_SHORT[result.state]}
            </Badge>
          </div>
          <div className="chips">
            <span className={`chip${ex.smoker === null ? ' is-missing' : ''}`}>
              Rauchen: <strong>{smokerLabel(ex.smoker)}</strong>
            </span>
            <span className={`chip${ex.pets === null ? ' is-missing' : ''}`}>
              Haustiere: <strong>{petsLabel(ex.pets)}</strong>
            </span>
            <span className={`chip${ex.schufa === null ? ' is-missing' : ''}`}>
              SCHUFA: <strong>{schufaLabel(ex.schufa)}</strong>
            </span>
          </div>
          <ul className="criteria-list">
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

      {ex.conflicts.length > 0 && (
        <div className="note note-red">
          <span className="note-title">Widerspruch beim Einzugstermin</span>
          {ex.moveInCandidates.map((c) => c.label).join(' und ')} – bitte klären.
        </div>
      )}

      {ex.conflicts.length === 0 && ex.missing.length > 0 && (
        <div className="note note-amber">
          <span className="note-title">Fehlende Angaben</span>
          {ex.missing.join(' · ')}
        </div>
      )}

      {ex.conflicts.length === 0 && ex.missing.length === 0 && (
        <div className="note note-green">
          <span className="note-title">Angaben vollständig</span>
          Alle Pflichtangaben dieses Objekts sind vorhanden.
        </div>
      )}

      {applicant.consultation.trim() && (
        <div className="note note-navy">
          <span className="note-title">Rücksprache</span>
          {applicant.consultation}
        </div>
      )}

      <div className="ac-next">
        Nächster Schritt: <strong>{ex.nextStep}</strong>
      </div>

      <footer className="ac-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          data-testid={`details-${applicant.id}`}
          onClick={onDetails}
        >
          Details
        </button>

        {(ex.state === 'klaerung' || (extendedChecked && ex.missingExtra.length > 0)) && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            data-testid={`inquiry-${applicant.id}`}
            onClick={onInquiry}
          >
            {ex.conflicts.length > 0 ? 'Widerspruch klären' : 'Rückfrage prüfen'}
          </button>
        )}

        {onViewing && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            data-testid={`viewing-${applicant.id}`}
            onClick={onViewing}
          >
            Besichtigung planen
          </button>
        )}

        {extraActions}

        {applicant.inquiry?.released && (
          <Badge tone="green" dot>
            Rückfrage freigegeben
          </Badge>
        )}
      </footer>
    </article>
  );
}
