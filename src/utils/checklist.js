// Lógica pura del equipaje.

// Minúsculas, sin tildes y con espacios simples, para comparar textos.
export function normalizeText(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

// listId: 'shared' (compartida) o el uid de quien es la lista personal.
export function itemsOfList(items, listId) {
  return listId === 'shared'
    ? items.filter((i) => i.scope === 'shared')
    : items.filter((i) => i.scope === 'personal' && i.ownerId === listId);
}

export function progressOf(items) {
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, ratio: items.length ? done / items.length : 0 };
}

// Textos de la plantilla que todavía no están en la lista (sin distinguir tildes ni mayúsculas).
export function missingFromTemplate(templateItems, existing) {
  const have = new Set(existing.map((i) => normalizeText(i.text)));
  return templateItems.filter((text) => {
    const key = normalizeText(text);
    if (have.has(key)) return false;
    have.add(key);
    return true;
  });
}
