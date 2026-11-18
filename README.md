# Sky Engine

A standalone, physics-driven, illustrated sky engine with time-of-day progression, animated clouds with dynamic wind gusts, flocking birds, twinkling stars, and easter eggs.

Extracted from **project-arKive** to be used as:
- **Chrome / Edge / Firefox New Tab Extension theme**
- **Desktop Live Wallpaper** (via *Lively Wallpaper*, *Wallpaper Engine*, or Electron)
- **Standalone ambient visualizer or screensaver**

---

## Quick Start

From the `sky-engine` directory:

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the local live dev server
npm run dev

# 3. Build optimized static production bundle
npm run build
```

The output in `dist/` is a pure static web app (`index.html`, bundled JS, and CSS) with no backend or server requirements.

---

## Features & Settings Panel

Click the **Gear icon** in the top-right corner (or press <kbd>Esc</kbd> to close) to open the **Sky Appearance** panel:

1. **Cloud Animations**: Toggle 3 layers of procedural puffy clouds drifting with realistic wind simulation.
2. **Bird Animations**: Flocks of birds with realistic sinusoidal flapping and altitude bobbing.
3. **Time-based Sky**: Synchronizes with your system clock to transition through:
   - Deep night with glowing moon & stars
   - Golden dawn & sunrise
   - Crisp midday
   - Vibrant twilight & sunset
4. **Easter Eggs Toggle**: Turn hidden interactions on or off.
5. **Animation Intensity**:
   - Level 1: *Calm* (gentle breeze, fewer clouds)
   - Level 2: *Balanced* (natural pace and flocks)
   - Level 3: *Lively* (faster wind, dynamic gusts, frequent birds)
6. **Time-of-Day Slider**: Override system clock to preview the atmosphere at any hour (0:00 to 23:59).
7. **Center Clock**: Toggle a clean, large digital clock display for new-tab/wallpaper use.
8. **Auto-hide Buttons & HUD (Hover-to-Reveal)**: Top-right controls (Fullscreen & Appearance) remain hidden by default and only reveal when hovering over the top-right options area. Normal mouse activity across the sky will not trigger them, keeping your view completely pristine.
9. **Settings Persistence**: All preferences auto-save to `localStorage`.

---

## Keyboard Shortcuts & Controls

| Shortcut | Action |
| :--- | :--- |
| **Any letter / number key** | Opens the **Liquid Glass Spotlight** with that character pre-filled |
| **<kbd>Ctrl</kbd> + <kbd>K</kbd>** / **<kbd>Cmd</kbd> + <kbd>K</kbd>** | Opens the **Spotlight Command Bar** |
| **<kbd>/</kbd>** | Opens Spotlight Command Bar |
| **<kbd>Esc</kbd>** | Close Spotlight / Close Appearance dialog / Exit fullscreen |
| **<kbd>Tab</kbd>** | Autocomplete highlighted command hint |
| **<kbd>↵ Enter</kbd>** | Run command or launch web search |
| **<kbd>↑</kbd> / <kbd>↓</kbd>** | Navigate suggestions in Spotlight |
| **Hover Top-Right Corner** | Reveals Search, Fullscreen & Appearance HUD buttons |
| **Move away from corner** | Smoothly fades out buttons for a pristine, uninterrupted sky |

---

## Liquid Glass Spotlight Commands

The Spotlight Command Bar accepts direct, lightweight keywords (no `/` required, though `/` is accepted if preferred):

### 🔍 Search & AI
| Command | Action |
| :--- | :--- |
| `g <query>` | Search Google (`g` alone opens Google) |
| `yt <query>` | Search YouTube (`yt` alone opens YouTube) |
| `gpt <prompt>` | Ask ChatGPT (`gpt` alone opens ChatGPT) |
| `claude <prompt>` | Open Claude AI with prompt |
| `rd <subreddit>` | Open subreddit (`rd webdev`) or search Reddit |
| `gh <query>` | Search GitHub repositories |
| `wiki <query>` | Search Wikipedia |
| `x <query>` / `tw <query>` | Search X / Twitter |
| `maps <query>` | Search Google Maps |
| `npm <pkg>` | Search NPM packages |
| *(Any query)* | Any unrecognized input automatically searches Google |

### 🚀 Quick Launch
| Command | Destination |
| :--- | :--- |
| `mail` / `gmail` | Open Gmail |
| `drive` | Open Google Drive |
| `cal` / `calendar` | Open Google Calendar |
| `keep` | Open Google Keep |
| `music` | Open YouTube Music |
| `news` | Open Google News |
| `docs` | Open Google Docs |
| `sheets` | Open Google Sheets |

### ⚙️ Sky & Appearance CLI Control
| Command | Effect |
| :--- | :--- |
| `clouds [on\|off]` | Toggle drifting puffy clouds |
| `birds [on\|off]` | Toggle flocking animated birds |
| `intensity [1\|2\|3]` | Set wind pace (or use `calm`, `balanced`, `lively`) |
| `clock [on\|off]` | Toggle center digital clock |
| `hud [on\|off]` | Toggle HUD buttons auto-hide |
| `eggs [on\|off]` | Toggle secrets & easter eggs |
| `timesky [on\|off]` | Toggle system-clock synced sky |
| `time <hour>` | Override sky hour (`time 19.5`) or `time reset` |
| `settings` / `appearance` | Open the Appearance visual configuration panel |
| `reset` | Restore all sky settings to defaults |

### ⚡ Ambient & System Actions
| Command | Effect |
| :--- | :--- |
| `time` | Show current live time & date |
| `date` | Show today's full date |
| `fs` / `fullscreen` | Toggle Fullscreen Wallpaper Mode |
| `meteor` / `shower` | Summon a meteor shower across the sky ✨ |
| `timelapse` | Trigger accelerated 24-hour day-to-night timelapse (20s) |
| `wish` | Spawn a wishing star ⭐ |
| `clear` | Clear spotlight search input |
| `help` / `?` | Show quick command cheatsheet |

---

## Built-in Easter Eggs

When Easter Eggs are enabled in Settings:

| Action | Secret Effect |
| :--- | :--- |
| **Konami Code** (`↑ ↑ ↓ ↓ ← → ← → b a`) | Unlocks a meteor shower |
| **Type "time"** anywhere | 20-second accelerated 24-hour timelapse |
| **Double-Click empty sky** | Spawns a wishing shooting star |
| **Click the Sun or Moon** | Time-aware greeting toast |
| **Click the Special Cloud** | Rainbow arc easter egg |
| **Rare Bird Behaviors** | Occasional loop-the-loop birds, upside-down flyers, or paper airplanes |

---

## Usage in a Chrome New Tab Extension

The extension is pre-configured and ready to load:

1. Run `npm run build` (generates the optimized build with `manifest.json` in `dist/`).
2. Open `chrome://extensions` in Google Chrome (or Edge/Brave).
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the **`dist`** folder (or the `sky-engine` project folder).
5. If you already loaded it earlier, click the **Reload (🔄)** icon on the Sky New Tab card.
6. Open a new tab (<kbd>Ctrl</kbd> + <kbd>T</kbd>) to enjoy your living sky!

