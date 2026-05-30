import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { Gasto, GastoCategory, CityKey, BudgetState } from '../types';
import { CITIES, CITY_ORDER, GASTO_CATEGORIES } from '../data';
import { todayISO, currentCityForDate, totalGastos, gastosByCity, gastosByCategory, budgetCityEstimate } from '../utils';

interface Props {
  gastos: Gasto[];
  budget: BudgetState;
  config: { startDate: string; cityNights: Record<CityKey, number> };
  cityOrder: CityKey[];
  onAdd: (g: Omit<Gasto, 'id'>) => void;
  onDelete: (id: string) => void;
}

const EMPTY_FORM = (city: CityKey): Omit<Gasto, 'id'> => ({
  date: todayISO(), city, category: 'comida', description: '', amountEur: 0, paidBy: 'ambos',
});

type ViewMode = 'lista' | 'categoria' | 'ciudad';

export default function GastosTab({ gastos, budget, config, cityOrder, onAdd, onDelete }: Props) {
  const defaultCity = useMemo(
    () => currentCityForDate(todayISO(), config, cityOrder),
    [config, cityOrder],
  );
  const [form, setForm] = useState<Omit<Gasto, 'id'>>(EMPTY_FORM(defaultCity));
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<ViewMode>('lista');
  const [filterCity, setFilterCity] = useState<CityKey | 'all'>('all');
  const [filterCat, setFilterCat] = useState<GastoCategory | 'all'>('all');

  const filtered = gastos.filter(g =>
    (filterCity === 'all' || g.city === filterCity) &&
    (filterCat === 'all' || g.category === filterCat)
  );

  const total = totalGastos(gastos);
  const budgetTotal = Object.values(budget).reduce((s, b) => s + budgetCityEstimate(b), 0);
  const diff = budgetTotal - total;
  const pct = budgetTotal > 0 ? Math.min((total / budgetTotal) * 100, 100) : 0;

  const byCity = gastosByCity(gastos);
  const byCat = gastosByCategory(gastos);

  const submitGasto = () => {
    if (!form.amountEur || form.amountEur <= 0) return;
    onAdd(form);
    setForm(EMPTY_FORM(defaultCity));
    setShowForm(false);
  };

  // Chart data
  const catChartData = Object.entries(byCat)
    .map(([cat, amt]) => ({ name: GASTO_CATEGORIES[cat as GastoCategory]?.label ?? cat, value: amt, color: GASTO_CATEGORIES[cat as GastoCategory]?.color ?? '#718096', cat }))
    .sort((a, b) => b.value - a.value);

  const cityChartData = CITY_ORDER.map(k => ({
    name: CITIES[k].label,
    real: byCity[k] ?? 0,
    presup: budgetCityEstimate(budget[k]),
    color: CITIES[k].bg,
    city: k,
  }));

  return (
    <div className="py-4 pb-12">
      {/* Summary header */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Gasto real · 2 personas</div>
            <div className="text-[32px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: diff >= 0 ? '#1A2650' : '#E53E3E' }}>
              €{total.toFixed(0)}
            </div>
            <div className="text-[12px] text-gray-400 mt-0.5">
              de €{budgetTotal.toFixed(0)} estimados
              <span className="ml-2 font-semibold" style={{ color: diff >= 0 ? '#38A169' : '#E53E3E' }}>
                {diff >= 0 ? `€${diff.toFixed(0)} bajo presupuesto` : `€${Math.abs(diff).toFixed(0)} sobre presupuesto`}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-400 mb-1">Por persona</div>
            <div className="text-[22px] font-bold text-[#1A2650]" style={{ fontFamily: "'Playfair Display', serif" }}>
              €{(total / 2).toFixed(0)}
            </div>
            <div className="text-[11px] text-gray-400">€{gastos.length > 0 ? (total / Math.max(1, gastos.reduce((max, g) => {
              const dayIdx = CITY_ORDER.indexOf(g.city);
              return Math.max(max, dayIdx);
            }, 0) + 1)).toFixed(0) : 0}/día aprox.</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct > 100 ? '#E53E3E' : pct > 80 ? '#DD6B20' : '#38A169' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>€0</span>
            <span className="font-semibold">{pct.toFixed(0)}% del presupuesto</span>
            <span>€{budgetTotal.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Add expense button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl text-[13px] font-semibold text-white mb-4 transition-all hover:opacity-90"
          style={{ background: '#1A2650' }}
        >
          + Registrar gasto
        </button>
      ) : (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 border border-blue-100">
          <div className="text-[12px] font-bold text-gray-600 mb-3">Nuevo gasto</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Amount */}
            <div>
              <div className="text-[10px] text-gray-400 mb-1">Importe (€) *</div>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#1A2650]">
                <span className="px-2.5 text-gray-400 text-[13px]">€</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.amountEur || ''}
                  onChange={e => setForm(f => ({ ...f, amountEur: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="flex-1 py-2 pr-2 text-[13px] outline-none"
                  autoFocus
                />
              </div>
            </div>
            {/* Date */}
            <div>
              <div className="text-[10px] text-gray-400 mb-1">Fecha</div>
              <input
                type="date"
                value={form.date}
                onChange={e => {
                  const city = currentCityForDate(e.target.value, config, cityOrder);
                  setForm(f => ({ ...f, date: e.target.value, city }));
                }}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[12px] outline-none focus:border-[#1A2650]"
              />
            </div>
            {/* Category */}
            <div>
              <div className="text-[10px] text-gray-400 mb-1">Categoría</div>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as GastoCategory }))}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[12px] outline-none"
              >
                {(Object.keys(GASTO_CATEGORIES) as GastoCategory[]).map(cat => (
                  <option key={cat} value={cat}>{GASTO_CATEGORIES[cat].icon} {GASTO_CATEGORIES[cat].label}</option>
                ))}
              </select>
            </div>
            {/* City */}
            <div>
              <div className="text-[10px] text-gray-400 mb-1">Ciudad</div>
              <select
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value as CityKey }))}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[12px] outline-none"
              >
                {CITY_ORDER.map(k => (
                  <option key={k} value={k}>{CITIES[k].label}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Description */}
          <div className="mb-3">
            <div className="text-[10px] text-gray-400 mb-1">Descripción</div>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') submitGasto(); }}
              placeholder="Ej: Cena en el barrio de Santa Cruz"
              className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[12px] outline-none focus:border-[#1A2650]"
            />
          </div>
          {/* Paid by */}
          <div className="mb-3">
            <div className="text-[10px] text-gray-400 mb-1.5">Pagó</div>
            <div className="flex gap-2">
              {(['ambos', 'p1', 'p2'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setForm(f => ({ ...f, paidBy: opt }))}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors border"
                  style={{
                    background: form.paidBy === opt ? '#1A2650' : '#fff',
                    color: form.paidBy === opt ? '#fff' : '#555',
                    borderColor: form.paidBy === opt ? '#1A2650' : '#ddd',
                  }}
                >
                  {opt === 'ambos' ? 'Ambos' : opt === 'p1' ? 'Persona 1' : 'Persona 2'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={submitGasto}
              disabled={!form.amountEur}
              className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white"
              style={{ background: form.amountEur > 0 ? '#1A2650' : '#ccc', cursor: form.amountEur > 0 ? 'pointer' : 'default' }}
            >
              Guardar €{form.amountEur.toFixed(2)}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-[12px] text-gray-500 border border-gray-200 hover:bg-gray-50"
            >Cancelar</button>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        {(['lista', 'categoria', 'ciudad'] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all"
            style={{ background: view === v ? '#fff' : 'transparent', color: view === v ? '#1A2650' : '#888', boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', fontWeight: view === v ? 600 : 400 }}
          >
            {v === 'lista' ? 'Lista' : v === 'categoria' ? 'Por categoría' : 'Por ciudad'}
          </button>
        ))}
      </div>

      {/* === LIST VIEW === */}
      {view === 'lista' && (
        <div>
          {/* Filters */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <select
              value={filterCity}
              onChange={e => setFilterCity(e.target.value as CityKey | 'all')}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none"
            >
              <option value="all">Todas las ciudades</option>
              {CITY_ORDER.map(k => <option key={k} value={k}>{CITIES[k].label}</option>)}
            </select>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value as GastoCategory | 'all')}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none"
            >
              <option value="all">Todas las categorías</option>
              {(Object.keys(GASTO_CATEGORIES) as GastoCategory[]).map(c => (
                <option key={c} value={c}>{GASTO_CATEGORIES[c].icon} {GASTO_CATEGORIES[c].label}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-300 text-[13px]">
              Sin gastos registrados{filterCity !== 'all' || filterCat !== 'all' ? ' con ese filtro' : ' — registrá el primer gasto'}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {[...filtered].reverse().map(g => {
                const cat = GASTO_CATEGORIES[g.category];
                const city = CITIES[g.city];
                return (
                  <div key={g.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[16px] flex-shrink-0" style={{ background: cat.color + '18' }}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-gray-800 truncate">
                        {g.description || cat.label}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5" style={{ background: city.soft, color: city.bg }}>{city.label}</span>
                        <span className="text-[10px] text-gray-400">{g.date}</span>
                        {g.paidBy !== 'ambos' && <span className="text-[10px] text-gray-400">· Pagó {g.paidBy === 'p1' ? 'P1' : 'P2'}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[15px] font-bold" style={{ color: cat.color }}>€{g.amountEur.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400">€{(g.amountEur / 2).toFixed(2)}/p</div>
                    </div>
                    <button
                      onClick={() => onDelete(g.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-red-400 border border-red-100 rounded px-1.5 py-0.5 hover:bg-red-50 flex-shrink-0"
                    >✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === CATEGORY VIEW === */}
      {view === 'categoria' && (
        <div>
          {catChartData.length === 0 ? (
            <div className="text-center py-12 text-gray-300 text-[13px]">Sin gastos todavía</div>
          ) : (
            <>
              <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={catChartData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {catChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`€${Number(v).toFixed(2)}`, '']} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2">
                {catChartData.map(({ name, value, color, cat }) => (
                  <div key={cat} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
                    <div className="text-[18px]">{GASTO_CATEGORIES[cat as GastoCategory]?.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-gray-700">{name}</span>
                        <span className="text-[13px] font-bold" style={{ color }}>€{value.toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${total > 0 ? (value / total) * 100 : 0}%`, background: color }} />
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-400 w-12 text-right">{total > 0 ? ((value / total) * 100).toFixed(0) : 0}%</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* === CITY VIEW === */}
      {view === 'ciudad' && (
        <div>
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Real vs Presupuesto por ciudad</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cityChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#bbb' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`€${Number(v).toFixed(0)}`, '']} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                <Bar dataKey="presup" name="Presupuesto" fill="#E2E8F0" radius={[3, 3, 0, 0]} />
                <Bar dataKey="real" name="Real" radius={[3, 3, 0, 0]}>
                  {cityChartData.map((entry: { color: string }, i: number) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2">
            {CITY_ORDER.map((k: string) => {
              const c = CITIES[k];
              const real = byCity[k] ?? 0;
              const est = budgetCityEstimate(budget[k]);
              const diff = est - real;
              const hasTx = real > 0;
              return (
                <div key={k} className="bg-white rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.bg }} />
                    <span className="text-[13px] font-semibold flex-1">{c.label}</span>
                    <span className="text-[12px] font-bold" style={{ color: c.bg }}>€{real.toFixed(0)}</span>
                    <span className="text-[11px] text-gray-400">/ €{est.toFixed(0)} ppto</span>
                    {hasTx && (
                      <span className="text-[10px] font-semibold" style={{ color: diff >= 0 ? '#38A169' : '#E53E3E' }}>
                        {diff >= 0 ? `▼ €${diff.toFixed(0)}` : `▲ €${Math.abs(diff).toFixed(0)}`}
                      </span>
                    )}
                  </div>
                  {est > 0 && (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min((real / est) * 100, 100)}%`, background: real > est ? '#E53E3E' : c.bg }}
                      />
                    </div>
                  )}
                  {!hasTx && <div className="text-[10px] text-gray-300 italic mt-1">Sin gastos registrados</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
