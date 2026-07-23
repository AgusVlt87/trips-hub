import { useState } from 'react';

/**
 * Asistente de viaje: una secuencia de preguntas de opción múltiple seguida de
 * una pregunta de texto libre. Al final arma un prompt listo para pegarle a
 * Claude Code, que completa el hub (itinerario, lugares, presupuesto, etc.).
 */

type StepId = 'company' | 'length' | 'budget' | 'pace' | 'interests' | 'season';

interface Choice { value: string; label: string; icon: string }
interface Step {
  id: StepId;
  title: string;
  subtitle: string;
  multi: boolean;
  choices: Choice[];
}

const STEPS: Step[] = [
  {
    id: 'company', title: '¿Con quién viajás?', subtitle: 'Para pensar el plan a la medida', multi: false,
    choices: [
      { value: 'en pareja', label: 'En pareja', icon: '💑' },
      { value: 'solo/a', label: 'Solo/a', icon: '🎒' },
      { value: 'con amigos', label: 'Con amigos', icon: '🎉' },
      { value: 'en familia', label: 'En familia', icon: '👨‍👩‍👧' },
    ],
  },
  {
    id: 'length', title: '¿Cuánto dura?', subtitle: 'Un aproximado está perfecto', multi: false,
    choices: [
      { value: 'un fin de semana', label: 'Un finde', icon: '⚡' },
      { value: 'una semana', label: 'Una semana', icon: '🗓️' },
      { value: 'dos semanas', label: 'Dos semanas', icon: '🌍' },
      { value: 'un mes o más', label: 'Un mes o más', icon: '🧭' },
    ],
  },
  {
    id: 'budget', title: '¿Qué presupuesto manejás?', subtitle: 'Sin vueltas, para calibrar todo', multi: false,
    choices: [
      { value: 'mochilero (lo justo)', label: 'Mochilero', icon: '🪙' },
      { value: 'medio', label: 'Medio', icon: '💶' },
      { value: 'cómodo', label: 'Cómodo', icon: '💳' },
      { value: 'sin límites', label: 'Sin límites', icon: '💎' },
    ],
  },
  {
    id: 'pace', title: '¿Qué ritmo te gusta?', subtitle: 'Cómo te gusta viajar', multi: false,
    choices: [
      { value: 'relax total', label: 'Relax total', icon: '🌴' },
      { value: 'equilibrado', label: 'Equilibrado', icon: '⚖️' },
      { value: 'a mil, ver todo', label: 'A mil', icon: '🚀' },
    ],
  },
  {
    id: 'interests', title: '¿Qué te vuela la cabeza?', subtitle: 'Elegí todo lo que te copa', multi: true,
    choices: [
      { value: 'gastronomía', label: 'Gastronomía', icon: '🍽️' },
      { value: 'arte y cultura', label: 'Arte y cultura', icon: '🎨' },
      { value: 'naturaleza', label: 'Naturaleza', icon: '🏔️' },
      { value: 'playa', label: 'Playa', icon: '🏖️' },
      { value: 'vida nocturna', label: 'Vida nocturna', icon: '🍸' },
      { value: 'compras', label: 'Compras', icon: '🛍️' },
      { value: 'historia', label: 'Historia', icon: '🏛️' },
      { value: 'aventura', label: 'Aventura', icon: '🧗' },
      { value: 'barrios y cafés', label: 'Barrios y cafés', icon: '☕' },
      { value: 'atardeceres', label: 'Atardeceres', icon: '🌅' },
    ],
  },
  {
    id: 'season', title: '¿Para cuándo?', subtitle: 'Si ya sabés; si no, después lo afinás', multi: false,
    choices: [
      { value: 'todavía no sé', label: 'No sé aún', icon: '🤷' },
      { value: 'primavera', label: 'Primavera', icon: '🌸' },
      { value: 'verano', label: 'Verano', icon: '☀️' },
      { value: 'otoño', label: 'Otoño', icon: '🍂' },
      { value: 'invierno', label: 'Invierno', icon: '❄️' },
    ],
  },
];

