import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bookingDate, bookingMapsLink, flightSummary, phoneLink, splitBookings } from '../src/utils/bookings.js';
import { itemsOfList, missingFromTemplate, normalizeText, progressOf } from '../src/utils/checklist.js';
import {
  albumOf,
  baseName,
  cacheName,
  chunk,
  documentsOf,
  exportName,
  filesOfBooking,
  formatSize,
  mergeFiles,
  storagePaths,
} from '../src/utils/files.js';
import {
  dayKey,
  formatDayRelative,
  formatDayShort,
  groupActivities,
  insertOrder,
  mapsLink,
  nextActivity,
  normalizeUrl,
  orderUpdates,
  tripDays,
} from '../src/utils/itinerary.js';
import {
  addToIndex,
  indexSummary,
  isDownloaded,
  planDownloads,
  removeFromIndex,
} from '../src/utils/downloads.js';
import { confirmEntry, decideEntry, dropEntry, failEntry, failedOf, putEntry } from '../src/utils/expenseBackup.js';
import { cleanOptions, tallyPoll } from '../src/utils/polls.js';
import { dragTargetIndex, moveItem } from '../src/utils/reorder.js';
import { computeBalances, simplifyDebts, splitCents } from '../src/utils/settle.js';
import { sortTasks, taskSummary } from '../src/utils/tasks.js';
import { createWriteTracker } from '../src/utils/writeTracker.js';

const ids = (list) => list.map((x) => x.id);

// --- Itinerario ---------------------------------------------------------------

test('días del viaje: incluye salida y regreso, cruza de mes y contempla años bisiestos', () => {
  assert.deepEqual(tripDays(new Date(2027, 1, 26, 23, 50), new Date(2027, 2, 1, 0, 10)), [
    '2027-02-26',
    '2027-02-27',
    '2027-02-28',
    '2027-03-01',
  ]);
  assert.deepEqual(tripDays(new Date(2028, 1, 28), new Date(2028, 2, 1)), ['2028-02-28', '2028-02-29', '2028-03-01']);
  assert.deepEqual(tripDays(new Date(2027, 0, 5, 8), new Date(2027, 0, 5, 20)), ['2027-01-05']);
  assert.deepEqual(tripDays(null, null), []);
  assert.equal(tripDays(new Date(2020, 0, 1), new Date(2030, 0, 1)).length, 120);
});

test('fechas como texto', () => {
  assert.equal(dayKey(new Date(2027, 1, 6, 0, 0)), '2027-02-06');
  assert.equal(formatDayShort('2027-02-26'), 'Vie 26/2');
  const now = new Date(2027, 1, 28, 12);
  assert.equal(formatDayRelative('2027-02-28', now), 'Hoy');
  assert.equal(formatDayRelative('2027-03-01', now), 'Mañana');
  assert.equal(formatDayRelative('2027-03-02', now), 'Martes 2/3');
});

test('agrupa en ideas, días y fuera de las fechas', () => {
  const acts = [
    { id: 'b', day: '2027-02-26', order: 2000 },
    { id: 'a', day: '2027-02-26', order: 1000 },
    { id: 'i', day: null, order: 1 },
    { id: 'x', day: '2027-04-01', order: 1 },
  ];
  const g = groupActivities(acts, ['2027-02-26', '2027-02-27']);
  assert.deepEqual(ids(g.byDay['2027-02-26']), ['a', 'b']);
  assert.deepEqual(g.byDay['2027-02-27'], []);
  assert.deepEqual(ids(g.ideas), ['i']);
  assert.deepEqual(ids(g.outOfRange), ['x']);
});

test('ubica una actividad nueva según la hora', () => {
  const list = [
    { time: '09:00', order: 1000 },
    { time: null, order: 2000 },
    { time: '20:00', order: 3000 },
  ];
  assert.equal(insertOrder([], '10:00'), 1000);
  assert.equal(insertOrder(list, '08:00'), 0);
  assert.equal(insertOrder(list, '12:00'), 2500);
  assert.equal(insertOrder(list, '22:00'), 4000);
  assert.equal(insertOrder(list, null), 4000);
});

