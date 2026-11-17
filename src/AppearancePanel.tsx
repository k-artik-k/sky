import { useEffect, useState } from "react";
import HandBox from "./HandBox";
import { toast } from "./toastManager";

export interface SkySettings {
  clouds: boolean;
  birds: boolean;
  intensity: number; // 1 | 2 | 3
  timeSky: boolean;
  easterEggs: boolean;
  showClock: boolean;
  customHour: number | null; // null = use system clock
  autoHideHud: boolean;
}

export const DEFAULT_SKY_SETTINGS: SkySettings = {
  clouds: true,
  birds: true,
  intensity: 2,
  timeSky: true,
  easterEggs: true,
  showClock: true,
  customHour: null,
  autoHideHud: true,
};

const STORAGE_KEY = "sky_engine_settings";

export function loadSettings(): SkySettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SKY_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore corrupt storage
  }
  return DEFAULT_SKY_SETTINGS;
}

export function saveSettings(s: SkySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Ignore storage issues
  }
}

interface AppearancePanelProps {
  settings: SkySettings;
  onChange: (newSettings: SkySettings) => void;
  onClose: () => void;
}

const TOGGLES: { key: keyof SkySettings; label: string; desc: string }[] = [
  {
    key: "clouds",
    label: "Cloud animations",
    desc: "Drifting hand-rendered clouds moving across 3 depths with variable wind.",
  },
  {
    key: "birds",
    label: "Bird animations",
    desc: "Flocks of birds crossing the sky, flapping their wings dynamically.",
  },
  {
    key: "timeSky",
    label: "Time-based sky",
    desc: "Sky follows your local system clock (sunrise, day, sunset, night, stars).",
  },
  {
    key: "easterEggs",
    label: "Easter eggs",
    desc: "Looping birds, paper planes, rainbow cloud, meteor showers, and secret keys.",
  },
  {
    key: "showClock",
    label: "Show Center Clock",
    desc: "Display a clean, minimal digital time and date in the center.",
  },
  {
    key: "autoHideHud",
    label: "Auto-hide buttons (Hover to reveal)",
    desc: "Only reveal top-right buttons when hovering over them; keeps the sky pure during all other activity.",
  },
];

const INTENSITY_LEVELS = [
  { level: 1, name: "Calm", desc: "Fewer clouds & gentle breeze" },
  { level: 2, name: "Balanced", desc: "Natural pacing & lively flocks" },
  { level: 3, name: "Lively", desc: "Dynamic gusts & frequent birds" },
] as const;

export default function AppearancePanel({
  settings,
  onChange,
  onClose,
}: AppearancePanelProps) {
  const [form, setForm] = useState<SkySettings>(settings);

  // Live preview as user tweaks values
  const update = <K extends keyof SkySettings>(key: K, val: SkySettings[K]) => {
    const next = { ...form, [key]: val };
    setForm(next);
    onChange(next);
  };

  const handleSave = () => {
    saveSettings(form);
    toast("Settings saved!");
    onClose();
  };

  const handleReset = () => {
    setForm(DEFAULT_SKY_SETTINGS);
    onChange(DEFAULT_SKY_SETTINGS);
    saveSettings(DEFAULT_SKY_SETTINGS);
    toast("Reset to default settings.");
  };

  // Close with Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formatHour = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.floor((h - hrs) * 60);
    const period = hrs >= 12 ? "PM" : "AM";
    const displayH = hrs % 12 === 0 ? 12 : hrs % 12;
    const displayM = mins < 10 ? `0${mins}` : mins;
    return `${displayH}:${displayM} ${period}`;
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="settings-heading"
      >
        <div className="settings-header">
          <h2 id="settings-heading" className="settings-title">
            Sky Appearance
          </h2>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M5 6 L19 19 M19 5 L6 18" />
            </svg>
          </button>
        </div>

        <p className="settings-subtitle">
          Customize the atmosphere and animation behavior. Changes preview live in the background.
        </p>

        {/* Toggles list */}
        <ul className="toggles-list">
          {TOGGLES.map(({ key, label, desc }) => (
            <li key={key}>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => update(key, e.target.checked as never)}
                />
                <div className="check-content">
                  <strong>{label}</strong>
                  <span>{desc}</span>
                </div>
              </label>
            </li>
          ))}
        </ul>

        {/* Intensity levels */}
        <span className="field-label">Animation Intensity</span>
        <div className="intensity-grid">
          {INTENSITY_LEVELS.map(({ level, name, desc }) => (
            <button
              key={level}
              type="button"
              className={`intensity-btn ${form.intensity === level ? "active" : ""}`}
              onClick={() => update("intensity", level)}
            >
              <span className="intensity-num">LEVEL {level}</span>
              <span className="intensity-name">{name}</span>
              <span className="intensity-desc">{desc}</span>
            </button>
          ))}
        </div>

        {/* Manual Time-of-Day Slider (great for testing wallpapers) */}
        <div className="slider-section">
          <label className="check-label" style={{ marginBottom: "12px" }}>
            <input
              type="checkbox"
              checked={form.customHour !== null}
              onChange={(e) => update("customHour", e.target.checked ? 12 : null)}
            />
            <div className="check-content">
              <strong>Preview Custom Time of Day</strong>
              <span>
                Override system clock to lock the sky to dawn, noon, sunset, or midnight.
              </span>
            </div>
          </label>

          {form.customHour !== null && (
            <div className="slider-row">
              <input
                type="range"
                min="0"
                max="23.9"
                step="0.1"
                value={form.customHour}
                onChange={(e) => update("customHour", parseFloat(e.target.value))}
              />
              <span className="time-readout">{formatHour(form.customHour)}</span>
            </div>
          )}
        </div>

        {/* Save & Reset buttons */}
        <div className="settings-actions">
          <button type="button" className="btn sm" onClick={handleReset}>
            Reset defaults
            <HandBox seed="reset" />
          </button>
          <button type="button" className="btn primary sm" onClick={handleSave}>
            Save & Close
            <HandBox seed="save" />
          </button>
        </div>
      </div>
    </div>
  );
}