const ACCENT = '#C0502A';

export default function TripWizard({ onClose }: { onClose: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<StepId, string[]>>({
    company: [], length: [], budget: [], pace: [], interests: [], season: [],
  });
  const [freeText, setFreeText] = useState('');
  const [phase, setPhase] = useState<'choices' | 'free' | 'result'>('choices');
  const [copied, setCopied] = useState(false);

  const step = STEPS[stepIdx];
  const totalPhases = STEPS.length + 1; // + la de texto libre
  const progress = phase === 'result' ? 100 : Math.round(((phase === 'free' ? STEPS.length : stepIdx) / totalPhases) * 100);

  const selected = answers[step.id];
  const canNext = phase === 'free' ? true : selected.length > 0;

  const pick = (value: string) => {
    setAnswers(prev => {
      const cur = prev[step.id];
      if (step.multi) {
        return { ...prev, [step.id]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] };
      }
      return { ...prev, [step.id]: [value] };
    });
    if (!step.multi) setTimeout(() => advance(), 180); // auto-avanzar en single
  };

  const advance = () => {
    if (phase === 'choices') {
      if (stepIdx < STEPS.length - 1) setStepIdx(i => i + 1);
      else setPhase('free');
    } else if (phase === 'free') {
      setPhase('result');
    }
  };

  const back = () => {
    if (phase === 'result') { setPhase('free'); return; }
    if (phase === 'free') { setPhase('choices'); setStepIdx(STEPS.length - 1); return; }
    if (stepIdx > 0) setStepIdx(i => i - 1);
    else onClose();
  };

  const prompt = buildPrompt(answers, freeText);

  const copy = () => {
    navigator.clipboard?.writeText(prompt).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col" style={{ background: 'linear-gradient(160deg,#FBF6F0 0%,#F4E8DD 100%)' }}>
      {/* Barra superior */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <button onClick={back} className="text-[22px] text-[#9A8b7c] w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5">‹</button>
        <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: ACCENT }} />
        </div>
        <button onClick={onClose} className="text-[13px] text-[#9A8b7c] font-medium px-2">Saltar</button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 max-w-lg w-full mx-auto">
        {phase === 'choices' && (
          <div key={step.id} className="pt-4">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>
              Paso {stepIdx + 1} de {totalPhases}
            </div>
            <h2 className="text-[26px] font-bold text-[#2A2320] leading-tight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {step.title}
            </h2>
            <p className="text-[13px] text-[#8A7B6E] mb-6">{step.subtitle}</p>

            <div className={step.choices.length > 5 ? 'grid grid-cols-2 gap-2.5' : 'flex flex-col gap-2.5'}>
              {step.choices.map(c => {
                const on = selected.includes(c.value);
                return (
                  <button key={c.value} onClick={() => pick(c.value)}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left border-2 transition-all"
                    style={{
                      borderColor: on ? ACCENT : '#EADFD3',
                      background: on ? '#FBEDE4' : '#fff',
                      boxShadow: on ? `0 4px 14px ${ACCENT}22` : '0 1px 3px rgba(0,0,0,0.04)',
                    }}>
                    <span className="text-[22px]">{c.icon}</span>
                    <span className="text-[14px] font-semibold text-[#3A322C] flex-1">{c.label}</span>
                    {on && <span className="text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center" style={{ background: ACCENT }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {step.multi && (
              <button onClick={advance} disabled={!canNext}
                className="w-full mt-6 py-3.5 rounded-2xl text-[15px] font-bold text-white transition-all"
                style={{ background: canNext ? ACCENT : '#D8C6B8' }}>
                Seguir →
              </button>
            )}
          </div>
        )}

        {phase === 'free' && (
          <div className="pt-4">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>
              Último paso
            </div>
            <h2 className="text-[26px] font-bold text-[#2A2320] leading-tight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              Contanos tu viaje soñado
            </h2>
            <p className="text-[13px] text-[#8A7B6E] mb-5">
              ¿Adónde te imaginás? ¿Algo que no puede faltar, alguna restricción, un sueño puntual? Escribí libre.
            </p>
            <textarea
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              autoFocus
              rows={6}
              placeholder="Ej: Queremos ir a Italia — Roma, Florencia y la costa Amalfitana. Nos encanta perdernos en mercados, comer pasta en trattorias de barrio y ver un atardecer sobre el mar. Sin madrugar mucho."
              className="w-full rounded-2xl border-2 border-[#EADFD3] bg-white px-4 py-3.5 text-[14px] leading-relaxed outline-none focus:border-[#C0502A] resize-none"
            />
            <button onClick={advance}
              className="w-full mt-5 py-3.5 rounded-2xl text-[15px] font-bold text-white transition-all"
              style={{ background: ACCENT }}>
              ✨ Armar mi viaje
            </button>
          </div>
        )}

        {phase === 'result' && (
          <div className="pt-4">
            <div className="text-center mb-5">
              <div className="text-[40px] mb-1">🗺️</div>
              <h2 className="text-[24px] font-bold text-[#2A2320] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                ¡Listo tu brief de viaje!
              </h2>
              <p className="text-[13px] text-[#8A7B6E] mt-1 px-2">
                Copiá el texto de abajo y pegáselo a <b>Claude Code</b> en la carpeta del hub. Te arma itinerario día a día, lugares, presupuesto y todo.
              </p>
            </div>

            {/* Resumen visual de elecciones */}
            <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
              {Object.entries(answers).flatMap(([, vals]) => vals).map((v, i) => (
                <span key={i} className="text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: '#FBEDE4', color: ACCENT }}>{v}</span>
              ))}
            </div>

            <div className="rounded-2xl border-2 border-[#EADFD3] bg-white p-4 text-[13px] text-[#3A322C] leading-relaxed whitespace-pre-wrap max-h-[34vh] overflow-y-auto">
              {prompt}
            </div>

            <button onClick={copy}
              className="w-full mt-4 py-3.5 rounded-2xl text-[15px] font-bold text-white transition-all"
              style={{ background: copied ? '#2E7D5E' : ACCENT }}>
              {copied ? '✓ Copiado — ¡pegáselo a Claude!' : '📋 Copiar el brief'}
            </button>
            <button onClick={onClose} className="w-full mt-2 py-3 rounded-2xl text-[13px] font-semibold text-[#8A7B6E]">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function buildPrompt(answers: Record<StepId, string[]>, freeText: string): string {
  const a = (k: StepId) => answers[k][0] ?? '';
  const interests = answers.interests.join(', ') || 'un poco de todo';
  const extra = freeText.trim() ? `\n\nDetalles y sueños en mis palabras:\n"${freeText.trim()}"` : '';
  return (
    `Sos mi agente de viajes experto. Armá este hub de viaje para mí con el mejor plan posible.\n\n` +
    `• Viajo: ${a('company') || 'sin especificar'}\n` +
    `• Duración: ${a('length') || 'a definir'}\n` +
    `• Presupuesto: ${a('budget') || 'medio'}\n` +
    `• Ritmo: ${a('pace') || 'equilibrado'}\n` +
    `• Me vuela la cabeza: ${interests}\n` +
    `• Época: ${a('season') || 'a definir'}` +
    extra +
    `\n\nCon esto, definí los destinos y las noches en cada uno, y completá src/trip.config.ts entero: ` +
    `itinerario día a día, lugares (POIs) elegidos a mi gusto, links útiles, presupuesto estimado y reservas sugeridas. ` +
    `Priorizá lo que me copa, sumá joyas poco turísticas y dejá todo listo para usar.`
  );
}
