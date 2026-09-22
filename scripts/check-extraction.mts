/** Selbsttest der Auswertung: Pflichtangaben, Zusatzangaben, Kriterien. */
import { extract } from '../src/lib/extract';
import { evaluateCriteria } from '../src/lib/criteria';
import { seedState } from '../src/data/seed';

let failed = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual); const e = JSON.stringify(expected);
  const ok = a === e; if (!ok) failed += 1;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}: ${a}${ok ? '' : ` (erwartet ${e})`}`);
}

const state = seedState();
for (const pid of state.propertyOrder) {
  const p = state.properties[pid];
  console.log(`\n══ ${p.listing.title} (max ${p.listing.criteria.maxPersons} Pers., Haustiere ${p.listing.criteria.petsAllowed ? 'erlaubt' : 'nein'}, ${p.listing.criteria.smokingAllowed ? 'Rauchen ok' : 'Nichtraucher'}) ══`);
  const exs = p.applicants.map(a => ({ a, ex: extract(a.message, a.displayName, p.listing.required) }));
  for (const { a, ex } of exs) {
    const cr = evaluateCriteria(ex, p.listing.criteria);
    console.log(`  ${a.displayName.padEnd(16)} pers=${String(ex.persons).padEnd(4)} einzug=${String(ex.moveIn).padEnd(11)} raucher=${String(ex.smoker).padEnd(5)} tiere=${String(ex.pets?.has ?? null).padEnd(5)} schufa=${String(ex.schufa).padEnd(5)} | ${ex.statusLabel.padEnd(22)} | ${cr.state.padEnd(14)} ${cr.summary}`);
  }
  check(`${pid} – ausgewertet`, exs.length, 5);
  check(`${pid} – vollständig`, exs.filter(x => x.ex.state === 'vollstaendig').length, 3);
  check(`${pid} – Klärungsbedarf`, exs.filter(x => x.ex.state === 'klaerung').length, 2);
}

console.log('\n══ München im Detail ══');
const m = state.properties.muenchen;
const mx = Object.fromEntries(m.applicants.map(a => [a.displayName, extract(a.message, a.displayName, m.listing.required)]));
check('Anna – vollständig', mx['Anna Weber'].state, 'vollstaendig');
check('Anna – Nichtraucherin', mx['Anna Weber'].smoker, false);
check('Anna – keine Tiere', mx['Anna Weber'].pets, { has: false, kind: null });
check('Anna – SCHUFA', mx['Anna Weber'].schufa, true);
check('Anna – Kriterien', evaluateCriteria(mx['Anna Weber'], m.listing.criteria).state, 'erfuellt');
check('Ben – fehlt', mx['Ben Keller'].missing, ['Einzugstermin']);
check('Ben – SCHUFA offen', mx['Ben Keller'].schufa, null);
check('Ben – Kriterien offen', evaluateCriteria(mx['Ben Keller'], m.listing.criteria).state, 'offen');
check('Clara – Widerspruch', mx['Clara Neumann'].conflicts.length, 1);
check('Clara – Katze', mx['Clara Neumann'].pets, { has: true, kind: 'Katze' });
check('Clara – Kriterium verletzt', evaluateCriteria(mx['Clara Neumann'], m.listing.criteria).state, 'nicht_erfuellt');
check('David – 3 Personen', mx['David Fischer'].persons, 3);
check('David – Kriterien', evaluateCriteria(mx['David Fischer'], m.listing.criteria).state, 'erfuellt');
check('Eva – Raucherin', mx['Eva Sommer'].smoker, true);
check('Eva – Kriterium verletzt', evaluateCriteria(mx['Eva Sommer'], m.listing.criteria).state, 'nicht_erfuellt');

console.log('\n══ Dachau im Detail ══');
const d = state.properties.dachau;
const dx = Object.fromEntries(d.applicants.map(a => [a.displayName, extract(a.message, a.displayName, d.listing.required)]));
check('Jonas – Kriterien', evaluateCriteria(dx['Jonas Reiter'], d.listing.criteria).state, 'erfuellt');
check('Mira – 4 Personen', dx['Mira Schuster'].persons, 4);
check('Mira – Belegung verletzt', evaluateCriteria(dx['Mira Schuster'], d.listing.criteria).state, 'nicht_erfuellt');
check('Tobias – Hund', dx['Tobias Lang'].pets, { has: true, kind: 'Hund' });
check('Tobias – Hund erlaubt', evaluateCriteria(dx['Tobias Lang'], d.listing.criteria).checks.find(c => c.key === 'pets')!.state, 'erfuellt');
check('Tobias – Einzug fehlt', dx['Tobias Lang'].missing, ['Einzugstermin']);
check('Sina – Widerspruch', dx['Sina Kraus'].conflicts.length, 1);
check('Noah – Raucher', dx['Noah Brandt'].smoker, true);
check('Noah – Kriterium verletzt', evaluateCriteria(dx['Noah Brandt'], d.listing.criteria).state, 'nicht_erfuellt');

console.log('\n══ Live-Test ══');
const max = extract('Hallo, ich heiße Max Mustermann. Sie erreichen mich unter max@example.de. Ich möchte die Wohnung zusammen mit meiner Freundin beziehen. Viele Grüße');
check('Max – Name', max.name, 'Max Mustermann');
check('Max – Personen', max.persons, 2);
check('Max – Einzug fehlt', max.moveIn, null);
check('Max – nächster Schritt', max.nextStep, 'Einzugstermin erfragen');
check('Max – Zusatzangaben offen', max.missingExtra, ['Raucher', 'Haustiere', 'SCHUFA']);

console.log(failed === 0 ? '\n✓ Alle Erwartungen erfüllt.' : `\n✗ ${failed} Abweichung(en).`);
process.exit(failed === 0 ? 0 : 1);
