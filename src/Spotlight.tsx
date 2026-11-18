import { useEffect, useRef, useState } from "react";
import { SkySettings } from "./AppearancePanel";
import { toast } from "./toastManager";

export interface SpotlightProps {
  settings: SkySettings;
  onChange: (settings: SkySettings) => void;
  onClose: () => void;
  onOpenAppearance: () => void;
  initialChar?: string;
}

/* ---- tiny safe math evaluator (no eval) ---- */
function tryCalc(expr: string): string | null {
  // Only allow digits, operators, parens, dots, spaces, and % for modulo
  if (!/^[\d+\-*/().%\s^]+$/.test(expr)) return null;
  // Must have at least one operator to be a "calculation"
  if (!/[+\-*/^%]/.test(expr)) return null;
  try {
    // Replace ^ with ** for exponentiation
    const sanitized = expr.replace(/\^/g, "**");
    const result = new Function(`"use strict"; return (${sanitized});`)();
    if (typeof result !== "number" || !isFinite(result)) return null;
    // Format nicely
    return Number.isInteger(result) ? String(result) : result.toFixed(6).replace(/\.?0+$/, "");
  } catch {
    return null;
  }
}

export default function Spotlight({
  settings,
  onChange,
  onClose,
  onOpenAppearance,
  initialChar = "",
}: SpotlightProps) {
  const [query, setQuery] = useState(initialChar);
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipNextInput = useRef(!!initialChar);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(query.length, query.length);
    }
  }, []);

  // Live calculator preview
  useEffect(() => {
    setCalcResult(tryCalc(query.trim()));
  }, [query]);

  const execute = () => {
    const raw = query.trim();
    if (!raw) return;

    const clean = raw.replace(/^\//, "").trim();
    const parts = clean.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    // Built-in: settings / appearance
    if (cmd === "settings" || cmd === "appearance" || cmd === "prefs") {
      onClose();
      onOpenAppearance();
      return;
    }

    // Built-in: fullscreen
    if (cmd === "fs" || cmd === "fullscreen") {
      onClose();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          toast("Fullscreen blocked");
        });
      } else {
        document.exitFullscreen().catch(() => {});
      }
      return;
    }

    // Built-in: reset
    if (cmd === "reset") {
      onChange({
        clouds: true,
        birds: true,
        intensity: 2,
        timeSky: true,
        easterEggs: true,
        showClock: true,
        customHour: null,
        autoHideHud: true,
        aliases: settings.aliases,
      });
      toast("Settings restored to defaults");
      onClose();
      return;
    }

    // Calculator — if it evaluates, copy to clipboard and show toast
    const calc = tryCalc(clean);
    if (calc !== null) {
      navigator.clipboard?.writeText(calc).catch(() => {});
      toast(`= ${calc}`);
      onClose();
      return;
    }

    const openLink = (url: string) => {
      setQuery("");
      onClose();
      if (window.electronWallpaper?.openExternal) {
        window.electronWallpaper.openExternal(url);
      } else {
        window.location.href = url;
      }
    };

    // Custom aliases check (exact match on first word)
    const alias = settings.aliases?.find(
      (a) => a.key.toLowerCase() === cmd
    );
    if (alias) {
      openLink(alias.url);
      return;
    }

    // Direct URL detection
    if (
      /^https?:\/\//i.test(clean) ||
      (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(clean) && !clean.includes(" "))
    ) {
      openLink(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`);
      return;
    }

    // Fallback: Google Search
    openLink(`https://www.google.com/search?q=${encodeURIComponent(raw)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      execute();
    }
  };

  return (
    <div
      className="spotlight-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="spotlight-container">
        <div className="spotlight-input-row">
          <svg
            className="spotlight-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            className="spotlight-input"
            placeholder="Search or type a command..."
            value={query}
            onChange={(e) => {
              // Skip the first input event if we pre-filled from initialChar
              // (browser fires input from the same keydown that opened us)
              if (skipNextInput.current) {
                skipNextInput.current = false;
                // If the value doubled (e.g. "gg" when we wanted "g"), fix it
                if (initialChar && e.target.value === initialChar + initialChar) {
                  setQuery(initialChar);
                  return;
                }
              }
              setQuery(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
          />

          {query && (
            <button
              className="spotlight-clear"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              title="Clear"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <div className="spotlight-badge" onClick={onClose}>ESC</div>
        </div>

        {/* Live calculator result preview */}
        {calcResult !== null && (
          <div className="spotlight-calc">
            = {calcResult}
          </div>
        )}
      </div>
    </div>
  );
}
