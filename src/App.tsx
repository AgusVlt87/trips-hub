import { useState, useEffect, useCallback } from 'react';
import { usePersistedState } from './usePersistedState';
import {
  CITIES, INIT_CONFIG, INIT_BUDGET, DEFAULT_POIS, DEFAULT_LINKS,
  ROUTE_SEGMENTS, CITY_TEMPLATES, TRIP_NAME, TRIP_EMOJI, TRIP_TAGLINE,
} from './trip.config';
import type {
  TripDay, CityKey, BudgetState, TripConfig,
  POI, PackingCategory, Gasto, WalletItem, ExchangeRates,
  TripLink, RouteSegment,
} from './types';
import { reconcileDays, generateDays, daysUntilTrip, currentTripDayIndex, totalProgress, totalNights } from './utils';
import { useSyncedKey, setTripCode, setAuthor, touchTripMeta } from './lib/useSync';

import ItineraryTab from './components/ItineraryTab';
import MapTab       from './components/MapTab';
import BudgetTab    from './components/BudgetTab';
import GastosTab    from './components/GastosTab';
import WalletTab    from './components/WalletTab';
import LinksTab     from './components/LinksTab';
import BookingsTab  from './components/BookingsTab';
import BottomNav    from './components/BottomNav';
import SyncPanel, { SyncStatusPill } from './components/SyncPanel';

const CITY_ORDER: CityKey[] = Object.entries(CITIES)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([k]) => k);

const INIT_PACKING: PackingCategory[] = [
  { id: 'docs', label: 'Documentos', items: [
    { id: 'p1', label: 'Pasaporte (vigencia +6 meses)', checked: false },
    { id: 'p2', label: 'Seguro de viaje', checked: false },
    { id: 'p3', label: 'Reservas de alojamiento (offline)', checked: false },
    { id: 'p4', label: 'Tarjeta de crédito internacional', checked: false },
    { id: 'p5', label: 'Efectivo en moneda local', checked: false },
  ]},
  { id: 'ropa', label: 'Ropa', items: [
    { id: 'r1', label: 'Camisetas', checked: false },
    { id: 'r2', label: 'Pantalones / shorts', checked: false },
    { id: 'r3', label: 'Calzado cómodo para caminar', checked: false },
    { id: 'r4', label: 'Abrigo / impermeable', checked: false },
  ]},
  { id: 'tech', label: 'Tecnología', items: [
    { id: 't1', label: 'Cargador universal / adaptador', checked: false },
    { id: 't2', label: 'Power bank', checked: false },
    { id: 't3', label: 'Auriculares', checked: false },
  ]},
];

const INIT_RATES: ExchangeRates = {
  eurToLocal: 1, localCurrencyCode: 'EUR', eurToUsd: 1.08, updatedAt: '',
};

const TABS = [
  { id: 'itinerary', label: 'Itinerario',  icon: '📅' },
  { id: 'map',       label: 'Mapa',        icon: '🗺️' },
  { id: 'links',     label: 'Links',       icon: '🔗' },
  { id: 'gastos',    label: 'Gastos',      icon: '💸' },
  { id: 'wallet',    label: 'Documentos',  icon: '🗂️' },
  { id: 'bookings',  label: 'Reservas',    icon: '🎫' },
  { id: 'budget',    label: 'Presupuesto', icon: '💰' },
] as const;
type TabId = typeof TABS[number]['id'];

function useSynced<T>(key: string, initial: T) {
  const [state, setLocal] = usePersistedState<T>(key, initial);
  const push = useSyncedKey<T>(key, state, setLocal);
  const setState = useCallback((value: T | ((prev: T) => T)) => {
    setLocal(prev => {
      const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
      push(next);
      touchTripMeta();
      return next;
    });
  }, [setLocal, push]);
  return [state, setState] as const;
}

