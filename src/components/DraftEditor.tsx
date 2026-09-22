/**
 * Editierbarer Nachrichten-Entwurf mit Freigabe.
 *
 * Die Freigabe versendet nichts – sie hält innerhalb von MietBlick fest,
 * dass Franz den Text geprüft und freigegeben hat.
 */

import type { Applicant, Draft } from '../types';
import { useStore } from '../state/store';
import { Badge } from './ui';
import { IconLock } from './icons';

interface Props {
  applicant: Applicant;
  draft: Draft;
  kind: 'inquiry' | 'reply';
  releaseLabel?: string;
  onReleased?: () => void;
}

const TITLES: Record<Draft['kind'], string> = {
  rueckfrage: 'Rückfrage – Entwurf zur Prüfung',
  zusage: 'Zusage – Entwurf zur Prüfung',
  absage: 'Absage – Entwurf zur Prüfung',
};

export function DraftEditor({ applicant, draft, kind, releaseLabel, onReleased }: Props) {
  const { dispatch, notify } = useStore();

  const update = (text: string) =>
    dispatch(
      kind === 'inquiry'
        ? { type: 'updateInquiry', id: applicant.id, text }
        : { type: 'updateReply', id: applicant.id, text },
    );

  const release = () => {
    dispatch(
      kind === 'inquiry'
        ? { type: 'releaseInquiry', id: applicant.id }
        : { type: 'releaseReply', id: applicant.id },
    );
    notify(`${TITLES[draft.kind].split(' –')[0]} für ${applicant.displayName} freigegeben.`);
    onReleased?.();
  };

  const testId = `${kind}-${applicant.id}`;

  return (
    <div className="draft" data-testid={`draft-${testId}`}>
      <div className="draft-head">
        <span className="draft-name">{TITLES[draft.kind]}</span>
        <span className="spacer" />
        {draft.released ? (
          <Badge tone="green" dot>
            Freigegeben
          </Badge>
        ) : (
          <Badge tone="grey" dot>
            Entwurf
          </Badge>
        )}
      </div>

      <div className="draft-body">
        <label className="field-label" htmlFor={`text-${testId}`}>
          Text an {applicant.displayName} – vor der Freigabe frei bearbeitbar
        </label>
        <textarea
          id={`text-${testId}`}
          className="draft-text"
          data-testid={`textarea-${testId}`}
          value={draft.text}
          disabled={draft.released}
          onChange={(event) => update(event.target.value)}
        />
      </div>

      <div className="draft-foot">
        {draft.released ? (
          <>
            <span className="badge badge-green">
              <IconLock /> Freigegeben am {draft.releasedAt}
            </span>
            <span className="hint">
              Im MVP wird nichts verschickt – die Freigabe wird nur im System festgehalten.
            </span>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary"
              data-testid={`release-${testId}`}
              onClick={release}
            >
              {releaseLabel ?? 'Entwurf freigeben'}
            </button>
            {draft.edited && <span className="hint">Von Ihnen bearbeitet</span>}
            <span className="spacer" />
            <span className="hint">Kein automatischer Versand</span>
          </>
        )}
      </div>
    </div>
  );
}
