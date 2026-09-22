/**
 * Lokale Persistenz. Bewusst ohne Server: der Zustand liegt im localStorage
 * des Browsers und übersteht Seitenwechsel und Reload.
 */

import type { AppState } from '../types';
import { STATE_VERSION, seedState } from '../data/seed';

const KEY = 'mietblick.state.v2';

export function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as AppState;
    if (
      !parsed ||
      parsed.version !== STATE_VERSION ||
      !parsed.properties ||
      !Array.isArray(parsed.propertyOrder)
    ) {
      return seedState();
    }
    const fresh = seedState();
    const properties = Object.fromEntries(
      Object.entries(parsed.properties).map(([id, property]) => [
        id,
        {
          ...property,
          listing: {
            ...property.listing,
            images: Array.isArray(property.listing.images) ? property.listing.images : [],
          },
        },
      ]),
    );
    return {
      ...fresh,
      ...parsed,
      properties: { ...fresh.properties, ...properties },
      connections: { ...fresh.connections, ...parsed.connections },
    };
  } catch {
    // Privater Modus oder blockierter Speicher: App bleibt trotzdem nutzbar.
    return seedState();
  }
}

export function saveState(state: AppState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Speichern nicht möglich – die App bleibt trotzdem bedienbar. */
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nichts zu tun */
  }
}

/** Meldet, ob der Browser lokale Persistenz erlaubt. */
export function storageAvailable(): boolean {
  try {
    const probe = '__mietblick_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
