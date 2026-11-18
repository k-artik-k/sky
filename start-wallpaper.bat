@echo off
title Sky Engine Live Wallpaper
cd /d "%~dp0"
if not exist "build\SkyWallpaper-win-x64\SkyWallpaper.exe" (
    echo Building standalone SkyWallpaper.exe...
    call npm run build:exe
)
echo Launching Sky Engine Live Wallpaper...
start "" "%~dp0build\SkyWallpaper-win-x64\SkyWallpaper.exe"
