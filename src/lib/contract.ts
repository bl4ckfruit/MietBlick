/**
 * Erzeugt einen Mietvertragsentwurf aus Objektdaten und den ausgelesenen
 * Angaben der ausgewählten Person.
 *
 * Der Entwurf ist bewusst kein Rechtsdokument: er fasst zusammen, was aus dem
 * Prozess bekannt ist, markiert Lücken sichtbar und bleibt vollständig
 * editierbar. Vor Unterschrift gehört er geprüft.
 */

import type { Applicant, Listing } from '../types';
import { LANDLORD } from '../data/seed';
import { personsLabel } from './extract';

const GAP = '________________';

function euro(value: number): string {
  return `${value.toLocaleString('de-DE')} €`;
}

export function buildContract(listing: Listing, applicant: Applicant): string {
  const ex = applicant.extraction;
  const name = ex?.name ?? applicant.displayName;
  const contact = ex?.contact ?? GAP;
  const persons = ex?.persons !== null && ex?.persons !== undefined ? ex.persons : null;
  const moveIn = ex?.moveIn ?? listing.moveIn;
  const total = listing.rent + listing.extraCosts;

  const petsClause = listing.criteria.petsAllowed
    ? 'Die Haltung von Haustieren ist nach vorheriger Absprache mit dem Vermieter gestattet.'
    : 'Die Haltung von Haustieren ist in der Wohnung nicht gestattet. Ausnahmen bedürfen der schriftlichen Zustimmung des Vermieters.';

  const smokingClause = listing.criteria.smokingAllowed
    ? 'Für das Rauchen in der Wohnung bestehen keine gesonderten Einschränkungen.'
    : 'Die Wohnung wird als Nichtraucherwohnung vermietet. Das Rauchen innerhalb der Wohnräume ist nicht gestattet.';

  const schufaClause = listing.criteria.schufaRequired
    ? ex?.schufa
      ? 'Eine aktuelle SCHUFA-Auskunft des Mieters liegt dem Vermieter vor.'
      : `Eine aktuelle SCHUFA-Auskunft ist vor Vertragsunterzeichnung vorzulegen.  [offen: ${GAP}]`
    : 'Ein Bonitätsnachweis wird für dieses Mietverhältnis nicht gefordert.';

  const openPoints: string[] = [];
  if (!ex?.contact) openPoints.push('Kontaktdaten des Mieters');
  if (persons === null) openPoints.push('Anzahl der einziehenden Personen');
  if (!ex?.moveIn) openPoints.push('verbindlicher Einzugstermin');
  if (listing.criteria.schufaRequired && !ex?.schufa) openPoints.push('SCHUFA-Auskunft');
  if (ex?.conflicts.length) openPoints.push('widersprüchliche Terminangaben in der Anfrage');

  const consultation = applicant.consultation.trim();

  return `MIETVERTRAG ÜBER WOHNRAUM
Entwurf – erstellt mit MietBlick am ${new Date().toLocaleDateString('de-DE')}

───────────────────────────────────────────────────────────────

§ 1  VERTRAGSPARTEIEN

Vermieter
  ${LANDLORD.name}
  München

Mieter
  ${name}
  Kontakt: ${contact}

───────────────────────────────────────────────────────────────

§ 2  MIETOBJEKT

  Objekt        ${listing.title}
  Anschrift     ${listing.city} · ${listing.district}
  Größe         ${listing.size} m², ${listing.rooms} Zimmer
  Ausstattung   ${listing.highlight}

Die Wohnung wird zu Wohnzwecken vermietet und von
${persons !== null ? personsLabel(persons) : `${GAP} Personen`} bewohnt.

───────────────────────────────────────────────────────────────

§ 3  MIETZEIT

  Mietbeginn    ${moveIn}
  Mietdauer     unbefristet

───────────────────────────────────────────────────────────────

§ 4  MIETE UND NEBENKOSTEN

  Grundmiete            ${euro(listing.rent)} monatlich
  Betriebskostenvorauszahlung  ${euro(listing.extraCosts)} monatlich
  Gesamtmiete           ${euro(total)} monatlich

  Kaution               ${euro(listing.deposit)} (drei Grundmieten)

Die Miete ist monatlich im Voraus, spätestens am dritten Werktag
des Monats, auf das vom Vermieter benannte Konto zu zahlen.

───────────────────────────────────────────────────────────────

§ 5  NUTZUNG DER MIETSACHE

${petsClause}

${smokingClause}

───────────────────────────────────────────────────────────────

§ 6  NACHWEISE

${schufaClause}

───────────────────────────────────────────────────────────────

§ 7  ÜBERGABE

Die Übergabe erfolgt am ${moveIn}. Über den Zustand der Wohnung
wird ein gemeinsames Übergabeprotokoll erstellt.

───────────────────────────────────────────────────────────────
${
  consultation
    ? `
NOTIZ AUS DER RÜCKSPRACHE

${consultation}

───────────────────────────────────────────────────────────────
`
    : ''
}${
    openPoints.length > 0
      ? `
VOR UNTERSCHRIFT NOCH ZU KLÄREN

${openPoints.map((point) => `  •  ${point}`).join('\n')}

───────────────────────────────────────────────────────────────
`
      : ''
  }
UNTERSCHRIFTEN


  ____________________________        ____________________________
  Ort, Datum                          Ort, Datum

  ____________________________        ____________________________
  ${LANDLORD.name}, Vermieter${' '.repeat(Math.max(1, 20 - LANDLORD.name.length))}${name}, Mieter


Hinweis: Dieser Entwurf wurde aus den in MietBlick erfassten Angaben
erzeugt. Er ersetzt keine Rechtsberatung und ist vor Unterzeichnung
zu prüfen und zu ergänzen.`;
}
