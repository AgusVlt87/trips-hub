import { BOOKINGS, CITIES } from '../data';

interface Props {
  booked: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export default function BookingsTab({ booked, onToggle }: Props) {
  const confirmed = BOOKINGS.filter(b => booked[b.id]).length;
  const pct = Math.round((confirmed / BOOKINGS.length) * 100);

  const urgent = BOOKINGS.filter(b => b.urgent);
  const normal = BOOKINGS.filter(b => !b.urgent);

  return (
    <div className="py-4 pb-10">
      {/* Progress header */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
            {confirmed} de {BOOKINGS.length} confirmadas
          </span>
          <span className="text-[11px] font-bold text-gray-500">{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full">
          <div
            className="h-full bg-[#426038] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Urgent */}
      <Section title="⚡ Reservar urgente" urgent items={urgent} booked={booked} onToggle={onToggle} />

      {/* Normal */}
      <Section title="Antes de viajar" urgent={false} items={normal} booked={booked} onToggle={onToggle} />
    </div>
  );
}

function Section({
  title, urgent, items, booked, onToggle,
}: {
  title: string;
  urgent: boolean;
  items: typeof BOOKINGS;
  booked: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mb-6">
      <div
        className="text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ color: urgent ? '#C85618' : '#999' }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map(b => {
          const c = CITIES[b.city];
          const done = !!booked[b.id];
          return (
            <div
              key={b.id}
              className="bg-white rounded-xl p-3 shadow-sm flex gap-3 items-start transition-opacity"
              style={{
                opacity: done ? 0.55 : 1,
                border: done ? '1px solid #DDD' : `1px solid ${urgent ? '#F5C5A0' : '#E8E0D4'}`,
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => onToggle(b.id)}
                className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all"
                style={{
                  borderColor: done ? '#426038' : '#ccc',
                  background: done ? '#426038' : '#fff',
                }}
              >
                {done && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[13px] font-semibold mb-1"
                  style={{ color: done ? '#999' : '#222', textDecoration: done ? 'line-through' : 'none' }}
                >
                  {b.label}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                    style={{ background: c.soft, color: c.bg }}
                  >
                    {c.label}
                  </span>
                  <span className="text-[11px] text-gray-400">{b.note}</span>
                </div>
              </div>

              {/* Link */}
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-[11px] font-semibold rounded-md px-2.5 py-1 border transition-colors hover:opacity-80"
                style={{ color: c.bg, borderColor: c.bg }}
              >
                Reservar →
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
