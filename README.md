# Poker Advisor

Aplicatie React care analizeaza screenshot-uri de poker si ofera recomandari de decizie.

## Setup

1. **Copiaza `.env.example` in `.env`** si adauga cheia API:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Instaleaza dependintele backend:**
   ```bash
   npm install
   ```

3. **Instaleaza dependintele frontend:**
   ```bash
   cd client
   npm install
   ```

## Pornire

### Rapid (Windows):
Dublu-click pe `start.bat`

### Manual:

Terminal 1 (backend):
```bash
node server.js
```

Terminal 2 (frontend):
```bash
cd client
npm run dev
```

Deschide `http://localhost:5173` in browser.

## Utilizare

1. Deschide aplicatia in browser
2. Apasa **Ctrl+V** pentru a paste un screenshot de poker
3. Sau trage & lasa (drag & drop) o imagine
4. Click **Analizeaza Mana**
5. Primesti analiza si recomandarea optima

## Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Express.js
