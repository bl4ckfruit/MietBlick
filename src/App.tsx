import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Intro, useIntro } from './components/Intro';
import { useStore } from './state/store';
import { StartPage } from './pages/StartPage';
import { WohnungenPage } from './pages/WohnungenPage';
import { ObjektPage } from './pages/ObjektPage';
import { InseratPage } from './pages/InseratPage';
import { KanaelePage } from './pages/KanaelePage';
import { InboxPage } from './pages/InboxPage';
import { BewerberPage } from './pages/BewerberPage';
import { NachrichtenPage } from './pages/NachrichtenPage';
import { BesichtigungenPage } from './pages/BesichtigungenPage';
import { EntscheidungPage } from './pages/EntscheidungPage';
import { VertragPage } from './pages/VertragPage';
import { IconCheck } from './components/icons';

function Toasts() {
  const { toasts, dismissToast } = useStore();
  if (toasts.length === 0) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id} data-testid="toast">
          <span className="toast-icon">
            <IconCheck />
          </span>
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Hinweis schließen"
            onClick={() => dismissToast(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

/** Seiten, die ein geöffnetes Objekt brauchen. */
const NEEDS_PROPERTY = new Set([
  'objekt',
  'inserat',
  'kanaele',
  'inbox',
  'bewerber',
  'nachrichten',
  'besichtigungen',
  'entscheidung',
  'vertrag',
]);

export function App() {
  const { route, property, navigate } = useStore();
  const intro = useIntro();

  // Direkter Aufruf einer Objektseite ohne geöffnetes Objekt -> zurück zur Auswahl.
  useEffect(() => {
    if (NEEDS_PROPERTY.has(route) && !property) navigate('start');
  }, [route, property, navigate]);

  const inApp = Boolean(property) && (NEEDS_PROPERTY.has(route) || route === 'wohnungen');

  return (
    <>
      {intro.visible && <Intro onSkip={intro.skip} />}

      {inApp ? (
        <div className="app">
          <Sidebar />
          <main className="app-main" data-route={route}>
            {route === 'objekt' && <ObjektPage />}
            {route === 'inserat' && <InseratPage />}
            {route === 'kanaele' && <KanaelePage />}
            {route === 'inbox' && <InboxPage />}
            {route === 'bewerber' && <BewerberPage />}
            {route === 'nachrichten' && <NachrichtenPage />}
            {route === 'besichtigungen' && <BesichtigungenPage />}
            {route === 'entscheidung' && <EntscheidungPage />}
            {route === 'vertrag' && <VertragPage />}
            {route === 'wohnungen' && <WohnungenPage />}
          </main>
        </div>
      ) : (
        <main className="app-plain" data-route={route}>
          {route === 'wohnungen' ? <WohnungenPage /> : <StartPage />}
        </main>
      )}

      <Toasts />
    </>
  );
}
