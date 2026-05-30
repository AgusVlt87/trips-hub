import type { TripDay, TripConfig, CityKey, DayTemplate, Gasto, BudgetState } from './types';

// ─── Date helpers ────────────────────────────────────────────────────────────
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const WEEKDAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()]}`;
}

export function formatWeekday(date: Date): string {
  return WEEKDAYS_ES[date.getDay()];
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function dateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return dateToISO(new Date());
}

// ─── Day generation ──────────────────────────────────────────────────────────
const FREE_DAY: Omit<TripDay, 'n' | 'date' | 'wd' | 'city'> = {
  title: 'Día libre',
  activities: ['Explorar sin agenda fija', 'Desayuno tranquilo en un bar de barrio', 'Paseo y descubrimiento espontáneo'],
};

export function reconcileDays(
  existing: TripDay[],
  config: TripConfig,
  cityOrder: CityKey[],
  templates: Record<string, DayTemplate[]> = {},
): TripDay[] {
  const existingByCity: Record<string, TripDay[]> = {};
  cityOrder.forEach(k => { existingByCity[k] = []; });
  existing.forEach(d => { if (existingByCity[d.city] !== undefined) existingByCity[d.city].push(d); });

  const result: TripDay[] = [];
  let dayN = 1;
  let date = parseDate(config.startDate);

  for (const cityKey of cityOrder) {
    const targetNights = config.cityNights[cityKey] ?? 1;
    const existingCityDays = existingByCity[cityKey] ?? [];
    const cityTemplates = templates[cityKey] ?? [];

    for (let i = 0; i < targetNights; i++) {
      const userDay = existingCityDays[i];
      const template = cityTemplates[i] ?? { ...FREE_DAY, city: cityKey };
      result.push({
        ...(userDay ?? template),
        city: cityKey,
        n: dayN++,
        date: formatDayDate(date),
        wd: formatWeekday(date),
      });
      date = addDays(date, 1);
    }
  }
  return result;
}

export function generateDays(config: TripConfig, templates: Record<string, DayTemplate[]> = {}): TripDay[] {
  const cityOrder = Object.keys(config.cityNights);
  return reconcileDays([], config, cityOrder, templates);
}


// ─── Progress helpers ────────────────────────────────────────────────────────
export function dayProgress(day: TripDay, checked: Record<string, boolean>): number {
  if (!day.activities.length) return 0;
  const done = day.activities.filter((_, i) => checked[`${day.n}-${i}`]).length;
  return Math.round((done / day.activities.length) * 100);
}

export function totalProgress(days: TripDay[], checked: Record<string, boolean>): { done: number; total: number } {
  let done = 0, total = 0;
  days.forEach(d => {
    total += d.activities.length;
    done += d.activities.filter((_, i) => checked[`${d.n}-${i}`] ?? false).length;
  });
  return { done, total };
}

// ─── Trip timeline helpers ────────────────────────────────────────────────────
export function totalNights(config: TripConfig): number {
  return Object.values(config.cityNights).reduce((s, n) => s + n, 0);
}

export function tripEndDate(config: TripConfig): Date {
  return addDays(parseDate(config.startDate), totalNights(config));
}

export function daysUntilTrip(config: TripConfig): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return daysBetween(today, parseDate(config.startDate));
}

/** Returns the 0-based trip day index for today (null if trip is not active) */
export function currentTripDayIndex(config: TripConfig): number | null {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = parseDate(config.startDate);
  const end = tripEndDate(config);
  if (today < start || today >= end) return null;
  return daysBetween(start, today);
}

/** Returns which city today belongs to based on config */
export function currentCityForDate(isoDate: string, config: TripConfig, cityOrder: CityKey[]): CityKey {
  let current = parseDate(config.startDate);
  const target = parseDate(isoDate);
  for (const city of cityOrder) {
    const nights = config.cityNights[city];
    const cityEnd = addDays(current, nights);
    if (target >= current && target < cityEnd) return city;
    current = cityEnd;
  }
  return cityOrder[cityOrder.length - 1];
}

// ─── Expense helpers ─────────────────────────────────────────────────────────
export function totalGastos(gastos: Gasto[]): number {
  return gastos.reduce((s, g) => s + g.amountEur, 0);
}

export function gastosByCity(gastos: Gasto[]): Record<CityKey, number> {
  const acc: Record<string, number> = {};
  gastos.forEach(g => { acc[g.city] = (acc[g.city] ?? 0) + g.amountEur; });
  return acc as Record<CityKey, number>;
}

export function gastosByCategory(gastos: Gasto[]) {
  const acc: Record<string, number> = {};
  gastos.forEach(g => { acc[g.category] = (acc[g.category] ?? 0) + g.amountEur; });
  return acc;
}

export function budgetTotalEstimate(budget: BudgetState): number {
  return Object.values(budget).reduce((s, b) => s + (b.airbnb + b.food + b.transport + b.activities) * b.nights * 2, 0);
}

export function budgetCityEstimate(b: BudgetState[CityKey]): number {
  return (b.airbnb + b.food + b.transport + b.activities) * b.nights * 2;
}
