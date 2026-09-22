/**
 * Zentraler App-Zustand: Objekte, Inserate, Bewerbungen, Auswertung,
 * Entwürfe, Termine, Entscheidung und Mietvertrag.
 * Jede Änderung wird sofort lokal gespeichert.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppState,
  Applicant,
  Draft,
  Listing,
  PortalId,
  Property,
  Route,
  Source,
  ViewingStatus,
} from '../types';
import { extract } from '../lib/extract';
import {
  buildAcceptanceDraft,
  buildInquiryDraft,
  buildRejectionDraft,
  needsInquiry,
} from '../lib/drafts';
import { buildContract } from '../lib/contract';
import { evaluateCriteria } from '../lib/criteria';
import { clearState, loadState, saveState } from '../lib/storage';
import { defaultViewingDate, seedProperty, seedState } from '../data/seed';

type Action =
  | { type: 'selectProperty'; id: string | null }
  | { type: 'createProperty' }
  | { type: 'updateListing'; listing: Listing }
  | { type: 'publish'; portals: PortalId[] }
  | { type: 'connectPortal'; portal: PortalId }
  | { type: 'disconnectPortal'; portal: PortalId }
  | { type: 'importPortalData' }
  | { type: 'evaluateAll' }
  | { type: 'checkExtended' }
  | { type: 'addApplicant'; message: string; source: Source }
  | { type: 'prepareInquiry'; id: string }
  | { type: 'updateInquiry'; id: string; text: string }
  | { type: 'releaseInquiry'; id: string }
  | { type: 'setConsultation'; id: string; text: string }
  | { type: 'updateReply'; id: string; text: string }
  | { type: 'releaseReply'; id: string }
  | { type: 'selectApplicant'; id: string; reason: string }
  | { type: 'clearSelection' }
  | { type: 'setViewingStatus'; id: string; status: ViewingStatus }
  | { type: 'addViewing'; applicantId: string; time: string }
  | { type: 'generateContract' }
  | { type: 'updateContract'; text: string }
  | { type: 'resetProperty' }
  | { type: 'reset' };

function timestamp(): string {
  const now = new Date();
  const two = (n: number) => String(n).padStart(2, '0');
  return `${two(now.getDate())}.${two(now.getMonth() + 1)}.${now.getFullYear()} · ${two(now.getHours())}:${two(now.getMinutes())}`;
}

const PORTAL_SOURCE: Record<PortalId, Source> = {
  immoscout: 'ImmoScout24',
  kleinanzeigen: 'Kleinanzeigen',
  immowelt: 'Immowelt',
};

export const PORTAL_LABEL: Record<PortalId, string> = {
  immoscout: 'ImmoScout24',
  kleinanzeigen: 'Kleinanzeigen',
  immowelt: 'Immowelt',
};

/** Wertet eine Bewerbung aus und legt – falls nötig – einen Rückfrage-Entwurf an. */
function evaluateApplicant(
  applicant: Applicant,
  listing: Listing,
  includeExtra: boolean,
): Applicant {
  const extraction = extract(applicant.message, applicant.displayName, listing.required);
  const evaluated: Applicant = {
    ...applicant,
    evaluated: true,
    extraction,
    displayName: extraction.name ?? applicant.displayName,
  };

  // Bearbeitete oder freigegebene Entwürfe bleiben unangetastet.
  const locked = evaluated.inquiry && (evaluated.inquiry.edited || evaluated.inquiry.released);
  if (!locked) {
    evaluated.inquiry = needsInquiry(evaluated, includeExtra)
      ? buildInquiryDraft(evaluated, includeExtra)
      : null;
  }

  return evaluated;
}

/**
 * Übernimmt die im Portal hinterlegten Zusatzangaben in die Auswertung.
 *
 * Wird die Übernahme ausgelöst, bevor die Bewerbungen ausgewertet sind, bleibt
 * die Markierung trotzdem gesetzt – die Angaben fließen dann bei der Auswertung
 * ein. Sonst ginge die Übernahme für dieses Objekt stillschweigend verloren.
 */
