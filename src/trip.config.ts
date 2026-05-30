/**
 * TRIP CONFIGURATION — edit this file to customize the hub for any trip.
 * When using Claude Code, run: claude "Setup this hub for my trip to..."
 * Claude will fill every section below automatically.
 */

import type { TripConfig, CityMap, RouteSegment, POI, TripLink, DayTemplate, BudgetState } from './types';

// ─── 1. Trip identity ─────────────────────────────────────────────────────────
export const TRIP_NAME    = 'Japón 2026';
export const TRIP_EMOJI   = '🗾';
export const TRIP_TAGLINE = 'Templos, ramen y Shinkansen';

// ─── 2. Cities / destinations ────────────────────────────────────────────────
export const CITIES: CityMap = {
  tokyo:  { label: 'Tokio',  bg: '#C0392B', soft: '#FEF2F2', coord: [35.6762, 139.6503], order: 0 },
  kyoto:  { label: 'Kioto',  bg: '#7B5E3C', soft: '#FDF6EE', coord: [35.0116, 135.7681], order: 1 },
  osaka:  { label: 'Osaka',  bg: '#1A6BAA', soft: '#EBF5FF', coord: [34.6937, 135.5023], order: 2 },
};

// ─── 3. Trip dates & nights ───────────────────────────────────────────────────
export const INIT_CONFIG: TripConfig = {
  startDate:  '2026-03-20',
  cityNights: { tokyo: 6, kyoto: 4, osaka: 3 },
};

// ─── 4. Route segments ───────────────────────────────────────────────────────
export const ROUTE_SEGMENTS: RouteSegment[] = [
  { from: 'tokyo', to: 'kyoto', mode: 'Tren', time: '2h 15min', distanceKm: 450 },
  { from: 'kyoto', to: 'osaka', mode: 'Tren', time: '15min',    distanceKm: 75  },
];

// ─── 5. Points of interest ───────────────────────────────────────────────────
export const DEFAULT_POIS: POI[] = [
  // Tokio
  { id: 'tok-1', city: 'tokyo', name: 'Templo Senso-ji',       category: 'monumento',  coord: [35.7148, 139.7967], visited: false, notes: 'El templo más antiguo de Tokio. Ir temprano para evitar multitudes.' },
  { id: 'tok-2', city: 'tokyo', name: 'Shibuya Crossing',       category: 'otro',       coord: [35.6595, 139.7004], visited: false, notes: 'El cruce peatonal más transitado del mundo. Mejor desde el piso de arriba del Starbucks.' },
  { id: 'tok-3', city: 'tokyo', name: 'Shinjuku Gyoen',         category: 'otro',       coord: [35.6852, 139.7100], visited: false, notes: 'Parque nacional. En marzo los cerezos están en flor. Entrada ¥500.' },
  { id: 'tok-4', city: 'tokyo', name: 'Harajuku — Takeshita St', category: 'compras',   coord: [35.6702, 139.7027], visited: false, notes: 'Moda alternativa japonesa, crepes y cultura pop.' },
  { id: 'tok-5', city: 'tokyo', name: 'Tsukiji Outer Market',   category: 'restaurante', coord: [35.6654, 139.7707], visited: false, notes: 'Desayuno de sushi fresco. Llegar antes de las 8:00.' },
  { id: 'tok-6', city: 'tokyo', name: 'Mirador Tokyo Skytree',  category: 'mirador',    coord: [35.7101, 139.8107], visited: false, notes: 'La torre más alta de Japón. Reservar tickets online. Mejor al atardecer.' },
  { id: 'tok-7', city: 'tokyo', name: 'Barrio Akihabara',       category: 'barrio',     coord: [35.7023, 139.7745], visited: false, notes: 'El corazón de la cultura otaku, electrónica y anime.' },
  { id: 'tok-8', city: 'tokyo', name: 'Museo Ghibli',           category: 'museo',      coord: [35.6962, 139.5702], visited: false, notes: 'RESERVAR 3 MESES ANTES. Entradas solo online via Lawson.' },
  // Kioto
  { id: 'kyo-1', city: 'kyoto', name: 'Fushimi Inari',          category: 'monumento',  coord: [34.9671, 135.7727], visited: false, notes: '10.000 torii naranjas. Subir hasta el final lleva 2-3h. Ir al amanecer.' },
  { id: 'kyo-2', city: 'kyoto', name: 'Bosque de Bambú Arashiyama', category: 'otro',   coord: [35.0168, 135.6720], visited: false, notes: 'Ir antes de las 8:00. A las 10am ya está lleno de turistas.' },
  { id: 'kyo-3', city: 'kyoto', name: 'Kinkaku-ji (Pabellón Dorado)', category: 'monumento', coord: [35.0394, 135.7292], visited: false, notes: 'El templo más fotografiado de Japón. Entrada ¥400.' },
  { id: 'kyo-4', city: 'kyoto', name: 'Barrio Gion',            category: 'barrio',     coord: [35.0036, 135.7752], visited: false, notes: 'El barrio de las geishas. Mejor a la tarde-noche para tener suerte de ver una.' },
  { id: 'kyo-5', city: 'kyoto', name: 'Nishiki Market',         category: 'compras',    coord: [35.0052, 135.7657], visited: false, notes: 'La "cocina de Kioto". Probar tofu, encurtidos, brochetas de pulpo.' },
  { id: 'kyo-6', city: 'kyoto', name: 'Filosofía Path (Tetsugaku-no-Michi)', category: 'otro', coord: [35.0175, 135.7937], visited: false, notes: 'Paseo junto a un canal bajo cerezos. Imprescindible en marzo.' },
  // Osaka
  { id: 'osa-1', city: 'osaka', name: 'Dotonbori',              category: 'barrio',     coord: [34.6687, 135.5014], visited: false, notes: 'El corazón gastronómico de Osaka. Takoyaki, okonomiyaki, ramen.' },
  { id: 'osa-2', city: 'osaka', name: 'Castillo de Osaka',      category: 'monumento',  coord: [34.6873, 135.5262], visited: false, notes: 'Castillo del siglo XVI. El parque alrededor tiene cerezos hermosos.' },
  { id: 'osa-3', city: 'osaka', name: 'Shinsekai',              category: 'barrio',     coord: [34.6523, 135.5059], visited: false, notes: 'Barrio retro de los años 50. Kushikatsu (brochetas fritas) son especialidad local.' },
  { id: 'osa-4', city: 'osaka', name: 'Kuromon Ichiba Market',  category: 'restaurante', coord: [34.6695, 135.5084], visited: false, notes: 'El mercado local de Osaka. Mariscos y platos callejeros para el desayuno.' },
];