test('reordenar solo escribe lo que cambió', () => {
  const list = [
    { id: 'a', order: 1000 },
    { id: 'b', order: 2000 },
    { id: 'c', order: 3000 },
  ];
  assert.deepEqual(orderUpdates(list), []);
  assert.deepEqual(orderUpdates(moveItem(list, 2, 1)), [
    { id: 'c', order: 2000 },
    { id: 'b', order: 3000 },
  ]);
});

test('próxima actividad', () => {
  const now = new Date(2027, 1, 26, 15, 0);
  const a = (id, day, time, order, status = 'idea') => ({ id, day, time, order, status });
  assert.equal(nextActivity([], now), null);
  assert.equal(nextActivity([a('i', null, null, 1)], now), null);
  assert.equal(nextActivity([a('ayer', '2027-02-25', '20:00', 1)], now), null);
  // Pasó hace más de una hora: se saltea; empezó hace menos: sigue siendo la próxima
  assert.equal(nextActivity([a('1', '2027-02-26', '13:00', 1), a('2', '2027-02-26', '20:00', 2)], now).id, '2');
  assert.equal(nextActivity([a('1', '2027-02-26', '14:30', 1), a('2', '2027-02-26', '20:00', 2)], now).id, '1');
  // Hecha: se saltea. Mañana viene después de hoy aunque tenga menor orden
  assert.equal(
    nextActivity([a('m', '2027-02-27', null, 0), a('h', '2027-02-26', null, 5), a('x', '2027-02-26', null, 1, 'hecho')], now).id,
    'h'
  );
  // Apenas pasada la medianoche
  assert.equal(nextActivity([a('t', '2027-02-27', '09:00', 1)], new Date(2027, 1, 27, 0, 20)).id, 't');
});

test('links de Maps', () => {
  assert.equal(normalizeUrl('  '), '');
  assert.equal(normalizeUrl('maps.app.goo.gl/abc'), 'https://maps.app.goo.gl/abc');
  assert.equal(normalizeUrl('https://maps.app.goo.gl/abc'), 'https://maps.app.goo.gl/abc');
  assert.equal(normalizeUrl('javascript:alert(1)'), null);
  assert.equal(normalizeUrl('hola'), null);
  assert.equal(mapsLink({ place: '' }), null);
  assert.equal(mapsLink({ mapsUrl: 'https://goo.gl/x', place: 'Otro' }), 'https://goo.gl/x');
  assert.equal(
    mapsLink({ place: 'Bodega Ñandú & Cía' }, 'Mendoza'),
    'https://www.google.com/maps/search/?api=1&query=Bodega%20%C3%91and%C3%BA%20%26%20C%C3%ADa%2C%20Mendoza'
  );
});

test('arrastrar: posición destino con altos distintos', () => {
  const h = [100, 50, 100];
  assert.equal(dragTargetIndex(h, 0, 0, 10), 0);
  assert.equal(dragTargetIndex(h, 0, 30, 10), 0);
  assert.equal(dragTargetIndex(h, 0, 40, 10), 1);
  assert.equal(dragTargetIndex(h, 0, 500, 10), 2);
  assert.equal(dragTargetIndex(h, 2, -90, 10), 1);
  assert.equal(dragTargetIndex(h, 2, -500, 10), 0);
  assert.equal(dragTargetIndex(h, 1, -70, 10), 0);
  assert.equal(dragTargetIndex(h, -1, 50, 10), -1);
});

// --- Votaciones ---------------------------------------------------------------

test('opciones limpias y conteo de votos', () => {
  const options = cleanOptions([' Catena ', '', 'catena', 'Zuccardi']);
  assert.deepEqual(options, [
    { id: 'o1', text: 'Catena' },
    { id: 'o2', text: 'Zuccardi' },
  ]);
  const win = tallyPoll({ options, votes: { u1: 'o1', u2: 'o2', u3: 'o2', u4: 'inexistente' } });
  assert.equal(win.total, 3);
  assert.deepEqual(ids(win.winners), ['o2']);
  assert.deepEqual(win.options[1].voters, ['u2', 'u3']);
  assert.deepEqual(ids(tallyPoll({ options, votes: { u1: 'o1', u2: 'o2' } }).winners), ['o1', 'o2']);
  assert.deepEqual(tallyPoll({ options, votes: {} }).winners, []);
});

// --- Equipaje y tareas --------------------------------------------------------

