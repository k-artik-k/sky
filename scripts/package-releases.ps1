# Sky Engine - Release Packaging Script
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$rootDir = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $rootDir "release"
$buildDir = Join-Path $rootDir "build\SkyWallpaper-win-x64"
$distDir = Join-Path $rootDir "dist"

Write-Host "=== Packaging Sky Engine Releases ==="

# Clean any existing artifacts in release/
if (Test-Path $releaseDir) {
    Remove-Item (Join-Path $releaseDir "*") -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

# ----------------------------------------------------
# 1. Package Desktop Wallpaper (Windows x64 Standalone)
# ----------------------------------------------------
Write-Host "`n[1/2] Creating Wallpaper package..."
$wallpaperStaging = Join-Path $releaseDir "SkyWallpaper-v1.0.0-windows-x64"
New-Item -ItemType Directory -Path $wallpaperStaging -Force | Out-Null

# Copy build binaries
Copy-Item (Join-Path $buildDir "*") -Destination $wallpaperStaging -Recurse -Force

# Copy launcher helper scripts
$batSource = Join-Path $rootDir "start-wallpaper.bat"
$vbsSource = Join-Path $rootDir "start-wallpaper-silent.vbs"
if (Test-Path $batSource) { Copy-Item $batSource $wallpaperStaging -Force }
if (Test-Path $vbsSource) { Copy-Item $vbsSource $wallpaperStaging -Force }

# Create README-WALLPAPER.txt
$wallpaperReadme = @"
========================================================================
 Sky Engine - Windows 11 Live Wallpaper (v1.0.0 Standalone)
========================================================================

A physics-driven, illustrated sky engine that runs directly as an active
live desktop wallpaper behind your Windows icons.

------------------------------------------------------------------------
 HOW TO RUN
------------------------------------------------------------------------
1. Double-click "SkyWallpaper.exe" (or "start-wallpaper-silent.vbs" for
   zero console window flashing).
2. The living sky immediately appears behind your desktop icons, advancing
   in real-time according to your system clock (sunrise, day, sunset, night).
3. All desktop icons remain 100% clickable, selectable, and draggable.

------------------------------------------------------------------------
 SYSTEM TRAY CONTROLS
------------------------------------------------------------------------
Right-click the Sky icon in your Windows notification tray (near clock) to:
  * Open Appearance Settings
  * Trigger Spotlight Search (Ctrl + Shift + Space)
  * Toggle Minimalist Center Clock
  * Launch on Windows Startup (toggle auto-boot)
  * Reload Wallpaper
  * Exit Live Wallpaper

------------------------------------------------------------------------
 GLOBAL SPOTLIGHT COMMANDS (Press Ctrl + Shift + Space anywhere)
------------------------------------------------------------------------
Search the web or launch shortcuts directly into your default browser:
  * yt <query>          -> Search YouTube / Open YouTube
  * g <query> / g: ...  -> Search Google
  * gpt <prompt>        -> Launch ChatGPT with prompt
  * claude <prompt>     -> Launch Claude AI with prompt
  * rd <subreddit>      -> Open subreddit (e.g. rd webdev)
  * <any calculation>   -> Evaluates instantly (e.g. 144*12, 2^8)
  * settings            -> Opens the visual customization panel
  * fs                  -> Toggle Fullscreen Wallpaper mode
  * reset               -> Restore all settings to defaults

------------------------------------------------------------------------
 HOW TO AUTOSTART ON BOOT
------------------------------------------------------------------------
Option A: Right-click the Sky tray icon -> Click "Launch on Windows Startup".
Option B: Press Win + R, type "shell:startup", press Enter, and paste a
          shortcut to "start-wallpaper-silent.vbs".
========================================================================
"@
Set-Content -Path (Join-Path $wallpaperStaging "README.txt") -Value $wallpaperReadme -Encoding UTF8

$wallpaperZip = Join-Path $releaseDir "SkyWallpaper-v1.0.0-windows-x64.zip"
Write-Host "Compressing $wallpaperZip ..."
Compress-Archive -Path (Join-Path $wallpaperStaging "*") -DestinationPath $wallpaperZip -CompressionLevel Optimal

# Remove staging directory to leave only the zip
Remove-Item $wallpaperStaging -Recurse -Force

# ----------------------------------------------------
# 2. Package Chrome Extension / Web Wallpaper Bundle
# ----------------------------------------------------
Write-Host "`n[2/2] Creating Chrome Extension package..."
$extensionStaging = Join-Path $releaseDir "SkyEngine-ChromeExtension-v1.0.0"
New-Item -ItemType Directory -Path $extensionStaging -Force | Out-Null

# Copy dist files
Copy-Item (Join-Path $distDir "*") -Destination $extensionStaging -Recurse -Force

# Create README-EXTENSION.txt
$extensionReadme = @"
========================================================================
 Sky Engine - Chrome / Edge / Brave New Tab Extension & Web Wallpaper
========================================================================

A physics-driven, illustrated sky engine with real-time day/night cycle,
animated clouds, dynamic wind gusts, flocking birds, center clock, and
liquid glass spotlight search bar.

------------------------------------------------------------------------
 HOW TO INSTALL AS A NEW TAB EXTENSION (Chrome / Edge / Brave)
------------------------------------------------------------------------
1. Extract this zip file to a permanent folder on your computer.
2. Open your web browser and navigate to the extensions page:
   - Google Chrome: chrome://extensions
   - Microsoft Edge: edge://extensions
   - Brave:         brave://extensions
3. Enable "Developer mode" (toggle switch in the top-right corner).
4. Click the "Load unpacked" button in the top-left corner.
5. Select the extracted "SkyEngine-ChromeExtension-v1.0.0" folder.
6. Open a new tab (Ctrl + T) to enjoy your living sky!

------------------------------------------------------------------------
 HOW TO USE WITH LIVELY WALLPAPER (Windows 11 Live Wallpaper)
------------------------------------------------------------------------
1. Download Lively Wallpaper (free & open source from Microsoft Store).
2. Open Lively Wallpaper.
3. Click "+ Add Wallpaper" in the top bar.
4. Drag and drop this extracted folder directly into Lively Wallpaper
   (or click Browse and select "index.html").
5. Click OK. The sky will run smoothly behind your desktop icons!

------------------------------------------------------------------------
 KEYBOARD SHORTCUTS & COMMANDS
------------------------------------------------------------------------
  * Press any letter key -> Opens Spotlight search with that letter
  * Ctrl + K or /       -> Opens Spotlight search bar
  * Esc                 -> Close Spotlight / Close Settings
  * yt <query>          -> YouTube search / YouTube home
  * g <query>           -> Google search
  * gpt <prompt>        -> Launch ChatGPT with prompt
  * claude <prompt>     -> Launch Claude with prompt
  * rd <subreddit>      -> Open subreddit (e.g. rd webdev)
  * Math calculations   -> Instant calculator (e.g. 24 * 60, sqrt)
  * settings            -> Open sky appearance settings dialog
  * Hover Top-Right     -> Reveals Search, Fullscreen, and Settings HUD
========================================================================
"@
Set-Content -Path (Join-Path $extensionStaging "README.txt") -Value $extensionReadme -Encoding UTF8

$extensionZip = Join-Path $releaseDir "SkyEngine-ChromeExtension-v1.0.0.zip"
Write-Host "Compressing $extensionZip ..."
Compress-Archive -Path (Join-Path $extensionStaging "*") -DestinationPath $extensionZip -CompressionLevel Optimal

# Remove staging directory to leave only the zip
Remove-Item $extensionStaging -Recurse -Force

Write-Host "`n=== Packaging Complete ==="
Get-ChildItem $releaseDir | Select-Object Name, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}}
