@echo off
cd /d "%~dp0"
start "" http://localhost:3000/Calendar.html
node server.js
pause