@echo off
echo Pornesc Poker AI Advisor...

:: Verifica daca .env exista
if not exist ".env" (
    echo EROARE: Lipseste fisierul .env
    echo Copiaza .env.example in .env si adauga ANTHROPIC_API_KEY
    pause
    exit /b 1
)

:: Instaleaza dependintele backend daca nu exista
if not exist "node_modules" (
    echo Instalez dependinte backend...
    call npm install
)

:: Instaleaza dependintele frontend daca nu exista
if not exist "client\node_modules" (
    echo Instalez dependinte frontend...
    cd client
    call npm install
    cd ..
)

:: Porneste serverul backend in background
echo Pornesc serverul backend pe portul 3001...
start "Poker Backend" cmd /c "node server.js"

timeout /t 2 /nobreak >nul

:: Porneste frontentul
echo Pornesc frontentul pe portul 5173...
cd client
start "Poker Frontend" cmd /c "npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:5173
