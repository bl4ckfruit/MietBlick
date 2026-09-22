/**
 * Regelbasierte Auswertung einer unstrukturierten Mietanfrage.
 *
 * Arbeitet vollständig lokal und deterministisch – kein API-Key, kein Netzwerk.
 * Erkannt werden: Name, Kontakt, Anzahl Personen, gewünschter Einzugstermin,
 * Raucher, Haustiere und SCHUFA-Auskunft – dazu fehlende Pflichtangaben und
 * einfache Widersprüche beim Einzugstermin.
 */

import type { Extraction, MoveInCandidate, PetInfo, RequiredField } from '../types';

/** Referenzdatum der Demo – legt fest, wie Jahresangaben ergänzt werden. */
const REFERENCE = { year: 2026, month: 9 };

export const CORE_FIELDS: RequiredField[] = ['Kontakt', 'Anzahl Personen', 'Einzugstermin'];
export const EXTRA_FIELDS: RequiredField[] = ['Raucher', 'Haustiere', 'SCHUFA'];

const MONTHS: Record<string, number> = {
  januar: 1, jaenner: 1, jänner: 1, jan: 1,
  februar: 2, feb: 2,
  maerz: 3, märz: 3, mrz: 3,
  april: 4, apr: 4,
  mai: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sept: 9, sep: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  dezember: 12, dez: 12,
};

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const MONTH_PATTERN =
  'Januar|Jänner|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|Jan|Feb|Mrz|Apr|Jun|Jul|Aug|Sept|Sep|Okt|Nov|Dez';

/** Signalwörter, die einen Termin als Einzugstermin ausweisen. */
const MOVE_IN_CUES = [
  'einzug', 'einziehen', 'einziehe', 'einzieht', 'beziehen', 'beziehe',
  'mietbeginn', 'übernehmen', 'uebernehmen', 'übernahme',
  'wunschtermin', 'wunschdatum', 'umziehen', 'umzug', 'verfügbar', 'verfuegbar',
  'ab dem', 'ab anfang', 'ab mitte', 'ab ende', 'zum ', 'ab ', 'per ',
  'frei werden', 'frei wird', 'starten', 'beginnen',
];

const NUMBER_WORDS: Record<string, number> = {
  eine: 1, einer: 1, ein: 1, eins: 1,
  zwei: 2, drei: 3, vier: 4, fünf: 5, fuenf: 5, sechs: 6, sieben: 7,
};

interface RawMatch {
  start: number;
  end: number;
  raw: string;
  label: string;
  key: string;
}

const lower = (s: string) => s.toLowerCase();

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Ergänzt ein fehlendes Jahr relativ zum Referenzdatum der Demo. */
function inferYear(month: number): number {
  return month >= REFERENCE.month ? REFERENCE.year : REFERENCE.year + 1;
}

function normalizeYear(value: string | undefined, month: number): number {
  if (!value) return inferYear(month);
  const n = Number(value);
  if (value.length === 2) return 2000 + n;
  return n;
}