// ─── 6. Links ────────────────────────────────────────────────────────────────
export const DEFAULT_LINKS: TripLink[] = [
  { id: 'lv-1', city: 'tokyo', title: 'Tokio — guía completa de viaje', url: 'https://youtu.be/FsopJ4p3f4E', category: 'video' },
  { id: 'lv-2', city: 'kyoto', title: 'Kioto — lo que no podés perderte', url: 'https://youtu.be/R8zjAGSkjeE', category: 'video' },
  { id: 'lv-3', city: 'osaka', title: 'Osaka — guía gastronómica', url: 'https://youtu.be/m5OhTWfDSJ4', category: 'video' },
  { id: 'lr-1', city: 'tokyo', title: 'Museo Ghibli — reservar entradas', url: 'https://www.ghibli-museum.jp/en/tickets/', category: 'reserva' },
  { id: 'lr-2', city: 'tokyo', title: 'Tokyo Skytree — tickets', url: 'https://www.tokyo-skytree.jp/en/ticket/', category: 'reserva' },
];

// ─── 7. Itinerary templates ───────────────────────────────────────────────────
export const CITY_TEMPLATES: Record<string, DayTemplate[]> = {
  tokyo: [
    { city: 'tokyo', title: 'Llegada a Tokio', transport: 'Narita/Haneda → centro en Narita Express', activities: ['Check-in y descanso', 'Primer paseo por Shinjuku', 'Cena en ramen bar local'] },
    { city: 'tokyo', title: 'Tokio clásico',    activities: ['Templo Senso-ji al amanecer', 'Barrio Asakusa', 'Akihabara por la tarde', 'Shibuya Crossing al anochecer'] },
    { city: 'tokyo', title: 'Harajuku y Shibuya', activities: ['Desayuno en Tsukiji Market', 'Harajuku — Takeshita Street', 'Meiji Shrine', 'Shibuya de noche'] },
    { city: 'tokyo', title: 'Museo Ghibli',     activities: ['Museo Ghibli (reserva obligatoria)', 'Parque Inokashira', 'Shimokitazawa por la tarde (barrio vintage)'] },
    { city: 'tokyo', title: 'Skytree y Ueno',   activities: ['Tokyo Skytree al atardecer', 'Barrio Ueno y su parque', 'Museo Nacional de Tokio (opcional)'] },
    { city: 'tokyo', title: 'Día libre en Tokio', activities: ['Shinjuku Gyoen (cerezos)', 'Shopping en Ginza o Harajuku', 'Preparar equipaje para Kioto'] },
  ],
  kyoto: [
    { city: 'kyoto', title: 'Llegada a Kioto',  transport: 'Shinkansen Tokyo → Kyoto (2h 15min)', activities: ['Check-in', 'Paseo por Gion al anochecer', 'Cena en restaurante local'] },
    { city: 'kyoto', title: 'Fushimi y Arashiyama', activities: ['Fushimi Inari al amanecer', 'Almuerzo en Fushimi', 'Bosque de bambú Arashiyama', 'Templo Tenryu-ji'] },
    { city: 'kyoto', title: 'Templos del norte', activities: ['Kinkaku-ji (Pabellón Dorado)', 'Ryoan-ji (jardín zen de piedra)', 'Nijo Castle', 'Nishiki Market por la tarde'] },
    { city: 'kyoto', title: 'Día libre en Kioto', activities: ['Filosofía Path (cerezos)', 'Higashiyama — calles empedradas', 'Compras en Sanjo-dori'] },
  ],
  osaka: [
    { city: 'osaka', title: 'Llegada a Osaka',  transport: 'Tren Kyoto → Osaka (15min)', activities: ['Check-in', 'Dotonbori de noche', 'Cena: takoyaki y okonomiyaki'] },
    { city: 'osaka', title: 'Osaka histórico',   activities: ['Kuromon Market para el desayuno', 'Castillo de Osaka', 'Shinsekai al mediodía — kushikatsu', 'Namba por la noche'] },
    { city: 'osaka', title: 'Último día',        activities: ['Compras en Shinsaibashi', 'Almuerzo final en Dotonbori', 'Viaje al aeropuerto KIX'] },
  ],
};

// ─── 8. Budget (por persona, por noche, en EUR) ──────────────────────────────
export const INIT_BUDGET: BudgetState = {
  tokyo: { airbnb: 90, food: 55, transport: 18, activities: 25, nights: 6 },
  kyoto: { airbnb: 85, food: 50, transport: 12, activities: 20, nights: 4 },
  osaka: { airbnb: 80, food: 60, transport: 10, activities: 15, nights: 3 },
};
