/**
 * Nachrichten – alle vorbereiteten Entwürfe an einem Ort.
 * Bearbeiten und freigeben; verschickt wird im MVP nichts.
 */

import { useProperty, useStore } from '../state/store';
import { DraftEditor } from '../components/DraftEditor';
import { Badge, Banner, Card, CardHead, Empty, PageHead, Stat } from '../components/ui';
import { IconArrow } from '../components/icons';

export function NachrichtenPage() {
  const { navigate } = useStore();
  const property = useProperty();

  const inquiries = property.applicants.filter((a) => a.inquiry);
  const replies = property.applicants.filter((a) => a.reply);

  const totalDrafts = inquiries.length + replies.length;
  const totalReleased =
    inquiries.filter((a) => a.inquiry?.released).length +
    replies.filter((a) => a.reply?.released).length;

  return (
    <div className="page">
      <PageHead
        eyebrow="Nachrichten"
        title="Entwürfe prüfen und freigeben"
        sub="MietBlick formuliert vor, Sie entscheiden über jeden Text. Nichts wird automatisch verschickt."
        actions={
          <button type="button" className="btn btn-ghost" onClick={() => navigate('bewerber')}>
            Zurück zu den Bewerbern
          </button>
        }
      />

      <div className="stat-row" style={{ marginBottom: 20 }}>
        <Stat value={totalDrafts} label="Entwürfe vorbereitet" />
        <Stat value={totalReleased} label="freigegeben" tone="green" />
        <Stat
          value={totalDrafts - totalReleased}
          label="warten auf Ihre Prüfung"
          tone={totalDrafts - totalReleased > 0 ? 'amber' : undefined}
        />
      </div>

      <Banner tone="soft" icon="✉️">
        <strong>Freigabe statt Versand.</strong> In diesem MVP hält die Freigabe fest, dass Sie den
        Text geprüft haben. Ein echter E-Mail-Versand ist bewusst nicht enthalten.
      </Banner>

      {totalDrafts === 0 ? (
        <Card style={{ marginTop: 20 }}>
          <Empty title="Noch keine Entwürfe">
            <p style={{ marginBottom: 18 }}>
              Sobald eine Bewerbung Klärungsbedarf hat, bereitet MietBlick hier automatisch eine
              Rückfrage vor.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('inbox')}>
              Bewerbungen auswerten <IconArrow />
            </button>
          </Empty>
        </Card>
      ) : (
        <div className="stack" style={{ marginTop: 20 }}>
          {inquiries.length > 0 && (
            <Card>
              <CardHead
                title="Rückfragen"
                sub="Zu Bewerbungen mit fehlenden Angaben oder Widersprüchen."
                right={<Badge tone="grey">{inquiries.length}</Badge>}
              />
              <div className="card-pad stack">
                {inquiries.map((applicant) => (
                  <div key={applicant.id}>
                    <div className="row" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <span className="draft-name">{applicant.displayName}</span>
                      <Badge tone="outline">{applicant.source}</Badge>
                      <span className="spacer" />
                      <span className="hint">{applicant.extraction?.nextStep}</span>
                    </div>
                    <DraftEditor applicant={applicant} draft={applicant.inquiry!} kind="inquiry" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {replies.length > 0 && (
            <Card>
              <CardHead
                title="Zusage und Absagen"
                sub="Entstehen im Schritt „Entscheidung“ – ebenfalls nur als Entwurf."
                right={<Badge tone="grey">{replies.length}</Badge>}
              />
              <div className="card-pad stack">
                {replies.map((applicant) => (
                  <div key={applicant.id}>
                    <div className="row" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <span className="draft-name">{applicant.displayName}</span>
                      <Badge tone={applicant.reply!.kind === 'zusage' ? 'green' : 'grey'}>
                        {applicant.reply!.kind === 'zusage' ? 'Zusage' : 'Absage'}
                      </Badge>
                      <span className="spacer" />
                    </div>
                    <DraftEditor
                      applicant={applicant}
                      draft={applicant.reply!}
                      kind="reply"
                      releaseLabel={
                        applicant.reply!.kind === 'zusage' ? 'Zusage freigeben' : 'Absage freigeben'
                      }
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {totalReleased > 0 && (
        <p className="hint" style={{ marginTop: 18 }}>
          Freigegebene Texte bleiben unverändert erhalten – auch nach einem Reload.
        </p>
      )}
    </div>
  );
}