/** Findet alle Datums- bzw. Monatsangaben im Text. */
function findDateMatches(text: string): RawMatch[] {
  const matches: RawMatch[] = [];
  const taken: Array<[number, number]> = [];

  const overlaps = (start: number, end: number) =>
    taken.some(([s, e]) => start < e && end > s);

  const push = (m: RawMatch) => {
    if (overlaps(m.start, m.end)) return;
    taken.push([m.start, m.end]);
    matches.push(m);
  };

  // 1) Numerisch: 01.11.2026 · 1.11.26 · 01.11.
  const numeric = /\b(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})?/g;
  for (const m of text.matchAll(numeric)) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (day < 1 || day > 31 || month < 1 || month > 12) continue;
    const year = normalizeYear(m[3], month);
    push({
      start: m.index!,
      end: m.index! + m[0].length,
      raw: m[0],
      label: `${pad(day)}.${pad(month)}.${year}`,
      key: `${year}-${pad(month)}-${pad(day)}`,
    });
  }

  // 2) Textuell mit Tag: 1. November 2026 · 01. Nov.
  const textualDay = new RegExp(
    `\\b(\\d{1,2})\\.\\s*(${MONTH_PATTERN})\\b\\.?(?:\\s+(\\d{4}))?`,
    'gi',
  );
  for (const m of text.matchAll(textualDay)) {
    const day = Number(m[1]);
    const month = MONTHS[lower(m[2])];
    if (!month || day < 1 || day > 31) continue;
    const year = normalizeYear(m[3], month);
    push({
      start: m.index!,
      end: m.index! + m[0].length,
      raw: m[0],
      label: `${pad(day)}.${pad(month)}.${year}`,
      key: `${year}-${pad(month)}-${pad(day)}`,
    });
  }

  // 3) Monat, optional mit Anfang/Mitte/Ende: "Anfang Dezember", "ab November 2026"
  const monthOnly = new RegExp(
    `\\b(Anfang|Mitte|Ende)?\\s*(${MONTH_PATTERN})\\b\\.?(?:\\s+(\\d{4}))?`,
    'gi',
  );
  for (const m of text.matchAll(monthOnly)) {
    const month = MONTHS[lower(m[2])];
    if (!month) continue;
    const qualifier = m[1] ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : null;
    const year = normalizeYear(m[3], month);
    const name = MONTH_NAMES[month - 1];
    push({
      start: m.index!,
      end: m.index! + m[0].length,
      raw: m[0].trim(),
      label: qualifier ? `${qualifier} ${name} ${year}` : `${name} ${year}`,
      key: qualifier ? `${year}-${pad(month)}-${qualifier}` : `${year}-${pad(month)}`,
    });
  }

  return matches.sort((a, b) => a.start - b.start);
}

/**
 * Ersetzt gefundene Datumsangaben durch Platzhalter gleicher Länge.
 * So stören die Punkte in "01.11.2026" weder die Satztrennung noch die
 * Telefonnummernerkennung.
 */
function maskRanges(text: string, ranges: Array<[number, number]>): string {
  const chars = text.split('');
  for (const [start, end] of ranges) {
    for (let i = start; i < end && i < chars.length; i += 1) {
      chars[i] = chars[i] === '\n' ? '\n' : '·';
    }
  }
  return chars.join('');
}

/** Satzgrenzen auf dem maskierten Text. */
function sentenceRanges(masked: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let start = 0;
  for (let i = 0; i < masked.length; i += 1) {
    const ch = masked[i];
    const isBreak =
      ch === '\n' ||
      ((ch === '.' || ch === '!' || ch === '?' || ch === ';') &&
        (i + 1 >= masked.length || /\s/.test(masked[i + 1])));
    if (isBreak) {
      if (i + 1 > start) ranges.push([start, i + 1]);
      start = i + 1;
    }
  }
  if (start < masked.length) ranges.push([start, masked.length]);
  return ranges;
}

function hasMoveInCue(sentence: string): boolean {
  const s = lower(sentence);
  return MOVE_IN_CUES.some((cue) => s.includes(cue));
}

/** Wählt aus allen Datumsangaben die tatsächlichen Einzugstermin-Kandidaten. */
function pickMoveInCandidates(text: string, dates: RawMatch[]): MoveInCandidate[] {
  if (dates.length === 0) return [];

  const masked = maskRanges(text, dates.map((d) => [d.start, d.end] as [number, number]));
  const sentences = sentenceRanges(masked);

  const inCueSentence = dates.filter((d) => {
    const sentence = sentences.find(([s, e]) => d.start >= s && d.start < e);
    if (!sentence) return false;
    return hasMoveInCue(text.slice(sentence[0], sentence[1]));
  });

  const chosen =
    inCueSentence.length > 0
      ? inCueSentence
      : dates.length === 1 && hasMoveInCue(text)
        ? dates
        : [];

  const seen = new Set<string>();
  const result: MoveInCandidate[] = [];
  for (const d of chosen) {
    if (seen.has(d.key)) continue;
    seen.add(d.key);
    result.push({ raw: d.raw, label: d.label, key: d.key });
  }
  return result;
}

