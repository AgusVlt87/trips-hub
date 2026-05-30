import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TripDay } from '../types';
import { CITIES } from '../data';

interface Props {
  days: TripDay[];
  checked: Record<string, boolean>;
  todayDayIndex: number | null;   // null = trip not active
  onToggleCheck: (dayN: number, idx: number) => void;
  onUpdateActivity: (dayN: number, idx: number, val: string) => void;
  onDeleteActivity: (dayN: number, idx: number) => void;
  onAddActivity: (dayN: number) => void;
  onReorderDays: (newDays: TripDay[]) => void;
}

function dayProgress(day: TripDay, checked: Record<string, boolean>) {
  if (!day.activities.length) return 0;
  const done = day.activities.filter((_, i) => checked[`${day.n}-${i}`]).length;
  return Math.round((done / day.activities.length) * 100);
}

// ─── Sortable day row for the sidebar ───────────────────────────────────────
function SortableDayRow({
  day, isSelected, isToday, checked, onClick,
}: {
  day: TripDay;
  isSelected: boolean;
  isToday: boolean;
  checked: Record<string, boolean>;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.n });
  const c = CITIES[day.city];
  const pct = dayProgress(day, checked);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-1 group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing px-0.5 py-1 touch-none"
        title="Arrastrar"
      >
        ⠿
      </button>

      <div
        onClick={onClick}
        className="flex-1 min-w-0 rounded-md px-2 py-1.5 cursor-pointer transition-colors"
        style={{
          background: isSelected ? c.bg : 'transparent',
          color: isSelected ? '#fff' : '#555',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold opacity-50 min-w-[18px]">D{day.n}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <div className="text-[11px] font-medium">{day.date}</div>
              {isToday && <span className="text-[8px] font-bold bg-yellow-400 text-yellow-900 rounded-full px-1.5 py-0.5 leading-none">HOY</span>}
            </div>
            <div className="text-[10px] opacity-65 truncate">{day.title}</div>
            {pct > 0 && (
              <div
                className="mt-1 h-0.5 rounded-full"
                style={{ background: isSelected ? 'rgba(255,255,255,0.25)' : '#e5e5e5' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: isSelected ? 'rgba(255,255,255,0.85)' : c.bg }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline editable activity row ───────────────────────────────────────────
function ActivityRow({
  act, checked, cityBg,
  onToggle, onUpdate, onDelete,
}: {
  act: string;
  idx?: number;
  dayN?: number;
  checked: boolean;
  cityBg: string;
  onToggle: () => void;
  onUpdate: (val: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(act);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = () => { onUpdate(draft); setEditing(false); };

  return (
    <div
      className="act-row flex gap-2 py-2 border-b border-[#F0EBE3] last:border-0 items-start group"
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-4 h-4 rounded border-2 mt-0.5 flex items-center justify-center transition-all"
        style={{
          borderColor: checked ? cityBg : '#ccc',
          background: checked ? cityBg : '#fff',
        }}
      >
        {checked && <span className="text-white text-[8px] font-bold leading-none">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex gap-1.5">
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
              className="flex-1 px-2 py-0.5 text-[13px] border rounded outline-none"
              style={{ borderColor: cityBg }}
            />
            <button
              onClick={save}
              className="px-2 py-0.5 text-white text-[11px] rounded"
              style={{ background: cityBg }}
            >✓</button>
          </div>
        ) : (
          <span
            className="text-[13px] leading-relaxed cursor-default"
            style={{
              color: checked ? '#AAA' : '#2A2A2A',
              textDecoration: checked ? 'line-through' : 'none',
            }}
          >
            {act}
          </span>
        )}
      </div>

      {/* Actions — visible on row hover */}
      {!editing && (
        <div className="act-actions flex gap-1 flex-shrink-0 opacity-0 transition-opacity">
          <button
            onClick={() => { setDraft(act); setEditing(true); }}
            className="border border-gray-200 rounded px-1.5 py-0.5 text-[10px] text-gray-500 hover:border-gray-400"
          >✎</button>
          <button
            onClick={onDelete}
            className="border border-gray-200 rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:border-red-300"
          >✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Main ItineraryTab ───────────────────────────────────────────────────────
export default function ItineraryTab({
  days, checked, todayDayIndex,
  onToggleCheck, onUpdateActivity, onDeleteActivity, onAddActivity,
  onReorderDays,
}: Props) {
  const [sel, setSel] = useState(() => todayDayIndex !== null ? todayDayIndex : 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = days.findIndex(d => d.n === active.id);
      const newIdx = days.findIndex(d => d.n === over.id);
      onReorderDays(arrayMove(days, oldIdx, newIdx));
      // Keep selection on the moved day
      setSel(newIdx);
    }
  };

  const day = days[sel];
  const city = CITIES[day.city];
  const pct = dayProgress(day, checked);

  // Group days by city for sidebar headers
  const grouped: { city: string; indices: number[] }[] = [];
  days.forEach((d, i) => {
    const last = grouped[grouped.length - 1];
    if (!last || last.city !== d.city) grouped.push({ city: d.city, indices: [i] });
    else last.indices.push(i);
  });

  return (
    <div className="flex gap-0 flex-1">
      {/* ── Timeline strip ── */}
      <div className="hidden md:block w-48 flex-shrink-0 pt-4 pr-3 overflow-y-auto max-h-[calc(100vh-200px)] sticky top-0">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={days.map(d => d.n)} strategy={verticalListSortingStrategy}>
            {grouped.map(group => {
              const c = CITIES[group.city as keyof typeof CITIES];
              return (
                <div key={group.city} className="mb-3">
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 mb-1"
                    style={{ color: c.bg, borderColor: c.bg }}
                  >
                    {c.label}
                  </div>
                  {group.indices.map(i => (
                    <SortableDayRow
                      key={days[i].n}
                      day={days[i]}
                      isSelected={sel === i}
                      isToday={todayDayIndex === i}
                      checked={checked}
                      onClick={() => setSel(i)}
                    />
                  ))}
                </div>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      {/* ── Day detail ── */}
      <div className="flex-1 pt-4 pb-8 pl-2 min-w-0">
        {/* Horizontal mini timeline (mobile) */}
        <div className="flex gap-0.5 mb-3 md:hidden">
          {days.map((d, i) => (
            <div
              key={i}
              onClick={() => setSel(i)}
              title={`Día ${d.n} · ${d.date}`}
              className="flex-1 h-4 cursor-pointer rounded-sm relative overflow-hidden"
              style={{ background: CITIES[d.city].bg, opacity: sel === i ? 1 : 0.35 }}
            >
              {dayProgress(d, checked) > 0 && (
                <div
                  className="absolute bottom-0 left-0 h-[3px] bg-white/70"
                  style={{ width: `${dayProgress(d, checked)}%` }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card header */}
        <div
          className="rounded-t-xl px-5 py-4 text-white"
          style={{ background: city.bg }}
        >
          {todayDayIndex === sel && (
            <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-yellow-900 rounded-full px-3 py-1 text-[10px] font-bold mb-2">
              ⭐ HOY · {day.date}
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-widest opacity-60 mb-0.5">
                Día {day.n} · {day.wd}
              </div>
              <div className="font-serif text-[19px] font-bold leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {day.title}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <div className="font-serif text-[17px] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                {day.date}
              </div>
              <div
                className="text-[11px] rounded-full px-2 py-0.5 inline-block mt-1"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {city.label}
              </div>
            </div>
          </div>
          {pct > 0 && (
            <div className="mt-3 h-[3px] rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/80 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="bg-white rounded-b-xl px-5 py-4 shadow-md mb-3">
          {/* Transport banner */}
          {day.transport && (
            <div
              className="text-[12.5px] font-medium leading-relaxed mb-4 px-3 py-2 rounded-r-md border-l-[3px]"
              style={{ borderColor: city.bg, background: city.soft, color: city.bg }}
            >
              {day.transport}
            </div>
          )}

          {/* Activities */}
          <div className="mb-3">
            {day.activities.map((act, i) => (
              <ActivityRow
                key={i}
                act={act}
                idx={i}
                dayN={day.n}
                checked={!!checked[`${day.n}-${i}`]}
                cityBg={city.bg}
                onToggle={() => onToggleCheck(day.n, i)}
                onUpdate={val => onUpdateActivity(day.n, i, val)}
                onDelete={() => onDeleteActivity(day.n, i)}
              />
            ))}
          </div>
          <button
            onClick={() => onAddActivity(day.n)}
            className="w-full py-2 text-[12px] rounded-md border-dashed border transition-colors mb-4"
            style={{ borderColor: city.bg, color: city.bg }}
          >
            + Agregar actividad
          </button>

          {/* Editorial tip */}
          {day.note && (
            <div className="bg-[#FFFBF0] border border-[#E8D890] border-l-[3px] border-l-[#C8A820] rounded-r-md px-3 py-2 text-[12px] text-[#5A4A10] leading-relaxed">
              <span className="font-semibold">Tip · </span>{day.note}
            </div>
          )}
        </div>

        {/* Prev / Next nav */}
        <div className="flex gap-2">
          {sel > 0 && (
            <button
              onClick={() => setSel(sel - 1)}
              className="bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-[12px] text-gray-600 hover:bg-gray-50"
            >
              ← Anterior
            </button>
          )}
          {sel < days.length - 1 && (
            <button
              onClick={() => setSel(sel + 1)}
              className="ml-auto text-white rounded-lg px-4 py-1.5 text-[12px] font-medium hover:opacity-90"
              style={{ background: city.bg }}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
