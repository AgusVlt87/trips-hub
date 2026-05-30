import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CityKey, CityMap, RouteSegment, TransportMode, POI } from '../types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const MODE_META: Record<TransportMode, { color: string; dash: string; icon: string }> = {
  AVE:   { color: '#1A2650', dash: '10,5', icon: '🚄' },
  Tren:  { color: '#5B3FA0', dash: '8,4',  icon: '🚆' },
  Auto:  { color: '#426038', dash: '',     icon: '🚗' },
  Bus:   { color: '#B84E14', dash: '6,4',  icon: '🚌' },
  Vuelo: { color: '#0F5694', dash: '4,6',  icon: '✈️' },
  Ferry: { color: '#0891B2', dash: '5,5',  icon: '⛴️' },
  Metro: { color: '#9333EA', dash: '',     icon: '🚇' },
};

const ALL_MODES: TransportMode[] = ['AVE', 'Tren', 'Bus', 'Auto', 'Vuelo', 'Ferry', 'Metro'];

function cityMarkerHtml(city: CityKey, order: number, isSelected: boolean, nights: number, cities: CityMap): string {
  const c = cities[city];
  const size = isSelected ? 52 : 42;
  return `
    <div style="
      width:${size}px;height:${size}px;
      background:${c.bg};
      border:3px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.8)'};
      border-radius:50%;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      box-shadow:0 3px 10px rgba(0,0,0,${isSelected ? '0.5' : '0.25'});
      cursor:pointer;
    ">
      <div style="color:rgba(255,255,255,0.65);font-size:9px;font-weight:700;line-height:1;">${order}</div>
      <div style="color:#fff;font-size:${isSelected ? 9 : 8}px;font-weight:800;line-height:1.1;">${c.label.slice(0,3).toUpperCase()}</div>
      <div style="color:rgba(255,255,255,0.7);font-size:7px;line-height:1;">${nights}n</div>
    </div>
  `;
}

function labelHtml(seg: RouteSegment): string {
  const m = MODE_META[seg.mode] ?? MODE_META.Auto;
  return `
    <div style="
      background:white;border-left:3px solid ${m.color};border-radius:5px;
      padding:4px 8px;font-size:11px;font-weight:600;color:#333;
      box-shadow:0 2px 8px rgba(0,0,0,0.18);white-space:nowrap;
      font-family:'DM Sans',sans-serif;line-height:1.4;
    ">
      <span style="color:${m.color}">${m.icon} ${seg.mode}</span>
      <span style="color:#666;font-weight:400;"> · ${seg.time}</span>
      ${seg.distanceKm ? `<span style="color:#999;font-size:10px;"> · ${seg.distanceKm}km</span>` : ''}
    </div>
  `;
}

function perpendicularMid(a: [number, number], b: [number, number], offsetDeg = 0.08): [number, number] {
  const midLat = (a[0] + b[0]) / 2;
  const midLng = (a[1] + b[1]) / 2;
  const dLat = b[0] - a[0];
  const dLng = b[1] - a[1];
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
  return [midLat - (dLng / len) * offsetDeg, midLng + (dLat / len) * offsetDeg];
}

function pointAlong(a: [number, number], b: [number, number], frac: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
}

function lineAngleDeg(a: [number, number], b: [number, number]): number {
  return Math.atan2(-(b[0] - a[0]), b[1] - a[1]) * (180 / Math.PI);
}

// ─── Sortable city row ────────────────────────────────────────────────────────
function SortableCityRow({ cityKey, order, isSelected, nights, onClick, cities }: {
  cityKey: CityKey; order: number; isSelected: boolean; nights: number; onClick: () => void; cities: CityMap;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cityKey });
  const c = cities[cityKey];
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} className="flex items-center gap-1.5">
      <button {...attributes} {...listeners} className="flex-shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing text-[14px] px-0.5 touch-none" title="Arrastrar para reordenar">⠿</button>
      <div onClick={onClick} className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all" style={{ background: isSelected ? c.bg : 'transparent', border: `1px solid ${isSelected ? c.bg : 'transparent'}` }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: isSelected ? 'rgba(255,255,255,0.25)' : c.bg }}>{order}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold" style={{ color: isSelected ? '#fff' : '#333' }}>{c.label}</div>
          <div className="text-[10px]" style={{ color: isSelected ? 'rgba(255,255,255,0.6)' : '#aaa' }}>{nights} noche{nights !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  cities: CityMap;
  cityOrder: CityKey[];
  cityNights: Record<CityKey, number>;
  pois?: POI[];
  onTogglePOI?: (id: string) => void;
  segments: RouteSegment[];
  onReorder: (newOrder: CityKey[]) => void;
  onUpdateSegment: (idx: number, patch: Partial<RouteSegment>) => void;
}

