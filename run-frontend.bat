@echo off
echo ===================================================
echo   ContractWatch - Frontend Startup (React + Vite)
echo ===================================================

cd /d "%~dp0frontend"

echo Starting Vite Dev Server on http://localhost:5173 ...
echo.

npm run dev
pause
