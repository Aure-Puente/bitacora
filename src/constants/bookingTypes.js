export const BOOKING_TYPES = [
  { id: 'vuelo', label: 'Vuelo', icon: 'airplane' },
  { id: 'alojamiento', label: 'Alojamiento', icon: 'bed-outline' },
  { id: 'excursion', label: 'Excursión', icon: 'hiking' },
  { id: 'auto', label: 'Auto', icon: 'car-outline' },
  { id: 'otro', label: 'Otro', icon: 'ticket-confirmation-outline' },
];

export function bookingTypeById(id) {
  return BOOKING_TYPES.find((t) => t.id === id) || BOOKING_TYPES[BOOKING_TYPES.length - 1];
}
