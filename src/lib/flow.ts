/**
 * Der Vermietungsprozess als Datenstruktur.
 *
 * Eine Quelle für beides: die Navigation links und das Haus, das sich mit
 * jedem erledigten Schritt weiter aufbaut.
 */

import type { Property, Route } from '../types';
import { countsFor } from '../state/store';

export interface FlowStep {
  route: Route;
  label: string;
  hint: string;
  done: boolean;
  count?: number;
}

export function buildSteps(property: Property, connected: boolean): FlowStep[] {
  const counts = countsFor(property);
  const releasedDrafts = property.applicants.filter(
    (a) => a.inquiry?.released || a.reply?.released,
  ).length;
  const openDrafts = property.applicants.filter(
    (a) => (a.inquiry && !a.inquiry.released) || (a.reply && !a.reply.released),
  ).length;

  return [
    {
      route: 'objekt',
      label: 'Objekt',
      hint: 'Wohnung und Kriterien',
      done: true,
    },
    {
      route: 'inserat',
      label: 'Inserat',
      hint: 'bearbeiten',
      done: property.listing.publishedTo.length > 0,
    },
    {
      route: 'kanaele',
      label: 'Kanäle',
      hint: 'Portale verbinden',
      done: connected,
    },
    {
      route: 'inbox',
      label: 'Posteingang',
      hint: 'Anfragen sammeln',
      done: counts.total > 0,
      count: counts.total,
    },
    {
      route: 'bewerber',
      label: 'Bewerber prüfen',
      hint: 'auswerten und abgleichen',
      done: property.evaluatedOnce,
      count: counts.evaluated,
    },
    {
      route: 'nachrichten',
      label: 'Nachrichten',
      hint: 'Rückfragen freigeben',
      done: releasedDrafts > 0,
      count: openDrafts,
    },
    {
      route: 'besichtigungen',
      label: 'Besichtigungen',
      hint: 'Termine bestätigen',
      done: counts.viewingsConfirmed > 0,
      count: property.viewings.length,
    },
    {
      route: 'entscheidung',
      label: 'Entscheidung',
      hint: 'Sie wählen aus',
      done: Boolean(property.selectedApplicantId),
    },
    {
      route: 'vertrag',
      label: 'Mietvertrag',
      hint: 'Entwurf erzeugen',
      done: Boolean(property.contract),
    },
  ];
}

export function flowProgress(steps: FlowStep[]): number {
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}
