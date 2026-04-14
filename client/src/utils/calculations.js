export const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentar", desc: "Birou, fără mișcare", multiplier: 1.2 },
  { value: "light",     label: "Ușor activ", desc: "Mers ușor, sport 1-2×/săpt.", multiplier: 1.375 },
  { value: "moderate",  label: "Moderat activ", desc: "Sport 3-5×/săpt.", multiplier: 1.55 },
  { value: "active",    label: "Activ", desc: "Sport intens zilnic", multiplier: 1.725 },
];

/** Mifflin-St Jeor BMR */
export function calcBMR(sex, age, height, weight) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(sex === "M" ? base + 5 : base - 161);
}

export function calcTDEE(bmr, activityLevel) {
  const level = ACTIVITY_LEVELS.find((l) => l.value === activityLevel) ?? ACTIVITY_LEVELS[0];
  return Math.round(bmr * level.multiplier);
}

/** Calorii arse din pași (bazat pe greutate) */
export function calcStepsCalories(steps, weightKg) {
  return Math.round(steps * 0.04 * (weightKg / 70));
}

/** Total calorii arse într-o zi (metabolism bazal + pași) */
export function calcDayBurned(bmr, steps, weightKg) {
  return bmr + calcStepsCalories(steps, weightKg);
}

/** Deficit caloric → grame de grăsime arse teoretic (7700 kcal = 1 kg) */
export function deficitToGrams(deficitKcal) {
  return Math.max(0, Math.round(deficitKcal / 7.7));
}

/** Predicție pierdere în greutate pentru N zile la deficit constant */
export function predictLossKg(dailyDeficitKcal, days = 14) {
  return Math.max(0, (dailyDeficitKcal * days) / 7700);
}

/** Câte zile au trecut de la o dată (string YYYY-MM-DD) */
export function daysSince(dateStr) {
  const start = new Date(dateStr);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / 86400000);
}

export function formatDateStr(date = new Date()) {
  return date.toISOString().split("T")[0];
}
