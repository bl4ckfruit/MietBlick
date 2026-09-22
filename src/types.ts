/** Zentrale Typen des MietBlick-MVP. */

export type Route =
  | 'start'
  | 'wohnungen'
  | 'objekt'
  | 'inserat'
  | 'kanaele'
  | 'inbox'
  | 'bewerber'
  | 'nachrichten'
  | 'besichtigungen'
  | 'entscheidung'
  | 'vertrag';

export type PortalId = 'immoscout' | 'kleinanzeigen' | 'immowelt';

export type Source = 'ImmoScout24' | 'Kleinanzeigen' | 'Immowelt' | 'E-Mail' | 'Manuell erfasst';

/* ------------------------------------------------------------------ Objekt */

/**
 * Vermietungskriterien eines Objekts.
 *
 * Bewusst nur objektbezogene, sachliche Kriterien: was die Wohnung hergibt
 * (Belegung nach Zimmerzahl) und was im Mietvertrag geregelt wird
 * (Haustiere, Rauchen, Bonitätsnachweis). Keine persönlichen Merkmale.
 */
export interface Criteria {
  petsAllowed: boolean;
  smokingAllowed: boolean;
  maxPersons: number;
  schufaRequired: boolean;
}

export type RequiredField =
  | 'Kontakt'
  | 'Anzahl Personen'
  | 'Einzugstermin'
  | 'Raucher'
  | 'Haustiere'
  | 'SCHUFA';

export interface Listing {
  title: string;
  city: string;
  district: string;
  rooms: number;
  size: number;
  rent: number;
  extraCosts: number;
  deposit: number;
  /** Einziger gepflegter Einzugstermin – wird überall daraus gelesen. */
  moveIn: string;
  highlight: string;
  description: string;
  required: RequiredField[];
  criteria: Criteria;
  publishedTo: PortalId[];
  updatedAt: string | null;
}

/* -------------------------------------------------------------- Auswertung */

export interface MoveInCandidate {
  raw: string;
  label: string;
  key: string;
}

export interface PetInfo {
  has: boolean;
  kind: string | null;
}

export type ExtractionState = 'vollstaendig' | 'klaerung';

export interface Extraction {
  name: string | null;
  contact: string | null;
  contactKind: 'E-Mail' | 'Telefon' | 'E-Mail & Telefon' | null;
  persons: number | null;
  personsEvidence: string | null;
  moveIn: string | null;
  moveInCandidates: MoveInCandidate[];
  /** Zusatzangaben – werden über „Mehr Angaben prüfen" ausgewertet. */
  smoker: boolean | null;
  pets: PetInfo | null;
  schufa: boolean | null;
  missing: RequiredField[];
  missingExtra: RequiredField[];
  conflicts: string[];
  state: ExtractionState;
  statusLabel: string;
  nextStep: string;
}

export type CheckState = 'erfuellt' | 'nicht_erfuellt' | 'offen';

export interface CriteriaCheck {
  key: 'pets' | 'smoking' | 'persons' | 'schufa';
  label: string;
  state: CheckState;
  detail: string;
}

export interface CriteriaResult {
  checks: CriteriaCheck[];
  state: CheckState;
  summary: string;
}

/* ---------------------------------------------------------------- Bewerber */

export type DraftKind = 'rueckfrage' | 'zusage' | 'absage';

export interface Draft {
  kind: DraftKind;
  text: string;
  released: boolean;
  releasedAt: string | null;
  edited: boolean;
}

/** Vom Portal übernommene Angaben – erst nach verbundener Schnittstelle verfügbar. */
export interface PortalProfile {
  smoker: boolean | null;
  pets: PetInfo | null;
  schufa: boolean | null;
  employment: string | null;
}

export interface Applicant {
  id: string;
  displayName: string;
  salutation: string | null;
  message: string;
  source: Source;
  receivedAt: string;
  evaluated: boolean;
  extraction: Extraction | null;
  inquiry: Draft | null;
  reply: Draft | null;
  /** Notiz aus einer Rücksprache mit dem Interessenten. */
  consultation: string;
  consultationAt: string | null;
  /** Im Portal hinterlegte Zusatzangaben (nur nach Datenübernahme sichtbar). */
  portal: PortalProfile | null;
  portalImported: boolean;
}

/* ------------------------------------------------------------ Besichtigung */

export type ViewingStatus = 'bestaetigt' | 'offen' | 'abgesagt';

export interface Viewing {
  id: string;
  applicantId: string | null;
  applicantName: string;
  date: string;
  time: string;
  status: ViewingStatus;
}

/* ---------------------------------------------------------------- Vertrag */

export interface Contract {
  text: string;
  edited: boolean;
  generatedAt: string | null;
  applicantId: string | null;
}

/* ------------------------------------------------------------------ State */

export interface Property {
  id: string;
  listing: Listing;
  applicants: Applicant[];
  viewings: Viewing[];
  evaluatedOnce: boolean;
  /** Wurde „Mehr Angaben prüfen" ausgeführt? */
  extendedChecked: boolean;
  selectedApplicantId: string | null;
  /** Begründung, wenn die Auswahl der Kriterienprüfung widerspricht. */
  overrideReason: string;
  contract: Contract | null;
}

export interface Connections {
  immoscout: boolean;
  kleinanzeigen: boolean;
  immowelt: boolean;
  importedAt: string | null;
}

export interface AppState {
  version: number;
  activePropertyId: string | null;
  propertyOrder: string[];
  properties: Record<string, Property>;
  connections: Connections;
}
