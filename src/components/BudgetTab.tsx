import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { BudgetState, CityKey } from '../types';
import { CITIES, CITY_ORDER } from '../data';

interface Props {
  budget: BudgetState;
  onUpdate: (city: CityKey, field: keyof Omit<BudgetState[CityKey], 'nights'>, value: number) => void;
}

const CATEGORIES = [
  { key: 'airbnb',     label: 'Alojamiento/noche' },
  { key: 'food',       label: 'Comida/día' },
  { key: 'transport',  label: 'Transporte/día' },
  { key: 'activities', label: 'Actividades/día' },
] as const;

function cityTotal(b: BudgetState[CityKey]) {
  return (b.airbnb + b.food + b.transport + b.activities) * b.nights * 2;
}

export default function BudgetTab({ budget, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);

  const total = CITY_ORDER.reduce((acc, k) => acc + cityTotal(budget[k]), 0);

  const chartData = CITY_ORDER.map(k => ({
    name: CITIES[k].label,
    total: cityTotal(budget[k]),
    color: CITIES[k].bg,
    city: k,
  }));

  return (
    <div className="py-4 pb-10">
      {/* Summary card */}
      <div className="bg-white rounded-xl px-5 py-4 shadow-sm mb-5 flex justify-between items-center">
        <div>
          <div className="text-[11px] text-gray-400 mb-1">Total estimado — 2 personas</div>
          <div className="font-serif text-3xl font-bold text-[#1A2650]" style={{ fontFamily: "'Playfair Display', serif" }}>
            USD {total.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-300 mt-1">Sin vuelos · Orientativo</div>
        </div>
        <button
          onClick={() => setEditing(e => !e)}
          className="border rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
          style={{
            background: editing ? '#1A2650' : '#fff',
            borderColor: '#1A2650',
            color: editing ? '#fff' : '#1A2650',
          }}
        >
          {editing ? 'Listo' : 'Editar'}
        </button>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl px-5 py-4 shadow-sm mb-5">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Por destino (USD · 2 personas)
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#bbb' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(val) => [`USD ${Number(val).toLocaleString()}`, 'Total']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #eee' }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-city breakdown */}
      <div className="flex flex-col gap-3">
        {CITY_ORDER.map(k => {
          const b = budget[k];
          const c = CITIES[k];
          const tot = cityTotal(b);
          const pct = Math.round((tot / total) * 100);

          return (
            <div key={k} className="bg-white rounded-xl px-4 py-3.5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.bg }} />
                  <span className="text-[13px] font-semibold">{c.label}</span>
                  <span className="text-[11px] text-gray-400">{b.nights} noche{b.nights !== 1 ? 's' : ''}</span>
                </div>
                <div>
                  <span className="text-[14px] font-bold" style={{ color: c.bg }}>
                    USD {tot.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-gray-400 ml-1.5">{pct}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-gray-100 rounded-full mb-3">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.bg }} />
              </div>

              {/* Edit grid or display */}
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(({ key, label }) => (
                    <div key={key}>
                      <div className="text-[10px] text-gray-400 mb-1">{label}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-gray-400">$</span>
                        <input
                          type="number"
                          value={b[key]}
                          min={0}
                          onChange={e => onUpdate(k, key, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-[12px] border border-gray-200 rounded-md outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-5 flex-wrap">
                  {([['Alojamiento', b.airbnb], ['Comida', b.food], ['Transporte', b.transport], ['Actividades', b.activities]] as [string, number][]).map(([label, val]) => (
                    <div key={label}>
                      <div className="text-[10px] text-gray-400">{label}</div>
                      <div className="text-[12px] font-semibold text-gray-600">USD {val}/p·día</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <div className="bg-[#FFFBF0] border border-[#E8D890] border-l-4 border-l-[#C8A820] rounded-r-lg px-4 py-3 text-[12px] text-[#5A4A10] leading-relaxed mt-5">
        <span className="font-semibold">Nota · </span>
        Con USD 130/persona/día estás cómodo en toda la ruta. Granada es el destino más barato (tapas gratis).
        Si usás Airbnb con cocina y cocinás algún almuerzo, el gasto real baja.
      </div>
    </div>
  );
}
