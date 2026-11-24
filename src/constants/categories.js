export const CATEGORIES = [
  { id: 'comida', label: 'Comida', icon: 'silverware-fork-knife' },
  { id: 'transporte', label: 'Transporte', icon: 'car' },
  { id: 'alojamiento', label: 'Alojamiento', icon: 'bed' },
  { id: 'salidas', label: 'Salidas', icon: 'glass-cocktail' },
  { id: 'compras', label: 'Compras', icon: 'shopping' },
  { id: 'otros', label: 'Otros', icon: 'dots-horizontal-circle' },
];

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