test('equipaje: listas, progreso y plantillas sin repetir', () => {
  const items = [
    { text: 'Cepillo', scope: 'shared', ownerId: null, done: true },
    { text: 'MALLA', scope: 'personal', ownerId: 'u1', done: false },
    { text: 'Toallón', scope: 'personal', ownerId: 'u2', done: true },
  ];
  assert.equal(itemsOfList(items, 'shared').length, 1);
  assert.deepEqual(itemsOfList(items, 'u1').map((i) => i.text), ['MALLA']);
  assert.deepEqual(progressOf(items), { done: 2, total: 3, ratio: 2 / 3 });
  assert.deepEqual(progressOf([]), { done: 0, total: 0, ratio: 0 });
  assert.equal(normalizeText('  Batería   EXTERNA '), 'bateria externa');
  assert.deepEqual(missingFromTemplate(['Malla', 'Ojotas', 'ojotas'], itemsOfList(items, 'u1')), ['Ojotas']);
});

test('tareas: pendientes primero y resumen', () => {
  const tasks = [
    { id: 'a', done: true, assigneeId: 'u1', t: 1 },
    { id: 'b', done: false, assigneeId: 'u1', t: 3 },
    { id: 'c', done: false, assigneeId: null, t: 2 },
  ];
  assert.deepEqual(ids(sortTasks(tasks, (x) => x.t)), ['c', 'b', 'a']);
  assert.deepEqual(taskSummary(tasks, 'u1'), { total: 3, done: 1, pending: 2, mine: 1 });
});

// --- Reservas y contactos -----------------------------------------------------

test('reservas en orden cronológico, separando las que ya pasaron', () => {
  const b = (id, day, time) => ({ id, day, time, title: id });
  const { upcoming, past } = splitBookings(
    [b('cena', '2027-02-26', '21:00'), b('vuelo', '2027-02-26', '08:30'), b('hotel', '2027-02-26', null),
      b('vuelta', '2027-03-02', '19:00'), b('auto', '2027-02-25', '10:00')],
    '2027-02-26'
  );
  assert.deepEqual(upcoming.map((g) => [g.day, ids(g.items)]), [
    ['2027-02-26', ['hotel', 'vuelo', 'cena']],
    ['2027-03-02', ['vuelta']],
  ]);
  assert.deepEqual(past.map((g) => ids(g.items)), [['auto']]);
  assert.deepEqual(splitBookings([], '2027-02-26'), { upcoming: [], past: [] });
});

test('datos del vuelo y Maps de una reserva', () => {
  assert.equal(
    flightSummary({ airline: 'Aerolíneas', number: 'AR1234', terminal: 'A', gate: '12' }),
    'Aerolíneas AR1234 · Terminal A · Puerta 12'
  );
  assert.equal(flightSummary({ airline: '', number: 'AR1', terminal: '', gate: '' }), 'AR1');
  assert.equal(flightSummary(null), '');
  assert.equal(bookingMapsLink({ address: '', mapsUrl: '' }), null);
  assert.equal(
    bookingMapsLink({ address: 'Aeroparque', mapsUrl: '' }),
    'https://www.google.com/maps/search/?api=1&query=Aeroparque'
  );
});

test('teléfonos', () => {
  assert.equal(phoneLink('+54 9 (261) 555-1234'), 'tel:+5492615551234');
  assert.equal(phoneLink('911'), 'tel:911');
  assert.equal(phoneLink('*611#'), 'tel:*611%23');
  assert.equal(phoneLink('hola'), null);
  assert.equal(phoneLink('261 555 int. 4'), null);
  assert.equal(phoneLink(''), null);
  assert.equal(phoneLink('+'), null);
});

// --- Archivos -----------------------------------------------------------------

test('rutas en Storage según la visibilidad', () => {
  const base = { tripId: 't1', uid: 'u1', fileId: 'f1' };
  assert.deepEqual(storagePaths({ ...base, visibility: 'private', contentType: 'image/jpeg', withThumb: true }), {
    path: 'trips/t1/private/u1/f1.jpg',
    thumbPath: 'trips/t1/private/u1/f1_mini.jpg',
  });
  assert.deepEqual(storagePaths({ ...base, visibility: 'group', contentType: 'application/pdf', withThumb: false }), {
    path: 'trips/t1/group/u1/f1.pdf',
    thumbPath: null,
  });
  assert.notEqual(cacheName('trips/t1/group/u1/f1.jpg'), cacheName('trips/t2/group/u1/f1.jpg'));
});