function applyPortalData(applicant: Applicant): Applicant {
  if (!applicant.portal) return applicant;
  if (!applicant.extraction) return { ...applicant, portalImported: true };
  const ex = applicant.extraction;
  const portal = applicant.portal;

  const smoker = ex.smoker ?? portal.smoker;
  const pets = ex.pets ?? portal.pets;
  const schufa = ex.schufa ?? portal.schufa;
  if (smoker === ex.smoker && pets === ex.pets && schufa === ex.schufa) {
    return { ...applicant, portalImported: true };
  }

  const missingExtra = ex.missingExtra.filter((field) => {
    if (field === 'Raucher') return smoker === null;
    if (field === 'Haustiere') return pets === null;
    return schufa === null;
  });

  return {
    ...applicant,
    portalImported: true,
    extraction: { ...ex, smoker, pets, schufa, missingExtra },
  };
}

function nextViewingTime(existing: string[], propertyId: string): string {
  const used = new Set(existing);
  const startHour = propertyId === 'dachau' ? 16 : 17;
  for (let hour = startHour; hour <= startHour + 4; hour += 1) {
    for (const minute of ['00', '30']) {
      const candidate = `${hour}:${minute}`;
      if (!used.has(candidate)) return candidate;
    }
  }
  return `${startHour + 4}:30`;
}

/** Wendet eine Änderung auf das gerade aktive Objekt an. */
function withActive(state: AppState, update: (property: Property) => Property): AppState {
  const id = state.activePropertyId;
  if (!id || !state.properties[id]) return state;
  return {
    ...state,
    properties: { ...state.properties, [id]: update(state.properties[id]) },
  };
}

function mapApplicants(
  property: Property,
  update: (applicant: Applicant) => Applicant,
): Property {
  return { ...property, applicants: property.applicants.map(update) };
}

