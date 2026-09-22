/**
 * Startzustand der Demo: zwei Wohnungen von Franz Peters mit je fünf
 * eingegangenen Anfragen.
 *
 * Die Nachrichten sind bewusst so formuliert, wie echte Mietanfragen eintreffen:
 * unstrukturiert, unterschiedlich lang, unterschiedlich vollständig.
 */

import type { AppState, Applicant, Property, Viewing } from '../types';

export const LANDLORD = {
  name: 'Franz Peters',
  role: 'Privater Vermieter · München',
  initials: 'FP',
};

export const STATE_VERSION = 2;

/* ------------------------------------------------------- Anfragen München */

const ANNA = `Sehr geehrter Herr Peters,

ich habe Ihre Anzeige für die 3-Zimmer-Wohnung in der Münchner Innenstadt gesehen und würde sie mir sehr gerne ansehen.

Mein Name ist Anna Weber, ich bin 34 und arbeite seit fünf Jahren als Projektleiterin in einem Ingenieurbüro in der Nähe. Ich würde alleine einziehen, bin Nichtraucherin und habe keine Haustiere.

Einziehen könnte ich zum 01.11.2026, das würde zeitlich perfekt passen.

Eine aktuelle SCHUFA-Auskunft liegt mir vor, die bringe ich gerne zur Besichtigung mit.

Sie erreichen mich unter anna.weber@example.de oder telefonisch unter 0176 2233445.

Viele Grüße
Anna Weber`;

const BEN = `Hallo,

ich interessiere mich für Ihre Wohnung und hätte großes Interesse an einer Besichtigung.

Ich heiße Ben Keller, bin 29 Jahre alt und arbeite als Physiotherapeut in einer Praxis in Sendling. Einziehen würde ich zusammen mit meiner Partnerin, wir beide sind Nichtraucher und haben keine Haustiere.

Am besten erreichen Sie mich per Mail: ben.keller@example.de

Beste Grüße
Ben Keller`;

const CLARA = `Guten Tag Herr Peters,

mein Name ist Clara Neumann und ich interessiere mich sehr für Ihre 3-Zimmer-Wohnung in der Innenstadt.

Wir würden zu zweit einziehen, mein Partner und ich. Wir arbeiten beide unbefristet in München und rauchen nicht.

Unsere Katze würden wir selbstverständlich mitbringen, sie ist sehr ruhig und eine reine Wohnungskatze.

Einziehen könnten wir zum 01.11.2026.

Unser jetziger Vermieter hat uns allerdings gerade mitgeteilt, dass sich die Übergabe verzögert. Realistisch wäre ein Einzug daher erst ab dem 01.01.2027.

Eine SCHUFA-Auskunft können wir selbstverständlich vorlegen.

Sie erreichen mich unter clara.neumann@example.de oder 0151 99887766.

Viele Grüße
Clara Neumann`;

const DAVID = `Hallo Herr Peters,

ich bin David Fischer und schreibe Ihnen wegen der 3-Zimmer-Wohnung in der Innenstadt. Die Lage wäre für uns ideal, meine Arbeitsstelle ist nur zwei Stationen entfernt.

Wir sind zu dritt: meine Frau, unsere Tochter und ich. Wir sind Nichtraucher und haben keine Haustiere.

Der gewünschte Einzugstermin wäre der 01.11.2026.

Die SCHUFA-Auskunft habe ich bereits angefordert und reiche sie nach.

Kontakt: david.fischer@example.de, 089 4455667

Mit freundlichen Grüßen
David Fischer`;

const EVA = `Sehr geehrter Herr Peters,

ich heiße Eva Sommer und bin über ein Inserat auf Ihre Wohnung aufmerksam geworden. Die Bilder und der Schnitt gefallen mir sehr gut.

Ich arbeite als Grafikdesignerin und würde alleine einziehen. Haustiere habe ich keine. Ich bin allerdings Raucherin, rauche aber ausschließlich auf dem Balkon.

Mein Wunschtermin für den Einzug ist der 01.11.2026.

Meine SCHUFA-Auskunft ist aktuell und kann ich Ihnen zusenden.

Sie erreichen mich unter eva.sommer@example.de.

Herzliche Grüße
Eva Sommer`;

/* -------------------------------------------------------- Anfragen Dachau */

const JONAS = `Guten Tag Herr Peters,

mein Name ist Jonas Reiter, ich bin 31 und arbeite als Elektroniker bei einem Betrieb in Karlsfeld.

Wir würden zu zweit einziehen, meine Partnerin und ich. Wir sind beide Nichtraucher und halten keine Haustiere.

Einziehen könnten wir zum 01.12.2026.

Eine aktuelle SCHUFA-Auskunft und die Gehaltsnachweise der letzten drei Monate liegen bereit.

Sie erreichen mich unter jonas.reiter@example.de oder 0170 5566778.

Viele Grüße
Jonas Reiter`;

