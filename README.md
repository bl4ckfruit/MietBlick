# MietBlick – MVP

Der digitale Vermietungsassistent für private Kleinvermieter.
Lauffähige Web-App: vom Inserat über die Anfragen bis zum Mietvertragsentwurf.

---

## Schnellstart

**Ohne Installation:** `MietBlick.html` doppelklicken.
Die Datei enthält die komplette App inklusive React und CSS, läuft offline und
speichert lokal im Browser.

**Als kleiner Webserver** (empfohlen, wenn der Rechner Dateizugriffe blockt):

```bash
npx serve dist        # oder: python3 -m http.server 5173 --directory dist
```

**Online stellen:** siehe *Auf GitHub Pages veröffentlichen* weiter unten.

Danach `http://localhost:5173` öffnen.

**Zum Weiterentwickeln:**

```bash
npm install
npm run dev           # Build + Watch + Server auf http://localhost:5173
npm run build         # erzeugt dist/, docs/ und MietBlick.html neu
```

Keine API-Keys, kein Backend, keine Datenbank.

---

## Der Ablauf

Beim Öffnen läuft eine kurze Eröffnungsanimation, danach wählt Franz Peters,
mit welcher seiner beiden Wohnungen er weiterarbeiten möchte. Das Logo oben
links führt jederzeit zurück zur Startseite.

| Objekt | Daten | Kriterien |
| --- | --- | --- |
| **Wohnung München** | Innenstadt · 90 m² · 3 Zimmer · 1.680 € · Einzug 01.11.2026 | keine Haustiere · Nichtraucherwohnung · bis 4 Personen · SCHUFA |
| **Wohnung Dachau** | Altstadt, sehr gute Lage · 69 m² · 2 Zimmer · 980 € · Einzug 01.12.2026 | Haustiere erlaubt · Nichtraucherwohnung · bis 2 Personen · SCHUFA |

Jede Wohnung hat ein eigenes Inserat, eigene Anfragen, eigene Termine und einen
eigenen Prozessstand. Die linke Leiste ist der Prozessablauf und zeigt mit
Fortschrittsbalken und Häkchen, wo man gerade steht:

1. **Objekt** – Wohnung und Kriterien
2. **Inserat** – anlegen und bearbeiten
3. **Kanäle** – Portale verbinden
4. **Posteingang** – Anfragen sammeln
5. **Bewerber prüfen** – auswerten und abgleichen
6. **Nachrichten** – Rückfragen freigeben
7. **Besichtigungen** – Termine bestätigen
8. **Entscheidung** – Sie wählen aus
9. **Mietvertrag** – Entwurf erzeugen

---

## Was der MVP kann

**Mehrere Objekte.** Übersicht aller Wohnungen mit Prozessstand, Wechsel über
die Sidebar oder die Startseite.

**Inserat bearbeiten.** Alle Angaben an einer Stelle – der Einzugstermin wird
genau einmal gepflegt und überall daraus gelesen. Kriterien (Haustiere, Rauchen,
Belegung, SCHUFA) und Pflichtangaben sind einstellbar; eine Änderung löst die
Neuauswertung der Bewerbungen aus.

**Schnittstellen.** ImmoScout24, Kleinanzeigen und Immowelt lassen sich
verbinden, das Inserat wird auf die verbundenen Portale ausgespielt. Über
*Profilangaben übernehmen* fließen die im Portal hinterlegten Angaben
(Raucher, Haustiere, SCHUFA, Beschäftigung) in die Auswertung ein und füllen,
was in der Nachricht fehlte. Vorhandene Angaben werden nie überschrieben.

**Auswertung.** Aus jeder unstrukturierten Nachricht liest MietBlick Name,
Kontakt, Anzahl Personen und Einzugstermin. Fehlende Pflichtangaben und
widersprüchliche Termine werden markiert.

**Mehr Angaben prüfen.** Der zweite Schritt liest Raucher, Haustiere und
SCHUFA aus und gleicht alles mit den Kriterien des Objekts ab. Ergebnis je
Bewerbung: *Kriterien erfüllt*, *Kriterium offen* oder *Kriterium nicht erfüllt*,
mit Begründung pro Kriterium.

**Drei Ansichten mit Filter.** Nach Kriterienstatus und nach Klärungsbedarf
filterbar – beim Umschalten gleiten die verbleibenden Karten an ihre neue
Position (FLIP), statt hart umzuspringen. Dazu die **Kriterienmatrix** (alle
Bewerbungen gegen alle Kriterien in einem Raster) und die **Vorher/Nachher**-
Ansicht, die die Originalnachrichten den Kurzprofilen gegenüberstellt.