test('nombres y tamaños', () => {
  assert.equal(baseName('IMG_2031.HEIC'), 'IMG_2031');
  assert.equal(baseName('Voucher hotel v1.2.pdf'), 'Voucher hotel v1.2');
  assert.equal(baseName(null), '');
  assert.equal(formatSize(900), '900 B');
  assert.equal(formatSize(51200), '50 KB');
  assert.equal(formatSize(1572864), '1,5 MB');
  assert.equal(formatSize(10485760), '10 MB');
  assert.equal(
    exportName({ id: 'abcdefgh', name: 'Ticket: cena/bar?', contentType: 'image/jpeg' }),
    'Ticket- cena-bar--abcdef.jpg'
  );
  assert.equal(exportName({ id: 'abcdefgh', name: '', contentType: 'application/pdf' }), 'archivo-abcdef.pdf');
});

test('junta archivos del grupo y propios sin repetir, y los separa por uso', () => {
  const g = [
    { id: 'a', kind: 'album' },
    { id: 'b', kind: 'documento', bookingId: 'r1' },
    { id: 't', kind: 'ticket', bookingId: 'r1' },
  ];
  const all = mergeFiles(g, [{ id: 'b', kind: 'documento', bookingId: 'r1' }, { id: 'p', kind: 'documento', bookingId: null }]);
  assert.deepEqual(ids(all), ['a', 'b', 't', 'p']);
  assert.deepEqual(ids(albumOf(all)), ['a']);
  assert.deepEqual(ids(documentsOf(all)), ['b', 't', 'p']);
  assert.deepEqual(ids(filesOfBooking(all, 'r1')), ['b']);
  assert.deepEqual(chunk([1, 2, 3, 4], 3), [[1, 2, 3], [4]]);
});

test('fecha del vuelo para la cuenta regresiva', () => {
  assert.equal(bookingDate('2027-02-26', '08:05').getTime(), new Date(2027, 1, 26, 8, 5).getTime());
});

// --- Dinero (v1): que siga cerrando en cero -----------------------------------

test('los saldos suman cero y las transferencias los cancelan', () => {
  assert.deepEqual(splitCents(10000, ['a', 'b', 'c']), { a: 3334, b: 3333, c: 3333 });
  const bal = computeBalances(
    ['a', 'b', 'c', 'd'],
    [
      { amount: 100.01, paidBy: 'a', splitBetween: ['a', 'b', 'c'] },
      { amount: 77.77, paidBy: 'd', splitBetween: [] },
    ],
    [{ from: 'b', to: 'a', amount: 10 }]
  );
  assert.equal(Object.values(bal).reduce((x, y) => x + y, 0), 0);
  simplifyDebts(bal).forEach((t) => {
    bal[t.from] += t.amount;
    bal[t.to] -= t.amount;
  });
  assert.deepEqual(Object.values(bal), [0, 0, 0, 0]);
});

// --- Sin conexión ---------------------------------------------------------------

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
function makeTracker(online) {
  const log = { pending: [], late: [] };
  const tracker = createWriteTracker({
    isOnline: () => online,
    onChange: (n) => log.pending.push(n),
    onLateError: (e) => log.late.push(e.message),
    waitMs: 40,
    offlineWaitMs: 5,
  });
  return { tracker, log };
}

test('escrituras: con señal espera al servidor; sin señal sigue y queda pendiente', async () => {
  const on = makeTracker(true);
  const a = deferred();
  const tracked = on.tracker.track(a.promise);
  assert.equal(on.tracker.pending(), 1);
  a.resolve();
  assert.deepEqual(await tracked, { queued: false });
  assert.equal(on.tracker.pending(), 0);

  const off = makeTracker(false);
  const b = deferred();
  assert.deepEqual(await off.tracker.track(b.promise), { queued: true });
  assert.equal(off.tracker.pending(), 1); // sigue pendiente hasta que confirme el servidor
  b.resolve();
  await wait(1);
  assert.equal(off.tracker.pending(), 0);
  assert.deepEqual(off.log.late, []);
});

