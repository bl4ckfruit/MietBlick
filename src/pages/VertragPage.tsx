/**
 * Mietvertrag: Entwurf aus Objektdaten und den Angaben der ausgewählten Person.
 * Editierbar, speicherbar und druckbar – bleibt bewusst ein Entwurf.
 */

import { useProperty, useStore } from '../state/store';
import { criteriaSummary } from '../lib/criteria';
import { personsLabel } from '../lib/extract';
import { Badge, Banner, Card, CardHead, Empty, Fact, PageHead } from '../components/ui';
import { IconArrow } from '../components/icons';

/**
 * Dateiname ohne Umlaute und Sonderzeichen.
 * Chromium verwirft den gewünschten Namen sonst und speichert nur „download".
 */
function safeFilename(name: string): string {
  const map: Record<string, string> = {
    ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss',
  };
  return name
    .replace(/[äöüÄÖÜß]/g, (c) => map[c])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  // Link und Blob erst später aufräumen – sonst verliert der Browser
  // gelegentlich den gewünschten Dateinamen.
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 2000);
}

export function VertragPage() {
  const { dispatch, navigate, notify } = useStore();
  const property = useProperty();
  const chosen = property.applicants.find((a) => a.id === property.selectedApplicantId) ?? null;
  const contract = property.contract;
  const l = property.listing;

  if (!chosen) {
    return (
      <div className="page">
        <PageHead
          eyebrow="Mietvertrag"
          title="Erst die Entscheidung, dann der Vertrag"
          sub="Sobald Sie eine Bewerbung ausgewählt haben, erzeugt MietBlick daraus einen Mietvertragsentwurf."
        />
        <Card>
          <Empty title="Noch keine Auswahl getroffen">
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 14 }}
              data-testid="goto-decision"
              onClick={() => navigate('entscheidung')}
            >
              Zur Entscheidung <IconArrow />
            </button>
          </Empty>
        </Card>
      </div>
    );
  }

  const ex = chosen.extraction;
  const filename = safeFilename(`Mietvertrag_${l.city}_${chosen.displayName}.txt`);

  return (
    <div className="page">
      <PageHead
        eyebrow="Mietvertrag"
        title="Vertragsentwurf für die Vermietung"
        sub={`Aus den Angaben von ${chosen.displayName} und den Daten zu ${l.title}. Der Entwurf bleibt vollständig bearbeitbar.`}
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('entscheidung')}
            >
              Zurück zur Entscheidung
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-testid="generate-contract"
              onClick={() => {
                dispatch({ type: 'generateContract' });
                notify('Mietvertragsentwurf erzeugt.');
              }}
            >
              {contract ? 'Neu aus den Daten erzeugen' : 'Mietvertrag erzeugen'}
            </button>
          </>
        }
      />

      <div className="grid grid-2">
        <Card>
          <CardHead
            title="Übernommene Daten"
            sub="Was aus dem Prozess in den Vertrag fließt."
            right={
              <Badge tone="green" dot>
                Von Franz ausgewählt
              </Badge>
            }
          />
          <div className="card-pad">
            <div className="facts">
              <Fact label="Mieter" value={ex?.name ?? chosen.displayName} />
              <Fact label="Kontakt" value={ex?.contact ?? 'noch offen'} missing={!ex?.contact} />
              <Fact
                label="Personen"
                value={ex?.persons != null ? personsLabel(ex.persons) : 'noch offen'}
                missing={ex?.persons == null}
              />
              <Fact
                label="Mietbeginn"
                value={ex?.moveIn ?? `${l.moveIn} (aus dem Inserat)`}
                missing={!ex?.moveIn}
              />
              <Fact label="Objekt" value={`${l.city} · ${l.district} · ${l.size} m²`} />
              <Fact
                label="Miete"
                value={`${l.rent.toLocaleString('de-DE')} € + ${l.extraCosts} € NK`}
              />
              <Fact label="Kaution" value={`${l.deposit.toLocaleString('de-DE')} €`} />
              <Fact
                label="SCHUFA"
                value={ex?.schufa ? 'liegt vor' : 'vor Unterzeichnung vorzulegen'}
                missing={!ex?.schufa}
              />
            </div>

            <div className="chips" style={{ marginTop: 16 }}>
              {criteriaSummary(l.criteria).map((c) => (
                <span className="chip" key={c}>
                  {c}
                </span>
              ))}
            </div>

            {chosen.consultation.trim() && (
              <div className="note note-navy" style={{ marginTop: 16 }}>
                <span className="note-title">Aus der Rücksprache übernommen</span>
                {chosen.consultation}
              </div>
            )}

            {property.overrideReason.trim() && (
              <div className="note note-amber" style={{ marginTop: 16 }}>
                <span className="note-title">Hinweis zur Auswahl</span>
                {property.overrideReason}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHead
            title="Vertragsentwurf"
            sub={
              contract
                ? `Erzeugt ${contract.generatedAt}${contract.edited ? ' · von Ihnen bearbeitet' : ''}`
                : 'Noch nicht erzeugt'
            }
            right={
              contract ? (
                <Badge tone="grey" dot>
                  Entwurf
                </Badge>
              ) : undefined
            }
          />
          <div className="card-pad">
            {contract ? (
              <>
                <textarea
                  className="contract-text"
                  data-testid="contract-text"
                  value={contract.text}
                  onChange={(event) =>
                    dispatch({ type: 'updateContract', text: event.target.value })
                  }
                />
                <div className="row" style={{ marginTop: 12, gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    data-testid="download-contract"
                    onClick={() => {
                      download(filename, contract.text);
                      notify('Mietvertrag als Datei gespeichert.');
                    }}
                  >
                    Als Datei speichern
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      navigator.clipboard
                        ?.writeText(contract.text)
                        .then(() => notify('Vertragstext kopiert.'))
                        .catch(() => notify('Kopieren war hier nicht möglich.'));
                    }}
                  >
                    Text kopieren
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => window.print()}
                  >
                    Drucken
                  </button>
                </div>
              </>
            ) : (
              <Empty title="Noch kein Entwurf erzeugt">
                <p style={{ marginBottom: 16 }}>
                  MietBlick setzt den Vertrag aus dem Inserat, den Kriterien und den Angaben von{' '}
                  {chosen.displayName} zusammen.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    dispatch({ type: 'generateContract' });
                    notify('Mietvertragsentwurf erzeugt.');
                  }}
                >
                  Mietvertrag erzeugen
                </button>
              </Empty>
            )}
          </div>
        </Card>
      </div>

      <div className="divider" />

      <Banner tone="amber" icon="📄">
        <strong>Entwurf, kein fertiger Vertrag.</strong> MietBlick füllt zusammen, was im Prozess
        bekannt ist, und markiert offene Punkte sichtbar. Vor der Unterschrift gehört der Text
        geprüft und ergänzt – eine Rechtsberatung ersetzt er nicht.
      </Banner>
    </div>
  );
}
