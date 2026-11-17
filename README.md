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
| **<kbd>F</kbd>** | Toggle **Fullscreen Wallpaper Mode** |
| **<kbd>H</kbd>** | Toggle **HUD Auto-Hide** on/off |
| **<kbd>Esc</kbd>** | Exit fullscreen / Close Appearance dialog |
| **Hover Top-Right Corner** | Reveals the Fullscreen & Appearance buttons |
| **Move away from corner** | Smoothly fades out buttons for a pristine sky |

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

To turn this into a browser extension:

1. Run `npm run build` to generate `sky-engine/dist/`.
2. In the `sky-engine/dist/` directory, create a `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Sky New Tab",
  "version": "1.0.0",
  "description": "Minimalist living sky new tab",
  "chrome_url_overrides": {
    "newtab": "index.html"
  }
}
```

3. Open `chrome://extensions`, enable **Developer mode** (top right), and click **Load unpacked**.
4. Select the `dist` folder. Every new tab will now display your sky!

---

## Usage as a Desktop Live Wallpaper

### Windows (Lively Wallpaper - Free & Open Source)
1. Download **Lively Wallpaper** from the Microsoft Store or GitHub (`rocksdanister/lively`).
2. Run `npm run build` in `sky-engine`.
3. In Lively Wallpaper, click **Add Wallpaper** -> **Browse** -> Select `sky-engine/dist/index.html`.
4. Done! The sky now runs natively on your desktop, following your computer's clock.

### Wallpaper Engine (Steam)
1. In Wallpaper Engine, click **Wallpaper Editor** -> **Create Wallpaper** -> **Web Wallpaper**.
2. Point it to `sky-engine/dist/index.html`.

---

## File Structure

```
sky-engine/
├── index.html              # HTML shell
├── package.json            # Vite + React 19 dependencies
├── tsconfig.json           # Strict TypeScript configuration
├── vite.config.ts          # Vite build config
├── src/
│   ├── Sky.tsx             # Core sky engine (clouds, birds, sun, moon, stars)
│   ├── palette.ts          # Mathematical color interpolation and solar angles
│   ├── sky.css             # Consolidated theme, keyframes, and layout styles
│   ├── AppearancePanel.tsx # Appearance settings UI & localStorage persistence
│   ├── HandBox.tsx         # Hand-drawn SVG border rendering
│   ├── Toast.tsx           # Floating toast notification component
│   ├── toastManager.ts     # Event dispatcher for notification popups
│   ├── App.tsx             # Main application shell with HUD & clock
│   ├── main.tsx            # React entry mount
│   └── vite-env.d.ts       # TypeScript client declarations
```
