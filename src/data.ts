/**
 * Compatibility bridge — re-exports trip.config.ts under the names
 * components expect. Do not add trip-specific logic here.
 */
import type { GastoCategory, Booking } from './types';
export { CITIES, INIT_CONFIG, INIT_BUDGET, DEFAULT_POIS, DEFAULT_LINKS, ROUTE_SEGMENTS } from './trip.config';

// Derive CITY_ORDER from CITIES (sorted by .order)
import { CITIES } from './trip.config';
export const CITY_ORDER = Object.entries(CITIES)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([k]) => k);

// Gasto categories — static, not trip-specific
export const GASTO_CATEGORIES: Record<GastoCategory, { icon: string; label: string; color: string }> = {
  alojamiento:  { icon: '🏠', label: 'Alojamiento',  color: '#7B341E' },
  comida:       { icon: '🍽️', label: 'Comida',        color: '#276749' },
  transporte:   { icon: '🚌', label: 'Transporte',    color: '#2B6CB0' },
  actividades:  { icon: '🎭', label: 'Actividades',   color: '#6B46C1' },
  compras:      { icon: '🛍️', label: 'Compras',       color: '#97266D' },
  bares:        { icon: '🍺', label: 'Bares',         color: '#B7791F' },
  farmacia:     { icon: '💊', label: 'Farmacia',      color: '#C53030' },
  comunicacion: { icon: '📱', label: 'Comunicación',  color: '#2C7A7B' },
  otro:         { icon: '🌀', label: 'Otro',           color: '#718096' },
};

// Bookings — empty by default; Claude Code can populate per trip
export const BOOKINGS: Booking[] = [];
