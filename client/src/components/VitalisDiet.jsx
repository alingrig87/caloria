import { useState } from "react";

const DAYS_LABEL = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];
const DAYS_SHORT = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

const OPT = {
  "Fără gătit": { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-400", row: "hover:bg-emerald-50 border-emerald-100", icon: "🥗" },
  "Cuptor":     { badge: "bg-amber-100 text-amber-800",     dot: "bg-amber-400",   row: "hover:bg-amber-50 border-amber-100",   icon: "🔥" },
  "Airfryer":   { badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-400",    row: "hover:bg-blue-50 border-blue-100",     icon: "💨" },
};

// Each meal with options has: time, type, icon, options: [{label, foods, kcal}]
// Fixed meals have: time, type, icon, foods, kcal, optional?
const WEEKS = [
  { week: 1, days: [
    {
      day: "Luni", date: "Ziua 1",
      breakfast: { time: "08:00", foods: "2 ouă fierte + roșii + castraveți + ardei gras crud", kcal: 195 },
      lunch: { time: "13:00", options: [
        { label: "Fără gătit", foods: "Ton conservă (150g) + roșii + castraveți + ardei crud + ulei de măsline + lămâie", kcal: 310 },
        { label: "Cuptor",     foods: "Piept de pui (160g) la cuptor 200°C · 25 min, cu rozmarin și lămâie + roșii la cuptor", kcal: 340 },
        { label: "Airfryer",   foods: "Piept de pui (160g) la airfryer 200°C · 15 min, cu boia și usturoi + ardei la airfryer", kcal: 330 },
      ]},
      snack: { time: "16:30", foods: "Iaurt grec (150g) + afine", kcal: 155 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Sardine la conservă (120g) + castraveți + roșii + ceapă verde + lămâie", kcal: 265 },
        { label: "Cuptor",     foods: "Păstrăv (180g) la cuptor 200°C · 20 min, cu cimbru și lămâie + broccoli la abur", kcal: 340 },
        { label: "Airfryer",   foods: "Cod (180g) la airfryer 190°C · 12 min, cu ierburi și lămâie + morcovi la airfryer", kcal: 300 },
      ]},
    },
    {
      day: "Marți", date: "Ziua 2",
      breakfast: { time: "08:00", foods: "Iaurt grec (200g) + fulgi de ovăz (40g) + căpșuni + afine", kcal: 290 },
      lunch: { time: "13:00", options: [
        { label: "Fără gătit", foods: "3 ouă fierte + roșii cherry + castraveți + ardei + ulei de măsline", kcal: 285 },
        { label: "Cuptor",     foods: "Somon (150g) la cuptor 190°C · 18 min, cu ierburi + morcovi la cuptor", kcal: 380 },
        { label: "Airfryer",   foods: "Piept de pui (160g) la airfryer 200°C · 15 min, cu boia afumată + dovlecel la airfryer", kcal: 330 },
      ]},
      snack: { time: "16:30", foods: "Măr + 10 migdale", kcal: 195 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Macrou la conservă (120g) + salată de varză albă rasă + morcov ras + lămâie", kcal: 290 },
        { label: "Cuptor",     foods: "Piept de pui (180g) la cuptor 200°C · 25 min, cu usturoi și rozmarin + fasole verde la abur", kcal: 370 },
        { label: "Airfryer",   foods: "Somon (150g) la airfryer 190°C · 12 min, cu lămâie + sparanghel la airfryer", kcal: 385 },
      ]},
    },
    {
      day: "Miercuri", date: "Ziua 3",
      breakfast: { time: "08:00", foods: "Omletă (2 ouă) cu ardei roșu, roșii și ceapă verde, tigaie fără ulei", kcal: 215 },
      lunch: { time: "13:00", options: [
        { label: "Fără gătit", foods: "Ton conservă (150g) + spanac proaspăt + roșii cherry + ½ avocado + lămâie", kcal: 360 },
        { label: "Cuptor",     foods: "Cod (160g) la cuptor 190°C · 18 min, cu lămâie + roșii și ardei la cuptor", kcal: 300 },
        { label: "Airfryer",   foods: "Piept de pui (160g) la airfryer 200°C · 15 min, cu cimbru + salată spanac proaspăt", kcal: 335 },
      ]},
      snack: { time: "16:30", foods: "Pară + 10 nuci", kcal: 220 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Sardine la conservă (120g) + castraveți + roșii + ardei crud + ulei de măsline", kcal: 270 },
        { label: "Cuptor",     foods: "Piept de pui (180g) la cuptor 200°C · 25 min, cu muștar și cimbru + dovlecel la cuptor", kcal: 355 },
        { label: "Airfryer",   foods: "Păstrăv (180g) la airfryer 200°C · 12 min, cu boia și lămâie + ardei la airfryer", kcal: 325 },
      ]},
    },
    {
      day: "Joi", date: "Ziua 4",
      breakfast: { time: "08:00", foods: "Fulgi de ovăz (50g) fierți în apă + iaurt simplu (100g) + banană", kcal: 310 },
      lunch: { time: "13:00", options: [
        { label: "Fără gătit", foods: "Iaurt grec (200g) + fulgi de ovăz (40g) + nuci (10 buc) + fructe de pădure", kcal: 310 },
        { label: "Cuptor",     foods: "Piept de pui (160g) la cuptor 200°C · 25 min, cu usturoi + morcovi și mazăre la cuptor", kcal: 360 },
        { label: "Airfryer",   foods: "Cod (160g) la airfryer 190°C · 12 min, cu lămâie + broccoli la airfryer", kcal: 295 },
      ]},
      snack: { time: "16:30", foods: "Iaurt grec (150g) + zmeură", kcal: 145 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Ton conservă (150g) + salată verde mare cu roșii, castraveți, ardei + ulei de măsline", kcal: 305 },
        { label: "Cuptor",     foods: "Somon (150g) la cuptor 190°C · 18 min, cu muștar de Dijon și lămâie + sparanghel la cuptor", kcal: 390 },
        { label: "Airfryer",   foods: "Piept de pui (180g) la airfryer 200°C · 15 min, cu rozmarin și usturoi + roșii la airfryer", kcal: 355 },
      ]},
    },
    {
      day: "Vineri", date: "Ziua 5",
      breakfast: { time: "08:00", foods: "2 ouă ochiuri (tigaie anti-aderentă) + ½ avocado + roșii cherry + castraveți", kcal: 295 },
      lunch: { time: "13:00", options: [
        { label: "Fără gătit", foods: "Macrou la conservă (120g) + castraveți + roșii + ardei crud + ceapă verde + lămâie", kcal: 275 },
        { label: "Cuptor",     foods: "Păstrăv (160g) la cuptor 200°C · 20 min, cu ierburi și lămâie + roșii la cuptor", kcal: 320 },
        { label: "Airfryer",   foods: "Somon (150g) la airfryer 190°C · 12 min, cu lămâie + dovlecel la airfryer", kcal: 370 },
      ]},
      snack: { time: "16:30", foods: "Portocală + 10 nuci caju nesărate", kcal: 215 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Sardine la conservă (120g) + spanac proaspăt + roșii cherry + ulei de măsline + lămâie", kcal: 270 },
        { label: "Cuptor",     foods: "Somon (150g) la cuptor 190°C · 18 min, cu usturoi și ierburi + broccoli și morcovi la cuptor", kcal: 390 },
        { label: "Airfryer",   foods: "Macrou (160g) la airfryer 190°C · 12 min, cu boia și lămâie + ardei și roșii la airfryer", kcal: 355 },
      ]},
    },
    {
      day: "Sâmbătă", date: "Ziua 6",
      breakfast: { time: "08:30", foods: "Fulgi de ovăz (50g) + iaurt grec (150g) + miere (1 lg) + nuci (10 buc)", kcal: 360 },
      lunch: { time: "13:30", options: [
        { label: "Fără gătit", foods: "3 ouă fierte + roșii + castraveți + ardei crud + ulei de măsline + lămâie", kcal: 280 },
        { label: "Cuptor",     foods: "Piept de pui (160g) la cuptor 200°C · 25 min, cu boia dulce și usturoi + fasole verde la cuptor", kcal: 345 },
        { label: "Airfryer",   foods: "Cod (160g) la airfryer 190°C · 12 min, cu cimbru și lămâie + sparanghel la airfryer", kcal: 295 },
      ]},
      snack: { time: "16:30", foods: "Mere (1 buc) + scorțișoară", kcal: 80 },
      dinner: { time: "19:30", options: [
        { label: "Fără gătit", foods: "Ton conservă (150g) + salată de varză albă rasă + morcov ras + ulei de măsline + lămâie", kcal: 295 },
        { label: "Cuptor",     foods: "Pulpe de pui dezosate (200g) la cuptor 200°C · 30 min, cu boia afumată + legume mixte la cuptor", kcal: 400 },
        { label: "Airfryer",   foods: "Piept de pui (180g) la airfryer 200°C · 15 min, cu rozmarin și lămâie + broccoli la airfryer", kcal: 360 },
      ]},
    },
    {
      day: "Duminică", date: "Ziua 7",
      breakfast: { time: "09:00", foods: "Iaurt grec (200g) + fulgi de ovăz (30g) + banană + scorțișoară", kcal: 300 },
      lunch: { time: "13:30", options: [
        { label: "Fără gătit", foods: "Brânză de vaci (150g) + roșii + castraveți + ardei crud + ulei de măsline + semințe de in", kcal: 260 },
        { label: "Cuptor",     foods: "Somon (150g) la cuptor 190°C · 18 min, cu lămâie și cimbru + roșii cherry la cuptor", kcal: 380 },
        { label: "Airfryer",   foods: "Piept de pui (160g) la airfryer 200°C · 15 min, cu muștar și usturoi + dovlecel la airfryer", kcal: 335 },
      ]},
      snack: { time: "16:30", foods: "Iaurt simplu (150g) + fructe de pădure", kcal: 140 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Macrou la conservă (120g) + spanac proaspăt + roșii cherry + castraveți + lămâie", kcal: 260 },
        { label: "Cuptor",     foods: "Păstrăv (180g) la cuptor 200°C · 20 min, cu usturoi, cimbru și lămâie + dovlecel la cuptor", kcal: 335 },
        { label: "Airfryer",   foods: "Somon (150g) la airfryer 190°C · 12 min, cu ierburi + fasole verde la airfryer", kcal: 385 },
      ]},
    },
  ]},
  { week: 2, days: [
    {
      day: "Luni", date: "Ziua 8",
      breakfast: { time: "08:00", foods: "2 ouă fierte + ardei gras crud (roșu sau galben) + roșii proaspete + castraveți", kcal: 200 },
      lunch: { time: "13:00", options: [
        { label: "Fără gătit", foods: "Ton conservă (150g) + salată de varză albă rasă + morcov ras + ulei de măsline + lămâie", kcal: 295 },
        { label: "Cuptor",     foods: "Cod (160g) la cuptor 190°C · 18 min, cu lămâie + morcovi și mazăre la cuptor", kcal: 300 },
        { label: "Airfryer",   foods: "Piept de pui (160g) la airfryer 200°C · 15 min, cu ierburi + ardei la airfryer", kcal: 330 },
      ]},
      snack: { time: "16:30", foods: "Iaurt grec (150g) + căpșuni (100g)", kcal: 145 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Sardine la conservă (120g) + castraveți + roșii + ceapă verde + ulei de măsline + lămâie", kcal: 265 },
        { label: "Cuptor",     foods: "Piept de pui (180g) la cuptor 200°C · 25 min, cu usturoi și cimbru + broccoli și morcovi la cuptor", kcal: 365 },
        { label: "Airfryer",   foods: "Păstrăv (180g) la airfryer 200°C · 12 min, cu lămâie și rozmarin + sparanghel la airfryer", kcal: 330 },
      ]},
    },
    {
      day: "Marți", date: "Ziua 9",
      breakfast: { time: "08:00", foods: "Omletă (2 ouă) cu ciuperci și ceapă verde + roșii proaspete pe lângă", kcal: 225 },
      lunch: { time: "13:00", options: [
        { label: "Fără gătit", foods: "Iaurt grec (200g) + fulgi de ovăz (40g) + afine + semințe de dovleac", kcal: 300 },
        { label: "Cuptor",     foods: "Piept de pui (160g) la cuptor 200°C · 25 min, cu boia dulce + roșii și ardei la cuptor", kcal: 340 },
        { label: "Airfryer",   foods: "Somon (150g) la airfryer 190°C · 12 min, cu ierburi + dovlecel la airfryer", kcal: 370 },
      ]},
      snack: { time: "16:30", foods: "Pară + 10 migdale", kcal: 205 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Ton conservă (150g) + spanac proaspăt + roșii cherry + ½ avocado + lămâie", kcal: 355 },
        { label: "Cuptor",     foods: "Curcan (180g) la cuptor 190°C · 25 min, cu muștar și ierburi + roșii la cuptor", kcal: 350 },
        { label: "Airfryer",   foods: "Cod (180g) la airfryer 190°C · 12 min, cu boia și lămâie + ardei și ceapă la airfryer", kcal: 300 },
      ]},
    },
    {
      day: "Miercuri", date: "Ziua 10",
      breakfast: { time: "08:00", foods: "Fulgi de ovăz (50g) + iaurt grec (150g) + afine + semințe de in (1 lg)", kcal: 310 },
      lunch: { time: "13:00", options: [
        { label: "Fără gătit", foods: "Macrou la conservă (120g) + castraveți + roșii + ardei crud + ulei de măsline + lămâie", kcal: 275 },
        { label: "Cuptor",     foods: "Somon (150g) la cuptor 190°C · 18 min, cu lămâie și cimbru + fasole verde la cuptor", kcal: 380 },
        { label: "Airfryer",   foods: "Piept de pui (160g) la airfryer 200°C · 15 min, cu usturoi și boia + broccoli la airfryer", kcal: 340 },
      ]},
      snack: { time: "16:30", foods: "Măr + 10 nuci", kcal: 205 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Sardine la conservă (120g) + salată verde mare cu roșii, ardei, castraveți + ulei de măsline", kcal: 270 },
        { label: "Cuptor",     foods: "Macrou (160g) la cuptor 190°C · 20 min, cu lămâie și ierburi + roșii și ardei la cuptor", kcal: 360 },
        { label: "Airfryer",   foods: "Piept de pui (180g) la airfryer 200°C · 15 min, cu boia afumată și cimbru + dovlecel la airfryer", kcal: 355 },
      ]},
    },
    {
      day: "Joi", date: "Ziua 11",
      breakfast: { time: "08:00", foods: "Iaurt grec (200g) + fulgi de ovăz (40g) + zmeură + scorțișoară", kcal: 285 },
      lunch: { time: "13:00", options: [
        { label: "Fără gătit", foods: "3 ouă fierte + roșii + castraveți + ardei crud + ulei de măsline + lămâie", kcal: 280 },
        { label: "Cuptor",     foods: "Cod (160g) la cuptor 190°C · 18 min, cu usturoi și lămâie + morcovi la cuptor", kcal: 295 },
        { label: "Airfryer",   foods: "Păstrăv (160g) la airfryer 200°C · 12 min, cu cimbru + sparanghel la airfryer", kcal: 305 },
      ]},
      snack: { time: "16:30", foods: "Portocală + 10 nuci", kcal: 215 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Ton conservă (150g) + varză albă rasă + morcov ras + ceapă verde + lămâie + ulei", kcal: 295 },
        { label: "Cuptor",     foods: "Piept de pui (180g) la cuptor 200°C · 25 min, cu rozmarin și lămâie + dovlecel la cuptor", kcal: 355 },
        { label: "Airfryer",   foods: "Somon (150g) la airfryer 190°C · 12 min, cu muștar de Dijon + broccoli la airfryer", kcal: 385 },
      ]},
    },
    {
      day: "Vineri", date: "Ziua 12",
      breakfast: { time: "08:00", foods: "2 ouă scramble (fără ulei) + roșii cherry + castraveți + ardei crud", kcal: 210 },
      lunch: { time: "13:00", options: [
        { label: "Fără gătit", foods: "Brânză de vaci (150g) + castraveți + roșii + ardei + semințe de in + ulei de măsline", kcal: 255 },
        { label: "Cuptor",     foods: "Piept de pui (160g) la cuptor 200°C · 25 min, cu boia și usturoi + roșii cherry la cuptor", kcal: 335 },
        { label: "Airfryer",   foods: "Cod (160g) la airfryer 190°C · 12 min, cu lămâie și ierburi + ardei la airfryer", kcal: 295 },
      ]},
      snack: { time: "16:30", foods: "Iaurt simplu (150g) + fructe de pădure mixte", kcal: 140 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Macrou la conservă (120g) + spanac proaspăt + roșii cherry + castraveți + lămâie", kcal: 260 },
        { label: "Cuptor",     foods: "Somon (150g) la cuptor 190°C · 18 min, cu usturoi și ierburi + morcovi și mazăre la cuptor", kcal: 385 },
        { label: "Airfryer",   foods: "Piept de pui (180g) la airfryer 200°C · 15 min, cu cimbru și lămâie + fasole verde la airfryer", kcal: 355 },
      ]},
    },
    {
      day: "Sâmbătă", date: "Ziua 13",
      breakfast: { time: "08:30", foods: "Fulgi de ovăz (50g) + iaurt grec (150g) + banană + nuci (8 buc)", kcal: 370 },
      lunch: { time: "13:30", options: [
        { label: "Fără gătit", foods: "Ton conservă (150g) + salată mare: spanac, roșii cherry, castraveți, ardei + ulei + lămâie", kcal: 315 },
        { label: "Cuptor",     foods: "Somon (150g) la cuptor 190°C · 18 min, cu lămâie și rozmarin + sparanghel la cuptor", kcal: 385 },
        { label: "Airfryer",   foods: "Piept de pui (160g) la airfryer 200°C · 15 min, cu boia afumată + broccoli la airfryer", kcal: 335 },
      ]},
      snack: { time: "16:30", foods: "Mere (1 buc) + 10 migdale", kcal: 190 },
      dinner: { time: "19:30", options: [
        { label: "Fără gătit", foods: "Sardine la conservă (120g) + roșii + castraveți + ardei crud + ceapă roșie + ulei de măsline", kcal: 265 },
        { label: "Cuptor",     foods: "Păstrăv (180g) la cuptor 200°C · 20 min, cu usturoi și cimbru + morcovi și mazăre la cuptor", kcal: 340 },
        { label: "Airfryer",   foods: "Curcan (180g) la airfryer 190°C · 18 min, cu boia și lămâie + roșii și ardei la airfryer", kcal: 345 },
      ]},
    },
    {
      day: "Duminică", date: "Ziua 14",
      breakfast: { time: "09:00", foods: "Iaurt grec (200g) + fulgi de ovăz (40g) + căpșuni + semințe de dovleac (1 lg)", kcal: 305 },
      lunch: { time: "13:30", options: [
        { label: "Fără gătit", foods: "Brânză de vaci (150g) + ½ avocado + roșii + castraveți + ardei + semințe de in + lămâie", kcal: 310 },
        { label: "Cuptor",     foods: "Piept de pui (160g) la cuptor 200°C · 25 min, cu rozmarin și usturoi + dovlecel la cuptor", kcal: 340 },
        { label: "Airfryer",   foods: "Somon (150g) la airfryer 190°C · 12 min, cu muștar și lămâie + sparanghel la airfryer", kcal: 380 },
      ]},
      snack: { time: "16:30", foods: "2 ouă fierte + castraveți + roșii", kcal: 185 },
      dinner: { time: "19:00", options: [
        { label: "Fără gătit", foods: "Ton conservă (150g) + spanac proaspăt + roșii cherry + ½ avocado + ulei de măsline + lămâie", kcal: 350 },
        { label: "Cuptor",     foods: "Păstrăv (180g) la cuptor 200°C · 20 min, cu cimbru, usturoi și lămâie + salată de legume colorate", kcal: 335 },
        { label: "Airfryer",   foods: "Piept de pui (180g) la airfryer 200°C · 15 min, cu rozmarin, usturoi și lămâie + dovlecel la airfryer", kcal: 360 },
      ]},
    },
  ]},
];