**Rückfragen.** Entstehen automatisch, sind frei bearbeitbar und werden einzeln
freigegeben. Es wird nichts verschickt – die Freigabe wird nur im System
festgehalten.

**Rücksprache.** Zu jeder Bewerbung lässt sich notieren, was am Telefon oder bei
der Besichtigung besprochen wurde. Die Notiz erscheint auf der Karte, in der
Entscheidung und im Mietvertrag.

**Besichtigungen.** Termine je Objekt mit änderbarem Status.

**Entscheidung mit Übersteuerung.** Der Kriterienabgleich ist ein Hinweis, keine
Empfehlung. Jede Bewerbung ist wählbar – auch eine mit fehlenden Angaben oder
nicht erfülltem Kriterium. In dem Fall verlangt MietBlick eine kurze Begründung
und hält sie nachvollziehbar fest. Zusage und Absagen entstehen als Entwürfe.

**Mietvertrag.** Wird aus Objektdaten, Kriterien und den Angaben der
ausgewählten Person zusammengesetzt: Vertragsparteien, Mietobjekt, Mietzeit,
Miete und Kaution, Haustier- und Rauchklausel, SCHUFA-Hinweis, Rücksprache-Notiz
und eine sichtbare Liste der vor Unterschrift noch offenen Punkte. Editierbar,
als Datei speicherbar, kopierbar und druckbar.

**Fortschritt als Haus.** Auf der Objektseite baut sich das MietBlick-Haus mit
jedem erledigten Schritt weiter auf: Grundstück, Wände, Dach, die beiden Augen,
die Tür – und zum Schluss der Schlüssel. Gekoppelt an die Anzahl der erledigten
Schritte, damit nie ein Dach ohne Wände in der Luft hängt.

**Diagramme.** Trichter über den Vermietungsprozess, gestapelte Balken für
Datenlage und Kriterienabgleich, Fortschrittsbalken und ein Objektvergleich auf
gemeinsamem Maßstab. Alle mit Hover-Tooltip, Legende und Beschriftung.

**Persistenz.** Alles bleibt lokal gespeichert und übersteht Seitenwechsel und
Reload. *Demo zurücksetzen* stellt den Ausgangszustand wieder her.

## Bewusst als spätere Ausbaustufe gekennzeichnet

- Echte Portal-Schnittstellen mit Anmeldung (die Verbindung ist eine Simulation
  mit Demo-Konto – es werden keine Zugangsdaten abgefragt und keine Daten
  übertragen)
- Automatisches Veröffentlichen auf den Portalen
- Echter E-Mail-Versand von Rückfragen, Zusagen und Absagen
- Kalendersynchronisierung für Besichtigungen
- Upload und Prüfung von Unterlagen

## Faire Produktlogik

Abgeglichen werden ausschließlich **objektbezogene** Kriterien: was die Wohnung
hergibt (Belegung nach Zimmerzahl und Fläche) und was im Mietvertrag geregelt
wird (Haustiere, Rauchen, Bonitätsnachweis). Persönliche Merkmale wie Herkunft,
Geschlecht, Alter, Religion oder Familienstand fließen an keiner Stelle ein, es
gibt kein Scoring und keine Rangfolge. Die Auswahl trifft der Vermieter, und
jede Nachricht geht erst nach seiner Freigabe raus.

---

## Auf GitHub Pages veröffentlichen

Die App ist dafür vorbereitet: alle Pfade sind relativ, die Navigation läuft über
`#/…`, und es gibt kein Backend. Sie funktioniert deshalb auch unter einer
Unteradresse wie `https://<name>.github.io/mietblick/`.

### Weg 1 – ohne Einrichtung (empfohlen)

Der fertig gebaute Ordner `docs/` liegt schon im Projekt.

