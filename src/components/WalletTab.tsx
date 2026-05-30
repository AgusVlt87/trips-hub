import { useState, useRef } from 'react';
import type { WalletItem, WalletSection, CityKey } from '../types';
import { CITIES, CITY_ORDER } from '../data';

const SECTION_META: Record<WalletSection, { icon: string; color: string }> = {
  Vuelos:       { icon: '✈️',  color: '#1A2650' },
  Alojamientos: { icon: '🏠',  color: '#7B341E' },
  Transportes:  { icon: '🚄',  color: '#276749' },
  Actividades:  { icon: '🎭',  color: '#6B46C1' },
  Documentos:   { icon: '📄',  color: '#2B6CB0' },
  Emergencias:  { icon: '🆘',  color: '#C53030' },
  Contactos:    { icon: '📞',  color: '#2C7A7B' },
};

const SECTIONS: WalletSection[] = ['Vuelos','Alojamientos','Transportes','Actividades','Documentos','Emergencias','Contactos'];

interface Props {
  wallet: WalletItem[];
  onUpdate: (id: string, patch: Partial<WalletItem>) => void;
  onAdd: (item: Omit<WalletItem, 'id'>) => void;
  onDelete: (id: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button
      onClick={copy}
      className="text-[10px] px-2 py-0.5 rounded border transition-colors flex-shrink-0"
      style={{ borderColor: copied ? '#38A169' : '#ddd', color: copied ? '#38A169' : '#999', background: copied ? '#F0FFF4' : '#fff' }}
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  );
}