/**
 * Der Auslöser ("mein Name ist", "Viele Grüße") wird ohne Rücksicht auf
 * Groß-/Kleinschreibung gesucht, der Name selbst bewusst mit – sonst würde
 * bei "Clara Neumann und ich" das Wort "und" mitgelesen.
 */
function nameAfter(text: string, trigger: RegExp): string | null {
  const namePart = '[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?';
  const fullName = new RegExp(`^[ \\t]*(${namePart}(?:[ \\t]+${namePart}){0,2})`);

  for (const match of text.matchAll(trigger)) {
    const rest = text.slice(match.index! + match[0].length);
    const found = rest.match(fullName);
    if (found) return found[1].trim();
  }
  return null;
}

function extractName(text: string): string | null {
  const intro =
    /(?:mein\s+name\s+ist|ich\s+hei(?:ß|ss)e|ich\s+bin|hier\s+(?:schreibt|ist))[ \t]+/gi;
  const fromIntro = nameAfter(text, intro);
  if (fromIntro) return fromIntro;

  const signature =
    /(?:mit\s+freundlichen\s+gr(?:ü|ue)(?:ß|ss)en|(?:viele|beste|herzliche|liebe|freundliche|sonnige)\s+gr(?:ü|ue)(?:ß|ss)e|gr(?:ü|ue)(?:ß|ss)e|mfg|lg|vg)[,!]?[ \t]*\n+[ \t]*/gi;
  const fromSignature = nameAfter(text, signature);
  if (fromSignature) return fromSignature;

  return null;
}

function extractEmail(text: string): string | null {
  const m = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  return m ? m[0].replace(/[.,;]$/, '') : null;
}

function extractPhone(masked: string): string | null {
  const m = masked.match(/(?:\+49|0)[\d][\d\s/()-]{6,20}\d/);
  if (!m) return null;
  const digits = m[0].replace(/\D/g, '');
  if (digits.length < 7) return null;
  return m[0].trim();
}

interface PersonsResult {
  persons: number | null;
  evidence: string | null;
}

function extractPersons(text: string): PersonsResult {
  const s = lower(text);
  /** Zitiert die Fundstelle in der Schreibweise des Originaltexts. */
  const quote = (match: RegExpMatchArray) =>
    `„${text.slice(match.index!, match.index! + match[0].length).trim()}“`;

  // 1) "zu zweit", "zu dritt" …
  const together: Record<string, number> = {
    zweit: 2, dritt: 3, viert: 4, fünft: 5, fuenft: 5, sechst: 6,
  };
  const togetherMatch = s.match(/\bzu\s+(zweit|dritt|viert|fünft|fuenft|sechst)\b/);
  if (togetherMatch) {
    return { persons: together[togetherMatch[1]], evidence: quote(togetherMatch) };
  }

  // 2) "2 Personen", "zwei Erwachsene"
  const counted = s.match(
    /\b(\d{1,2}|eine?r?|zwei|drei|vier|fünf|fuenf|sechs)\s+(personen|person|erwachsene[nr]?|leute)\b/,
  );
  if (counted) {
    const raw = counted[1];
    const value = /^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS[raw];
    if (value && value > 0 && value < 20) {
      return { persons: value, evidence: quote(counted) };
    }
  }

  // 3) Allein einziehen
  const alone = s.match(/\b(alleine|allein|als einzelperson)\b/);
  if (alone) {
    return { persons: 1, evidence: quote(alone) };
  }

  // 4) Partner/in genannt -> zwei Personen, zzgl. explizit genannter Kinder
  const partner = s.match(
    /\b(?:meine[rnm]?|mit\s+meine[rnm]?)\s+(freundin|freund|partnerin|partner|frau|mann|ehefrau|ehemann|lebensgef(?:ä|ae)hrtin|lebensgef(?:ä|ae)hrte)\b/,
  );
  if (partner) {
    let total = 2;
    const children = s.match(/\b(beiden|\d{1,2}|ein|einem|zwei|drei|vier)\s+kinder?n?\b/);
    if (children) {
      const raw = children[1];
      const value =
        raw === 'beiden'
          ? 2
          : /^\d+$/.test(raw)
            ? Number(raw)
            : NUMBER_WORDS[raw.replace('einem', 'ein')];
      if (value) total += value;
    } else if (/\bunser(?:e|em|en)?\s+(sohn|tochter|kind)\b/.test(s)) {
      total += 1;
    }
    return { persons: total, evidence: quote(partner) };
  }

  return { persons: null, evidence: null };
}

