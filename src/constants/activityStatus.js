export const ACTIVITY_STATUS = [
  { id: 'idea', label: 'Idea', icon: 'lightbulb-outline' },
  { id: 'reservado', label: 'Reservado', icon: 'bookmark-check-outline' },
  { id: 'hecho', label: 'Hecho', icon: 'check-circle-outline' },
];

export function statusById(id) {
  return ACTIVITY_STATUS.find((s) => s.id === id) || ACTIVITY_STATUS[0];
}