1. Auf github.com ein neues **öffentliches** Repository anlegen, z. B. `mietblick`.
2. Das Projekt hochladen – entweder per Drag-and-drop im Browser
   („uploading an existing file") oder im Terminal:

   ```bash
   git remote add origin https://github.com/<name>/mietblick.git
   git branch -M main
   git push -u origin main
   ```

   (Das Projekt ist bereits ein Git-Repository mit einem ersten Commit.)
3. Im Repository auf **Settings → Pages** gehen.
4. Unter *Build and deployment* → *Source*: **Deploy from a branch**,
   Branch: **main**, Ordner: **/docs** → **Save**.
5. Nach ein bis zwei Minuten steht die Adresse oben auf derselben Seite:
   `https://<name>.github.io/mietblick/`

Nach jeder Änderung `node scripts/build.mjs` laufen lassen und `docs/`
mit committen – dann aktualisiert sich die Seite von selbst.

### Weg 2 – automatisch bauen lassen

Wer nicht jedes Mal selbst bauen möchte, nutzt den mitgelieferten Workflow
`.github/workflows/deploy.yml`:

1. **Settings → Pages → Source: GitHub Actions**
2. Reiter **Actions** → *MietBlick auf GitHub Pages veröffentlichen* →
   **Run workflow**

GitHub installiert dann selbst die Abhängigkeiten, baut die App und
veröffentlicht sie. Wer Weg 1 nutzt, kann die Workflow-Datei löschen.

### Gut zu wissen

- Die Seite ist danach **öffentlich im Netz**. In der Demo stecken nur erfundene
  Beispieldaten, echte Bewerberdaten gehören dort nicht hinein.
- Gespeichert wird weiterhin nur im Browser des Besuchers (`localStorage`).
  Jeder sieht also seinen eigenen Stand, nichts wird geteilt oder hochgeladen.
- Für die Präsentation bleibt `MietBlick.html` die sicherste Rückfalloption:
  läuft per Doppelklick, auch ganz ohne Internet.

---

## Technik

React 19 · TypeScript · esbuild · handgeschriebenes CSS-Design-System
(kein UI-Framework, keine Laufzeit-Abhängigkeit außer React, keine CDN).

```
src/
  lib/extract.ts        Regelbasierte Auswertung der Nachrichten
  lib/criteria.ts       Abgleich mit den Objektkriterien
  lib/drafts.ts         Entwürfe für Rückfrage, Zusage, Absage
  lib/contract.ts       Mietvertragsgenerator
  lib/flow.ts           Der Vermietungsprozess als Datenstruktur
  lib/flip.ts           FLIP-Animation für die gefilterte Bewerberliste
  lib/storage.ts        Lokale Persistenz
  state/store.tsx       Objekte, Zustand, Navigation, Toasts
  data/seed.ts          Beide Wohnungen mit je fünf Beispielanfragen
  components/           Sidebar-Flow, Bewerberkarte, Diagramme, Intro, Modal
  pages/                Start, Wohnungen, Objekt, Inserat, Kanäle, Posteingang,
                        Bewerber, Nachrichten, Besichtigungen, Entscheidung, Vertrag
  brand/Logo.tsx        MietBlick-Logo als SVG
  brand/HouseProgress.tsx  Haus, das sich mit dem Fortschritt aufbaut
  styles.css            Design-System (#13283B · #3A9F75 · #FFFFFF)
```

Animationen laufen über CSS-Übergänge und die Web Animations API des Browsers –
keine Animationsbibliothek. `prefers-reduced-motion` wird überall respektiert:
Eröffnungsanimation, FLIP-Bewegung und Hausaufbau schalten sich dann ab.

Die Diagramm-Farben (`#3A9F75` erfüllt, `#B57D05` offen, `#A8322E` nicht erfüllt,
`#1C6A96` neutral) sind gegen Helligkeitsband, Farbsättigung, Farbsehschwäche und
Kontrast geprüft. Status wird nie über Farbe allein transportiert – immer mit
Punkt, Symbol und Beschriftung.

### Tests

```bash
node scripts/build.mjs && npx serve dist   # App bereitstellen
node scripts/abnahmetest.mjs               # Abnahmetest 1–39 im echten Browser
npx tsx scripts/check-extraction.mts       # Auswertungslogik gegen die Erwartungen
```

Der Abnahmetest fährt die komplette Journey über beide Wohnungen in Chromium
durch: Startanimation, Objektauswahl, Prozessablauf, Inseratbearbeitung,
Portalanbindung und Datenübernahme, Auswertung und Kriterienabgleich, Filter,
Rückfragen, Rücksprache, Reload-Persistenz, neue Anfrage, Termine, Entscheidung
mit Übersteuerung, Mietvertrag samt Download, FLIP-Animation, Kriterienmatrix,
Diagramm-Tooltips, Hausaufbau, Objektvergleich, tote Buttons und Console-Fehler.
