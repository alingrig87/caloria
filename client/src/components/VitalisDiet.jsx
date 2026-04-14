const WEEKS = [
  {
    week: 1,
    days: [
      {
        day: "Luni", date: "Ziua 1",
        meals: [
          { time: "08:00", type: "Mic dejun", icon: "🌅", foods: "2 ouă fierte + roșii + castraveți + ardei gras crud", kcal: 195 },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Salată verde cu castraveți, roșii, lămâie + 1 ou fiert", kcal: 140 },
              { label: "Normal",     foods: "Salată verde mare cu roșii, ardei, castraveți + 2 ouă fierte + ulei de măsline", kcal: 280 },
              { label: "Consistent", foods: "Salată bogată + 2 ouă fierte + ½ avocado + ulei de măsline + semințe de dovleac", kcal: 420 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Iaurt grec (150g) + afine", kcal: 155, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Păstrăv cuptor",  foods: "Păstrăv (180g) la cuptor 200°C, 20 min, cu lămâie, cimbru și usturoi + broccoli la abur", kcal: 340 },
              { label: "Pui airfryer",    foods: "Piept de pui (180g) la airfryer 200°C, 15 min, cu boia, usturoi și ulei de măsline + roșii la cuptor", kcal: 360 },
              { label: "Cod cuptor",      foods: "Fileu de cod (180g) la cuptor 190°C, 18 min, cu lămâie și ierburi + morcovi la cuptor", kcal: 300 },
            ],
          },
        ],
      },
      {
        day: "Marți", date: "Ziua 2",
        meals: [
          { time: "08:00", type: "Mic dejun", icon: "🌅", foods: "Iaurt grec (200g) + fulgi de ovăz (40g) + fructe de pădure (căpșuni, afine)", kcal: 290 },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Supă de legume (400ml, fără carne)", kcal: 120 },
              { label: "Normal",     foods: "Supă de legume (500ml) + 2 ouă fierte + salată de roșii", kcal: 270 },
              { label: "Consistent", foods: "Supă de legume (600ml) + 3 ouă fierte + salată verde cu ulei de măsline", kcal: 390 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Măr + 10 migdale", kcal: 195, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Pui cuptor",      foods: "Piept de pui (180g) la cuptor 200°C, 25 min, cu usturoi, rozmarin și lămâie + fasole verde la abur", kcal: 370 },
              { label: "Somon airfryer",  foods: "Somon (150g) la airfryer 190°C, 12 min, cu ierburi și lămâie + broccoli la abur", kcal: 380 },
              { label: "Ton + legume",    foods: "Ton în suc propriu (180g) + dovlecel (200g) la airfryer 200°C, 10 min + roșii cherry", kcal: 310 },
            ],
          },
        ],
      },
      {
        day: "Miercuri", date: "Ziua 3",
        meals: [
          { time: "08:00", type: "Mic dejun", icon: "🌅", foods: "Omletă (2 ouă) cu ardei roșu, roșii și ceapă verde, la tigaie fără ulei", kcal: 215 },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Castraveți + roșii + ardei cruzi cu lămâie și sare", kcal: 80 },
              { label: "Normal",     foods: "Salată de castraveți, roșii, ardei + ou fiert + ulei de măsline", kcal: 230 },
              { label: "Consistent", foods: "Salată bogată de legume + 2 ouă fierte + iaurt grec (100g) pentru dressing", kcal: 370 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Pară + 10 nuci", kcal: 220, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Ton + ardei",     foods: "Ton în suc propriu (180g) + ardei (2 buc) la airfryer 200°C, 12 min + salată verde cu ulei", kcal: 330 },
              { label: "Curcan cuptor",   foods: "Piept de curcan (180g) la cuptor 190°C, 25 min, cu muștar și ierburi + roșii la cuptor", kcal: 350 },
              { label: "Cod airfryer",    foods: "Cod (180g) la airfryer 190°C, 12 min, cu lămâie și cimbru + sparanghel la airfryer", kcal: 300 },
            ],
          },
        ],
      },
      {
        day: "Joi", date: "Ziua 4",
        meals: [
          { time: "08:00", type: "Mic dejun", icon: "🌅", foods: "Fulgi de ovăz (50g) fierți în apă + iaurt simplu (100g) + banană", kcal: 310 },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Supă cremă de broccoli (350ml, fără smântână)", kcal: 130 },
              { label: "Normal",     foods: "Supă cremă de broccoli (450ml) + 2 ouă fierte", kcal: 280 },
              { label: "Consistent", foods: "Supă cremă de broccoli (550ml) + 2 ouă fierte + salată verde cu ulei", kcal: 400 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Iaurt grec (150g) + zmeură", kcal: 145, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Păstrăv airfryer", foods: "Păstrăv (180g) la airfryer 200°C, 12 min, cu lămâie și cimbru + morcovi la cuptor", kcal: 330 },
              { label: "Pui cuptor",       foods: "Piept de pui (180g) la cuptor 200°C, 25 min, cu boia dulce și usturoi + mazăre la abur", kcal: 370 },
              { label: "Somon cuptor",     foods: "Somon (150g) la cuptor 190°C, 18 min, cu muștar de Dijon și lămâie + sparanghel", kcal: 390 },
            ],
          },
        ],
      },
      {
        day: "Vineri", date: "Ziua 5",
        meals: [
          { time: "08:00", type: "Mic dejun", icon: "🌅", foods: "2 ouă ochiuri (tigaie anti-aderentă) + ½ avocado + roșii cherry + castraveți", kcal: 295 },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Salată de spanac proaspăt cu lămâie + ou fiert", kcal: 155 },
              { label: "Normal",     foods: "Salată de spanac proaspăt + roșii cherry + 2 ouă fierte + ulei de măsline", kcal: 300 },
              { label: "Consistent", foods: "Salată mare de spanac + roșii + ardei + 2 ouă fierte + ½ avocado + ulei", kcal: 460 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Portocală + 10 nuci caju nesărate", kcal: 215, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Somon cuptor",    foods: "Somon (150g) la cuptor 190°C, 18 min, cu ierburi, usturoi și lămâie + broccoli + morcovi la abur", kcal: 390 },
              { label: "Pui airfryer",    foods: "Piept de pui (180g) la airfryer 200°C, 15 min, cu rozmarin și usturoi + ardei și roșii la airfryer", kcal: 360 },
              { label: "Macrou cuptor",   foods: "Macrou (160g) la cuptor 190°C, 20 min, cu lămâie și cimbru + salată verde cu ulei de măsline", kcal: 370 },
            ],
          },
        ],
      },
      {
        day: "Sâmbătă", date: "Ziua 6",
        meals: [
          { time: "08:30", type: "Mic dejun", icon: "🌅", foods: "Fulgi de ovăz (50g) + iaurt grec (150g) + miere (1 lg) + nuci (10 buc)", kcal: 360 },
          {
            time: "13:30", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Ciorbă de legume (400ml, fără carne)", kcal: 110 },
              { label: "Normal",     foods: "Ciorbă de legume (500ml) + 2 ouă fierte", kcal: 250 },
              { label: "Consistent", foods: "Ciorbă de legume (600ml) + 3 ouă fierte + salată de roșii cu ulei", kcal: 390 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Mere (2 buc mici) + scorțișoară", kcal: 130, optional: true },
          {
            time: "19:30", type: "Cină", icon: "🌙",
            options: [
              { label: "Pui airfryer",    foods: "Piept de pui (180g) la airfryer 200°C, 15 min, cu usturoi, lămâie și boia + salată verde", kcal: 370 },
              { label: "Păstrăv cuptor",  foods: "Păstrăv (180g) la cuptor 200°C, 20 min, cu ierburi și lămâie + legume mixte (morcov, dovlecel) la cuptor", kcal: 350 },
              { label: "Pui pulpe airfryer", foods: "Pulpe de pui dezosate (200g) la airfryer 200°C, 20 min, cu boia afumată + broccoli la abur", kcal: 400 },
            ],
          },
        ],
      },
      {
        day: "Duminică", date: "Ziua 7",
        meals: [
          { time: "09:00", type: "Mic dejun", icon: "🌅", foods: "Iaurt grec (200g) + fulgi de ovăz (30g) + banană + scorțișoară", kcal: 300 },
          {
            time: "13:30", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Salată de roșii + castraveți + ardei + lămâie", kcal: 70 },
              { label: "Normal",     foods: "Salată de roșii, castraveți, ardei + 2 ouă fierte + ulei de măsline", kcal: 280 },
              { label: "Consistent", foods: "Salată bogată + 2 ouă fierte + brânză de vaci (100g) + ulei de măsline", kcal: 420 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Iaurt simplu (150g) + fructe de pădure", kcal: 140, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Păstrăv airfryer", foods: "Păstrăv (180g) la airfryer 200°C, 12 min, cu cimbru, usturoi și lămâie + dovlecel la airfryer", kcal: 330 },
              { label: "Somon cuptor",     foods: "Somon (150g) la cuptor 190°C, 18 min, cu usturoi și lămâie + fasole verde la abur", kcal: 390 },
              { label: "Pui cuptor",       foods: "Piept de pui (180g) la cuptor 200°C, 25 min, cu muștar și rozmarin + morcovi la cuptor", kcal: 370 },
            ],
          },
        ],
      },
    ],
  },
  {
    week: 2,
    days: [
      {
        day: "Luni", date: "Ziua 8",
        meals: [
          { time: "08:00", type: "Mic dejun", icon: "🌅", foods: "2 ouă fierte + ardei gras crud (roșu sau galben) + roșii proaspete + castraveți", kcal: 200 },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Salată de varză albă rasă cu morcov și lămâie", kcal: 90 },
              { label: "Normal",     foods: "Salată de varză albă cu morcov ras + 2 ouă fierte + ulei de măsline", kcal: 285 },
              { label: "Consistent", foods: "Salată de varză + morcov + 2 ouă fierte + ½ avocado + ulei de măsline", kcal: 430 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Iaurt grec (150g) + căpșuni (100g)", kcal: 145, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Pui airfryer",     foods: "Piept de pui (180g) la airfryer 200°C, 15 min, cu ierburi și usturoi + sparanghel la airfryer", kcal: 360 },
              { label: "Cod cuptor",       foods: "Cod (180g) la cuptor 190°C, 18 min, cu lămâie și morcovi la cuptor + mazăre la abur", kcal: 310 },
              { label: "Păstrăv cuptor",   foods: "Păstrăv (180g) la cuptor 200°C, 20 min, cu lămâie și cimbru + broccoli la abur", kcal: 340 },
            ],
          },
        ],
      },
      {
        day: "Marți", date: "Ziua 9",
        meals: [
          { time: "08:00", type: "Mic dejun", icon: "🌅", foods: "Omletă (2 ouă) cu ciuperci și ceapă verde + roșii proaspete pe lângă", kcal: 225 },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Supă cremă de morcov și pastârnac (350ml)", kcal: 125 },
              { label: "Normal",     foods: "Supă cremă de morcov și pastârnac (450ml) + 2 ouă fierte", kcal: 270 },
              { label: "Consistent", foods: "Supă cremă (550ml) + 2 ouă fierte + salată verde cu ulei de măsline", kcal: 400 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Pară + 10 migdale", kcal: 205, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Ton + dovlecel",   foods: "Ton în suc propriu (180g) + dovlecel (200g) la airfryer 200°C, 10 min + salată de roșii cu ulei", kcal: 330 },
              { label: "Curcan airfryer",  foods: "Piept de curcan (180g) la airfryer 190°C, 18 min, cu boia și usturoi + roșii și ardei la cuptor", kcal: 350 },
              { label: "Somon cuptor",     foods: "Somon (150g) la cuptor 190°C, 18 min, cu lămâie și ierburi + sparanghel la airfryer", kcal: 385 },
            ],
          },
        ],
      },
      {
        day: "Miercuri", date: "Ziua 10",
        meals: [
          { time: "08:00", type: "Mic dejun", icon: "🌅", foods: "Fulgi de ovăz (50g) + iaurt grec (150g) + afine + semințe de in (1 lg)", kcal: 310 },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Salată de spanac proaspăt cu lămâie + castraveți", kcal: 65 },
              { label: "Normal",     foods: "Salată de spanac + castraveți + roșii + 2 ouă fierte + ulei de măsline", kcal: 280 },
              { label: "Consistent", foods: "Salată de spanac + roșii + ardei + 3 ouă fierte + ½ avocado + ulei", kcal: 460 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Măr + 10 nuci", kcal: 205, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Cod airfryer",    foods: "Cod (180g) la airfryer 190°C, 12 min, cu lămâie și usturoi + fasole verde la abur + roșii cherry", kcal: 305 },
              { label: "Pui cuptor",      foods: "Piept de pui (180g) la cuptor 200°C, 25 min, cu boia dulce și cimbru + morcovi la cuptor", kcal: 360 },
              { label: "Macrou cuptor",   foods: "Macrou (160g) la cuptor 190°C, 20 min, cu lămâie și ierburi + salată de roșii și ardei", kcal: 370 },
            ],
          },
        ],
      },
      {
        day: "Joi", date: "Ziua 11",
        meals: [
          { time: "08:00", type: "Mic dejun", icon: "🌅", foods: "Iaurt grec (200g) + fulgi de ovăz (40g) + zmeură + scorțișoară", kcal: 285 },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Ciorbă de legume (400ml, fără carne)", kcal: 115 },
              { label: "Normal",     foods: "Ciorbă de legume (500ml) + 2 ouă fierte + salată de roșii", kcal: 270 },
              { label: "Consistent", foods: "Ciorbă de legume (600ml) + 2 ouă fierte + brânză de vaci (80g)", kcal: 390 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Portocală + 10 nuci", kcal: 215, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Pui airfryer",    foods: "Piept de pui (180g) la airfryer 200°C, 15 min, cu boia afumată și usturoi + dovlecel la airfryer", kcal: 360 },
              { label: "Păstrăv cuptor",  foods: "Păstrăv (180g) la cuptor 200°C, 20 min, cu lămâie și rozmarin + broccoli la abur", kcal: 335 },
              { label: "Somon airfryer",  foods: "Somon (150g) la airfryer 190°C, 12 min, cu muștar de Dijon și lămâie + sparanghel la airfryer", kcal: 390 },
            ],
          },
        ],
      },
      {
        day: "Vineri", date: "Ziua 12",
        meals: [
          { time: "08:00", type: "Mic dejun", icon: "🌅", foods: "2 ouă scramble (fără ulei) + roșii cherry + castraveți + ardei crud", kcal: 210 },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Salată de roșii, ardei, castraveți cu lămâie", kcal: 75 },
              { label: "Normal",     foods: "Salată de roșii, ardei, castraveți + 2 ouă fierte + ulei de măsline", kcal: 290 },
              { label: "Consistent", foods: "Salată bogată de legume + 2 ouă fierte + iaurt grec (100g) ca dressing + ulei", kcal: 420 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Iaurt simplu (150g) + fructe de pădure mixte", kcal: 140, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Somon airfryer",  foods: "Somon (150g) la airfryer 190°C, 12 min, cu lămâie și rozmarin + broccoli + morcovi la abur", kcal: 385 },
              { label: "Pui cuptor",      foods: "Piept de pui (180g) la cuptor 200°C, 25 min, cu usturoi și cimbru + fasole verde la abur", kcal: 360 },
              { label: "Cod airfryer",    foods: "Cod (180g) la airfryer 190°C, 12 min, cu lămâie și boia dulce + roșii și ardei la cuptor", kcal: 305 },
            ],
          },
        ],
      },
      {
        day: "Sâmbătă", date: "Ziua 13",
        meals: [
          { time: "08:30", type: "Mic dejun", icon: "🌅", foods: "Fulgi de ovăz (50g) + iaurt grec (150g) + banană + nuci (8 buc)", kcal: 370 },
          {
            time: "13:30", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Supă de legume (400ml) cu ou bătut în supă", kcal: 130 },
              { label: "Normal",     foods: "Supă de legume (500ml) + 2 ouă fierte + salată verde", kcal: 265 },
              { label: "Consistent", foods: "Supă de legume (600ml) + 3 ouă fierte + salată verde cu avocado", kcal: 430 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Mere (1 buc) + 10 migdale", kcal: 190, optional: true },
          {
            time: "19:30", type: "Cină", icon: "🌙",
            options: [
              { label: "Pui airfryer",    foods: "Piept de pui (180g) la airfryer 200°C, 15 min, cu lămâie și ierburi + salată de varză albă cu morcov", kcal: 365 },
              { label: "Ton + legume",    foods: "Ton în suc propriu (180g) + ardei și dovlecel (200g total) la airfryer 200°C, 10 min + salată", kcal: 315 },
              { label: "Păstrăv cuptor",  foods: "Păstrăv (180g) la cuptor 200°C, 20 min, cu usturoi și cimbru + morcovi și mazăre la cuptor", kcal: 345 },
            ],
          },
        ],
      },
      {
        day: "Duminică", date: "Ziua 14",
        meals: [
          { time: "09:00", type: "Mic dejun", icon: "🌅", foods: "Iaurt grec (200g) + fulgi de ovăz (40g) + căpșuni + semințe de dovleac (1 lg)", kcal: 305 },
          {
            time: "13:30", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",       foods: "Salată colorată de legume (roșii, ardei, castraveți, ceapă) cu lămâie", kcal: 80 },
              { label: "Normal",     foods: "Salată colorată de legume + 2 ouă fierte + ulei de măsline", kcal: 285 },
              { label: "Consistent", foods: "Salată colorată + 2 ouă fierte + ½ avocado + brânză de vaci (80g) + ulei", kcal: 450 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "2 ouă fierte + castraveți + roșii", kcal: 185, optional: true },
          {
            time: "19:00", type: "Cină", icon: "🌙",
            options: [
              { label: "Păstrăv airfryer", foods: "Păstrăv (180g) la airfryer 200°C, 12 min, cu lămâie, cimbru și usturoi + salată de legume colorate", kcal: 330 },
              { label: "Somon cuptor",     foods: "Somon (150g) la cuptor 190°C, 18 min, cu usturoi, lămâie și ierburi + broccoli la abur", kcal: 390 },
              { label: "Pui cuptor",       foods: "Piept de pui (180g) la cuptor 200°C, 25 min, cu rozmarin, usturoi și lămâie + dovlecel la cuptor", kcal: 365 },
            ],
          },
        ],
      },
    ],
  },
];

