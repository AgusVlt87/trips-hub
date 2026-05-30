/**
 * Mobile-only bottom navigation bar.
 * Shows on screens < 768px (md breakpoint).
 * Covers the 5 most-used tabs + a "More" drawer for the rest.
 */
import { useState } from 'react';

type TabId = string;

const PRIMARY: { id: TabId; icon: string; label: string }[] = [
  { id: 'dashboard',  icon: '📊', label: 'Panel' },
  { id: 'itinerary', icon: '📅', label: 'Días' },
  { id: 'gastos',    icon: '💸', label: 'Gastos' },
  { id: 'journal',   icon: '📔', label: 'Diario' },
  { id: 'more',      icon: '⋯',  label: 'Más' },
];

const MORE_TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'map',          icon: '🗺️', label: 'Mapa' },
  { id: 'cities',       icon: '📍', label: 'Ciudades' },
  { id: 'wallet',       icon: '🗂',  label: 'Documentos' },
  { id: 'herramientas', icon: '🔧', label: 'Herramientas' },
  { id: 'bookings',     icon: '🎫', label: 'Reservas' },
  { id: 'budget',       icon: '💰', label: 'Presupuesto' },
  { id: 'configurator', icon: '⚙️', label: 'Planificador' },
  { id: 'guide',        icon: '📖', label: 'Guía' },
];

interface Props {
  activeTab: TabId;
  onNavigate: (id: TabId) => void;
}

export default function BottomNav({ activeTab, onNavigate }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = MORE_TABS.some(t => t.id === activeTab);

  const navigate = (id: TabId) => {
    setMoreOpen(false);
    onNavigate(id);
  };

  return (
    <>
      {/* More drawer overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[900] md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer */}
      {moreOpen && (
        <div className="fixed bottom-16 inset-x-0 z-[910] px-3 md:hidden">
          <div className="bg-white rounded-2xl shadow-2xl p-3 grid grid-cols-4 gap-2">
            {MORE_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => navigate(t.id)}
                className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-colors"
                style={{ background: activeTab === t.id ? '#EBF0FF' : 'transparent' }}
              >
                <span className="text-[22px]">{t.icon}</span>
                <span className="text-[9px] text-gray-500 font-medium leading-tight text-center">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 inset-x-0 z-[800] md:hidden bg-white border-t border-gray-100 safe-area-inset-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {PRIMARY.map(t => {
            const isActive = t.id === 'more' ? (moreOpen || isMoreActive) : activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (t.id === 'more') setMoreOpen(o => !o);
                  else navigate(t.id);
                }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors"
                style={{ color: isActive ? '#1A2650' : '#9CA3AF' }}
              >
                <span className="text-[22px] leading-none">{t.icon}</span>
                <span className="text-[9px] font-semibold">{t.label}</span>
                {isActive && t.id !== 'more' && (
                  <div className="w-1 h-1 rounded-full bg-[#1A2650] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer so content isn't hidden behind the nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}
