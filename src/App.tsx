import { useEffect, useRef, useState } from "react";
import Sky from "./Sky";
import Toast from "./Toast";
import AppearancePanel, {
  loadSettings,
  saveSettings,
  SkySettings,
} from "./AppearancePanel";
import { toast } from "./toastManager";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export default function App() {
  const [settings, setSettings] = useState<SkySettings>(() => loadSettings());
  const [openSettings, setOpenSettings] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchActive, setTouchActive] = useState(false);

  const touchTimerRef = useRef<number | null>(null);

  // Keep live clock updated
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    let wasFullscreen = Boolean(document.fullscreenElement);
    const fn = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (active && !wasFullscreen) {
        toast("Fullscreen Wallpaper Mode (Press F or Esc to exit)");
      } else if (!active && wasFullscreen) {
        toast("Exited Fullscreen");
      }
      wasFullscreen = active;
    };
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  // Clean up touch timer on unmount
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        toast("Fullscreen blocked or not supported by browser");
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTouchZone = () => {
    setTouchActive(true);
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = window.setTimeout(() => {
      setTouchActive(false);
    }, 3500);
  };

  const handleSettingsChange = (newSettings: SkySettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Keyboard shortcuts (F for fullscreen, H for hud toggle, Konami, time timelapse)
  useEffect(() => {
    let buf: string[] = [];

    const onKey = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs/dialogs or holding meta keys
      if (
        (e.target as HTMLElement)?.closest?.("input, textarea, select, [role=dialog]") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      // Universal F key for Fullscreen Wallpaper Mode
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      // H key to toggle HUD auto-hide
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        const next = !settings.autoHideHud;
        handleSettingsChange({ ...settings, autoHideHud: next });
        toast(next ? "Hover-only mode enabled" : "Buttons set to always visible");
        return;
      }

      // Easter eggs keyboard sequence
      if (!settings.easterEggs) return;

      buf = [...buf, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-12);
      const tail = buf.join("");

      if (buf.slice(-KONAMI.length).join() === KONAMI.join()) {
        buf = [];
        window.dispatchEvent(new Event("archive:meteors"));
        toast("Meteor shower unlocked.");
      } else if (tail.endsWith("time")) {
        buf = [];
        window.dispatchEvent(new Event("archive:timelapse"));
        toast("Time machine: one whole day in 20 seconds.");
      }
    };

    const onDblClick = (e: MouseEvent) => {
      if (!settings.easterEggs) return;
      if (
        (e.target as HTMLElement)?.closest?.(
          "button, input, textarea, select, [role=dialog], .settings-card, .sky-hud"
        )
      ) {
        return;
      }
      window.dispatchEvent(new Event("archive:wish"));
      toast("Make a wish.");
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("dblclick", onDblClick);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("dblclick", onDblClick);
    };
  }, [settings]);

  // Clock formatters
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours >= 12 ? "PM" : "AM";
  const dateStr = time.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Sky Canvas & Physics Engine */}
      <Sky
        clouds={settings.clouds}
        birds={settings.birds}
        intensity={settings.intensity}
        timeSky={settings.timeSky}
        easterEggs={settings.easterEggs}
        hour={settings.customHour}
      />

      {/* Floating Navigation HUD - Only reveals when hovering over this options area */}
      <nav
        className={`sky-hud ${!settings.autoHideHud ? "always-visible" : ""} ${
          touchActive ? "is-active" : ""
        }`}
        aria-label="Controls"
        onTouchStart={handleTouchZone}
      >
        <button
          className="hud-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen Wallpaper Mode (F)"}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen Wallpaper Mode"}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          )}
        </button>

        <button
          className="hud-btn"
          onClick={() => setOpenSettings(true)}
          title="Sky & Appearance Settings"
          aria-label="Open Appearance Settings"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </nav>

      {/* Clean Minimalist Center Clock (for New Tab / Wallpaper) */}
      {settings.showClock && (
        <main className="center-clock">
          <div className="clock-time">
            {displayHours}:{displayMinutes}
            <span style={{ fontSize: "0.35em", marginLeft: "10px", verticalAlign: "super" }}>
              {ampm}
            </span>
          </div>
          <div className="clock-date">{dateStr}</div>
        </main>
      )}

      {/* Appearance & Customization Dialog */}
      {openSettings && (
        <AppearancePanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setOpenSettings(false)}
        />
      )}

      {/* Floating Notifications */}
      <Toast />
    </>
  );
}
