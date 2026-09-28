@echo off
echo ===================================================
echo   ContractWatch - Backend Startup (Java 21 + Spring Boot)
echo ===================================================

set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
set "PATH=%JAVA_HOME%\bin;C:\Users\Home\jp2\maven_dist\apache-maven-3.9.6\bin;%PATH%"

cd /d "%~dp0backend"

echo Using Java:
java -version

echo.
echo Starting ContractWatch Backend on http://localhost:8080 ...
echo Swagger UI will be available at: http://localhost:8080/swagger-ui.html
echo.

call mvn spring-boot:run
pause
