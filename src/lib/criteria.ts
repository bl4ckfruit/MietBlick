/**
 * Abgleich einer Bewerbung gegen die Vermietungskriterien des Objekts.
 *
 * Geprüft wird ausschließlich Objektbezogenes: was die Wohnung hergibt
 * (Belegung nach Zimmerzahl) und was im Mietvertrag geregelt wird
 * (Haustiere, Rauchen, Bonitätsnachweis). Keine persönlichen Merkmale,
 * keine Rangfolge, keine automatische Entscheidung – das Ergebnis ist ein
 * Hinweis für den Vermieter, mehr nicht.
 */

import type { CheckState, Criteria, CriteriaCheck, CriteriaResult, Extraction } from '../types';
import { personsLabel } from './extract';

function worst(states: CheckState[]): CheckState {
  if (states.includes('nicht_erfuellt')) return 'nicht_erfuellt';
  if (states.includes('offen')) return 'offen';
  return 'erfuellt';
}

export function evaluateCriteria(
  extraction: Extraction | null,
  criteria: Criteria,
): CriteriaResult {
  if (!extraction) {
    return { checks: [], state: 'offen', summary: 'Noch nicht ausgewertet' };
  }

  const checks: CriteriaCheck[] = [];

  // Haustiere
  if (criteria.petsAllowed) {
    checks.push({
      key: 'pets',
      label: 'Haustiere',
      state: 'erfuellt',
      detail: 'Haustiere sind in diesem Objekt erlaubt',
    });
  } else if (extraction.pets === null) {
    checks.push({
      key: 'pets',
      label: 'Haustiere',
      state: 'offen',
      detail: 'Keine Angabe zu Haustieren',
    });
  } else if (extraction.pets.has) {
    checks.push({
      key: 'pets',
      label: 'Haustiere',
      state: 'nicht_erfuellt',
      detail: `${extraction.pets.kind ?? 'Haustier'} vorhanden – Objekt ist ohne Haustiere ausgeschrieben`,
    });
  } else {
    checks.push({
      key: 'pets',
      label: 'Haustiere',
      state: 'erfuellt',
      detail: 'Keine Haustiere',
    });
  }

  // Rauchen
  if (criteria.smokingAllowed) {
    checks.push({
      key: 'smoking',
      label: 'Rauchen',
      state: 'erfuellt',
      detail: 'Keine Einschränkung hinterlegt',
    });
  } else if (extraction.smoker === null) {
    checks.push({
      key: 'smoking',
      label: 'Rauchen',
      state: 'offen',
      detail: 'Keine Angabe zum Rauchen',
    });
  } else if (extraction.smoker) {
    checks.push({
      key: 'smoking',
      label: 'Rauchen',
      state: 'nicht_erfuellt',
      detail: 'Raucher – Objekt ist als Nichtraucherwohnung ausgeschrieben',
    });
  } else {
    checks.push({
      key: 'smoking',
      label: 'Rauchen',
      state: 'erfuellt',
      detail: 'Nichtraucher',
    });
  }

  // Belegung
  if (extraction.persons === null) {
    checks.push({
      key: 'persons',
      label: 'Belegung',
      state: 'offen',
      detail: `Anzahl Personen unbekannt (zulässig: bis ${criteria.maxPersons})`,
    });
  } else if (extraction.persons > criteria.maxPersons) {
    checks.push({
      key: 'persons',
      label: 'Belegung',
      state: 'nicht_erfuellt',
      detail: `${personsLabel(extraction.persons)} bei ${criteria.maxPersons} zulässigen Personen`,
    });
  } else {
    checks.push({
      key: 'persons',
      label: 'Belegung',
      state: 'erfuellt',
      detail: `${personsLabel(extraction.persons)} von ${criteria.maxPersons} zulässigen`,
    });
  }

  // SCHUFA
  if (!criteria.schufaRequired) {
    checks.push({
      key: 'schufa',
      label: 'SCHUFA',
      state: 'erfuellt',
      detail: 'Für dieses Objekt nicht gefordert',
    });
  } else if (extraction.schufa === null) {
    checks.push({
      key: 'schufa',
      label: 'SCHUFA',
      state: 'offen',
      detail: 'Keine Angabe zur SCHUFA-Auskunft',
    });
  } else if (!extraction.schufa) {
    checks.push({
      key: 'schufa',
      label: 'SCHUFA',
      state: 'nicht_erfuellt',
      detail: 'Keine SCHUFA-Auskunft vorhanden',
    });
  } else {
    checks.push({
      key: 'schufa',
      label: 'SCHUFA',
      state: 'erfuellt',
      detail: 'SCHUFA-Auskunft liegt vor',
    });
  }

  const state = worst(checks.map((c) => c.state));
  const failed = checks.filter((c) => c.state === 'nicht_erfuellt');
  const open = checks.filter((c) => c.state === 'offen');

  const summary =
    state === 'erfuellt'
      ? 'Erfüllt alle Kriterien'
      : state === 'nicht_erfuellt'
        ? `Kriterium nicht erfüllt: ${failed.map((c) => c.label).join(', ')}`
        : `Angabe offen: ${open.map((c) => c.label).join(', ')}`;

  return { checks, state, summary };
}

export const CRITERIA_TONE: Record<CheckState, 'green' | 'amber' | 'red'> = {
  erfuellt: 'green',
  offen: 'amber',
  nicht_erfuellt: 'red',
};

export const CRITERIA_LABEL: Record<CheckState, string> = {
  erfuellt: 'Kriterien erfüllt',
  offen: 'Kriterium offen',
  nicht_erfuellt: 'Kriterium nicht erfüllt',
};

/** Kurzform für enge Stellen wie die Bewerberkarte. */
export const CRITERIA_SHORT: Record<CheckState, string> = {
  erfuellt: 'erfüllt',
  offen: 'offen',
  nicht_erfuellt: 'nicht erfüllt',
};

/** Kurzfassung der Objektkriterien für Anzeige und Mietvertrag. */
export function criteriaSummary(criteria: Criteria): string[] {
  return [
    criteria.petsAllowed ? 'Haustiere erlaubt' : 'Keine Haustiere',
    criteria.smokingAllowed ? 'Rauchen erlaubt' : 'Nichtraucherwohnung',
    `Belegung bis ${criteria.maxPersons} Personen`,
    criteria.schufaRequired ? 'SCHUFA-Auskunft erforderlich' : 'SCHUFA-Auskunft optional',
  ];
}
