/**
 * Inserat bearbeiten.
 *
 * Alle Angaben stehen genau einmal – der Einzugstermin wird hier gepflegt und
 * überall daraus gelesen, damit er nicht an zwei Stellen abweichen kann.
 * Änderungen an Pflichtangaben oder Kriterien lösen eine Neuauswertung aus.
 */

import { useEffect, useState } from 'react';
import { useProperty, useStore, PORTAL_LABEL } from '../state/store';
import type { Listing, PortalId, RequiredField } from '../types';
import { EXTRA_FIELDS } from '../lib/extract';
import { Badge, Banner, Card, CardHead, PageHead } from '../components/ui';
import { IconArrow } from '../components/icons';

const PORTALS: PortalId[] = ['immoscout', 'kleinanzeigen', 'immowelt'];
const MAX_IMAGES = 8;
const MAX_IMAGE_EDGE = 1400;

async function compressImage(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'));
    img.src = source;
  });

  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return source;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.78);
}

export function InseratPage() {
  const { dispatch, navigate, notify, state } = useStore();
  const property = useProperty();
  const [form, setForm] = useState<Listing>(property.listing);
  const [dirty, setDirty] = useState(false);

  // Beim Objektwechsel das Formular neu laden.
  useEffect(() => {
    setForm(property.listing);
    setDirty(false);
  }, [property.id, property.listing]);

  const set = <K extends keyof Listing>(key: K, value: Listing[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const setCriteria = <K extends keyof Listing['criteria']>(
    key: K,
    value: Listing['criteria'][K],
  ) => {
    setForm((current) => ({ ...current, criteria: { ...current.criteria, [key]: value } }));
    setDirty(true);
  };

  const toggleRequired = (field: RequiredField) => {
    setForm((current) => {
      const has = current.required.includes(field);
      return {
        ...current,
        required: has
          ? current.required.filter((f) => f !== field)
          : [...current.required, field],
      };
    });
    setDirty(true);
  };

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = Math.max(0, MAX_IMAGES - form.images.length);
    if (remaining === 0) {
      notify(`Es können maximal ${MAX_IMAGES} Bilder hinterlegt werden.`);
      return;
    }

    const selected = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remaining);

    try {
      const images = await Promise.all(selected.map(compressImage));
      setForm((current) => ({ ...current, images: [...current.images, ...images] }));
      setDirty(true);
      if (files.length > remaining) {
        notify(`Maximal ${MAX_IMAGES} Bilder möglich – weitere Dateien wurden nicht übernommen.`);
      }
    } catch {
      notify('Mindestens ein Bild konnte nicht verarbeitet werden.');
    }
  };

  const removeImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
    setDirty(true);
  };

  const makeCover = (index: number) => {
    setForm((current) => {
      const images = [...current.images];
      const [image] = images.splice(index, 1);
      images.unshift(image);
      return { ...current, images };
    });
    setDirty(true);
  };

  const save = () => {
    dispatch({ type: 'updateListing', listing: form });
    setDirty(false);
    notify(
      property.evaluatedOnce
        ? 'Inserat gespeichert – die Bewerbungen wurden neu geprüft.'
        : 'Inserat gespeichert.',
    );
  };

  const publish = () => {
    const connected = PORTALS.filter((p) => state.connections[p]);
    if (connected.length === 0) {
      notify('Verbinden Sie zuerst mindestens ein Portal unter „Kanäle".');
      navigate('kanaele');
      return;
    }
    dispatch({ type: 'publish', portals: connected });
    notify(
      `Inserat auf ${connected.map((p) => PORTAL_LABEL[p]).join(', ')} veröffentlicht.`,
    );
  };

  const connectedPortals = PORTALS.filter((p) => state.connections[p]);

  return (
    <div className="page">
      <PageHead
        eyebrow="Inserat"
        title="Inserat bearbeiten"
        sub="Einmal zentral pflegen – MietBlick nutzt diese Angaben für die Prüfung der Bewerbungen und später für den Mietvertrag."
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              data-testid="save-listing"
              onClick={save}
              disabled={!dirty}
            >
              {dirty ? 'Änderungen speichern' : 'Gespeichert'}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('kanaele')}>
              Weiter zu den Kanälen <IconArrow />
            </button>
          </>
        }
      />

      {dirty && (
        <Banner tone="amber" icon="✏️">
          Sie haben Änderungen am Inserat, die noch nicht gespeichert sind.
        </Banner>
      )}

      <div className="grid grid-2" style={{ marginTop: dirty ? 18 : 0 }}>
        <Card>
          <CardHead title="Objektdaten" sub="Diese Angaben erscheinen im Inserat." />
          <div className="card-pad">
            <label className="field">
              <span className="field-label">Bezeichnung</span>
              <input
                className="input"
                data-testid="listing-title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Ort</span>
                <input
                  className="input"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Lage</span>
                <input
                  className="input"
                  value={form.district}
                  onChange={(e) => set('district', e.target.value)}
                />
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Zimmer</span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={form.rooms}
                  onChange={(e) => set('rooms', Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="field-label">Wohnfläche (m²)</span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={form.size}
                  onChange={(e) => set('size', Number(e.target.value))}
                />
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Kaltmiete (€)</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={form.rent}
                  onChange={(e) => set('rent', Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="field-label">Nebenkosten (€)</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={form.extraCosts}
                  onChange={(e) => set('extraCosts', Number(e.target.value))}
                />
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Kaution (€)</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={form.deposit}
                  onChange={(e) => set('deposit', Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="field-label">Einzugstermin</span>
                <input
                  className="input"
                  data-testid="listing-movein"
                  value={form.moveIn}
                  onChange={(e) => set('moveIn', e.target.value)}
                />
                <span className="hint">
                  Wird nur hier gepflegt und überall daraus übernommen.
                </span>
              </label>
            </div>

            <label className="field">
              <span className="field-label">Kurzbeschreibung</span>
              <input
                className="input"
                value={form.highlight}
                onChange={(e) => set('highlight', e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Inseratstext</span>
              <textarea
                className="input"
                style={{ minHeight: 120 }}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </label>

            <div className="field">
              <span className="field-label">Bilder</span>
              <label className="listing-upload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  data-testid="listing-images"
                  onChange={async (e) => {
                    await addImages(e.target.files);
                    e.target.value = '';
                  }}
                />
                <span className="listing-upload-title">+ Bilder hinzufügen</span>
                <span className="hint">Bis zu {MAX_IMAGES} Bilder. Das erste Bild ist das Titelbild.</span>
              </label>

              {form.images.length > 0 && (
                <div className="listing-images">
                  {form.images.map((image, index) => (
                    <div className="listing-image" key={`${index}-${image.slice(-18)}`}>
                      <img src={image} alt={`Wohnungsbild ${index + 1}`} />
                      <div className="listing-image-actions">
                        {index === 0 ? (
                          <span className="listing-cover">Titelbild</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-subtle btn-sm"
                            onClick={() => makeCover(index)}
                          >
                            Als Titelbild
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeImage(index)}
                        >
                          Entfernen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="stack">
          <Card>
            <CardHead
              title="Vermietungskriterien"
              sub="Wonach MietBlick die Bewerbungen abgleicht."
            />
            <div className="card-pad">
              <div className="toggle-list">
                <label className="toggle">
                  <input
                    type="checkbox"
                    data-testid="criteria-pets"
                    checked={form.criteria.petsAllowed}
                    onChange={(e) => setCriteria('petsAllowed', e.target.checked)}
                  />
                  <span>
                    <strong>Haustiere erlaubt</strong>
                    <span className="hint">
                      Aus bleibt: Bewerbungen mit Haustier werden markiert.
                    </span>
                  </span>
                </label>

                <label className="toggle">
                  <input
                    type="checkbox"
                    data-testid="criteria-smoking"
                    checked={form.criteria.smokingAllowed}
                    onChange={(e) => setCriteria('smokingAllowed', e.target.checked)}
                  />
                  <span>
                    <strong>Rauchen erlaubt</strong>
                    <span className="hint">Aus bleibt: Vermietung als Nichtraucherwohnung.</span>
                  </span>
                </label>

                <label className="toggle">
                  <input
                    type="checkbox"
                    data-testid="criteria-schufa"
                    checked={form.criteria.schufaRequired}
                    onChange={(e) => setCriteria('schufaRequired', e.target.checked)}
                  />
                  <span>
                    <strong>SCHUFA-Auskunft erforderlich</strong>
                    <span className="hint">Bonitätsnachweis vor Vertragsschluss.</span>
                  </span>
                </label>
              </div>

              <label className="field" style={{ marginTop: 16 }}>
                <span className="field-label">Zulässige Belegung (Personen)</span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={10}
                  data-testid="criteria-persons"
                  value={form.criteria.maxPersons}
                  onChange={(e) => setCriteria('maxPersons', Number(e.target.value))}
                />
                <span className="hint">
                  Richtet sich nach Zimmerzahl und Wohnfläche, nicht nach der Zusammensetzung des
                  Haushalts.
                </span>
              </label>

              <div className="note note-navy" style={{ marginTop: 16 }}>
                <span className="note-title">Sachliche Kriterien</span>
                MietBlick gleicht nur objektbezogene Punkte ab: Haustiere, Rauchen, Belegung und
                Bonitätsnachweis. Persönliche Merkmale wie Herkunft, Geschlecht, Alter, Religion
                oder Familienstand fließen an keiner Stelle ein.
              </div>
            </div>
          </Card>

          <Card>
            <CardHead
              title="Pflichtangaben je Bewerbung"
              sub="Fehlt eine davon, markiert MietBlick Klärungsbedarf."
            />
            <div className="card-pad">
              <div className="chips">
                {(['Kontakt', 'Anzahl Personen', 'Einzugstermin'] as RequiredField[]).map(
                  (field) => (
                    <button
                      key={field}
                      type="button"
                      className={`chip-toggle${form.required.includes(field) ? ' is-on' : ''}`}
                      onClick={() => toggleRequired(field)}
                    >
                      {field}
                    </button>
                  ),
                )}
              </div>
              <div className="card-sub" style={{ margin: '14px 0 8px' }}>
                Zusatzangaben – werden über „Mehr Angaben prüfen“ ausgewertet und können hier zur
                Pflicht gemacht werden:
              </div>
              <div className="chips">
                {EXTRA_FIELDS.map((field) => (
                  <button
                    key={field}
                    type="button"
                    data-testid={`required-${field}`}
                    className={`chip-toggle${form.required.includes(field) ? ' is-on' : ''}`}
                    onClick={() => toggleRequired(field)}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="divider" />

      <Card>
        <CardHead
          title="Veröffentlichung"
          sub="MietBlick spielt das Inserat auf die verbundenen Portale aus."
          right={
            property.listing.publishedTo.length > 0 ? (
              <Badge tone="green" dot>
                Veröffentlicht
              </Badge>
            ) : (
              <Badge tone="grey" dot>
                Noch nicht veröffentlicht
              </Badge>
            )
          }
        />
        <div className="card-pad">
          {connectedPortals.length === 0 ? (
            <Banner tone="amber" icon="🔌">
              Noch kein Portal verbunden. Unter <strong>Kanäle</strong> stellen Sie die Verbindung
              zu ImmoScout24, Kleinanzeigen und Immowelt her.
            </Banner>
          ) : (
            <div className="chips" style={{ marginBottom: 16 }}>
              {connectedPortals.map((p) => (
                <span className="chip" key={p}>
                  {PORTAL_LABEL[p]}{' '}
                  {property.listing.publishedTo.includes(p) ? '· veröffentlicht' : '· bereit'}
                </span>
              ))}
            </div>
          )}

          <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-navy"
              data-testid="publish-listing"
              onClick={publish}
              disabled={connectedPortals.length === 0}
            >
              Auf verbundenen Portalen veröffentlichen
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('kanaele')}>
              Portale verwalten
            </button>
            {property.listing.updatedAt && (
              <span className="hint">Zuletzt gespeichert: {property.listing.updatedAt}</span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
