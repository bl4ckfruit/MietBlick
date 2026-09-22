/**
 * Abnahmetest – fährt die komplette MVP-Journey über beide Wohnungen im
 * echten Browser durch.
 *
 * Start:  node scripts/build.mjs && npx serve dist
 *         node scripts/abnahmetest.mjs
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:5173';

const results = [];
const consoleErrors = [];
let current = null;

function test(nr, name) {
  current = { nr, name, ok: true, notes: [] };
  results.push(current);
}

function expect(condition, message) {
  if (!condition) {
    current.ok = false;
    current.notes.push(message);
  }
}

function eq(actual, expected, message) {
  expect(
    String(actual) === String(expected),
    `${message} – erwartet "${expected}", war "${actual}"`,
  );
}

const ROUTES = [
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

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1480, height: 1000 } });

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

  /** Eröffnungsanimation überspringen, falls sie gerade läuft. */
  const skipIntro = async () => {
    if (await page.locator('[data-testid="intro"]').count()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(160);
    }
  };

  const go = async (route) => {
    await page.goto(`${BASE}/#/${route}`, { waitUntil: 'networkidle' });
    await skipIntro();
    await page.waitForTimeout(280);
  };

  const closeModal = async () => {
    const btn = page.locator('.modal-foot .btn-ghost').first();
    if (await btn.count()) await btn.click();
    await page.waitForTimeout(220);
  };

  // ---------------------------------------------------------------- TEST 1
  test(1, 'Website lädt mit Eröffnungsanimation');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  expect((await page.locator('[data-testid="intro"]').count()) > 0, 'Intro wird nicht gezeigt');
  await page.waitForTimeout(2500);
  expect(
    (await page.locator('[data-testid="intro"]').count()) === 0,
    'Intro verschwindet nicht von selbst',
  );
  expect(await page.locator('.start-title').isVisible(), 'Startseite nicht sichtbar');

  // ---------------------------------------------------------------- TEST 2
  test(2, 'Startseite bietet beide Wohnungen zur Auswahl');
  eq(await page.locator('.pick').count(), 2, 'Anzahl Objektkacheln');
  const startText = await page.locator('.start-picks').innerText();
  expect(startText.includes('München') && startText.includes('Innenstadt'), 'München fehlt');
  expect(startText.includes('90 m²') && startText.includes('3 Zimmer'), 'Daten München fehlen');
  expect(startText.includes('Dachau'), 'Dachau fehlt');
  expect(startText.includes('69 m²') && startText.includes('2 Zimmer'), 'Daten Dachau fehlen');
  expect(startText.includes('Sehr gute Lage'), 'Lagehinweis Dachau fehlt');
  expect(
    (await page.locator('.start-user').innerText()).includes('Franz Peters'),
    'Franz Peters fehlt',
  );

  // ---------------------------------------------------------------- TEST 3
  test(3, 'Kein „Magic Moment“ mehr in der Anwendung');
  await page.locator('[data-testid="open-muenchen"]').click();
  await page.waitForTimeout(350);
  let magicHits = 0;
  for (const route of ROUTES) {
    await go(route);
    if (/magic\s*moment/i.test(await page.locator('body').innerText())) {
      magicHits += 1;
      current.notes.push(`„Magic Moment" auf /${route}`);
    }
  }
  eq(magicHits, 0, 'Vorkommen von „Magic Moment"');

  // ---------------------------------------------------------------- TEST 4
  test(4, 'Linke Seite ist ein Prozessablauf mit Fortschritt');
  await go('objekt');
  eq(await page.locator('.flow-step').count(), 9, 'Anzahl Prozessschritte');
  const flowText = await page.locator('[data-testid="flow"]').innerText();
  for (const step of [
    'Objekt',
    'Inserat',
    'Kanäle',
    'Posteingang',
    'Bewerber prüfen',
    'Nachrichten',
    'Besichtigungen',
    'Entscheidung',
    'Mietvertrag',
  ]) {
    expect(flowText.includes(step), `Schritt „${step}" fehlt`);
  }
  expect(
    (await page.locator('.flow-progress').innerText()).includes('%'),
    'Fortschrittsanzeige fehlt',
  );

  // ---------------------------------------------------------------- TEST 5
  test(5, 'Keine Prozessschritt-Kacheln mehr auf der Objektseite');
  eq(await page.locator('.steps').count(), 0, 'Alte Schritt-Kacheln');
  expect(
    !(await page.locator('.page').innerText()).includes('So läuft die Vermietung'),
    'Alter Schritt-Block noch vorhanden',
  );

  // ---------------------------------------------------------------- TEST 6
  test(6, 'Logo oben links führt zurück zur Startseite');
  await page.locator('[data-testid="logo-home"]').click();
  await page.waitForTimeout(400);
  expect(await page.locator('.start-title').isVisible(), 'Startseite nicht erreicht');
  await page.locator('[data-testid="open-muenchen"]').click();
  await page.waitForTimeout(350);

  // ---------------------------------------------------------------- TEST 7
  test(7, 'Wohnungsübersicht zeigt beide Objekte');
  await go('wohnungen');
  eq(await page.locator('[data-testid="property-list"] .card').count(), 2, 'Objektkarten');
  const listText = await page.locator('[data-testid="property-list"]').innerText();
  expect(listText.includes('Wohnung München'), 'München fehlt');
  expect(listText.includes('Wohnung Dachau'), 'Dachau fehlt');

  // ---------------------------------------------------------------- TEST 8
  test(8, 'Objekt lässt sich über die Sidebar wechseln');
  await go('objekt');
  await page.locator('[data-testid="property-switch"]').click();
  await page.waitForTimeout(280);
  await page.locator('[data-testid="switch-dachau"]').click();
  await page.waitForTimeout(450);
  eq(await page.locator('.page-title').innerText(), 'Wohnung Dachau', 'Wechsel nach Dachau');
  expect(
    (await page.locator('.property-hero').innerText()).includes('69 m²'),
    'Daten Dachau falsch',
  );
  await page.locator('[data-testid="property-switch"]').click();
  await page.waitForTimeout(280);
  await page.locator('[data-testid="switch-muenchen"]').click();
  await page.waitForTimeout(450);
  eq(await page.locator('.page-title').innerText(), 'Wohnung München', 'Wechsel zurück');

  // ---------------------------------------------------------------- TEST 9
  test(9, 'Inserat lässt sich bearbeiten, Einzugstermin steht nur einmal');
  await go('inserat');
  eq(await page.locator('[data-testid="listing-movein"]').count(), 1, 'Einzugstermin-Felder');
  await page.locator('[data-testid="listing-movein"]').fill('15.11.2026');
  await page.waitForTimeout(160);
  await page.locator('[data-testid="save-listing"]').click();
  await page.waitForTimeout(400);
  await go('objekt');
  const heroText = await page.locator('.property-hero').innerText();
  expect(heroText.includes('15.11.2026'), 'Geänderter Termin nicht übernommen');
  expect(!heroText.includes('01.11.2026'), 'Alter Termin steht noch daneben');
  await go('inserat');
  await page.locator('[data-testid="listing-movein"]').fill('01.11.2026');
  await page.locator('[data-testid="save-listing"]').click();
  await page.waitForTimeout(350);

  // ---------------------------------------------------------------- TEST 10
  test(10, 'Kriterien des Objekts sind im Inserat gepflegt');
  eq(
    await page.locator('[data-testid="criteria-pets"]').isChecked(),
    false,
    'München: Haustiere nicht erlaubt',
  );
  eq(await page.locator('[data-testid="criteria-persons"]').inputValue(), '4', 'Belegung München');
  eq(
    await page.locator('[data-testid="criteria-schufa"]').isChecked(),
    true,
    'SCHUFA erforderlich',
  );

  // ---------------------------------------------------------------- TEST 11
  test(11, 'Schnittstellen: Portale lassen sich verbinden');
  await go('kanaele');
  eq(await page.locator('[data-testid="portal-list"] .portal').count(), 3, 'Portale');
  const kanaeleText = await page.locator('.page').innerText();
  for (const p of ['ImmoScout24', 'Kleinanzeigen', 'Immowelt']) {
    expect(kanaeleText.includes(p), `${p} fehlt`);
  }
  expect(kanaeleText.includes('Simulierte Schnittstelle'), 'Simulationshinweis fehlt');
  await page.locator('[data-testid="connect-immoscout"]').click();
  await page.waitForTimeout(300);
  const dialog = await page.locator('.modal').innerText();
  expect(dialog.includes('Raucher'), 'Übernommene Felder fehlen');
  expect(dialog.includes('SCHUFA-Auskunft'), 'SCHUFA fehlt');
  expect(dialog.includes('Demo-Konto'), 'Demo-Hinweis fehlt');
  await page.locator('[data-testid="confirm-connect"]').click();
  await page.waitForTimeout(400);
  expect(
    (await page.locator('[data-testid="portal-immoscout"]').innerText()).includes('Verbunden'),
    'Verbindung nicht hergestellt',
  );

  // ---------------------------------------------------------------- TEST 12
  test(12, 'Inserat lässt sich auf verbundenen Portalen veröffentlichen');
  await go('inserat');
  await page.locator('[data-testid="publish-listing"]').click();
  await page.waitForTimeout(400);
  expect(
    (await page.locator('.page').innerText()).includes('Veröffentlicht'),
    'Veröffentlichung nicht bestätigt',
  );

  // ---------------------------------------------------------------- TEST 13
  test(13, 'Posteingang zeigt die fünf Ausgangsbewerbungen');
  await go('inbox');
  const names = await page.locator('.inbox-name').allInnerTexts();
  eq(names.length, 5, 'Anzahl Bewerbungen');
  eq(
    names.join(', '),
    'Anna Weber, Ben Keller, Clara Neumann, David Fischer, Eva Sommer',
    'Namen im Posteingang',
  );

  // ---------------------------------------------------------------- TEST 14
  test(14, 'Originalanfrage lässt sich öffnen');
  await page.locator('[data-testid="inbox-item-m-clara"]').click();
  await page.waitForSelector('[data-testid="original-message"]');
  const original = await page.locator('[data-testid="original-message"]').innerText();
  expect(original.includes('Clara Neumann'), 'Originaltext fehlt');
  expect(original.includes('01.11.2026') && original.includes('01.01.2027'), 'Termine fehlen');
  await closeModal();

  // ---------------------------------------------------------------- TEST 15
  test(15, '„Bewerbungen auswerten“ ergibt 5 ausgewertet, 3 vollständig, 2 offen');
  await page.locator('[data-testid="evaluate"]').click();
  await page.waitForTimeout(450);
  eq(await page.locator('.page-title').innerText(), 'Aus Nachrichten wird Überblick', 'Zielseite');
  const stats = await page.locator('.stat').allInnerTexts();
  eq(stats[0].replace(/\s+/g, ' ').trim(), '5 Bewerbungen ausgewertet', 'Kennzahl 1');
  eq(stats[1].replace(/\s+/g, ' ').trim(), '3 Angaben vollständig', 'Kennzahl 2');
  eq(stats[2].replace(/\s+/g, ' ').trim(), '2 mit Klärungsbedarf', 'Kennzahl 3');

  // ---------------------------------------------------------------- TEST 16
  test(16, 'Bewerberkarten reagieren zuverlässig auf jeden Klick');
  for (const id of ['m-anna', 'm-ben', 'm-clara', 'm-david', 'm-eva']) {
    await page.locator(`[data-testid="name-${id}"]`).click();
    await page.waitForTimeout(240);
    expect(
      await page.locator('[data-testid="original-message"]').isVisible(),
      `Klick auf Namen ${id} öffnet nichts`,
    );
    await closeModal();
    await page.locator(`[data-testid="details-${id}"]`).click();
    await page.waitForTimeout(240);
    expect(
      await page.locator('[data-testid="original-message"]').isVisible(),
      `Details-Button ${id} öffnet nichts`,
    );
    await closeModal();
  }

  // ---------------------------------------------------------------- TEST 17
  test(17, '„Mehr Angaben prüfen“ ergänzt Raucher, Haustiere und SCHUFA');
  expect(
    await page.locator('[data-testid="check-extended"]').isVisible(),
    'Button „Mehr Angaben prüfen" fehlt',
  );
  await page.locator('[data-testid="check-extended"]').click();
  await page.waitForTimeout(500);
  const anna = await page.locator('[data-testid="extra-m-anna"]').innerText();
  expect(anna.includes('Nichtraucher'), 'Raucherangabe fehlt');
  expect(anna.includes('keine Haustiere'), 'Haustierangabe fehlt');
  expect(anna.includes('liegt vor'), 'SCHUFA-Angabe fehlt');

  // ---------------------------------------------------------------- TEST 18
  test(18, 'Abgleich mit den Objektkriterien greift');
  eq(
    await page.locator('[data-testid="applicant-m-anna"]').getAttribute('data-criteria'),
    'erfuellt',
    'Anna erfüllt alles',
  );
  eq(
    await page.locator('[data-testid="applicant-m-clara"]').getAttribute('data-criteria'),
    'nicht_erfuellt',
    'Clara: Katze in Wohnung ohne Haustiere',
  );
  expect(
    (await page.locator('[data-testid="applicant-m-clara"]').innerText()).includes('Katze'),
    'Haustier nicht benannt',
  );
  eq(
    await page.locator('[data-testid="applicant-m-eva"]').getAttribute('data-criteria'),
    'nicht_erfuellt',
    'Eva: Raucherin in Nichtraucherwohnung',
  );
  eq(
    await page.locator('[data-testid="applicant-m-ben"]').getAttribute('data-criteria'),
    'offen',
    'Ben: SCHUFA noch offen',
  );

  // ---------------------------------------------------------------- TEST 19
  test(19, 'Filter nach Kriterien funktioniert');
  const count = () => page.locator('[data-testid="applicant-grid"] article').count();
  await page.locator('[data-testid="filter-nicht_erfuellt"]').click();
  await page.waitForTimeout(320);
  eq(await count(), 2, 'Filter „Kriterium nicht erfüllt"');
  await page.locator('[data-testid="filter-erfuellt"]').click();
  await page.waitForTimeout(320);
  eq(await count(), 2, 'Filter „Kriterien erfüllt"');
  await page.locator('[data-testid="filter-klaerung"]').click();
  await page.waitForTimeout(320);
  eq(await count(), 2, 'Filter „Klärungsbedarf"');
  await page.locator('[data-testid="filter-alle"]').click();
  await page.waitForTimeout(320);
  eq(await count(), 5, 'Filter zurückgesetzt');

  // ---------------------------------------------------------------- TEST 20
  test(20, 'Vorher/Nachher-Ansicht zeigt die Transformation');
  await page.locator('[data-testid="view-vergleich"]').click();
  await page.waitForTimeout(320);
  eq(await page.locator('.magic-before').count(), 5, 'Originalnachrichten links');
  eq(await page.locator('.magic-after').count(), 5, 'Kurzprofile rechts');
  await page.locator('[data-testid="view-karten"]').click();
  await page.waitForTimeout(280);

  // ---------------------------------------------------------------- TEST 21
  test(21, 'Datenübernahme aus dem Portal füllt fehlende Angaben');
  await go('kanaele');
  await page.locator('[data-testid="import-data"]').click();
  await page.waitForTimeout(500);
  await go('bewerber');
  expect(
    (await page.locator('[data-testid="extra-m-ben"]').innerText()).includes('liegt vor'),
    'SCHUFA nicht aus dem Profil ergänzt',
  );
  eq(
    await page.locator('[data-testid="applicant-m-ben"]').getAttribute('data-criteria'),
    'erfuellt',
    'Ben nach Übernahme kriterienkonform',
  );
  expect(
    (await page.locator('[data-testid="applicant-m-ben"]').innerText()).includes('Profil übernommen'),
    'Herkunft der Daten nicht ausgewiesen',
  );

  // ---------------------------------------------------------------- TEST 22
  test(22, 'Rückfrage wird vorbereitet, bearbeitet und freigegeben');
  await page.locator('[data-testid="inquiry-m-ben"]').click();
  await page.waitForSelector('[data-testid="textarea-inquiry-m-ben"]');
  const draft = await page.locator('[data-testid="textarea-inquiry-m-ben"]').inputValue();
  expect(draft.startsWith('Guten Tag Herr Keller,'), 'Anrede falsch');
  expect(draft.includes('Ab wann möchten Sie einziehen?'), 'Frage nach Einzug fehlt');
  expect(draft.includes('Franz Peters'), 'Signatur fehlt');
  const edited = `${draft}\n\n(Der 01.11.2026 wäre mir am liebsten.)`;
  await page.locator('[data-testid="textarea-inquiry-m-ben"]').fill(edited);
  await page.waitForTimeout(180);
  await page.locator('[data-testid="release-inquiry-m-ben"]').click();
  await page.waitForTimeout(320);
  expect(
    (await page.locator('[data-testid="draft-inquiry-m-ben"]').innerText()).includes('Freigegeben'),
    'Freigabe nicht sichtbar',
  );
  expect((await page.locator('[data-testid="toast"]').count()) > 0, 'Kein visuelles Feedback');
  await closeModal();

  // ---------------------------------------------------------------- TEST 23
  test(23, 'Rücksprache lässt sich vermerken');
  await page.locator('[data-testid="details-m-david"]').click();
  await page.waitForTimeout(320);
  await page
    .locator('[data-testid="consultation-m-david"]')
    .fill('Telefonat 22.09.: Einzug auch zum 15.11. möglich, SCHUFA wird nachgereicht.');
  await page.locator('[data-testid="save-consultation-m-david"]').click();
  await page.waitForTimeout(320);
  await closeModal();
  expect(
    (await page.locator('[data-testid="applicant-m-david"]').innerText()).includes('Telefonat'),
    'Rücksprache nicht auf der Karte',
  );

  // ---------------------------------------------------------------- TEST 24
  test(24, 'Text, Freigabe und Rücksprache überstehen den Reload');
  await page.reload({ waitUntil: 'networkidle' });
  await skipIntro();
  await page.waitForTimeout(550);
  expect(
    (await page.locator('[data-testid="applicant-m-david"]').innerText()).includes('Telefonat'),
    'Rücksprache nach Reload weg',
  );
  await go('nachrichten');
  eq(
    await page.locator('[data-testid="textarea-inquiry-m-ben"]').inputValue(),
    edited,
    'Bearbeiteter Text nach Reload',
  );
  expect(
    (await page.locator('[data-testid="draft-inquiry-m-ben"]').innerText()).includes('Freigegeben'),
    'Freigabestatus nach Reload weg',
  );

  // ---------------------------------------------------------------- TEST 25
  test(25, 'Neue Anfrage wird hinzugefügt und sofort ausgewertet');
  await go('inbox');
  await page.locator('[data-testid="new-request"]').click();
  await page.waitForSelector('[data-testid="request-text"]');
  await page
    .locator('[data-testid="request-text"]')
    .fill(
      'Hallo, ich heiße Max Mustermann. Sie erreichen mich unter max@example.de. Ich möchte die Wohnung zusammen mit meiner Freundin beziehen. Viele Grüße',
    );
  await page.locator('[data-testid="submit-request"]').click();
  await page.waitForTimeout(450);
  expect(
    (await page.locator('[data-testid="inbox-list"]').innerText()).includes('Max Mustermann'),
    'Max fehlt im Posteingang',
  );
  eq(await page.locator('.inbox-name').count(), 6, 'Anzahl nach Hinzufügen');
  await go('bewerber');
  const maxCard = page
    .locator('[data-testid="applicant-grid"] article')
    .filter({ hasText: 'Max Mustermann' });
  eq(await maxCard.count(), 1, 'Karte für Max');
  const maxText = (await maxCard.innerText()).replace(/\n/g, ' ');
  expect(maxText.includes('max@example.de'), 'Kontakt nicht erkannt');
  expect(/Personen\s*2 Personen/.test(maxText), 'Personenzahl nicht erkannt');
  expect(maxText.includes('Einzugstermin fehlt'), 'Fehlende Angabe nicht markiert');
  expect(maxText.includes('Einzugstermin erfragen'), 'Nächster Schritt fehlt');
  const statsAfter = await page.locator('.stat').allInnerTexts();
  eq(statsAfter[0].replace(/\s+/g, ' ').trim(), '6 Bewerbungen ausgewertet', 'Zähler aktualisiert');

  // ---------------------------------------------------------------- TEST 26
  test(26, 'Besichtigungen funktionieren und Status ist änderbar');
  await go('besichtigungen');
  const viewings = await page.locator('[data-testid="viewing-list"]').innerText();
  for (const entry of ['17:00', 'Anna Weber', '17:30', 'David Fischer', '18:00', 'Eva Sommer']) {
    expect(viewings.includes(entry), `${entry} fehlt`);
  }
  await page.locator('[data-testid="status-mv-2-bestaetigt"]').click();
  await page.waitForTimeout(320);
  expect(
    (await page.locator('[data-testid="viewing-mv-2"]').innerText()).includes('Bestätigt'),
    'Status nicht geändert',
  );
  await page.reload({ waitUntil: 'networkidle' });
  await skipIntro();
  await page.waitForTimeout(500);
  expect(
    (await page.locator('[data-testid="viewing-mv-2"]').innerText()).includes('Bestätigt'),
    'Terminstatus nach Reload weg',
  );

  // ---------------------------------------------------------------- TEST 27
  test(27, 'Bewerber mit offenen Punkten ist trotzdem wählbar (Übersteuerung)');
  await go('entscheidung');
  eq(
    await page.locator('.page-title').innerText(),
    'Die Entscheidung bleibt bei Franz.',
    'Titel der Entscheidungsseite',
  );
  expect(
    (await page.locator('.page').innerText()).includes(
      'KI unterstützt. Der Vermieter entscheidet und gibt Nachrichten frei.',
    ),
    'Hinweis zur Entscheidungshoheit fehlt',
  );
  await page.locator('[data-testid="select-m-clara"]').click();
  await page.waitForTimeout(320);
  expect(
    await page.locator('[data-testid="override-reason"]').isVisible(),
    'Begründungsfeld fehlt bei offenen Punkten',
  );
  expect(
    await page.locator('[data-testid="confirm-select"]').isDisabled(),
    'Auswahl ohne Begründung möglich',
  );
  await page
    .locator('[data-testid="override-reason"]')
    .fill('Katze zieht nicht mit ein, Einzugstermin telefonisch auf 01.11.2026 festgelegt.');
  await page.waitForTimeout(220);
  expect(
    !(await page.locator('[data-testid="confirm-select"]').isDisabled()),
    'Auswahl trotz Begründung blockiert',
  );
  await page.locator('[data-testid="confirm-select"]').click();
  await page.waitForTimeout(500);
  const decisionText = await page.locator('.page').innerText();
  expect(decisionText.includes('Von Franz ausgewählt'), 'Auswahl nicht sichtbar');
  expect(decisionText.includes('Katze zieht nicht mit ein'), 'Begründung nicht festgehalten');
  expect(decisionText.includes('Zusage – Entwurf zur Prüfung'), 'Zusage-Bereich fehlt');
  expect(decisionText.includes('Übrige Bewerbungen'), 'Absagen-Bereich fehlt');
  eq(await page.locator('[data-testid^="draft-reply-"]').count(), 6, 'Zusage + 5 Absagen');
  eq(
    await page.locator('[data-testid^="draft-reply-"] .badge-green').count(),
    0,
    'Nichts darf automatisch freigegeben sein',
  );

  // ---------------------------------------------------------------- TEST 28
  test(28, 'Mietvertrag wird aus den Daten der Person erzeugt');
  await go('vertrag');
  await page.locator('[data-testid="generate-contract"]').click();
  await page.waitForTimeout(500);
  const contract = await page.locator('[data-testid="contract-text"]').inputValue();
  expect(contract.includes('MIETVERTRAG'), 'Kein Vertragstext');
  expect(contract.includes('Clara Neumann'), 'Mietername fehlt');
  expect(contract.includes('clara.neumann@example.de'), 'Kontakt fehlt');
  expect(contract.includes('Franz Peters'), 'Vermieter fehlt');
  expect(contract.includes('München · Innenstadt'), 'Objekt fehlt');
  expect(contract.includes('90 m²') && contract.includes('3 Zimmer'), 'Objektdaten fehlen');
  expect(contract.includes('1.680 €'), 'Miete fehlt');
  expect(contract.includes('5.040 €'), 'Kaution fehlt');
  expect(contract.includes('2 Personen'), 'Personenzahl fehlt');
  expect(
    contract.includes('Haltung von Haustieren ist in der Wohnung nicht gestattet'),
    'Haustier-Klausel aus den Kriterien fehlt',
  );
  expect(contract.includes('Nichtraucherwohnung'), 'Rauchklausel fehlt');
  expect(contract.includes('VOR UNTERSCHRIFT NOCH ZU KLÄREN'), 'Offene Punkte fehlen');

  // ---------------------------------------------------------------- TEST 29
  test(29, 'Mietvertrag ist editierbar, speicherbar und bleibt erhalten');
  await page
    .locator('[data-testid="contract-text"]')
    .fill(`${contract}\n\nZusatz: Kellerabteil Nr. 7 gehört zur Wohnung.`);
  await page.waitForTimeout(280);
  const downloadPromise = page.waitForEvent('download', { timeout: 6000 }).catch(() => null);
  await page.locator('[data-testid="download-contract"]').click();
  const download = await downloadPromise;
  expect(download !== null, 'Kein Download ausgelöst');
  if (download) {
    expect(
      download.suggestedFilename().startsWith('Mietvertrag_'),
      `Dateiname unerwartet: ${download.suggestedFilename()}`,
    );
  }
  await page.reload({ waitUntil: 'networkidle' });
  await skipIntro();
  await page.waitForTimeout(500);
  expect(
    (await page.locator('[data-testid="contract-text"]').inputValue()).includes('Kellerabteil'),
    'Vertragsänderung nach Reload weg',
  );

  // ---------------------------------------------------------------- TEST 30
  test(30, 'Zweite Wohnung hat eigene Daten und eigene Kriterien');
  await go('objekt');
  await page.locator('[data-testid="property-switch"]').click();
  await page.waitForTimeout(280);
  await page.locator('[data-testid="switch-dachau"]').click();
  await page.waitForTimeout(500);
  await go('inbox');
  const dachauNames = await page.locator('.inbox-name').allInnerTexts();
  eq(dachauNames.length, 5, 'Anzahl Anfragen Dachau');
  expect(!dachauNames.includes('Anna Weber'), 'Bewerber vermischen sich');
  await page.locator('[data-testid="evaluate"]').click();
  await page.waitForTimeout(450);
  await page.locator('[data-testid="check-extended"]').click();
  await page.waitForTimeout(500);
  eq(
    await page.locator('[data-testid="applicant-d-mira"]').getAttribute('data-criteria'),
    'nicht_erfuellt',
    'Dachau: 4 Personen bei 2 zulässigen',
  );
  expect(
    (await page.locator('[data-testid="applicant-d-mira"]').innerText()).includes('Belegung'),
    'Belegungskriterium nicht benannt',
  );
  eq(
    await page.locator('[data-testid="applicant-d-tobias"]').getAttribute('data-criteria'),
    'erfuellt',
    'Dachau: Hund ist hier erlaubt',
  );
  eq(
    await page.locator('[data-testid="applicant-d-noah"]').getAttribute('data-criteria'),
    'nicht_erfuellt',
    'Dachau: Raucher in Nichtraucherwohnung',
  );


  /** Zurück zum Objekt München, das den vollen Durchlauf hinter sich hat. */
  const openMuenchen = async () => {
    await go('objekt');
    if ((await page.locator('.page-title').innerText()) !== 'Wohnung München') {
      await page.locator('[data-testid="property-switch"]').click();
      await page.waitForTimeout(280);
      await page.locator('[data-testid="switch-muenchen"]').click();
      await page.waitForTimeout(450);
    }
  };

  // ---------------------------------------------------------------- TEST 31
  test(31, 'FLIP: Karten gleiten beim Filtern an ihre neue Position');
  await openMuenchen();
  await go('bewerber');
  await page.locator('[data-testid="view-karten"]').click();
  await page.locator('[data-testid="filter-alle"]').click();
  await page.waitForTimeout(400);
  eq(
    await page.locator('[data-testid="applicant-grid"] [data-flip-id]').count(),
    6,
    'Karten mit FLIP-Kennung',
  );
  await page.locator('[data-testid="filter-nicht_erfuellt"]').click();
  // Direkt nach dem Filtern muss mindestens eine Karte animiert werden.
  let animating = 0;
  for (let attempt = 0; attempt < 12 && animating === 0; attempt += 1) {
    animating = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('[data-flip-id]')).filter(
          (el) => el.getAnimations().length > 0,
        ).length,
    );
    if (animating === 0) await page.waitForTimeout(40);
  }
  expect(animating > 0, 'Keine Bewegung beim Filtern – FLIP greift nicht');
  await page.waitForTimeout(520);
  eq(
    await page.locator('[data-testid="applicant-grid"] article').count(),
    2,
    'Gefilterte Karten',
  );
  await page.locator('[data-testid="filter-alle"]').click();
  await page.waitForTimeout(520);

  // ---------------------------------------------------------------- TEST 32
  test(32, 'Kriterienmatrix zeigt alle Bewerbungen gegen alle Kriterien');
  await page.locator('[data-testid="view-matrix"]').click();
  await page.waitForTimeout(400);
  expect(await page.locator('[data-testid="criteria-matrix"]').isVisible(), 'Matrix fehlt');
  eq(
    await page.locator('[data-testid="criteria-matrix"] tbody tr').count(),
    6,
    'Zeilen in der Matrix',
  );
  // Die Kopfzeile wird per CSS in Großbuchstaben gesetzt – Schreibweise egal.
  const matrixHead = (
    await page.locator('[data-testid="criteria-matrix"] thead').innerText()
  ).toLowerCase();
  for (const column of ['haustiere', 'rauchen', 'belegung', 'schufa']) {
    expect(matrixHead.includes(column), `Spalte ${column} fehlt`);
  }
  expect(
    (await page.locator('[data-testid="matrix-m-clara"]').innerText()).includes('nicht erfüllt'),
    'Clara ohne Verstoß in der Matrix',
  );
  expect(
    (await page.locator('[data-testid="matrix-m-eva"]').innerText()).includes('nicht erfüllt'),
    'Eva ohne Verstoß in der Matrix',
  );
  await page.locator('[data-testid="view-karten"]').click();
  await page.waitForTimeout(320);

  // ---------------------------------------------------------------- TEST 33
  test(33, 'Diagramme zeigen einen Tooltip beim Überfahren');
  await page.locator('.stackbar-seg').first().hover();
  await page.waitForTimeout(260);
  expect((await page.locator('.chart-tip').count()) > 0, 'Kein Tooltip erschienen');
  if ((await page.locator('.chart-tip').count()) > 0) {
    const tipText = await page.locator('.chart-tip').first().innerText();
    expect(/\d/.test(tipText) && tipText.includes('%'), `Tooltip ohne Werte: "${tipText}"`);
  }

  // ---------------------------------------------------------------- TEST 34
  test(34, 'Haus ist bei abgeschlossener Vermietung vollständig');
  await openMuenchen();
  expect(await page.locator('[data-testid="house-progress"]').isVisible(), 'Haus fehlt');
  eq(
    await page.locator('[data-testid="house-progress"]').getAttribute('data-built'),
    '9',
    'Bauteile bei abgeschlossenem Prozess',
  );
  const houseText = await page.locator('.house-caption').innerText();
  expect(houseText.includes('9') && houseText.includes('von 9'), 'Zähler fehlt');
  expect(houseText.includes('abgeschlossen'), 'Abschlusshinweis fehlt');

  // ---------------------------------------------------------------- TEST 35
  test(35, 'Haus wächst mit jedem erledigten Schritt');
  await go('objekt');
  await page.locator('[data-testid="property-switch"]').click();
  await page.waitForTimeout(280);
  await page.locator('[data-testid="switch-dachau"]').click();
  await page.waitForTimeout(500);
  const builtBefore = Number(
    await page.locator('[data-testid="house-progress"]').getAttribute('data-built'),
  );
  expect(builtBefore > 0 && builtBefore < 9, `Unerwarteter Baustand Dachau: ${builtBefore}`);
  await go('inserat');
  await page.locator('[data-testid="publish-listing"]').click();
  await page.waitForTimeout(400);
  await go('objekt');
  const builtAfter = Number(
    await page.locator('[data-testid="house-progress"]').getAttribute('data-built'),
  );
  eq(builtAfter, builtBefore + 1, 'Haus wächst um ein Bauteil');

  // ---------------------------------------------------------------- TEST 36
  test(36, 'Wohnungsübersicht vergleicht beide Objekte im Trichter');
  await go('wohnungen');
  eq(await page.locator('[data-testid="funnel-compare"] .funnel').count(), 2, 'Trichter');
  const compareText = await page.locator('[data-testid="funnel-compare"]').innerText();
  expect(compareText.includes('Wohnung München'), 'München fehlt');
  expect(compareText.includes('Wohnung Dachau'), 'Dachau fehlt');
  expect(compareText.includes('Prozessschritte erledigt'), 'Fortschrittsbalken fehlt');
  expect(/% erledigt/.test(compareText), 'Prozentangabe fehlt');

  // ---------------------------------------------------------------- TEST 37
  test(37, 'Keine sichtbaren Buttons ohne Funktion, keine toten Links');
  let dead = 0;
  let checked = 0;
  for (const route of ROUTES) {
    await go(route);
    const info = await page.evaluate(() => {
      const out = { dead: 0, total: 0, labels: [] };
      for (const el of Array.from(document.querySelectorAll('a[href]'))) {
        const href = el.getAttribute('href') || '';
        if (href === '' || href === '#') {
          out.dead += 1;
          out.labels.push(`leerer Link: ${el.textContent}`);
        }
      }
      for (const el of Array.from(document.querySelectorAll('button'))) {
        if (!(el.offsetParent || el.getClientRects().length)) continue;
        out.total += 1;
        if ((el.textContent || '').trim().length === 0 && !el.hasAttribute('aria-label')) {
          out.dead += 1;
          out.labels.push('Button ohne Beschriftung');
        }
      }
      return out;
    });
    dead += info.dead;
    checked += info.total;
    if (info.dead > 0) current.notes.push(`${route}: ${info.labels.join(', ')}`);
  }
  eq(dead, 0, 'Tote Links/Buttons');
  expect(checked > 60, `Zu wenige Buttons geprüft (${checked})`);

  // ---------------------------------------------------------------- TEST 38
  test(38, 'Demo zurücksetzen stellt den Ausgangszustand her');
  await go('objekt');
  await page.locator('.sidebar-reset').click();
  await page.waitForTimeout(280);
  await page.locator('.modal-foot .btn-primary').click();
  await page.waitForTimeout(550);
  expect(await page.locator('.start-title').isVisible(), 'Nach Reset nicht auf der Startseite');
  await page.locator('[data-testid="open-muenchen"]').click();
  await page.waitForTimeout(400);
  await go('inbox');
  eq(await page.locator('.inbox-name').count(), 5, 'Fünf Startbewerbungen wiederhergestellt');

  // ---------------------------------------------------------------- TEST 39
  test(39, 'Keine Console-Fehler im gesamten Ablauf');
  const noisy = consoleErrors.filter((e) => !/favicon|ERR_/.test(e));
  expect(noisy.length === 0, `Console-Fehler: ${noisy.slice(0, 5).join(' | ')}`);

  await browser.close();

  console.log('\n═══ ABNAHMETEST MietBlick ═══\n');
  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? '✓' : '✗';
    if (!r.ok) failed += 1;
    console.log(`${mark} TEST ${String(r.nr).padStart(2, '0')}  ${r.name}`);
    for (const note of r.notes) console.log(`         → ${note}`);
  }
  console.log(
    `\n${failed === 0 ? '✓ Alle' : `✗ ${failed} von`} ${results.length} Tests ${failed === 0 ? 'bestanden' : 'fehlgeschlagen'}.`,
  );
  process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error('\nAbbruch:', error);
  console.log('\nBis dahin:');
  for (const r of results) console.log(`${r.ok ? '✓' : '✗'} TEST ${r.nr} ${r.name}`, r.notes);
  process.exit(1);
});