/* ------------------------------------------------------- Zusatzangaben */

function extractSmoker(text: string): boolean | null {
  const s = lower(text);
  if (/nicht-?raucher/.test(s)) return false;
  if (/\b(rauche|rauchen)\s+(wir\s+|ich\s+)?nicht\b/.test(s)) return false;
  if (/\braucher(in)?\b/.test(s)) return true;
  if (/\bich\s+rauche\b/.test(s)) return true;
  return null;
}

const ANIMALS: Array<[RegExp, string]> = [
  [/\b(hund|hündin|huendin|mischling|welpe)\b/, 'Hund'],
  [/\b(katze|kater|wohnungskatze)\b/, 'Katze'],
  [/\b(kaninchen|meerschweinchen|hamster|nagetier)\b/, 'Kleintier'],
  [/\b(wellensittich|papagei|vogel|kanarienvogel)\b/, 'Vogel'],
  [/\b(schlange|echse|reptil|gecko)\b/, 'Reptil'],
];

function extractPets(text: string): PetInfo | null {
  const s = lower(text);

  const noPets =
    /\bkein(e)?\s+(haus)?tiere?\b/.test(s) ||
    /\b(haus)?tiere?\s+(habe|haben)\s+(wir|ich)\s+keine\b/.test(s) ||
    /\bhalten\s+keine\s+(haus)?tiere?\b/.test(s);

  for (const [pattern, kind] of ANIMALS) {
    if (pattern.test(s)) return { has: true, kind };
  }
  if (noPets) return { has: false, kind: null };
  if (/\bhaustier(e)?\b/.test(s)) return { has: true, kind: 'Haustier' };
  return null;
}

function extractSchufa(text: string): boolean | null {
  const s = lower(text);
  if (!/schufa|bonit(ä|ae)t/.test(s)) return null;
  if (/keine?\s+schufa|schufa[^.]{0,30}\bnicht\b/.test(s)) return false;
  return true;
}

/* ------------------------------------------------------------- Status */

const STEP_TEXT: Record<RequiredField, string> = {
  Kontakt: 'Kontaktdaten',
  'Anzahl Personen': 'Anzahl Personen',
  Einzugstermin: 'Einzugstermin',
  Raucher: 'Angabe zum Rauchen',
  Haustiere: 'Angabe zu Haustieren',
  SCHUFA: 'SCHUFA-Auskunft',
};

const SINGLE_LABEL: Partial<Record<RequiredField, string>> = {
  Einzugstermin: 'Einzugstermin fehlt',
  Kontakt: 'Kontakt fehlt',
  'Anzahl Personen': 'Anzahl Personen fehlt',
  Raucher: 'Angabe zum Rauchen fehlt',
  Haustiere: 'Angabe zu Haustieren fehlt',
  SCHUFA: 'SCHUFA-Auskunft fehlt',
};

