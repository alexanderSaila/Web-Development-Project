@echo off
cd /d "%~dp0"
timeout /t 2 /nobreak >nul
start "" http://localhost:3000/Calendar.html
call npx nodemon server.js
pause