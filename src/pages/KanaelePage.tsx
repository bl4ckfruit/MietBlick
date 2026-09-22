/**
 * Kanäle: Anbindung der Vermietungsportale und Übernahme der dort
 * hinterlegten Bewerberangaben.
 */

import { useState } from 'react';
import { PORTAL_LABEL, useStore } from '../state/store';
import type { PortalId } from '../types';
import { Badge, Card, CardHead, Modal, PageHead } from '../components/ui';
import { IconArrow, IconCheck } from '../components/icons';

interface PortalInfo {
  id: PortalId;
  short: string;
  color: string;
  desc: string;
  fields: string[];
}

const PORTALS: PortalInfo[] = [
  {
    id: 'immoscout',
    short: 'IS',
    color: '#A8322E',
    desc: 'Reichweitenstärkstes Portal. Interessenten füllen dort bereits ein Profil aus.',
    fields: ['Name', 'Kontakt', 'Anzahl Personen', 'Raucher', 'Haustiere', 'SCHUFA-Auskunft', 'Beschäftigung'],
  },
  {
    id: 'kleinanzeigen',
    short: 'KA',
    color: '#3A9F75',
    desc: 'Viele Anfragen, meist sehr kurz und ohne strukturierte Angaben.',
    fields: ['Name', 'Kontakt', 'Nachrichtentext'],
  },
  {
    id: 'immowelt',
    short: 'IW',
    color: '#B57D05',
    desc: 'Zusätzliche Reichweite mit eigenem Nachrichtenformat.',
    fields: ['Name', 'Kontakt', 'Nachrichtentext'],
  },
];

export function KanaelePage() {
  const { state, dispatch, navigate, notify } = useStore();
  const [connecting, setConnecting] = useState<PortalInfo | null>(null);

  const connected = PORTALS.filter((p) => state.connections[p.id]);
  const importable = connected.some((p) => p.fields.includes('SCHUFA-Auskunft'));

  const importData = () => {
    dispatch({ type: 'importPortalData' });
    notify('Profilangaben aus den verbundenen Portalen übernommen.');
  };

  return (
    <div className="page">
      <PageHead
        eyebrow="Kanäle"
        title="Einmal inserieren. Mehrfach sichtbar."
        sub="MietBlick verbindet die Vermietungsportale, spielt das Inserat dorthin aus und führt alle Anfragen in einem Posteingang zusammen."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => navigate('inbox')}>
            Weiter zum Posteingang <IconArrow />
          </button>
        }
      />

      <div className="grid grid-3" style={{ marginTop: 20 }} data-testid="portal-list">
        {PORTALS.map((portal) => {
          const isConnected = state.connections[portal.id];
          return (
            <div className="portal" key={portal.id} data-testid={`portal-${portal.id}`}>
              <div className="row">
                <span className="portal-logo" style={{ background: portal.color }}>
                  {portal.short}
                </span>
                <span className="spacer" />
                {isConnected ? (
                  <Badge tone="green" dot>
                    Verbunden
                  </Badge>
                ) : (
                  <Badge tone="grey" dot>
                    Nicht verbunden
                  </Badge>
                )}
              </div>
              <div className="portal-name">{PORTAL_LABEL[portal.id]}</div>
              <div className="portal-desc">{portal.desc}</div>

              <div className="chips" style={{ marginBottom: 12 }}>
                {portal.fields.slice(0, 4).map((field) => (
                  <span className="chip" key={field}>
                    {field}
                  </span>
                ))}
                {portal.fields.length > 4 && (
                  <span className="chip">+{portal.fields.length - 4} weitere</span>
                )}
              </div>

              {isConnected ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  data-testid={`disconnect-${portal.id}`}
                  onClick={() => {
                    dispatch({ type: 'disconnectPortal', portal: portal.id });
                    notify(`${PORTAL_LABEL[portal.id]} getrennt.`);
                  }}
                >
                  Verbindung trennen
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-navy btn-sm"
                  data-testid={`connect-${portal.id}`}
                  onClick={() => setConnecting(portal)}
                >
                  Mit {PORTAL_LABEL[portal.id]} verbinden
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="divider" />

      <Card>
        <CardHead
          title="Angaben aus den Portalprofilen übernehmen"
          sub="Interessenten haben im Portal bereits Angaben hinterlegt – MietBlick ergänzt damit, was in der Nachricht fehlt."
          right={
            state.connections.importedAt ? (
              <Badge tone="green" dot>
                Übernommen {state.connections.importedAt}
              </Badge>
            ) : (
              <Badge tone="grey" dot>
                Noch nicht übernommen
              </Badge>
            )
          }
        />
        <div className="card-pad">
          <div className="transfer">
            <div className="transfer-side">
              <span className="transfer-title">Im Portal hinterlegt</span>
              <ul className="transfer-list">
                <li>Raucher / Nichtraucher</li>
                <li>Haustiere</li>
                <li>SCHUFA-Auskunft</li>
                <li>Beschäftigungsverhältnis</li>
              </ul>
            </div>
            <div className="transfer-arrow" aria-hidden="true">
              <IconArrow />
            </div>
            <div className="transfer-side">
              <span className="transfer-title">In MietBlick ergänzt</span>
              <ul className="transfer-list">
                <li>Fehlende Zusatzangaben werden gefüllt</li>
                <li>Kriterienabgleich wird vollständig</li>
                <li>Rückfragen werden dadurch kürzer</li>
                <li>Vorhandene Angaben werden nicht überschrieben</li>
              </ul>
            </div>
          </div>

          <div className="row" style={{ marginTop: 18, gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              data-testid="import-data"
              onClick={importData}
              disabled={!importable}
            >
              Profilangaben übernehmen
            </button>
            {!importable && (
              <span className="hint">
                Dafür muss ein Portal verbunden sein, das Profilangaben liefert (ImmoScout24).
              </span>
            )}
          </div>
        </div>
      </Card>


      {connecting && (
        <Modal
          title={`${PORTAL_LABEL[connecting.id]} verbinden`}
          sub="Wählen Sie das Portal aus, das Sie mit MietBlick verbinden möchten."
          width={560}
          onClose={() => setConnecting(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-primary"
                data-testid="confirm-connect"
                onClick={() => {
                  dispatch({ type: 'connectPortal', portal: connecting.id });
                  notify(`${PORTAL_LABEL[connecting.id]} verbunden.`);
                  setConnecting(null);
                }}
              >
                Verbindung herstellen
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConnecting(null)}>
                Abbrechen
              </button>
            </>
          }
        >
          <div className="connect-account">
            <span className="avatar">FP</span>
            <span className="user-text">
              <span className="user-name" style={{ color: 'var(--navy)' }}>
                Franz Peters
              </span>
              <span className="user-role" style={{ color: 'var(--muted)' }}>
                Privater Vermieter · München
              </span>
            </span>
          </div>

          <div className="section-title" style={{ marginTop: 18 }}>
            MietBlick würde dabei lesen
          </div>
          <ul className="check-list">
            {connecting.fields.map((field) => (
              <li key={field}>
                <span className="check-icon">
                  <IconCheck />
                </span>
                {field}
              </li>
            ))}
          </ul>

        </Modal>
      )}
    </div>
  );
}