function createEmptyProperty(): Property {
  const id = `wohnung-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    listing: {
      title: 'Neue Wohnung',
      city: '',
      district: '',
      rooms: 1,
      size: 1,
      rent: 0,
      extraCosts: 0,
      deposit: 0,
      moveIn: '',
      highlight: '',
      description: '',
      images: [],
      required: ['Kontakt', 'Anzahl Personen', 'Einzugstermin'],
      criteria: {
        petsAllowed: false,
        smokingAllowed: false,
        maxPersons: 1,
        schufaRequired: true,
      },
      publishedTo: [],
      updatedAt: null,
    },
    applicants: [],
    viewings: [],
    evaluatedOnce: false,
    extendedChecked: false,
    selectedApplicantId: null,
    overrideReason: '',
    contract: null,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'selectProperty':
      return { ...state, activePropertyId: action.id };

    case 'createProperty': {
      const property = createEmptyProperty();
      return {
        ...state,
        activePropertyId: property.id,
        propertyOrder: [...state.propertyOrder, property.id],
        properties: { ...state.properties, [property.id]: property },
      };
    }

    case 'updateListing':
      return withActive(state, (property) => {
        const listing = { ...action.listing, updatedAt: timestamp() };
        if (!property.evaluatedOnce) return { ...property, listing };
        // Pflichtangaben oder Kriterien geändert -> neu auswerten.
        return {
          ...property,
          listing,
          applicants: property.applicants.map((a) =>
            a.evaluated ? applyPortalDataIfImported(evaluateApplicant(a, listing, property.extendedChecked)) : a,
          ),
        };
      });

    case 'publish':
      return withActive(state, (property) => ({
        ...property,
        listing: { ...property.listing, publishedTo: action.portals, updatedAt: timestamp() },
      }));

    case 'connectPortal':
      return { ...state, connections: { ...state.connections, [action.portal]: true } };

    case 'disconnectPortal':
      return { ...state, connections: { ...state.connections, [action.portal]: false } };

    case 'importPortalData': {
      const connected = (Object.keys(PORTAL_SOURCE) as PortalId[]).filter(
        (portal) => state.connections[portal],
      );
      const sources = new Set(connected.map((portal) => PORTAL_SOURCE[portal]));
      const properties: Record<string, Property> = {};
      for (const [id, property] of Object.entries(state.properties)) {
        properties[id] = mapApplicants(property, (applicant) =>
          sources.has(applicant.source) ? applyPortalData(applicant) : applicant,
        );
      }
      return {
        ...state,
        properties,
        connections: { ...state.connections, importedAt: timestamp() },
      };
    }

    case 'evaluateAll':
      return withActive(state, (property) => ({
        ...property,
        evaluatedOnce: true,
        applicants: property.applicants.map((a) =>
          applyPortalDataIfImported(
            evaluateApplicant(a, property.listing, property.extendedChecked),
          ),
        ),
      }));

    case 'checkExtended':
      return withActive(state, (property) => ({
        ...property,
        evaluatedOnce: true,
        extendedChecked: true,
        applicants: property.applicants.map((a) =>
          applyPortalDataIfImported(evaluateApplicant(a, property.listing, true)),
        ),
      }));

    case 'addApplicant':
      return withActive(state, (property) => {
        const id = `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const preview = extract(action.message, undefined, property.listing.required);
        const fresh: Applicant = {
          id,
          displayName: preview.name ?? 'Unbekannter Absender',
          salutation: null,
          message: action.message,
          source: action.source,
          receivedAt: timestamp(),
          evaluated: false,
          extraction: null,
          inquiry: null,
          reply: null,
          consultation: '',
          consultationAt: null,
          portal: null,
          portalImported: false,
        };
        const prepared = property.evaluatedOnce
          ? evaluateApplicant(fresh, property.listing, property.extendedChecked)
          : fresh;
        return { ...property, applicants: [...property.applicants, prepared] };
      });

    case 'prepareInquiry':
      return withActive(state, (property) =>
        mapApplicants(property, (a) =>
          a.id === action.id && a.extraction && !a.inquiry
            ? { ...a, inquiry: buildInquiryDraft(a, property.extendedChecked) }
            : a,
        ),
      );

    case 'updateInquiry':
      return withActive(state, (property) =>
        mapApplicants(property, (a) =>
          a.id === action.id && a.inquiry
            ? { ...a, inquiry: { ...a.inquiry, text: action.text, edited: true } }
            : a,
        ),
      );

    case 'releaseInquiry':
      return withActive(state, (property) =>
        mapApplicants(property, (a) =>
          a.id === action.id && a.inquiry
            ? { ...a, inquiry: { ...a.inquiry, released: true, releasedAt: timestamp() } }
            : a,
        ),
      );

    case 'setConsultation':
      return withActive(state, (property) =>
        mapApplicants(property, (a) =>
          a.id === action.id
            ? {
                ...a,
                consultation: action.text,
                consultationAt: action.text.trim() ? timestamp() : null,
              }
            : a,
        ),
      );

    case 'selectApplicant':
      return withActive(state, (property) => ({
        ...property,
        selectedApplicantId: action.id,
        overrideReason: action.reason,
        applicants: property.applicants.map((a) => {
          if (!a.evaluated) return a;
          const existing = a.reply;
          const locked = existing && (existing.edited || existing.released);
          const draft: Draft = locked
            ? existing
            : a.id === action.id
              ? buildAcceptanceDraft(a, property.listing)
              : buildRejectionDraft(a);
          return { ...a, reply: draft };
        }),
      }));

    case 'clearSelection':
      return withActive(state, (property) => ({
        ...property,
        selectedApplicantId: null,
        overrideReason: '',
        contract: null,
        applicants: property.applicants.map((a) =>
          a.reply && a.reply.released ? a : { ...a, reply: null },
        ),
      }));

    case 'updateReply':
      return withActive(state, (property) =>
        mapApplicants(property, (a) =>
          a.id === action.id && a.reply
            ? { ...a, reply: { ...a.reply, text: action.text, edited: true } }
            : a,
        ),
      );

    case 'releaseReply':
      return withActive(state, (property) =>
        mapApplicants(property, (a) =>
          a.id === action.id && a.reply
            ? { ...a, reply: { ...a.reply, released: true, releasedAt: timestamp() } }
            : a,
        ),
      );

    case 'setViewingStatus':
      return withActive(state, (property) => ({
        ...property,
        viewings: property.viewings.map((v) =>
          v.id === action.id ? { ...v, status: action.status } : v,
        ),
      }));

    case 'addViewing':
      return withActive(state, (property) => {
        const applicant = property.applicants.find((a) => a.id === action.applicantId);
        if (!applicant) return property;
        if (property.viewings.some((v) => v.applicantId === action.applicantId)) return property;
        const time =
          action.time || nextViewingTime(property.viewings.map((v) => v.time), property.id);
        const viewing = {
          id: `v-${Date.now().toString(36)}`,
          applicantId: applicant.id,
          applicantName: applicant.displayName,
          date: defaultViewingDate(property.id),
          time,
          status: 'offen' as ViewingStatus,
        };
        return {
          ...property,
          viewings: [...property.viewings, viewing].sort((a, b) => a.time.localeCompare(b.time)),
        };
      });

    case 'generateContract':
      return withActive(state, (property) => {
        const applicant = property.applicants.find(
          (a) => a.id === property.selectedApplicantId,
        );
        if (!applicant) return property;
        return {
          ...property,
          contract: {
            text: buildContract(property.listing, applicant),
            edited: false,
            generatedAt: timestamp(),
            applicantId: applicant.id,
          },
        };
      });

    case 'updateContract':
      return withActive(state, (property) =>
        property.contract
          ? { ...property, contract: { ...property.contract, text: action.text, edited: true } }
          : property,
      );

    case 'resetProperty':
      return withActive(state, (property) => seedProperty(property.id));

    case 'reset':
      clearState();
      return seedState();

    default:
      return state;
  }
}