export default function MapTab({ cities, cityOrder, cityNights, segments, onReorder, onUpdateSegment }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityKey | null>(null);
  const [editingSegIdx, setEditingSegIdx] = useState<number | null>(null);
  const [coords, setCoords] = useState<Record<string, [number, number]>>(
    Object.fromEntries(Object.entries(cities).map(([k, c]) => [k, c.coord]))
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = cityOrder.indexOf(active.id as CityKey);
      const newIdx = cityOrder.indexOf(over.id as CityKey);
      onReorder(arrayMove(cityOrder, oldIdx, newIdx));
    }
  };

  // Init map once — fitBounds on all cities including Madrid
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const map = L.map(mapRef.current);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    const allCoords = Object.values(cities).map((c) => c.coord as L.LatLngTuple);
    map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
    leafletRef.current = map;
    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  // Redraw layers when segments, coords, or selection changes
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    layersRef.current.forEach(l => l.remove());
    layersRef.current = [];
    const addLayer = (l: L.Layer) => { l.addTo(map); layersRef.current.push(l); };

    // Draw all route segments (includes Madrid→Sevilla)
    segments.forEach(seg => {
      const fromCoord = coords[seg.from];
      const toCoord = coords[seg.to];
      if (!fromCoord || !toCoord) return;
      const meta = MODE_META[seg.mode] ?? MODE_META.Auto;

      addLayer(L.polyline([fromCoord, toCoord], { color: meta.color, weight: 3, opacity: 0.85, dashArray: meta.dash }));

      const arrowPos = pointAlong(fromCoord, toCoord, 0.65);
      const angle = lineAngleDeg(fromCoord, toCoord);
      addLayer(L.marker(arrowPos, {
        icon: L.divIcon({ html: `<div style="transform:rotate(${angle}deg);color:${meta.color};font-size:16px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">➤</div>`, className: '', iconAnchor: [8, 10] }),
        interactive: false, zIndexOffset: 100,
      }));

      const labelPos = perpendicularMid(fromCoord, toCoord, 0.1);
      addLayer(L.marker(labelPos, {
        icon: L.divIcon({ html: labelHtml(seg), className: '', iconAnchor: [60, 14] }),
        interactive: false, zIndexOffset: 200,
      }));
    });

    // City markers — include all cities that appear in segments
    const citiesInRoute = new Set<string>();
    segments.forEach(s => { citiesInRoute.add(s.from); citiesInRoute.add(s.to); });

    cityOrder.forEach((cityKey, idx) => {
      citiesInRoute.delete(cityKey); // will be handled with stay order below
      const c = cities[cityKey];
      if (!c) return;
      const isSelected = selectedCity === cityKey;
      const nights = cityNights[cityKey] ?? 1;
      const size = isSelected ? 52 : 42;

      const marker = L.marker(coords[cityKey] ?? c.coord, {
        icon: L.divIcon({ html: cityMarkerHtml(cityKey, idx + 1, isSelected, nights, cities), className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
        draggable: true, zIndexOffset: isSelected ? 1000 : 500,
      });
      marker.bindPopup(`<div style="font-family:'DM Sans',sans-serif;min-width:140px;padding:2px"><div style="font-weight:700;font-size:14px;color:${c.bg};margin-bottom:4px">${idx + 1}. ${c.label}</div><div style="font-size:12px;color:#666">${nights} noche${nights !== 1 ? 's' : ''}</div></div>`);
      marker.on('click', () => setSelectedCity(k => k === cityKey ? null : cityKey));
      marker.on('dragend', (e: L.LeafletEvent) => {
        const ll = (e.target as L.Marker).getLatLng();
        setCoords(prev => ({ ...prev, [cityKey]: [ll.lat, ll.lng] }));
      });
      addLayer(marker);
    });

    // Hub markers — cities in segments but not in cityOrder (e.g. origin airport city)
    citiesInRoute.forEach(cityKey => {
      const c = cities[cityKey];
      if (!c || !coords[cityKey]) return;
      const size = 38;
      const short = c.label.slice(0, 3).toUpperCase();
      const marker = L.marker(coords[cityKey], {
        icon: L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;background:${c.bg};border:3px solid rgba(255,255,255,0.8);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.25);cursor:pointer;"><div style="color:#fff;font-size:7px;font-weight:800;line-height:1">${short}</div><div style="color:rgba(255,255,255,0.7);font-size:6px;">✈</div></div>`,
          className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        }),
        draggable: true, zIndexOffset: 400,
      });
      marker.bindPopup(`<div style="font-family:sans-serif;padding:2px"><div style="font-weight:700;font-size:14px;color:${c.bg}">${c.label}</div><div style="font-size:12px;color:#666">Llegada / Salida</div></div>`);
      addLayer(marker);
    });
  }, [coords, selectedCity, cityOrder, cityNights, segments, cities]);

  const stats = (() => {
    const acc: Record<string, { mode: TransportMode; km: number; segments: number }> = {};
    segments.forEach(seg => {
      if (!acc[seg.mode]) acc[seg.mode] = { mode: seg.mode, km: 0, segments: 0 };
      acc[seg.mode].km += seg.distanceKm;
      acc[seg.mode].segments += 1;
    });
    return Object.values(acc).sort((a, b) => b.km - a.km);
  })();
  const total = segments.reduce((s, seg) => s + seg.distanceKm, 0);

  return (
    <div className="flex flex-col md:flex-row gap-4 py-4">
      {/* Map */}
      <div className="flex-1 relative flex flex-col gap-3 min-w-0">
        <div ref={mapRef} className="flex-1 min-h-[300px] md:min-h-[460px] rounded-xl shadow-md" style={{ zIndex: 0 }} />

        <button
          onClick={() => setCoords(Object.fromEntries(Object.entries(cities).map(([k, c]) => [k, c.coord])))}
          className="absolute top-3 right-3 z-[400] bg-white/90 border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow hover:bg-white transition backdrop-blur"
        >
          ↺ Reset posiciones
        </button>

        {/* Distance + segments card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Trayectos del viaje
          </div>

          <div className="flex items-end gap-6 flex-wrap mb-4">
            <div>
              <div className="text-[26px] font-bold text-[#1A2650]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {segments.reduce((s, seg) => s + seg.distanceKm, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400">km totales</div>
            </div>
            <div className="flex gap-4 flex-wrap pb-1">
              {stats.map(s => {
                const m = MODE_META[s.mode as TransportMode] ?? MODE_META.Auto;
                return (
                  <div key={s.mode} className="flex items-center gap-2">
                    <div className="text-[12px]">{m.icon}</div>
                    <div>
                      <div className="text-[13px] font-bold" style={{ color: m.color }}>{s.km} km</div>
                      <div className="text-[10px] text-gray-400">{s.mode} · {s.segments} tramo{s.segments !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {total > 0 && (
            <div className="mb-4 flex h-2 rounded-full overflow-hidden gap-0.5">
              {stats.map(s => (
                <div key={s.mode} style={{ width: `${(s.km / total) * 100}%`, background: (MODE_META[s.mode as TransportMode] ?? MODE_META.Auto).color }} title={`${s.mode}: ${s.km}km`} />
              ))}
            </div>
          )}

          {/* Segment rows — editable */}
          <div className="flex flex-col gap-1">
            {segments.map((seg, i) => {
              const m = MODE_META[seg.mode] ?? MODE_META.Auto;
              const fromLabel = cities[seg.from]?.label ?? seg.from;
              const toLabel = cities[seg.to]?.label ?? seg.to;
              const isEditing = editingSegIdx === i;

              return (
                <div key={i} className="rounded-lg overflow-hidden">
                  {/* Row */}
                  <div
                    className="flex items-center gap-2 text-[12px] px-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setEditingSegIdx(isEditing ? null : i)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                    <span className="font-medium text-gray-700">{fromLabel}</span>
                    <span className="text-gray-300">→</span>
                    <span className="font-medium text-gray-700">{toLabel}</span>
                    <span className="ml-auto text-gray-400">{m.icon} {seg.mode}</span>
                    <span className="text-gray-500">{seg.time}</span>
                    <span className="font-semibold" style={{ color: m.color }}>{seg.distanceKm}km</span>
                    <span className="text-gray-300 text-[10px]">{isEditing ? '▲' : '✎'}</span>
                  </div>

                  {/* Inline editor */}
                  {isEditing && (
                    <div className="bg-gray-50 rounded-b-lg px-3 py-3 flex flex-wrap gap-3 items-end border-t border-gray-100">
                      <div>
                        <div className="text-[10px] text-gray-400 mb-1">Modo</div>
                        <div className="flex gap-1 flex-wrap">
                          {ALL_MODES.map(mode => {
                            const mm = MODE_META[mode];
                            const active = seg.mode === mode;
                            return (
                              <button
                                key={mode}
                                onClick={() => onUpdateSegment(i, { mode })}
                                className="text-[11px] px-2 py-1 rounded-lg border transition-colors font-medium"
                                style={{
                                  background: active ? mm.color : 'white',
                                  color: active ? 'white' : '#555',
                                  borderColor: active ? mm.color : '#E5E7EB',
                                }}
                              >
                                {mm.icon} {mode}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-1">Duración</div>
                        <input
                          type="text"
                          defaultValue={seg.time}
                          onBlur={e => onUpdateSegment(i, { time: e.target.value })}
                          placeholder="2h 30"
                          className="border border-gray-200 rounded-lg px-2 py-1 text-[12px] outline-none focus:border-[#1A2650] w-20"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-1">Distancia (km)</div>
                        <input
                          type="number"
                          defaultValue={seg.distanceKm}
                          onBlur={e => onUpdateSegment(i, { distanceKm: Number(e.target.value) })}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-[12px] outline-none focus:border-[#1A2650] w-20"
                        />
                      </div>
                      <button
                        onClick={() => setEditingSegIdx(null)}
                        className="text-[11px] text-white rounded-lg px-3 py-1 font-semibold"
                        style={{ background: '#1A2650' }}
                      >
                        Listo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-52 md:flex-shrink-0 flex flex-col gap-3">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1">Orden del viaje</div>
        <div className="text-[10px] text-gray-300 -mt-2">Arrastrá para reordenar</div>

        {/* Legend */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-widest">Transporte</div>
          {ALL_MODES.map(mode => {
            const meta = MODE_META[mode];
            return (
              <div key={mode} className="flex items-center gap-2 mb-1.5">
                <span className="text-[12px]">{meta.icon}</span>
                <div className="w-8 h-0.5 flex-shrink-0" style={{ background: `repeating-linear-gradient(to right, ${meta.color} 0, ${meta.color} ${meta.dash ? '6px' : '100%'}, transparent ${meta.dash ? '6px' : '0'}, transparent ${meta.dash ? '10px' : '0'})` }} />
                <span className="text-[11px] text-gray-500">{mode}</span>
              </div>
            );
          })}
        </div>

        {/* DND sortable list */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cityOrder} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5">
              {cityOrder.map((cityKey, idx) => (
                <SortableCityRow key={cityKey} cityKey={cityKey} order={idx + 1} isSelected={selectedCity === cityKey} nights={cityNights[cityKey] ?? 1} onClick={() => setSelectedCity(k => k === cityKey ? null : cityKey)} cities={cities} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {selectedCity && cities[selectedCity] && (
          <div className="rounded-xl p-3 text-white text-[11px] leading-relaxed" style={{ background: cities[selectedCity].bg }}>
            <div className="font-bold text-[13px] mb-1">{cities[selectedCity].label}</div>
            <div className="opacity-70">
              {(coords[selectedCity] ?? cities[selectedCity].coord)[0].toFixed(4)}°N<br />
              {Math.abs((coords[selectedCity] ?? cities[selectedCity].coord)[1]).toFixed(4)}°O
            </div>
            <div className="mt-1.5 opacity-80 text-[10px]">Arrastrá el marcador en el mapa para mover la ciudad</div>
          </div>
        )}

        <div className="text-[9px] text-gray-300 leading-tight pb-2">Hacé click en un trayecto para editar el medio de transporte</div>
      </div>
    </div>
  );
}