---

## Usage as a Desktop Live Wallpaper

### Standalone Windows 11 App (`SkyWallpaper.exe`)
A dedicated, standalone native Windows application has been built for you:

**Direct Executable:**
- `build\SkyWallpaper-win-x64\SkyWallpaper.exe`

Double-click **`SkyWallpaper.exe`** directly (or use **`start-wallpaper-silent.vbs`** / **`start-wallpaper.bat`**). It runs natively on your desktop without needing any browser extensions, third-party wallpaper software (no Lively Wallpaper needed), or open terminal windows!

```bash
# To re-build the standalone EXE bundle anytime:
npm run build:exe
```

#### Features:
- **Zero Deadlocks / Freeze-Free:** Uses asynchronous non-blocking Win32 hooks with explicit `WS_CHILD | WS_VISIBLE` window style transitions, preventing cross-process message deadlocks on Windows 11.
- **Embedded Behind Desktop Icons:** Anchored into Windows 11's `WorkerW` / `Progman` desktop canvas. All desktop icons remain fully clickable, selectable, and draggable.
- **Smooth 60 FPS Background Animation:** Background throttling is disabled (`backgroundThrottling: false`) so ambient clouds, wind gusts, and bird animations run smoothly at 60 FPS even while gaming or multitasking in other windows.
- **Global Search Shortcut:** Press **<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd>** anywhere in Windows to summon the Spotlight search bar on top of your screen to search Google, launch custom aliases, or compute calculations.
- **Windows 11 Taskbar Tray Menu:** Right-click the Sky icon in the Windows taskbar notification tray:
  - Open Appearance Settings
  - Command Spotlight
  - Toggle Center Clock
  - Reload Wallpaper
  - Launch on Windows Startup (autostart on boot toggle)
  - Exit Live Wallpaper

---