/** Nach einer Neuauswertung die bereits übernommenen Portaldaten wieder anwenden. */
function applyPortalDataIfImported(applicant: Applicant): Applicant {
  return applicant.portalImported ? applyPortalData(applicant) : applicant;
}

/* --------------------------------------------------------------- Context */

export interface Toast {
  id: number;
  message: string;
}

interface StoreValue {
  state: AppState;
  dispatch: (action: Action) => void;
  property: Property | null;
  route: Route;
  navigate: (route: Route) => void;
  toasts: Toast[];
  notify: (message: string) => void;
  dismissToast: (id: number) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const ROUTES: Route[] = [
  'start',
  'wohnungen',
  'objekt',
  'inserat',
  'kanaele',
  'inbox',
  'bewerber',
  'nachrichten',
  'besichtigungen',
  'entscheidung',
  'vertrag',
];

function routeFromHash(): Route {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return (ROUTES as string[]).includes(hash) ? (hash as Route) : 'start';
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = `/${next}`;
    setRoute(next);
    const main = document.querySelector('.app-main');
    if (main) main.scrollTop = 0;
    window.scrollTo({ top: 0 });
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-1), { id, message }]);
      window.setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast],
  );

  const property = state.activePropertyId
    ? (state.properties[state.activePropertyId] ?? null)
    : null;

  const value = useMemo<StoreValue>(
    () => ({ state, dispatch, property, route, navigate, toasts, notify, dismissToast }),
    [state, property, route, navigate, toasts, notify, dismissToast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore muss innerhalb des StoreProvider verwendet werden.');
  return ctx;
}

/** Das aktive Objekt – für Seiten, die ohne Objekt gar nicht sinnvoll sind. */
export function useProperty(): Property {
  const { property } = useStore();
  if (!property) throw new Error('Kein Objekt ausgewählt.');
  return property;
}

export interface Counts {
  total: number;
  evaluated: number;
  complete: number;
  open: number;
  pending: number;
  criteriaOk: number;
  criteriaOpen: number;
  criteriaFail: number;
  viewingsConfirmed: number;
  decided: number;
}

export function countsFor(property: Property): Counts {
  const evaluated = property.applicants.filter((a) => a.evaluated);
  const results = evaluated.map((a) => evaluateCriteria(a.extraction, property.listing.criteria));
  return {
    total: property.applicants.length,
    evaluated: evaluated.length,
    complete: evaluated.filter((a) => a.extraction?.state === 'vollstaendig').length,
    open: evaluated.filter((a) => a.extraction?.state === 'klaerung').length,
    pending: property.applicants.filter((a) => !a.evaluated).length,
    criteriaOk: results.filter((r) => r.state === 'erfuellt').length,
    criteriaOpen: results.filter((r) => r.state === 'offen').length,
    criteriaFail: results.filter((r) => r.state === 'nicht_erfuellt').length,
    viewingsConfirmed: property.viewings.filter((v) => v.status === 'bestaetigt').length,
    decided: property.selectedApplicantId ? 1 : 0,
  };
}

export function useCounts(): Counts {
  const property = useProperty();
  return countsFor(property);
}
