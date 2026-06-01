@echo off
title Ngrok Static Tunnel (Port 80)
echo ================================================================
echo   🎬 CINEMA SYSTEM — CINEMAMS
echo   🌐 Ngrok static tunnel starting...
echo   🔗 Domain: envious-citrus-rink.ngrok-free.dev
echo   📌 Frontend + API qua cung 1 URL (nginx proxy)
echo ================================================================
D:\Doan\ngrok.exe http 80 --domain=envious-citrus-rink.ngrok-free.dev
pause
