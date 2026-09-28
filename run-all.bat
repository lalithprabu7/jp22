@echo off
echo ========================================================
echo   ContractWatch - Full Stack Runner (Backend + Frontend)
echo ========================================================

echo Launching Backend in a new window...
start "ContractWatch Backend (Spring Boot :8080)" cmd /k "%~dp0run-backend.bat"

echo Launching Frontend in a new window...
start "ContractWatch Frontend (React Vite :5173)" cmd /k "%~dp0run-frontend.bat"

echo.
echo Both services are starting!
echo - Backend:  http://localhost:8080
echo - Swagger:  http://localhost:8080/swagger-ui.html
echo - Frontend: http://localhost:5173
echo ========================================================