function WalletRow({ item, onUpdate, onDelete }: { item: WalletItem; onUpdate: (p: Partial<WalletItem>) => void; onDelete: () => void }) {
  const [hidden, setHidden] = useState(item.secret ?? false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.value);
  const [notesDraft, setNotesDraft] = useState(item.notes ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const save = () => {
    onUpdate({ value: draft, notes: notesDraft });
    setEditing(false);
  };

  const isEmpty = !item.value.trim();

  return (
    <div className={`border-b border-gray-50 last:border-0 py-3 group ${isEmpty ? 'opacity-60' : ''}`}>
      {editing ? (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-gray-600">{item.label}</div>
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
            placeholder="Valor / código / número..."
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1A2650]"
          />
          <input
            value={notesDraft}
            onChange={e => setNotesDraft(e.target.value)}
            placeholder="Notas (opcional)"
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            <button onClick={save} className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white" style={{ background: '#1A2650' }}>Guardar</button>
            <button onClick={() => setEditing(false)} className="px-3 py-1 rounded-lg text-[11px] text-gray-500 border border-gray-200">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] text-gray-500">{item.label}</span>
              {item.city && (
                <span className="text-[9px] font-semibold rounded-full px-1.5 py-0.5" style={{ background: CITIES[item.city].soft, color: CITIES[item.city].bg }}>
                  {CITIES[item.city].label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEmpty ? (
                <span className="text-[12px] text-gray-300 italic">Sin completar — hacé click para editar</span>
              ) : (
                <span
                  className="text-[13px] font-semibold text-gray-800 font-mono select-all"
                  style={{ letterSpacing: item.secret ? '0.15em' : 'normal' }}
                >
                  {hidden && item.secret ? '•'.repeat(Math.min(item.value.length, 12)) : item.value}
                </span>
              )}
              {!isEmpty && item.secret && (
                <button onClick={() => setHidden(h => !h)} className="text-[10px] text-gray-400 hover:text-gray-600">
                  {hidden ? '👁' : '🙈'}
                </button>
              )}
              {!isEmpty && <CopyButton text={item.value} />}
            </div>
            {item.notes && !editing && (
              <div className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{item.notes}</div>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => setEditing(true)} className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 text-gray-500 hover:bg-gray-50">✎</button>
            <button onClick={onDelete} className="text-[10px] border border-red-100 rounded px-1.5 py-0.5 text-red-400 hover:bg-red-50">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WalletTab({ wallet, onUpdate, onAdd, onDelete }: Props) {
  const [openSection, setOpenSection] = useState<WalletSection | null>('Vuelos');
  const [addingTo, setAddingTo] = useState<WalletSection | null>(null);
  const [newForm, setNewForm] = useState({ label: '', value: '', notes: '', city: '' as CityKey | '', secret: false });
  const [filterEmpty, setFilterEmpty] = useState(false);

  const filledCount = wallet.filter(w => w.value.trim()).length;
  const pct = wallet.length > 0 ? Math.round((filledCount / wallet.length) * 100) : 0;

  const submitNew = () => {
    if (!newForm.label.trim()) return;
    onAdd({
      section: addingTo!,
      label: newForm.label,
      value: newForm.value,
      notes: newForm.notes || undefined,
      city: newForm.city || undefined,
      secret: newForm.secret,
    });
    setAddingTo(null);
    setNewForm({ label: '', value: '', notes: '', city: '', secret: false });
  };

  return (
    <div className="py-4 pb-12">
      {/* Header progress */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[11px] text-gray-400 uppercase tracking-widest mb-0.5">Documentos completados</div>
            <div className="text-[22px] font-bold text-[#1A2650]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {filledCount}/{wallet.length}
            </div>
          </div>
          <div className="text-[28px] font-bold" style={{ color: pct === 100 ? '#38A169' : '#1A2650', fontFamily: "'Playfair Display', serif" }}>
            {pct}%
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? '#38A169' : '#1A2650' }} />
        </div>
        {pct < 100 && (
          <div className="text-[11px] text-gray-400 mt-2">
            {wallet.filter(w => !w.value.trim()).slice(0, 3).map(w => w.label).join(' · ')}
            {wallet.filter(w => !w.value.trim()).length > 3 ? ` y ${wallet.filter(w => !w.value.trim()).length - 3} más...` : ''}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 items-center">
        <button
          onClick={() => setFilterEmpty(f => !f)}
          className="text-[11px] px-3 py-1.5 rounded-lg border transition-colors font-medium"
          style={{ background: filterEmpty ? '#FFF5F5' : '#fff', borderColor: filterEmpty ? '#FEB2B2' : '#ddd', color: filterEmpty ? '#C53030' : '#666' }}
        >
          {filterEmpty ? '✕ Solo vacíos activo' : 'Mostrar solo vacíos'}
        </button>
        <div className="text-[10px] text-gray-400 ml-auto">{filledCount} completados · {wallet.filter(w => !w.value.trim()).length} pendientes</div>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => {
        const sectionItems = wallet.filter(w => w.section === section && (!filterEmpty || !w.value.trim()));
        const meta = SECTION_META[section];
        const sectionFilled = wallet.filter(w => w.section === section && w.value.trim()).length;
        const sectionTotal = wallet.filter(w => w.section === section).length;
        const isOpen = openSection === section;

        return (
          <div key={section} className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden">
            <button
              className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
              onClick={() => setOpenSection(s => s === section ? null : section)}
            >
              <span className="text-[16px]">{meta.icon}</span>
              <span className="flex-1 font-semibold text-[13px] text-gray-700">{section}</span>
              <span className="text-[10px] font-semibold" style={{ color: sectionFilled === sectionTotal ? '#38A169' : meta.color }}>
                {sectionFilled}/{sectionTotal}
              </span>
              {sectionFilled < sectionTotal && (
                <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              )}
              <span className="text-gray-400 text-[12px] ml-1">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-50">
                {sectionItems.length === 0 && filterEmpty && (
                  <div className="px-4 py-3 text-[11px] text-gray-300 italic">Todo completado en esta sección ✓</div>
                )}
                <div className="px-4">
                  {sectionItems.map(item => (
                    <WalletRow
                      key={item.id}
                      item={item}
                      onUpdate={patch => onUpdate(item.id, patch)}
                      onDelete={() => onDelete(item.id)}
                    />
                  ))}
                </div>

                {/* Add item form */}
                {addingTo === section ? (
                  <div className="px-4 py-3 border-t border-gray-50 bg-gray-50">
                    <div className="space-y-2">
                      <input
                        value={newForm.label}
                        onChange={e => setNewForm(f => ({ ...f, label: e.target.value }))}
                        placeholder="Etiqueta (ej: Hostel Barcelona — código) *"
                        autoFocus
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1A2650] bg-white"
                      />
                      <input
                        value={newForm.value}
                        onChange={e => setNewForm(f => ({ ...f, value: e.target.value }))}
                        placeholder="Valor / código (opcional)"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none bg-white"
                      />
                      <input
                        value={newForm.notes}
                        onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Notas (opcional)"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none bg-white"
                      />
                      <div className="flex gap-3 items-center">
                        <select
                          value={newForm.city}
                          onChange={e => setNewForm(f => ({ ...f, city: e.target.value as CityKey | '' }))}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] outline-none bg-white"
                        >
                          <option value="">Sin ciudad</option>
                          {CITY_ORDER.map(k => <option key={k} value={k}>{CITIES[k].label}</option>)}
                        </select>
                        <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                          <input type="checkbox" checked={newForm.secret} onChange={e => setNewForm(f => ({ ...f, secret: e.target.checked }))} />
                          Ocultar valor
                        </label>
                        <div className="flex gap-1.5 ml-auto">
                          <button onClick={submitNew} className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white" style={{ background: '#1A2650' }}>Guardar</button>
                          <button onClick={() => setAddingTo(null)} className="px-3 py-1 rounded-lg text-[11px] text-gray-500 border border-gray-200 bg-white">✕</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo(section)}
                    className="w-full text-left px-4 py-2.5 text-[11px] border-t border-gray-50 transition-colors hover:bg-gray-50"
                    style={{ color: meta.color }}
                  >
                    + Agregar a {section}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