const RULES = [
  { icon: "✅", text: "Mic dejun: ouă, iaurt sau ovăz cu legume — nu sări peste el" },
  { icon: "✅", text: "Prânz: salate sau supe cu ouă — alegeți porția după apetit" },
  { icon: "✅", text: "Cină: pește, pui sau carne slabă — la cuptor sau airfryer" },
  { icon: "✅", text: "Apă: minimum 2L pe zi, un pahar înainte de fiecare masă" },
  { icon: "✅", text: "Grăsimi sănătoase: ulei de măsline, avocado, nuci, semințe" },
  { icon: "❌", text: "Fără zahăr adăugat, băuturi îndulcite sau sucuri" },
  { icon: "❌", text: "Fără pâine, paste, orez, cartofi (prima săptămână strict)" },
  { icon: "❌", text: "Fără mezeluri, produse procesate sau afumate" },
  { icon: "❌", text: "Fără prăjeli sau gătit cu mult ulei" },
  { icon: "⚠️", text: "Gustarea — opțională, numai dacă simți foame reală" },
];

const LUNCH_STYLES = [
  { dot: "bg-green-400",  badge: "bg-green-100 text-green-800",  row: "hover:bg-green-50" },
  { dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-800", row: "hover:bg-amber-50" },
  { dot: "bg-orange-400", badge: "bg-orange-100 text-orange-800", row: "hover:bg-orange-50" },
];

const DINNER_STYLES = [
  { dot: "bg-indigo-400",  badge: "bg-indigo-100 text-indigo-800",  row: "hover:bg-indigo-50" },
  { dot: "bg-violet-400",  badge: "bg-violet-100 text-violet-800",  row: "hover:bg-violet-50" },
  { dot: "bg-teal-400",    badge: "bg-teal-100 text-teal-800",      row: "hover:bg-teal-50" },
];

const MEAL_COLORS = {
  "Mic dejun": "bg-amber-50",
  "Gustare":   "bg-blue-50",
};

const MEAL_BADGE = {
  "Mic dejun": "bg-amber-100 text-amber-800",
  "Gustare":   "bg-blue-100 text-blue-800",
};

export default function VitalisDiet() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-green-700 text-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-1">Dieta Vitalis</h2>
        <p className="text-teal-100 text-sm mb-5">Programul alimentar complet de 14 zile · Alimente naturale integrale</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-200 mb-2">Structura zilei</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2"><span>🌅</span><span><strong>08:00</strong> — Mic dejun (ouă / iaurt / ovăz)</span></div>
              <div className="flex items-center gap-2"><span>☀️</span><span><strong>13:00</strong> — Prânz (3 variante de porție)</span></div>
              <div className="flex items-center gap-2"><span>🍎</span><span><strong>16:30</strong> — Gustare <span className="text-teal-300">(opțional)</span></span></div>
              <div className="flex items-center gap-2"><span>🌙</span><span><strong>19:00</strong> — Cină (3 variante cuptor / airfryer)</span></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-200 mb-2">Ce să aștepți după 2 săptămâni</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2"><span>⚖️</span><span>Scădere în greutate de <strong>3–5 kg</strong></span></div>
              <div className="flex items-start gap-2"><span>⚡</span><span>Energie mai bună și somn mai odihnitor</span></div>
              <div className="flex items-start gap-2"><span>🫁</span><span>Reducerea balonării și senzație de ușurință</span></div>
              <div className="flex items-start gap-2"><span>💪</span><span>Masă musculară păstrată datorită proteinei</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3 text-base">Reguli de bază</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {RULES.map((r, i) => (
            <div key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="shrink-0">{r.icon}</span>
              <span>{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weeks */}
      {WEEKS.map((week) => (
        <div key={week.week} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">
              {week.week}
            </div>
            <h3 className="text-lg font-bold text-gray-800">Săptămâna {week.week}</h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {week.days.map((day) => {
            const lunchKcal = day.meals.find(m => m.type === "Prânz")?.options?.[1]?.kcal ?? 0;
            const dinnerKcal = day.meals.find(m => m.type === "Cină")?.options?.[0]?.kcal ?? 0;
            const fixedKcal = day.meals.filter(m => !m.options).reduce((s, m) => s + m.kcal, 0);
            return (
              <div key={day.date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{day.day}</span>
                    <span className="text-gray-400 text-sm">{day.date}</span>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">~{fixedKcal + lunchKcal + dinnerKcal} kcal est.</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {day.meals.map((meal, mi) => {
                    if (meal.options) {
                      const isLunch = meal.type === "Prânz";
                      const styles = isLunch ? LUNCH_STYLES : DINNER_STYLES;
                      const badgeClass = isLunch ? "bg-green-100 text-green-800" : "bg-indigo-100 text-indigo-800";
                      const hint = isLunch ? "alege porția potrivită" : "alege varianta de azi";
                      return (
                        <div key={mi} className={`px-5 py-4 ${isLunch ? "" : "bg-indigo-50/30"}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-center shrink-0 w-14">
                              <div className="text-lg">{meal.icon}</div>
                              <div className="text-xs font-bold text-gray-500 mt-0.5">{meal.time}</div>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                              {meal.type}
                            </span>
                            <span className="text-xs text-gray-400">{hint}</span>
                          </div>
                          <div className="ml-[4.25rem] space-y-2">
                            {meal.options.map((opt, oi) => (
                              <div key={oi} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 border border-gray-100 transition-colors ${styles[oi].row}`}>
                                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles[oi].dot}`} />
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${styles[oi].badge}`}>
                                    {opt.label}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 flex-1 leading-relaxed">{opt.foods}</p>
                                <span className="text-xs font-semibold text-gray-500 shrink-0 pt-0.5 whitespace-nowrap">~{opt.kcal} kcal</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={mi} className={`flex gap-4 px-5 py-3 ${MEAL_COLORS[meal.type] ?? ""}`}>
                        <div className="text-center shrink-0 w-14">
                          <div className="text-lg">{meal.icon}</div>
                          <div className="text-xs font-bold text-gray-500 mt-0.5">{meal.time}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MEAL_BADGE[meal.type] ?? "bg-gray-100 text-gray-700"}`}>
                              {meal.type}
                            </span>
                            {meal.optional && (
                              <span className="text-xs text-gray-400 italic">opțional</span>
                            )}
                            <span className="text-xs text-gray-400">~{meal.kcal} kcal</span>
                          </div>
                          <p className="text-sm leading-relaxed text-gray-700">{meal.foods}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Footer note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Notă:</strong> Toate variantele de cină se gătesc ușor la cuptor (180–200°C) sau airfryer, fără ulei adăugat sau cu maxim un strop. Totalul zilnic variază în funcție de alegerile la prânz și cină. Consultați un medic sau nutriționist înainte de a începe orice dietă.
      </div>
    </div>
  );
}
