/**
 * Entscheidung – die Auswahl trifft ausschließlich der Vermieter.
 *
 * MietBlick zeigt transparent, welche Kriterien erfüllt sind und wo Angaben
 * fehlen. Der Hinweis lässt sich jederzeit übersteuern: auch eine Bewerbung
 * mit offenen Punkten kann ausgewählt werden – dann wird der Grund festgehalten.
 */

import { useState } from 'react';
import { useProperty, useStore } from '../state/store';
import { evaluateCriteria, CRITERIA_LABEL, CRITERIA_TONE } from '../lib/criteria';
import { personsLabel } from '../lib/extract';
import { DraftEditor } from '../components/DraftEditor';
import { statusTone } from '../components/ApplicantCard';
import { ApplicantDetail } from '../components/ApplicantDetail';
import { Badge, Banner, Card, CardHead, Empty, Modal, PageHead } from '../components/ui';
import { IconArrow } from '../components/icons';

export function EntscheidungPage() {
  const { dispatch, navigate, notify } = useStore();
  const property = useProperty();

  const [confirming, setConfirming] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState<string | null>(null);

  const evaluated = property.applicants.filter((a) => a.evaluated);
  const chosen = property.applicants.find((a) => a.id === property.selectedApplicantId) ?? null;
  const others = chosen ? evaluated.filter((a) => a.id !== chosen.id) : [];
  const candidate = confirming ? property.applicants.find((a) => a.id === confirming) : null;
  const detailApplicant = detail ? property.applicants.find((a) => a.id === detail) : null;

  const candidateResult = candidate
    ? evaluateCriteria(candidate.extraction, property.listing.criteria)
    : null;
  const candidateBlocked =
    candidateResult !== null &&
    (candidateResult.state !== 'erfuellt' || candidate?.extraction?.state === 'klaerung');
  const reasonRequired = candidateBlocked;

  if (evaluated.length === 0) {
    return (
      <div className="page">
        <PageHead
          eyebrow="Entscheidung"
          title="Die Entscheidung bleibt bei Franz."
          sub="Werten Sie zuerst die Bewerbungen aus – danach können Sie hier auswählen."
        />
        <Card>
          <Empty title="Noch keine ausgewerteten Bewerbungen">
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 14 }}
              onClick={() => navigate('inbox')}
            >
              Zum Posteingang <IconArrow />
            </button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead
        eyebrow="Entscheidung"
        title="Die Entscheidung bleibt bei Franz."
        sub="MietBlick stellt die Bewerbungen vergleichbar nebeneinander und zeigt, was noch offen ist. Auswählen können Sie jede Bewerbung – auch eine mit offenen Punkten."
        actions={
          chosen ? (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                data-testid="reset-decision"
                onClick={() => {
                  dispatch({ type: 'clearSelection' });
                  notify('Auswahl zurückgenommen. Nicht freigegebene Entwürfe wurden verworfen.');
                }}
              >
                Auswahl ändern
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-testid="to-contract"
                onClick={() => navigate('vertrag')}
              >
                Weiter zum Mietvertrag <IconArrow />
              </button>
            </>
          ) : undefined
        }
      />

      <Banner tone="navy" icon="🤝">
        <strong>KI unterstützt. Der Vermieter entscheidet und gibt Nachrichten frei.</strong>
        <br />
        Der Kriterienabgleich ist ein Hinweis, keine Empfehlung und keine Rangfolge. Sie können ihn
        jederzeit übersteuern – MietBlick hält dann nur fest, warum.
      </Banner>

      <div className="divider" />

      <div className="section-title">{chosen ? 'Ihre Auswahl' : 'Wen möchten Sie auswählen?'}</div>
      <p className="section-sub">
        {chosen
          ? 'Sie können die Auswahl jederzeit ändern, solange nichts freigegeben ist.'
          : 'Reihenfolge nach Eingang – es gibt keine Vorsortierung nach Personen.'}
      </p>

      <div className="applicant-grid" data-testid="decision-grid">
        {evaluated.map((applicant) => {
          const ex = applicant.extraction!;
          const result = evaluateCriteria(ex, property.listing.criteria);
          const isChosen = chosen?.id === applicant.id;
          return (
            <article
              key={applicant.id}
              className={`applicant-card${isChosen ? ' is-selected is-complete' : ''}`}
              data-testid={`decision-${applicant.id}`}
            >
              <header className="ac-head">
                <div className="ac-id">
                  <button
                    type="button"
                    className="ac-name"
                    onClick={() => setDetail(applicant.id)}
                  >
                    {applicant.displayName}
                  </button>
                  <div className="ac-source">
                    {personsLabel(ex.persons)} · Einzug {ex.moveIn ?? 'offen'}
                  </div>
                </div>
                {isChosen ? (
                  <Badge tone="green" dot>
                    Von Franz ausgewählt
                  </Badge>
                ) : (
                  <Badge tone={statusTone(applicant)} dot>
                    {ex.statusLabel}
                  </Badge>
                )}
              </header>

              <div className="ac-body">
                <div className="mini-fact">
                  <span className="mini-key">Kontakt</span>
                  <span className="mini-val">{ex.contact ?? 'fehlt'}</span>
                </div>
                <div className="mini-fact">
                  <span className="mini-key">Kriterien</span>
                  <span className="mini-val">
                    <Badge tone={CRITERIA_TONE[result.state]} dot>
                      {CRITERIA_LABEL[result.state]}
                    </Badge>
                  </span>
                </div>
                <div className="mini-fact">
                  <span className="mini-key">Besichtigung</span>
                  <span className="mini-val">
                    {property.viewings.find((v) => v.applicantId === applicant.id)
                      ? `${property.viewings.find((v) => v.applicantId === applicant.id)!.time} Uhr`
                      : 'nicht geplant'}
                  </span>
                </div>
              </div>

              {result.state !== 'erfuellt' && (
                <div className={result.state === 'offen' ? 'note note-amber' : 'note note-red'}>
                  <span className="note-title">{result.summary}</span>
                  {result.checks
                    .filter((c) => c.state !== 'erfuellt')
                    .map((c) => c.detail)
                    .join(' · ')}
                </div>
              )}

              {applicant.consultation.trim() && (
                <div className="note note-navy">
                  <span className="note-title">Rücksprache</span>
                  {applicant.consultation}
                </div>
              )}

              <footer className="ac-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  data-testid={`decision-details-${applicant.id}`}
                  onClick={() => setDetail(applicant.id)}
                >
                  Details &amp; Rücksprache
                </button>
                {isChosen ? (
                  <Badge tone="green">Zusage-Entwurf vorbereitet</Badge>
                ) : (
                  <button
                    type="button"
                    className="btn btn-navy btn-sm"
                    data-testid={`select-${applicant.id}`}
                    onClick={() => {
                      setConfirming(applicant.id);
                      setReason('');
                    }}
                  >
                    {chosen ? 'Stattdessen auswählen' : 'Auswählen'}
                  </button>
                )}
              </footer>
            </article>
          );
        })}
      </div>

      {chosen && (
        <>
          {property.overrideReason.trim() && (
            <>
              <div className="divider" />
              <Banner tone="amber" icon="✋">
                <strong>Entscheidung trotz offener Punkte – von Ihnen begründet:</strong>
                <br />
                {property.overrideReason}
              </Banner>
            </>
          )}

          <div className="divider" />

          <Card>
            <CardHead
              title="Zusage – Entwurf zur Prüfung"
              sub={`An ${chosen.displayName}. Wird erst nach Ihrer Freigabe als erledigt markiert.`}
              right={
                <Badge tone="green" dot>
                  Von Franz ausgewählt
                </Badge>
              }
            />
            <div className="card-pad">
              {chosen.reply && (
                <DraftEditor
                  applicant={chosen}
                  draft={chosen.reply}
                  kind="reply"
                  releaseLabel="Zusage freigeben"
                />
              )}
            </div>
          </Card>

          <div style={{ height: 18 }} />

          <Card>
            <CardHead
              title="Übrige Bewerbungen – Absagen zur Prüfung"
              sub="Jede Absage einzeln bearbeitbar und einzeln freizugeben. Kein Sammelversand."
              right={<Badge tone="grey">{others.length}</Badge>}
            />
            <div className="card-pad stack">
              {others.map((applicant) => (
                <div key={applicant.id}>
                  <div className="row" style={{ marginBottom: 8 }}>
                    <span className="draft-name">{applicant.displayName}</span>
                    <span className="spacer" />
                  </div>
                  {applicant.reply && (
                    <DraftEditor
                      applicant={applicant}
                      draft={applicant.reply}
                      kind="reply"
                      releaseLabel="Absage freigeben"
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="divider" />

          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('vertrag')}
            >
              Mietvertrag vorbereiten <IconArrow />
            </button>
            <span className="hint">
              Nichts wird automatisch versendet – Zusage und Absagen bleiben Entwürfe bis zu Ihrer
              Freigabe.
            </span>
          </div>
        </>
      )}

      {candidate && (
        <Modal
          title={`${candidate.displayName} auswählen?`}
          sub="Sie treffen diese Entscheidung – MietBlick bereitet danach nur die Texte vor."
          width={560}
          onClose={() => setConfirming(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-primary"
                data-testid="confirm-select"
                disabled={reasonRequired && reason.trim().length < 3}
                onClick={() => {
                  dispatch({ type: 'selectApplicant', id: candidate.id, reason: reason.trim() });
                  setConfirming(null);
                  notify(`${candidate.displayName} ausgewählt. Entwürfe vorbereitet.`);
                }}
              >
                Ja, {candidate.displayName} auswählen
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(null)}>
                Abbrechen
              </button>
            </>
          }
        >
          {candidateResult && candidateBlocked ? (
            <>
              <div className="note note-amber">
                <span className="note-title">Bei dieser Bewerbung ist noch etwas offen</span>
                {candidate.extraction?.state === 'klaerung' && (
                  <>
                    Datenlage: {candidate.extraction.statusLabel}.<br />
                  </>
                )}
                {candidateResult.state !== 'erfuellt' && <>Kriterien: {candidateResult.summary}.</>}
              </div>
              <p className="muted" style={{ margin: '14px 0 10px' }}>
                Sie können trotzdem auswählen – das ist Ihre Entscheidung. MietBlick hält nur fest,
                warum, damit es später nachvollziehbar bleibt.
              </p>
              <label className="field">
                <span className="field-label">Begründung (wird nur bei Ihnen gespeichert)</span>
                <textarea
                  className="input"
                  style={{ minHeight: 90 }}
                  data-testid="override-reason"
                  placeholder="z. B. Einzugstermin telefonisch geklärt, SCHUFA wird zur Vertragsunterzeichnung vorgelegt."
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
            </>
          ) : (
            <p className="muted">
              MietBlick legt daraufhin einen Zusage-Entwurf für {candidate.displayName} und
              Absage-Entwürfe für die übrigen Bewerbungen an. Verschickt wird nichts – alle Texte
              bleiben Entwürfe, bis Sie sie freigeben.
            </p>
          )}
        </Modal>
      )}

      {detailApplicant && (
        <ApplicantDetail applicant={detailApplicant} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
