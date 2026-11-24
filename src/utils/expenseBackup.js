// Lógica pura del respaldo de gastos: cada gasto queda copiado en el celular hasta que el servidor
// lo confirma, para que nunca se pierda.
//
// entrada: { tripId, expenseId, writeId, isNew, payload, savedAt, status: 'pending' | 'failed', error }
// payload: datos del gasto con la fecha como texto ISO.

export function putEntry(list, entry) {
  const previous = list.find((e) => e.expenseId === entry.expenseId);
  // Editar un gasto nuevo que todavía no se confirmó: para el servidor sigue siendo nuevo.
  const isNew = entry.isNew || !!(previous && previous.isNew);
  return [
    ...list.filter((e) => e.expenseId !== entry.expenseId),
    { ...entry, isNew, status: 'pending', error: '' },
  ];
}

// Solo si es la misma escritura: la confirmación de una anterior no borra el respaldo de la última.
export function confirmEntry(list, expenseId, writeId) {
  return list.filter((e) => e.expenseId !== expenseId || e.writeId !== writeId);
}

export function failEntry(list, expenseId, writeId, error) {
  return list.map((e) =>
    e.expenseId === expenseId && e.writeId === writeId ? { ...e, status: 'failed', error } : e
  );
}

export function dropEntry(list, expenseId) {
  return list.filter((e) => e.expenseId !== expenseId);
}

// Qué hacer con una entrada pendiente según lo que hay en el servidor.
// server: null si no existe, o { writeId, updatedAtMs }
export function decideEntry(entry, server) {
  if (!server) return entry.isNew ? 'rewrite' : 'missing';
  if (server.writeId === entry.writeId) return 'confirmed';
  // Alguien lo cambió después: gana la última escritura.
  if ((server.updatedAtMs || 0) > entry.savedAt) return 'superseded';
  return 'rewrite';
}

export const failedOf = (list, tripId) => list.filter((e) => e.status === 'failed' && e.tripId === tripId);
