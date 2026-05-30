import { useState, useEffect } from 'react';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  useSyncStatus, setTripCode, setAuthor,
  getTripCode, getAuthor,
} from '../lib/useSync';

const STATUS_META = {
  offline:     { dot: '#718096', label: 'Sin sincronización', bg: '#F7FAFC' },
  connecting:  { dot: '#ECC94B', label: 'Conectando…',        bg: '#FFFFF0' },
  synced:      { dot: '#48BB78', label: 'Sincronizado',        bg: '#F0FFF4' },
  syncing:     { dot: '#4299E1', label: 'Guardando…',          bg: '#EBF8FF' },
  error:       { dot: '#F56565', label: 'Error de conexión',   bg: '#FFF5F5' },
};

interface Props {
  onClose: () => void;
}

function generateCode(): string {
  const words = ['sol','mar','tren','vino','flor','luna','rio','mesa','pan','sal'];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(100 + Math.random() * 900);
  return `${pick()}-${pick()}-${n}`;
}

export function SyncStatusPill({ onClick }: { onClick: () => void }) {
  const status = useSyncStatus();
  const meta = STATUS_META[status];
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-2.5 py-1 transition-colors hover:opacity-80"
      style={{ background: meta.bg, color: '#444', border: `1px solid ${meta.dot}40` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: meta.dot }} />
      {meta.label}
    </button>
  );
}

export default function SyncPanel({ onClose }: Props) {
  const status = useSyncStatus();
  const [localCode, setLocalCode] = useState(getTripCode() ?? '');
  const [localAuthor, setLocalAuthor] = useState(getAuthor());
  const [applied, setApplied] = useState(false);
  const [showSteps, setShowSteps] = useState(!isFirebaseConfigured);

  const apply = () => {
    const trimmed = localCode.trim().toLowerCase();
    setTripCode(trimmed || null);
    setAuthor(localAuthor || 'Viajero');
    localStorage.setItem('es-trip-code', trimmed);
    localStorage.setItem('es-author', localAuthor);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  useEffect(() => {
    const savedCode = localStorage.getItem('es-trip-code');
    const savedAuthor = localStorage.getItem('es-author');
    if (savedCode) { setLocalCode(savedCode); setTripCode(savedCode); }
    if (savedAuthor) { setLocalAuthor(savedAuthor); setAuthor(savedAuthor); }
  }, []);

  const meta = STATUS_META[status];

  return (
    <div className="fixed inset-0 bg-black/40 z-[2000] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="font-bold text-[15px] text-gray-800">Sincronización</div>
            <div className="text-[11px] text-gray-400">Compartir datos entre dispositivos</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-[20px] w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: meta.bg }}>
            <div className="w-3 h-3 rounded-full" style={{ background: meta.dot }} />
            <div>
              <div className="text-[12px] font-semibold text-gray-700">{meta.label}</div>
              {!isFirebaseConfigured && (
                <div className="text-[10px] text-gray-400">Firebase no configurado</div>
              )}
              {isFirebaseConfigured && getTripCode() && (
                <div className="text-[10px] text-gray-400">Sala: <span className="font-mono font-semibold">{getTripCode()}</span></div>
              )}
            </div>
          </div>

          {/* Firebase not configured → guide */}
          {!isFirebaseConfigured && (
            <div>
              <button
                onClick={() => setShowSteps(s => !s)}
                className="flex items-center gap-2 text-[12px] font-semibold text-[#1A2650] mb-3"
              >
                {showSteps ? '▼' : '▶'} ¿Cómo activar la sincronización?
              </button>
              {showSteps && (
                <div className="space-y-3">
                  {[
                    {
                      n: 1, title: 'Crear proyecto Firebase',
                      body: 'Ir a console.firebase.google.com → "Agregar proyecto" → cualquier nombre (ej: "viaje-espana") → sin Google Analytics está bien.',
                    },
                    {
                      n: 2, title: 'Activar Realtime Database',
                      body: 'En el menú lateral → "Realtime Database" → "Crear base de datos" → modo de prueba → elegir ubicación más cercana (europe-west1).',
                    },
                    {
                      n: 3, title: 'Obtener la configuración',
                      body: 'Configuración del proyecto (⚙) → "Tus apps" → agregar app web (</>)  → copiar el objeto firebaseConfig.',
                    },
                    {
                      n: 4, title: 'Crear archivo .env.local',
                      body: 'En la raíz del proyecto crear .env.local con las variables del archivo .env.example. Pegar los valores del config.',
                    },
                    {
                      n: 5, title: 'Subir a Vercel',
                      body: 'npx vercel → seguir el wizard → en "Environment Variables" agregar las mismas variables VITE_FB_*. En 2 minutos tenés la URL.',
                    },
                  ].map(({ n, title, body }) => (
                    <div key={n} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#1A2650] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</div>
                      <div>
                        <div className="text-[12px] font-semibold text-gray-700">{title}</div>
                        <div className="text-[11px] text-gray-500 leading-relaxed">{body}</div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-[10px] text-gray-600 leading-relaxed">
                    # .env.local<br/>
                    VITE_FB_API_KEY=AIza...<br/>
                    VITE_FB_AUTH_DOMAIN=tu-proyecto.firebaseapp.com<br/>
                    VITE_FB_DATABASE_URL=https://tu-proyecto-default-rtdb.europe-west1.firebasedatabase.app<br/>
                    VITE_FB_PROJECT_ID=tu-proyecto<br/>
                    VITE_FB_APP_ID=1:1234:web:abcd
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trip code config */}
          {isFirebaseConfigured && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tu nombre</div>
                <input
                  value={localAuthor}
                  onChange={e => setLocalAuthor(e.target.value)}
                  placeholder="Agustín"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#1A2650]"
                />
                <div className="text-[10px] text-gray-400 mt-1">Aparece en el diario cuando escribís una entrada</div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Código de sala</div>
                <div className="flex gap-2">
                  <input
                    value={localCode}
                    onChange={e => setLocalCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="sol-mar-482"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-mono outline-none focus:border-[#1A2650]"
                  />
                  <button
                    onClick={() => setLocalCode(generateCode())}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-[11px] text-gray-500 hover:bg-gray-50"
                  >🎲 Generar</button>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Compartí este código con tu compañera de viaje. Los dos tienen que usar el mismo código para sincronizar datos.
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-700 leading-relaxed">
                <span className="font-bold">¿Cómo funciona?</span> Los cambios que hace una persona (marcar actividades, agregar gastos, escribir en el diario) aparecen automáticamente en el celular de la otra. Sin necesidad de recargar.
              </div>

              <button
                onClick={apply}
                className="w-full py-3 rounded-xl text-[13px] font-bold text-white transition-all"
                style={{ background: applied ? '#48BB78' : '#1A2650' }}
              >
                {applied ? '✓ Conectado' : 'Conectar sala'}
              </button>

              {getTripCode() && (
                <button
                  onClick={() => { setTripCode(null); setLocalCode(''); localStorage.removeItem('es-trip-code'); }}
                  className="w-full py-2 rounded-xl text-[12px] text-gray-500 border border-gray-200 hover:bg-gray-50"
                >
                  Desconectar sala
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
