/**
 * Erzeugt Nachrichten-Entwürfe für den Vermieter.
 *
 * Wichtig: Entwürfe werden nur vorbereitet. Verschickt wird nichts –
 * die Freigabe passiert ausschließlich durch Franz innerhalb von MietBlick.
 */

import type { Applicant, Draft, Listing, RequiredField } from '../types';

const SIGNATURE = 'Viele Grüße\nFranz Peters';

const QUESTION: Record<RequiredField, string> = {
  Einzugstermin: 'Ab wann möchten Sie einziehen?',
  'Anzahl Personen': 'Wie viele Personen würden einziehen?',
  Kontakt: 'Wie kann ich Sie am besten erreichen?',
  Raucher: 'Sind Sie Raucher oder Nichtraucher?',
  Haustiere: 'Würden Haustiere mit einziehen?',
  SCHUFA: 'Können Sie eine aktuelle SCHUFA-Auskunft vorlegen?',
};

/** Anrede: gepflegte Anrede aus dem Kanal, sonst neutral mit dem vollen Namen. */
export function salutationFor(applicant: Applicant): string {
  if (applicant.salutation) return `Guten Tag ${applicant.salutation},`;
  const name = applicant.extraction?.name ?? applicant.displayName;
  return `Guten Tag ${name},`;
}

/**
 * Fragenliste für den Rückfrage-Entwurf.
 *
 * `includeExtra` bestimmt, ob auch die Zusatzangaben (Raucher, Haustiere,
 * SCHUFA) abgefragt werden – das passiert erst nach „Mehr Angaben prüfen".
 */
export function questionsFor(applicant: Applicant, includeExtra = false): string[] {
  const ex = applicant.extraction;
  if (!ex) return [];
  const questions: string[] = [];

  if (ex.conflicts.length > 0 && ex.moveInCandidates.length > 1) {
    const dates = ex.moveInCandidates.map((c) => c.label);
    const list = `${dates.slice(0, -1).join(', ')} und ${dates[dates.length - 1]}`;
    const count = ['', '', 'zwei', 'drei', 'vier'][dates.length] ?? String(dates.length);
    questions.push(
      `In Ihrer Nachricht sind ${count} unterschiedliche Einzugstermine genannt: ${list}.`,
    );
    questions.push('Welcher Termin passt für Sie am besten?');
  } else {
    for (const field of ex.missing) {
      const question = QUESTION[field];
      if (question && !questions.includes(question)) questions.push(question);
    }
  }

  if (includeExtra) {
    for (const field of ex.missingExtra) {
      const question = QUESTION[field];
      if (question && !questions.includes(question)) questions.push(question);
    }
  }

  return questions;
}

/** Braucht diese Bewerbung überhaupt eine Rückfrage? */
export function needsInquiry(applicant: Applicant, includeExtra = false): boolean {
  return questionsFor(applicant, includeExtra).length > 0;
}

/** Rückfrage-Entwurf zu fehlenden Angaben oder einem Widerspruch. */
export function buildInquiryDraft(applicant: Applicant, includeExtra = false): Draft {
  const questions = questionsFor(applicant, includeExtra);
  const body =
    questions.length > 0 ? questions.join('\n') : 'Wann würde Ihnen eine Besichtigung passen?';

  const text = [
    salutationFor(applicant),
    '',
    'vielen Dank für Ihr Interesse an meiner Wohnung.',
    body,
    '',
    SIGNATURE,
  ].join('\n');

  return { kind: 'rueckfrage', text, released: false, releasedAt: null, edited: false };
}

/** Zusage-Entwurf – wird erst nach Freigabe durch Franz wirksam. */
export function buildAcceptanceDraft(applicant: Applicant, listing: Listing): Draft {
  const text = [
    salutationFor(applicant),
    '',
    'vielen Dank für Ihre Bewerbung und für die Zeit, die Sie sich genommen haben.',
    `Ich habe mich für Sie entschieden und würde Ihnen die Wohnung in ${listing.city} · ${listing.district} gerne anbieten.`,
    '',
    'Den Mietvertragsentwurf bereite ich vor. Melden Sie sich gerne bei mir, dann stimmen wir die nächsten Schritte und die Unterlagen ab.',
    '',
    SIGNATURE,
  ].join('\n');

  return { kind: 'zusage', text, released: false, releasedAt: null, edited: false };
}

/** Absage-Entwurf – ebenfalls nur ein Entwurf zur Prüfung. */
export function buildRejectionDraft(applicant: Applicant): Draft {
  const text = [
    salutationFor(applicant),
    '',
    'vielen Dank für Ihr Interesse an meiner Wohnung und für Ihre Nachricht.',
    'Ich habe mich in diesem Fall für eine andere Bewerbung entschieden.',
    '',
    'Für die weitere Wohnungssuche wünsche ich Ihnen alles Gute.',
    '',
    SIGNATURE,
  ].join('\n');

  return { kind: 'absage', text, released: false, releasedAt: null, edited: false };
}