function OptionsBlock({ time, icon, type, options, hint }) {
  const badgeBase = type === "Prânz"
    ? "bg-green-100 text-green-800"
    : "bg-indigo-100 text-indigo-800";
  return (
    <div className={`px-5 py-4 ${type === "Cină" ? "bg-indigo-50/20" : ""}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center shrink-0 w-14">
          <div className="text-lg">{icon}</div>
          <div className="text-xs font-bold text-gray-500 mt-0.5">{time}</div>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeBase}`}>{type}</span>
        <span className="text-xs text-gray-400">{hint}</span>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const s = OPT[opt.label];
          return (
            <div key={i} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 border transition-colors w-full ${s.row}`}>
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <span className="text-sm">{s.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.badge}`}>{opt.label}</span>
              </div>
              <p className="text-sm text-gray-700 flex-1 leading-relaxed">{opt.foods}</p>
              <span className="text-xs font-semibold text-gray-400 shrink-0 pt-0.5 whitespace-nowrap">~{opt.kcal} kcal</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VitalisDiet() {
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeDay, setActiveDay] = useState(0);

  const week = WEEKS[activeWeek];
  const day = week.days[activeDay];
  const estKcal = day.breakfast.kcal + day.snack.kcal + day.lunch.options[1].kcal + day.dinner.options[1].kcal;

  return (
    <div className="space-y-6">
      {/* Main tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {WEEKS.map((w, wi) => (
            <button
              key={wi}
              onClick={() => { setActiveWeek(wi); setActiveDay(0); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeWeek === wi
                  ? "bg-teal-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Săptămâna {w.week}
            </button>
          ))}
        </div>

        {activeWeek !== -1 && <>

        {/* Day tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50">
          {DAYS_SHORT.map((d, di) => (
            <button
              key={di}
              onClick={() => setActiveDay(di)}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                activeDay === di
                  ? "bg-white text-teal-700 border-b-2 border-teal-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Day content */}
        <div>
          {/* Day header */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">{day.day}</span>
              <span className="text-gray-400 text-sm">{day.date}</span>
            </div>
            <span className="text-xs text-gray-400">~{estKcal} kcal estimat (variantă medie)</span>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Breakfast */}
            <div className="flex gap-4 px-5 py-4 bg-amber-50/50">
              <div className="text-center shrink-0 w-14">
                <div className="text-lg">🌅</div>
                <div className="text-xs font-bold text-gray-500 mt-0.5">{day.breakfast.time}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Mic dejun</span>
                  <span className="text-xs text-gray-400">~{day.breakfast.kcal} kcal</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{day.breakfast.foods}</p>
              </div>
            </div>

            {/* Lunch */}
            <OptionsBlock
              time={day.lunch.time}
              icon="☀️"
              type="Prânz"
              options={day.lunch.options}
              hint="alege cum gătești azi"
            />

            {/* Snack */}
            <div className="flex gap-4 px-5 py-3 bg-blue-50/40">
              <div className="text-center shrink-0 w-14">
                <div className="text-lg">🍎</div>
                <div className="text-xs font-bold text-gray-500 mt-0.5">{day.snack.time}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Gustare</span>
                  <span className="text-xs text-gray-400 italic">opțional</span>
                  <span className="text-xs text-gray-400">~{day.snack.kcal} kcal</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{day.snack.foods}</p>
              </div>
            </div>

            {/* Dinner */}
            <OptionsBlock
              time={day.dinner.time}
              icon="🌙"
              type="Cină"
              options={day.dinner.options}
              hint="alege cum gătești azi"
            />
          </div>
        </div>
        </>}
      </div>

    </div>
  );
}