function buildStatus(
  missing: RequiredField[],
  conflicts: string[],
): { statusLabel: string; nextStep: string } {
  if (conflicts.length > 0) {
    return { statusLabel: 'Widerspruch klären', nextStep: 'Einzugstermin klären' };
  }
  if (missing.length === 0) {
    return { statusLabel: 'Angaben vollständig', nextStep: 'Besichtigung anbieten' };
  }
  if (missing.length === 1) {
    return {
      statusLabel: SINGLE_LABEL[missing[0]] ?? 'Angaben unvollständig',
      nextStep: `${STEP_TEXT[missing[0]]} erfragen`,
    };
  }
  return {
    statusLabel: 'Angaben unvollständig',
    nextStep: `${missing.map((f) => STEP_TEXT[f]).join(' und ')} erfragen`,
  };
}

/* ------------------------------------------------------------ Extraktion */

/**
 * Wertet eine Nachricht aus.
 *
 * `fallbackName` ist der Absendername aus dem Kanal und wird nur genutzt, wenn
 * im Text selbst kein Name steht. `required` bestimmt, welche Felder für dieses
 * Objekt Pflicht sind – Standard sind Kontakt, Personen und Einzugstermin.
 */
export function extract(
  message: string,
  fallbackName?: string,
  required: RequiredField[] = CORE_FIELDS,
): Extraction {
  const text = message.replace(/\r\n/g, '\n');

  const dates = findDateMatches(text);
  const masked = maskRanges(text, dates.map((d) => [d.start, d.end] as [number, number]));

  const name = extractName(text) ?? fallbackName ?? null;
  const email = extractEmail(text);
  const phone = extractPhone(masked);
  const { persons, evidence } = extractPersons(text);
  const moveInCandidates = pickMoveInCandidates(text, dates);
  const smoker = extractSmoker(text);
  const pets = extractPets(text);
  const schufa = extractSchufa(text);

  let contact: string | null = null;
  let contactKind: Extraction['contactKind'] = null;
  if (email && phone) {
    contact = `${email} · ${phone}`;
    contactKind = 'E-Mail & Telefon';
  } else if (email) {
    contact = email;
    contactKind = 'E-Mail';
  } else if (phone) {
    contact = phone;
    contactKind = 'Telefon';
  }

  const conflicts: string[] = [];
  if (moveInCandidates.length > 1) {
    conflicts.push('Widerspruch beim Einzugstermin');
  }

  const moveIn = moveInCandidates.length === 1 ? moveInCandidates[0].label : null;

  const present: Record<RequiredField, boolean> = {
    Kontakt: contact !== null,
    'Anzahl Personen': persons !== null,
    Einzugstermin: moveInCandidates.length > 0,
    Raucher: smoker !== null,
    Haustiere: pets !== null,
    SCHUFA: schufa !== null,
  };

  const missing = required.filter((field) => !present[field]);
  const missingExtra = EXTRA_FIELDS.filter(
    (field) => !present[field] && !required.includes(field),
  );

  const { statusLabel, nextStep } = buildStatus(missing, conflicts);

  return {
    name,
    contact,
    contactKind,
    persons,
    personsEvidence: evidence,
    moveIn,
    moveInCandidates,
    smoker,
    pets,
    schufa,
    missing,
    missingExtra,
    conflicts,
    state: missing.length === 0 && conflicts.length === 0 ? 'vollstaendig' : 'klaerung',
    statusLabel,
    nextStep,
  };
}

/** "1 Person" / "3 Personen" – kleine Höflichkeit gegenüber dem Leser. */
export function personsLabel(count: number | null): string {
  if (count === null) return 'Personen offen';
  return count === 1 ? '1 Person' : `${count} Personen`;
}

export function smokerLabel(value: boolean | null): string {
  if (value === null) return 'keine Angabe';
  return value ? 'Raucher' : 'Nichtraucher';
}

export function petsLabel(value: PetInfo | null): string {
  if (value === null) return 'keine Angabe';
  if (!value.has) return 'keine Haustiere';
  return value.kind ? `Haustier: ${value.kind}` : 'Haustier vorhanden';
}

export function schufaLabel(value: boolean | null): string {
  if (value === null) return 'keine Angabe';
  return value ? 'liegt vor' : 'nicht vorhanden';
}