const MIRA = `Sehr geehrter Herr Peters,

ich heiße Mira Schuster und wir suchen dringend eine Wohnung in Dachau, da wir im Ort arbeiten.

Wir sind zu viert: mein Mann, unsere beiden Kinder und ich. Wir rauchen nicht und haben keine Haustiere.

Als Einzugstermin wäre der 01.12.2026 ideal.

Die SCHUFA-Auskunft können wir gerne vorlegen.

Kontakt: mira.schuster@example.de

Mit freundlichen Grüßen
Mira Schuster`;

const TOBIAS = `Hallo,

ich interessiere mich sehr für die 2-Zimmer-Wohnung in Dachau. Die Lage klingt genau nach dem, was ich suche.

Ich heiße Tobias Lang, arbeite im Homeoffice als Softwareentwickler und würde alleine einziehen. Ich bin Nichtraucher.

Ich habe einen kleinen Hund, einen sehr ruhigen Mischling.

Erreichbar bin ich unter tobias.lang@example.de.

Beste Grüße
Tobias Lang`;

const SINA = `Guten Tag Herr Peters,

mein Name ist Sina Kraus. Die Wohnung in Dachau würde mir sehr gut gefallen, vor allem wegen der Anbindung.

Ich würde alleine einziehen, bin Nichtraucherin und habe keine Haustiere.

Einziehen könnte ich zum 01.12.2026.

Mein Arbeitsvertrag beginnt allerdings erst später, realistisch wäre ein Einzug ab dem 15.01.2027.

Eine SCHUFA-Auskunft reiche ich selbstverständlich ein.

Sie erreichen mich unter sina.kraus@example.de oder 0152 4433221.

Viele Grüße
Sina Kraus`;

const NOAH = `Hallo Herr Peters,

ich bin Noah Brandt und schreibe Ihnen wegen der Wohnung in Dachau.

Wir würden zu zweit einziehen, meine Freundin und ich. Haustiere haben wir keine. Ich bin Raucher, würde aber selbstverständlich nur draußen rauchen.

Einziehen würden wir gerne zum 01.12.2026.

Die SCHUFA-Auskunft liegt vor.

Kontakt: noah.brandt@example.de, 0176 8899001

Viele Grüße
Noah Brandt`;

/* ------------------------------------------------------------- Hilfsmittel */

function applicant(
  id: string,
  displayName: string,
  salutation: string,
  source: Applicant['source'],
  receivedAt: string,
  message: string,
  portal: Applicant['portal'] = null,
): Applicant {
  return {
    id,
    displayName,
    salutation,
    source,
    receivedAt,
    message,
    evaluated: false,
    extraction: null,
    inquiry: null,
    reply: null,
    consultation: '',
    consultationAt: null,
    portal,
    portalImported: false,
  };
}

/* ------------------------------------------------------------------ Objekte */

function muenchen(): Property {
  return {
    id: 'muenchen',
    listing: {
      title: 'Wohnung München',
      city: 'München',
      district: 'Innenstadt',
      rooms: 3,
      size: 90,
      rent: 1680,
      extraCosts: 240,
      deposit: 5040,
      moveIn: '01.11.2026',
      highlight: 'Altbau mit Balkon, ruhiger Innenhof, 5 Minuten zum Viktualienmarkt',
      description:
        'Helle 3-Zimmer-Altbauwohnung im Herzen der Münchner Innenstadt. Parkett, hohe Decken, Balkon zum begrünten Innenhof. Nahversorgung und U-Bahn fußläufig.',
      required: ['Kontakt', 'Anzahl Personen', 'Einzugstermin'],
      criteria: {
        petsAllowed: false,
        smokingAllowed: false,
        maxPersons: 4,
        schufaRequired: true,
      },
      publishedTo: [],
      updatedAt: null,
    },
    applicants: [
      applicant('m-anna', 'Anna Weber', 'Frau Weber', 'ImmoScout24', '21.09.2026 · 09:14', ANNA, {
        smoker: false,
        pets: { has: false, kind: null },
        schufa: true,
        employment: 'unbefristet angestellt',
      }),
      applicant('m-ben', 'Ben Keller', 'Herr Keller', 'ImmoScout24', '21.09.2026 · 11:02', BEN, {
        smoker: false,
        pets: { has: false, kind: null },
        schufa: true,
        employment: 'unbefristet angestellt',
      }),
      applicant('m-clara', 'Clara Neumann', 'Frau Neumann', 'Immowelt', '21.09.2026 · 16:38', CLARA),
      applicant('m-david', 'David Fischer', 'Herr Fischer', 'ImmoScout24', '22.09.2026 · 08:05', DAVID, {
        smoker: false,
        pets: { has: false, kind: null },
        schufa: true,
        employment: 'unbefristet angestellt',
      }),
      applicant('m-eva', 'Eva Sommer', 'Frau Sommer', 'E-Mail', '22.09.2026 · 10:47', EVA),
    ],
    viewings: [
      {
        id: 'mv-1',
        applicantId: 'm-anna',
        applicantName: 'Anna Weber',
        date: '25. September 2026',
        time: '17:00',
        status: 'bestaetigt',
      },
      {
        id: 'mv-2',
        applicantId: 'm-david',
        applicantName: 'David Fischer',
        date: '25. September 2026',
        time: '17:30',
        status: 'offen',
      },
      {
        id: 'mv-3',
        applicantId: 'm-eva',
        applicantName: 'Eva Sommer',
        date: '25. September 2026',
        time: '18:00',
        status: 'bestaetigt',
      },
    ],
    evaluatedOnce: false,
    extendedChecked: false,
    selectedApplicantId: null,
    overrideReason: '',
    contract: null,
  };
}

