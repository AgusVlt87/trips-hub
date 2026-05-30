/**
 * TRIP CONFIGURATION — edit this file to customize the hub for any trip.
 * When using Claude Code, run: claude "Setup this hub for my trip to..."
 * Claude will fill every section below automatically.
 */

import type { TripConfig } from './types';

// ─── 1. Trip identity ─────────────────────────────────────────────────────────
export const TRIP_NAME    = 'Mi Viaje';         // e.g. "Japón 2026"
export const TRIP_EMOJI   = '✈️';               // emoji shown in the header
export const TRIP_TAGLINE = 'El viaje de mi vida';

// ─── 2. Cities / destinations ────────────────────────────────────────────────
// Add one entry per destination. Order = travel order.
// coord: [latitude, longitude]  — used for the map
export const CITIES: CityMap = {
  // Example — Claude Code replaces this block:
  //   ciudad1: { label: 'Tokio',  bg: '#E94B3C', soft: '#FEF2F2', coord: [35.6762, 139.6503], order: 0 },
  //   ciudad2: { label: 'Kyoto',  bg: '#8B5E3C', soft: '#FDF6EE', coord: [35.0116, 135.7681], order: 1 },
};

// ─── 3. Trip dates & nights ───────────────────────────────────────────────────
export const INIT_CONFIG: TripConfig = {
  startDate:  '2025-01-01',    // 'YYYY-MM-DD' — first day of the trip
  cityNights: {
    // ciudad1: 6,
    // ciudad2: 4,
  },
};

// ─── 4. Route segments (transport between cities) ────────────────────────────
export const ROUTE_SEGMENTS: RouteSegment[] = [
  // Example:
  // { from: 'ciudad1', to: 'ciudad2', mode: 'Tren', time: '2h 15min', distanceKm: 450 },
];

// ─── 5. Points of interest per city ──────────────────────────────────────────
export const DEFAULT_POIS: POI[] = [
  // Example:
  // { id: 'c1-1', city: 'ciudad1', name: 'Templo Senso-ji', category: 'monumento', coord: [35.7148, 139.7967], visited: false, notes: 'El templo más antiguo de Tokio.' },
];

// ─── 6. Links (videos, airbnbs, reservas, blogs) ─────────────────────────────
export const DEFAULT_LINKS: TripLink[] = [
  // Example:
  // { id: 'lv-1', city: 'ciudad1', title: 'Tokio — guía completa', url: 'https://youtu.be/...', category: 'video' },
];

// ─── 7. Daily itinerary templates ────────────────────────────────────────────
// One entry per overnight city. Activities shown in the itinerary tab.
export const CITY_TEMPLATES: Record<string, DayTemplate[]> = {
  // ciudad1: [
  //   { city: 'ciudad1', title: 'Llegada a Tokio', transport: 'Vuelo internacional', activities: ['Check-in', 'Paseo por Shinjuku'] },
  //   { city: 'ciudad1', title: 'Tokio clásico', activities: ['Senso-ji', 'Harajuku', 'Shibuya crossing'] },
  // ],
};

// ─── 8. Budget defaults (per person per night, EUR) ───────────────────────────
export const INIT_BUDGET: BudgetState = {
  // ciudad1: { airbnb: 80, food: 50, transport: 15, activities: 20, nights: 6 },
};

// ─── 9. Theme colors (auto-generated from CITIES, override here if needed) ───
// The app uses CITIES[city].bg for headers and CITIES[city].soft for backgrounds.
// bg: dark accent color (hex)   soft: light tint (hex)

// ─── Type re-exports (keep as-is) ────────────────────────────────────────────
export type { CityMap, RouteSegment, POI, TripLink, DayTemplate, BudgetState };
import type { CityMap, RouteSegment, POI, TripLink, DayTemplate, BudgetState } from './types';