export default function App() {
  const [tab, setTab]         = useState<TabId>('itinerary');
  const [syncOpen, setSyncOpen] = useState(false);

  useEffect(() => {
    const code   = localStorage.getItem('th-trip-code');
    const author = localStorage.getItem('th-author');
    if (code)   setTripCode(code);
    if (author) setAuthor(author);
  }, []);

  const [config]              = useSynced<TripConfig>('th-config', INIT_CONFIG);
  const [days, setDays]       = useSynced<TripDay[]>('th-days', generateDays(INIT_CONFIG, CITY_TEMPLATES));
  const [checked, setChecked] = useSynced<Record<string, boolean>>('th-checked', {});
  const [cityOrder, setCityOrder] = useSynced<CityKey[]>('th-city-order', CITY_ORDER);
  const [pois, setPOIs]       = useSynced<POI[]>('th-pois', DEFAULT_POIS);
  const [, setPacking]        = useSynced<PackingCategory[]>('th-packing', INIT_PACKING);
  const [gastos, setGastos]   = useSynced<Gasto[]>('th-gastos', []);
  const [wallet, setWallet]   = useSynced<WalletItem[]>('th-wallet', []);
  const [rates]               = useSynced<ExchangeRates>('th-rates', INIT_RATES);
  const [links, setLinks]     = useSynced<TripLink[]>('th-links', DEFAULT_LINKS);
  const [segments, setSegments] = useSynced<RouteSegment[]>('th-segments', ROUTE_SEGMENTS);
  const [budget, setBudget]   = useSynced<BudgetState>('th-budget', INIT_BUDGET);
  const [booked, setBooked]   = useSynced<Record<string, boolean>>('th-booked', {});

  useEffect(() => {
    setPOIs(prev => {
      const ids = new Set(prev.map(p => p.id));
      const toAdd = DEFAULT_POIS.filter(p => !ids.has(p.id));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
    setLinks(prev => {
      if (prev.length === 0) return DEFAULT_LINKS;
      const ids = new Set(prev.map(l => l.id));
      const toAdd = DEFAULT_LINKS.filter(l => !ids.has(l.id));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const daysLeft       = daysUntilTrip(config);
  const todayDayIndex  = currentTripDayIndex(config);
  const { done: doneActs, total: totalActs } = totalProgress(days, checked);
  const totalNightsCount = totalNights(config);

  const updateSegment  = (idx: number, patch: Partial<RouteSegment>) =>
    setSegments(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

  const addGasto    = (g: Gasto)              => setGastos(prev => [...prev, g]);
  const deleteGasto = (id: string)            => setGastos(prev => prev.filter(g => g.id !== id));
  const addLink     = (l: Omit<TripLink,'id'>) => setLinks(prev => [...prev, { ...l, id: `lnk-${Date.now()}` }]);
  const deleteLink  = (id: string)            => setLinks(prev => prev.filter(l => l.id !== id));
  const togglePOI   = (id: string)            => setPOIs(prev => prev.map(p => p.id === id ? { ...p, visited: !p.visited } : p));

  const firstCity  = CITIES[cityOrder[0]];
  const headerBg   = firstCity?.bg ?? '#1A2650';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <header
        className="text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm"
        style={{ background: headerBg }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{TRIP_EMOJI}</span>
            <h1 className="text-[17px] font-bold tracking-tight">{TRIP_NAME}</h1>
          </div>
          <p className="text-[11px] opacity-70 mt-0.5">{TRIP_TAGLINE}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right text-[11px] opacity-80">
            <div>{cityOrder.length} destinos · {totalNightsCount} noches</div>
            {daysLeft > 0
              ? <div>{daysLeft}d para el viaje</div>
              : todayDayIndex >= 0
              ? <div className="text-green-300 font-semibold">Día {todayDayIndex + 1} ✈</div>
              : <div>Viaje finalizado</div>}
          </div>
          <SyncStatusPill onClick={() => setSyncOpen(true)} />
        </div>
      </header>

      {totalActs > 0 && (
        <div className="h-1" style={{ background: `${headerBg}22` }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${(doneActs / totalActs) * 100}%`, background: headerBg }}
          />
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-24">
        {tab === 'itinerary' && (
          <ItineraryTab
            days={days}
            checked={checked}
            onToggle={(id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))}
            cities={CITIES}
            cityOrder={cityOrder}
          />
        )}
        {tab === 'map' && (
          <MapTab
            cities={CITIES}
            cityOrder={cityOrder}
            cityNights={config.cityNights}
            pois={pois}
            onTogglePOI={togglePOI}
            segments={segments}
            onReorder={setCityOrder}
            onUpdateSegment={updateSegment}
          />
        )}
        {tab === 'links' && (
          <LinksTab links={links} cities={CITIES} onAdd={addLink} onDelete={deleteLink} />
        )}
        {tab === 'gastos' && (
          <GastosTab
            gastos={gastos} cities={CITIES} cityOrder={cityOrder}
            rates={rates} onAdd={addGasto} onDelete={deleteGasto}
          />
        )}
        {tab === 'wallet' && (
          <WalletTab items={wallet} onChange={setWallet} />
        )}
        {tab === 'bookings' && (
          <BookingsTab booked={booked} onToggle={(id) => setBooked(prev => ({ ...prev, [id]: !prev[id] }))} cities={CITIES} />
        )}
        {tab === 'budget' && (
          <BudgetTab budget={budget} onChange={setBudget} cityOrder={cityOrder} cities={CITIES} />
        )}
      </main>

      <BottomNav tabs={TABS} active={tab} onChange={t => setTab(t as TabId)} />
      {syncOpen && <SyncPanel onClose={() => setSyncOpen(false)} />}
    </div>
  );
}
