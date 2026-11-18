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
    const sanitized = expr.replace(/\^/g, "**");
    const result = new Function(`"use strict"; return (${sanitized});`)();
    if (typeof result !== "number" || !isFinite(result)) return null;
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

  // Auto-focus input on mount and place cursor at end
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 15);
    return () => clearTimeout(timer);
  }, []);

  // Live calculator preview
  useEffect(() => {
    setCalcResult(tryCalc(query.trim()));
  }, [query]);

  const openLink = (url: string) => {
    setQuery("");
    onClose();
    // 1. Electron Wallpaper Mode: delegate to system default browser
    if (window.electronWallpaper?.openExternal) {
      window.electronWallpaper.openExternal(url);
      return;
    }
    // 2. Chrome Extension New Tab: navigate the current tab
    if (window.location.protocol === "chrome-extension:") {
      window.location.href = url;
      return;
    }
    // 3. Live Wallpaper / WebView2 / Web Preview: open in external/new tab without replacing the sky
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const execute = () => {
    const raw = query.trim();
    if (!raw) return;

    const clean = raw.replace(/^\//, "").trim();
    const parts = clean.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const rest = parts.slice(1).join(" ").trim();

    // Built-in: settings / appearance / prefs
    if (cmd === "settings" || cmd === "appearance" || cmd === "prefs") {
      setQuery("");
      onClose();
      onOpenAppearance();
      return;
    }

    // Built-in: fullscreen
    if (cmd === "fs" || cmd === "fullscreen") {
      setQuery("");
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
      setQuery("");
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

    // Built-in: Clear
    if (cmd === "clear") {
      setQuery("");
      return;
    }

    // Calculator — if it evaluates, copy to clipboard and notify
    const calc = tryCalc(clean);
    if (calc !== null) {
      setQuery("");
      navigator.clipboard?.writeText(calc).catch(() => {});
      toast(`= ${calc}`);
      onClose();
      return;
    }

    // 1. Check custom user-defined aliases first
    const alias = settings.aliases?.find((a) => a.key.toLowerCase() === cmd);
    if (alias) {
      let targetUrl = alias.url;
      if (rest) {
        if (targetUrl.includes("%s")) {
          targetUrl = targetUrl.replace(/%s/g, encodeURIComponent(rest));
        } else if (!targetUrl.includes("?")) {
          targetUrl += `?q=${encodeURIComponent(rest)}`;
        } else {
          targetUrl += `&q=${encodeURIComponent(rest)}`;
        }
      }
      openLink(targetUrl);
      return;
    }

    // 2. Built-in YouTube Search & Launch
    if (cmd === "yt" || cmd === "youtube") {
      if (rest) {
        openLink(`https://www.youtube.com/results?search_query=${encodeURIComponent(rest)}`);
      } else {
        openLink("https://www.youtube.com");
      }
      return;
    }

    // 3. Built-in Google Search & Launch (supports "g <query>" and "g: <query>")
    if (cmd === "g" || cmd === "google" || cmd === "g:") {
      const gQuery = cmd === "g:" ? rest : rest;
      if (gQuery) {
        openLink(`https://www.google.com/search?q=${encodeURIComponent(gQuery)}`);
      } else {
        openLink("https://www.google.com");
      }
      return;
    }

    // 4. Built-in ChatGPT
    if (cmd === "gpt" || cmd === "chatgpt") {
      if (rest) {
        openLink(`https://chatgpt.com/?q=${encodeURIComponent(rest)}`);
      } else {
        openLink("https://chatgpt.com");
      }
      return;
    }

    // 5. Built-in Claude AI
    if (cmd === "claude") {
      if (rest) {
        openLink(`https://claude.ai/new?q=${encodeURIComponent(rest)}`);
      } else {
        openLink("https://claude.ai");
      }
      return;
    }

    // 6. Built-in Reddit
    if (cmd === "rd" || cmd === "reddit") {
      if (rest) {
        const sub = rest.replace(/^r\//i, "");
        openLink(`https://www.reddit.com/r/${encodeURIComponent(sub)}`);
      } else {
        openLink("https://www.reddit.com");
      }
      return;
    }

    // 7. Direct URL detection (e.g. "github.com", "https://news.ycombinator.com")
    if (
      /^https?:\/\//i.test(clean) ||
      (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(clean) && !clean.includes(" "))
    ) {
      openLink(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`);
      return;
    }

    // 8. General fallback: Google Search
    openLink(`https://www.google.com/search?q=${encodeURIComponent(raw)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
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
        if (e.target === e.currentTarget) {
          setQuery("");
          onClose();
        }
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
            placeholder="Search or type a command (yt, g, gpt, settings, fs)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

          <div
            className="spotlight-badge"
            onClick={() => {
              setQuery("");
              onClose();
            }}
          >
            ESC
          </div>
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
