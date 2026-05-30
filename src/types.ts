// CityKey is a plain string — Claude Code generates the actual city IDs
export type CityKey = string;

export interface CityConfig {
  label: string;
  bg: string;       // dark accent hex, e.g. '#E94B3C'
  soft: string;     // light tint hex,  e.g. '#FEF2F2'
  coord: [number, number];
  order: number;
}

export type CityMap = Record<CityKey, CityConfig>;

export interface TripDay {
  n: number;
  date: string;
  wd: string;
  city: CityKey;
  title: string;
  transport?: string;
  activities: string[];
  note?: string;
}

export type DayTemplate = Omit<TripDay, 'n' | 'date' | 'wd'>;

export interface TripConfig {
  startDate: string;
  cityNights: Record<CityKey, number>;
}

export type POICategory =
  | 'museo' | 'restaurante' | 'barrio' | 'mirador'
  | 'playa' | 'monumento' | 'compras' | 'otro';

export interface POI {
  id: string;
  city: CityKey;
  name: string;
  category: POICategory;
  notes?: string;
  coord: [number, number];
  visited: boolean;
}

export type TransportMode = 'AVE' | 'Tren' | 'Bus' | 'Auto' | 'Vuelo' | 'Ferry' | 'Metro';

export interface RouteSegment {
  from: CityKey;
  to: CityKey;
  mode: TransportMode;
  time: string;
  distanceKm: number;
}

export type LinkCategory = 'airbnb' | 'video' | 'blog' | 'mapa' | 'reserva' | 'otro';

export interface TripLink {
  id: string;
  city: CityKey;
  title: string;
  url: string;
  category: LinkCategory;
}

export interface CityBudget {
  airbnb: number;
  food: number;
  transport: number;
  activities: number;
  nights: number;
}

export type BudgetState = Record<CityKey, CityBudget>;

export interface PackingItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface PackingCategory {
  id: string;
  label: string;
  items: PackingItem[];
}

export type GastoCategory =
  | 'alojamiento' | 'comida' | 'transporte' | 'actividades'
  | 'compras' | 'bares' | 'farmacia' | 'comunicacion' | 'otro';

export interface Gasto {
  id: string;
  date: string;
  city: CityKey;
  category: GastoCategory;
  description: string;
  amountEur: number;
  paidBy: 'ambos' | 'p1' | 'p2';
}

export type WalletSection =
  | 'Vuelos' | 'Alojamientos' | 'Transportes' | 'Actividades'
  | 'Documentos' | 'Emergencias' | 'Contactos';

export interface WalletItem {
  id: string;
  section: WalletSection;
  label: string;
  value: string;
  notes?: string;
  city?: CityKey;
  secret?: boolean;
}

export interface ExchangeRates {
  eurToLocal: number;       // generic: EUR to destination's main currency
  localCurrencyCode: string; // e.g. 'JPY', 'GBP', 'ARS'
  eurToUsd: number;
  updatedAt: string;
}

export type CityRecommendation = {
  min: number; rec: number; max: number;
  tiers: { upTo: number; label: string; text: string }[];
};

export type RecommendationsState = Record<CityKey, CityRecommendation>;