### Option A: Lively Wallpaper (Recommended for Windows 11 - Free & Open Source)
Lively Wallpaper is Microsoft Store's top-rated, free, open-source live wallpaper manager:
- **Zero Configuration:** Drag and drop the `dist/` folder directly into Lively Wallpaper! (Pre-configured with `LivelyInfo.json`).
- **Native DirectComposition:** Seamlessly integrates with Windows 11 DWM, desktop icons, and taskbar transparency.
- **Smart Power Saving:** Automatically pauses rendering when full-screen apps or games are focused to preserve 100% of your GPU/CPU.
- **Multi-Monitor:** Supports independent monitors, spanning across displays, or per-screen settings.

**Setup Instructions:**
1. Download **Lively Wallpaper** from the [Microsoft Store](https://apps.microsoft.com/detail/9ntm2qc6qws7) or [GitHub](https://github.com/rocksdanister/lively).
2. Run `npm run build` in `sky-engine`.
3. In Lively Wallpaper, click **+ Add Wallpaper** -> Drag and drop the `dist` folder (or click **Browse** and select `dist/index.html`).
4. Done! The sky now runs flawlessly behind your desktop icons, advancing with your real-world clock.

---

### Option B: Standalone Windows App (`SkyWallpaper.exe`)
If you prefer a 100% self-contained app without installing any wallpaper manager:

**Direct Launch:**
- Double-click **`start-wallpaper.bat`** (or **`start-wallpaper-silent.vbs`** for zero command prompt window).
- Or run **`build\SkyWallpaper-win-x64\SkyWallpaper.exe`**.

**Features:**
- **External Browser Integration:** Spotlight web searches and aliases (`yt`, `g`, `gpt`, custom links) launch directly into your default browser (Chrome, Edge, Firefox), keeping the wallpaper pristine.
- **Embedded Behind Desktop Icons:** Anchored into Windows 11's `WorkerW` / `Progman` desktop canvas with all desktop icons fully clickable.
- **Smooth 60 FPS Background Animation:** Ambient clouds, wind gusts, and bird animations run smoothly at 60 FPS.
- **Global Search Shortcut:** Press **<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd>** anywhere in Windows to summon the Spotlight search bar on top of your screen.
- **Windows Taskbar Tray Menu:** Right-click the Sky icon in the Windows taskbar tray to open Appearance Settings, toggle center clock, reload, or toggle startup on boot.

---

### Wallpaper Engine (Steam)
1. In Wallpaper Engine, click **Wallpaper Editor** -> **Create Wallpaper** -> **Web Wallpaper**.
2. Point it to `sky-engine/dist/index.html`.

---

## File Structure

```
sky-engine/
├── dist/                       # Production web bundle (Chrome extension & Lively wallpaper)
├── build/                      # Standalone Windows app (SkyWallpaper-win-x64)
├── electron/
│   ├── main.cjs                # Electron main process & tray controller
│   ├── preload.cjs             # IPC bridge for renderer
│   ├── wallpaper-helper.exe    # Compiled native Win32 WorkerW embedder
│   ├── WallpaperHelper.cs      # C# source for WorkerW embedder
│   └── tray-icon.png           # System tray icon
├── public/                     # Static assets copied directly into dist/
│   ├── LivelyInfo.json         # Lively Wallpaper package descriptor
│   └── manifest.json           # Chrome Extension Manifest V3
├── scripts/
│   └── build-exe.cjs           # Standalone Windows executable packager
├── src/
│   ├── Sky.tsx                 # Core sky engine (clouds, birds, sun, moon, stars)
│   ├── palette.ts              # Mathematical color interpolation and solar angles
│   ├── sky.css                 # Consolidated theme, keyframes, and layout styles
│   ├── AppearancePanel.tsx     # Appearance settings UI & localStorage persistence
│   ├── Spotlight.tsx           # Liquid glass spotlight command parser & launcher
│   ├── HandBox.tsx             # Hand-drawn SVG border rendering
│   ├── Toast.tsx               # Floating toast notification component
│   ├── toastManager.ts         # Event dispatcher for notification popups
│   ├── App.tsx                 # Main application shell with HUD & clock
│   ├── main.tsx                # React entry mount
│   └── vite-env.d.ts           # TypeScript client declarations
├── index.html                  # HTML entry point
├── package.json                # Project dependencies & scripts
├── start-wallpaper.bat         # Windows wallpaper launcher
├── start-wallpaper-silent.vbs  # Silent zero-console wallpaper launcher
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite configuration
```