test('escrituras: un rechazo inmediato va al formulario; uno tardío se avisa aparte', async () => {
  const now = makeTracker(true);
  await assert.rejects(now.tracker.track(Promise.reject(new Error('no'))), /no/);
  assert.deepEqual(now.log.late, []);
  assert.equal(now.tracker.pending(), 0);

  const late = makeTracker(false);
  const d = deferred();
  await late.tracker.track(d.promise);
  d.reject(new Error('rechazado'));
  await wait(1);
  assert.deepEqual(late.log.late, ['rechazado']);
  assert.equal(late.tracker.pending(), 0);
});

test('escrituras: con señal muy lenta no deja esperando para siempre', async () => {
  const { tracker } = makeTracker(true);
  assert.deepEqual(await tracker.track(new Promise(() => {})), { queued: true });
});

test('respaldo de gastos: no se pierde ni se confirma por error', () => {
  const e = (writeId, isNew = true, savedAt = 100) => ({ tripId: 't', expenseId: 'x', writeId, isNew, payload: {}, savedAt });
  let list = putEntry([], e('w1'));
  assert.equal(list[0].status, 'pending');
  // Editar antes de que se confirme: reemplaza el respaldo y sigue siendo un gasto nuevo
  list = putEntry(list, e('w2', false));
  assert.equal(list.length, 1);
  assert.equal(list[0].isNew, true);
  // La confirmación de la primera versión no borra el respaldo de la segunda
  assert.equal(confirmEntry(list, 'x', 'w1').length, 1);
  assert.equal(confirmEntry(list, 'x', 'w2').length, 0);
  const failed = failEntry(list, 'x', 'w2', 'sin permiso');
  assert.equal(failedOf(failed, 't').length, 1);
  assert.equal(failedOf(failed, 'otro').length, 0);
  assert.equal(failedOf(failEntry(list, 'x', 'w1', 'viejo'), 't').length, 0);
  assert.deepEqual(dropEntry(failed, 'x'), []);
});

test('respaldo de gastos: qué hacer al volver la señal', () => {
  const entry = { writeId: 'w', isNew: true, savedAt: 100 };
  assert.equal(decideEntry(entry, null), 'rewrite');
  assert.equal(decideEntry({ ...entry, isNew: false }, null), 'missing');
  assert.equal(decideEntry(entry, { writeId: 'w', updatedAtMs: 50 }), 'confirmed');
  assert.equal(decideEntry(entry, { writeId: 'otro', updatedAtMs: 200 }), 'superseded');
  assert.equal(decideEntry(entry, { writeId: 'otro', updatedAtMs: 50 }), 'rewrite');
  assert.equal(decideEntry(entry, { updatedAtMs: 50 }), 'rewrite'); // gasto de la v1, sin writeId
});

test('descargas: qué bajar y qué borrar', () => {
  const doc = { id: 'd', kind: 'documento', path: 'p/d.jpg', thumbPath: 'p/d_mini.jpg', size: 1000 };
  const pdf = { id: 'f', kind: 'documento', path: 'p/f.pdf', thumbPath: null, size: 500 };
  const photo = { id: 'a', kind: 'album', path: 'p/a.jpg', thumbPath: 'p/a_mini.jpg', size: 9 };
  const ticket = { id: 't', kind: 'ticket', path: 'p/t.jpg', thumbPath: 'p/t_mini.jpg', size: 9 };
  const base = { tripId: 't1', auto: true, synced: true };

  let plan = planDownloads({ ...base, files: [doc, pdf, photo, ticket], index: {} });
  assert.deepEqual(ids(plan.download), ['d', 'f']);
  assert.deepEqual(planDownloads({ ...base, auto: false, files: [doc], index: {} }).download, []);

  let index = addToIndex({}, doc, 't1');
  assert.equal(isDownloaded(index, doc), true);
  assert.equal(isDownloaded({ 'p/d.jpg': {} }, doc), false); // falta la miniatura
  index = addToIndex(addToIndex(index, pdf, 't1'), photo, 't2');
  assert.deepEqual(indexSummary(index), { files: 3, bytes: 1509 });

  // pdf se borró del viaje t1: se limpia. Lo del viaje t2 no se toca
  plan = planDownloads({ ...base, files: [doc], index });
  assert.deepEqual(plan, { download: [], remove: ['p/f.pdf'] });
  // Si la lista no vino del servidor, no se borra nada
  assert.deepEqual(planDownloads({ ...base, synced: false, files: [], index }).remove, []);
  assert.equal(isDownloaded(removeFromIndex(index, ['p/d.jpg']), doc), false);
});
