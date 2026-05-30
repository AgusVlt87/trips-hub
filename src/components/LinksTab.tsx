import { useState } from 'react';
import type { TripLink, LinkCategory, CityKey } from '../types';
import { CITIES, CITY_ORDER } from '../data';

const CATEGORIES: Record<LinkCategory, { icon: string; label: string }> = {
  airbnb:  { icon: '🏠', label: 'Airbnb' },
  video:   { icon: '🎬', label: 'Video' },
  blog:    { icon: '📝', label: 'Blog / Artículo' },
  mapa:    { icon: '🗺️', label: 'Mapa / Ruta' },
  reserva: { icon: '🎫', label: 'Reserva' },
  otro:    { icon: '🔗', label: 'Otro' },
};

const EMPTY_FORM = { city: 'sevilla' as CityKey, title: '', url: '', category: 'otro' as LinkCategory };

interface Props {
  links: TripLink[];
  onAdd: (link: Omit<TripLink, 'id'>) => void;
  onDelete: (id: string) => void;
}

export default function LinksTab({ links, onAdd, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterCity, setFilterCity] = useState<CityKey | 'all'>('all');

  const submit = () => {
    if (!form.title.trim() || !form.url.trim()) return;
    const url = form.url.startsWith('http') ? form.url : `https://${form.url}`;
    onAdd({ ...form, url });
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const visible = filterCity === 'all'
    ? links
    : links.filter(l => l.city === filterCity);

  const byCity = CITY_ORDER.reduce<Record<CityKey, TripLink[]>>((acc, k) => {
    acc[k] = visible.filter(l => l.city === k);
    return acc;
  }, {} as Record<CityKey, TripLink[]>);

  const hasLinks = visible.length > 0;

  return (
    <div className="py-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-bold text-gray-800 m-0" style={{ fontFamily: "'Playfair Display', serif" }}>
            Links & Referencias
          </h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Airbnbs, videos, blogs, mapas — todo en un lugar</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-[12px] font-semibold text-white rounded-xl px-4 py-2"
          style={{ background: '#1A2650' }}
        >
          {showForm ? '✕ Cancelar' : '+ Agregar'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-5 space-y-3">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nuevo link</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block">Ciudad</label>
              <select
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value as CityKey }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1A2650] bg-white"
              >
                {CITY_ORDER.map(k => (
                  <option key={k} value={k}>{CITIES[k].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block">Categoría</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as LinkCategory }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1A2650] bg-white"
              >
                {(Object.entries(CATEGORIES) as [LinkCategory, { icon: string; label: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 mb-1 block">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Airbnb Sevilla centro, Video tour Granada..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1A2650]"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-400 mb-1 block">URL</label>
            <input
              type="url"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1A2650]"
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </div>

          <button
            onClick={submit}
            disabled={!form.title.trim() || !form.url.trim()}
            className="w-full py-2 rounded-lg text-[13px] font-semibold text-white transition-all"
            style={{ background: form.title && form.url ? '#1A2650' : '#9CA3AF' }}
          >
            Guardar link
          </button>
        </div>
      )}

      {/* City filter */}
      {links.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setFilterCity('all')}
            className="text-[11px] rounded-full px-3 py-1 border transition-colors"
            style={{
              background: filterCity === 'all' ? '#1A2650' : 'white',
              color: filterCity === 'all' ? 'white' : '#555',
              borderColor: filterCity === 'all' ? '#1A2650' : '#E5E7EB',
            }}
          >
            Todas
          </button>
          {CITY_ORDER.filter(k => links.some(l => l.city === k)).map(k => {
            const c = CITIES[k];
            const active = filterCity === k;
            return (
              <button
                key={k}
                onClick={() => setFilterCity(active ? 'all' : k)}
                className="text-[11px] rounded-full px-3 py-1 border transition-colors"
                style={{
                  background: active ? c.bg : 'white',
                  color: active ? 'white' : '#555',
                  borderColor: active ? c.bg : '#E5E7EB',
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Links grouped by city */}
      {!hasLinks ? (
        <div className="text-center py-16 text-gray-300">
          <div className="text-[32px] mb-3">🔗</div>
          <div className="text-[14px] font-medium text-gray-400">Sin links todavía</div>
          <div className="text-[12px] text-gray-300 mt-1">Guardá Airbnbs, videos de YouTube, blogs de viaje...</div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {CITY_ORDER.map(cityKey => {
            const cityLinks = byCity[cityKey];
            if (!cityLinks.length) return null;
            const c = CITIES[cityKey];
            return (
              <div key={cityKey}>
                <div
                  className="text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 mb-3"
                  style={{ color: c.bg, borderColor: c.bg }}
                >
                  {c.label}
                </div>
                <div className="flex flex-col gap-2">
                  {cityLinks.map(link => {
                    const cat = CATEGORIES[link.category];
                    return (
                      <div
                        key={link.id}
                        className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3"
                      >
                        <span className="text-[20px] flex-shrink-0">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13px] font-medium text-gray-800 hover:underline block truncate"
                            style={{ color: c.bg }}
                          >
                            {link.title}
                          </a>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">{link.url}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: c.soft, color: c.bg }}
                          >
                            {cat.label}
                          </span>
                          <button
                            onClick={() => onDelete(link.id)}
                            className="text-gray-300 hover:text-red-400 text-[16px] leading-none transition-colors"
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
