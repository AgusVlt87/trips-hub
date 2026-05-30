import { useState } from 'react';

type TabId = string;

interface Tab { id: TabId; icon: string; label: string }

interface Props {
  tabs: readonly Tab[];
  active: TabId;
  onChange: (id: TabId) => void;
}

export default function BottomNav({ tabs, active, onChange }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = tabs.slice(0, 4);
  const more = tabs.slice(4);
  const isMoreActive = more.some(t => t.id === active);

  const navigate = (id: TabId) => { setMoreOpen(false); onChange(id); };

  return (
    <>
      {moreOpen && <div className="fixed inset-0 bg-black/30 z-[900]" onClick={() => setMoreOpen(false)} />}
      {moreOpen && more.length > 0 && (
        <div className="fixed bottom-16 inset-x-0 z-[910] px-3">
          <div className="bg-white rounded-2xl shadow-2xl p-3 grid grid-cols-4 gap-2">
            {more.map(t => (
              <button key={t.id} onClick={() => navigate(t.id)}
                className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-colors"
                style={{ background: active === t.id ? '#EBF0FF' : 'transparent' }}>
                <span className="text-[22px]">{t.icon}</span>
                <span className="text-[9px] text-gray-500 font-medium leading-tight text-center">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 inset-x-0 z-[800] bg-white border-t border-gray-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex max-w-md mx-auto">
          {primary.map(t => {
            const isActive = active === t.id;
            return (
              <button key={t.id} onClick={() => navigate(t.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors"
                style={{ color: isActive ? '#1A2650' : '#9CA3AF' }}>
                <span className="text-[22px] leading-none">{t.icon}</span>
                <span className="text-[9px] font-semibold">{t.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-[#1A2650] mt-0.5" />}
              </button>
            );
          })}
          {more.length > 0 && (
            <button onClick={() => setMoreOpen(o => !o)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors"
              style={{ color: (moreOpen || isMoreActive) ? '#1A2650' : '#9CA3AF' }}>
              <span className="text-[22px] leading-none">⋯</span>
              <span className="text-[9px] font-semibold">Más</span>
            </button>
          )}
        </div>
      </nav>

      {/* Spacer so content isn't hidden behind the nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}
