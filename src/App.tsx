import { useState, useEffect, useCallback } from 'react';
import { usePersistedState } from './usePersistedState';
import {
  CITIES, INIT_CONFIG, INIT_BUDGET, DEFAULT_POIS, DEFAULT_LINKS,
  ROUTE_SEGMENTS, CITY_TEMPLATES, TRIP_NAME, TRIP_EMOJI, TRIP_TAGLINE,
} from './trip.config';
import type {
  TripDay, CityKey, BudgetState, TripConfig,
  POI, Gasto, WalletItem,
  TripLink, RouteSegment,
} from './types';
import { generateDays, daysUntilTrip, currentTripDayIndex, totalProgress, totalNights } from './utils';
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
  const [gastos, setGastos]   = useSynced<Gasto[]>('th-gastos', []);
  const [wallet, setWallet]   = useSynced<WalletItem[]>('th-wallet', []);
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

  const addGasto    = (g: Omit<Gasto,'id'>)   => setGastos(prev => [...prev, { ...g, id: `g-${Date.now()}` }]);
  const deleteGasto = (id: string)            => setGastos(prev => prev.filter(g => g.id !== id));
  const addLink     = (l: Omit<TripLink,'id'>) => setLinks(prev => [...prev, { ...l, id: `lnk-${Date.now()}` }]);
  const deleteLink  = (id: string)            => setLinks(prev => prev.filter(l => l.id !== id));

  const toggleCheck     = (dayN: number, idx: number) =>
    setChecked(prev => ({ ...prev, [`${dayN}-${idx}`]: !prev[`${dayN}-${idx}`] }));
  const updateActivity  = (dayN: number, idx: number, val: string) =>
    setDays(prev => prev.map(d => d.n === dayN ? { ...d, activities: d.activities.map((a, i) => i === idx ? val : a) } : d));
  const deleteActivity  = (dayN: number, idx: number) =>
    setDays(prev => prev.map(d => d.n === dayN ? { ...d, activities: d.activities.filter((_, i) => i !== idx) } : d));
  const addActivity     = (dayN: number) =>
    setDays(prev => prev.map(d => d.n === dayN ? { ...d, activities: [...d.activities, ''] } : d));

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
              : todayDayIndex != null && todayDayIndex >= 0
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
            todayDayIndex={todayDayIndex}
            onToggleCheck={toggleCheck}
            onUpdateActivity={updateActivity}
            onDeleteActivity={deleteActivity}
            onAddActivity={addActivity}
            onReorderDays={setDays}
          />
        )}
        {tab === 'map' && (
          <MapTab
            cities={CITIES}
            cityOrder={cityOrder}
            cityNights={config.cityNights}
            pois={pois}
            onTogglePOI={(id) => setPOIs(prev => prev.map(p => p.id === id ? { ...p, visited: !p.visited } : p))}
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
            gastos={gastos}
            budget={budget}
            config={config}
            cityOrder={cityOrder}
            onAdd={addGasto}
            onDelete={deleteGasto}
          />
        )}
        {tab === 'wallet' && (
          <WalletTab
            wallet={wallet}
            cities={CITIES}
            cityOrder={cityOrder}
            onUpdate={(id, patch) => setWallet(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w))}
            onAdd={item => setWallet(prev => [...prev, { ...item, id: `w-${Date.now()}` }])}
            onDelete={id => setWallet(prev => prev.filter(w => w.id !== id))}
          />
        )}
        {tab === 'bookings' && (
          <BookingsTab booked={booked} onToggle={(id) => setBooked(prev => ({ ...prev, [id]: !prev[id] }))} />
        )}
        {tab === 'budget' && (
          <BudgetTab
            budget={budget}
            onUpdate={(city, field, value) => setBudget(prev => ({ ...prev, [city]: { ...prev[city], [field]: value } }))}
          />
        )}
      </main>

      <BottomNav tabs={TABS} active={tab} onChange={t => setTab(t as TabId)} />
      {syncOpen && <SyncPanel onClose={() => setSyncOpen(false)} />}
    </div>
  );
}