function dachau(): Property {
  return {
    id: 'dachau',
    listing: {
      title: 'Wohnung Dachau',
      city: 'Dachau',
      district: 'Altstadt',
      rooms: 2,
      size: 69,
      rent: 980,
      extraCosts: 170,
      deposit: 2940,
      moveIn: '01.12.2026',
      highlight: 'Sehr gute Lage, S-Bahn in 6 Minuten, Balkon nach Süden',
      description:
        'Gepflegte 2-Zimmer-Wohnung in sehr guter Lage in der Dachauer Altstadt. Süd-Balkon, Einbauküche, Kellerabteil. S-Bahn, Schulen und Einkaufsmöglichkeiten in wenigen Minuten erreichbar.',
      required: ['Kontakt', 'Anzahl Personen', 'Einzugstermin'],
      criteria: {
        petsAllowed: true,
        smokingAllowed: false,
        maxPersons: 2,
        schufaRequired: true,
      },
      publishedTo: [],
      updatedAt: null,
    },
    applicants: [
      applicant('d-jonas', 'Jonas Reiter', 'Herr Reiter', 'ImmoScout24', '20.09.2026 · 14:20', JONAS, {
        smoker: false,
        pets: { has: false, kind: null },
        schufa: true,
        employment: 'unbefristet angestellt',
      }),
      applicant('d-mira', 'Mira Schuster', 'Frau Schuster', 'Kleinanzeigen', '20.09.2026 · 18:55', MIRA),
      applicant('d-tobias', 'Tobias Lang', 'Herr Lang', 'ImmoScout24', '21.09.2026 · 07:40', TOBIAS, {
        smoker: false,
        pets: { has: true, kind: 'Hund' },
        schufa: true,
        employment: 'selbstständig',
      }),
      applicant('d-sina', 'Sina Kraus', 'Frau Kraus', 'Immowelt', '21.09.2026 · 12:11', SINA),
      applicant('d-noah', 'Noah Brandt', 'Herr Brandt', 'ImmoScout24', '22.09.2026 · 09:26', NOAH, {
        smoker: true,
        pets: { has: false, kind: null },
        schufa: true,
        employment: 'unbefristet angestellt',
      }),
    ],
    viewings: [
      {
        id: 'dv-1',
        applicantId: 'd-jonas',
        applicantName: 'Jonas Reiter',
        date: '26. September 2026',
        time: '16:00',
        status: 'bestaetigt',
      },
      {
        id: 'dv-2',
        applicantId: 'd-tobias',
        applicantName: 'Tobias Lang',
        date: '26. September 2026',
        time: '16:30',
        status: 'offen',
      },
    ],
    evaluatedOnce: false,
    extendedChecked: false,
    selectedApplicantId: null,
    overrideReason: '',
    contract: null,
  };
}

export function seedState(): AppState {
  const m = muenchen();
  const d = dachau();
  return {
    version: STATE_VERSION,
    activePropertyId: null,
    propertyOrder: [m.id, d.id],
    properties: { [m.id]: m, [d.id]: d },
    connections: {
      immoscout: false,
      kleinanzeigen: false,
      immowelt: false,
      importedAt: null,
    },
  };
}

export function seedProperty(id: string): Property {
  return id === 'dachau' ? dachau() : muenchen();
}

/** Anzeige-Titel eines Viewings-Tags je Objekt. */
export function defaultViewingDate(propertyId: string): string {
  return propertyId === 'dachau' ? '26. September 2026' : '25. September 2026';
}
