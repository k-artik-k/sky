
import { useEffect, useMemo, useRef, useState } from "react";
import { currentHour, skyAt } from "./palette";
import { toast } from "./toastManager";
import "./sky.css";

export interface SkyProps {
  clouds: boolean;
  birds: boolean;
  intensity: number;
  timeSky: boolean;
  easterEggs: boolean;
  hour?: number | null;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

function useReducedMotion(): boolean {
  const [r, setR] = useState(() =>
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);

  return r;
}

// ---- clouds -------------------------------------------------------------

type Puff = [number, number, number];

const SHAPES: Puff[][] = [
  [[70, 140, 38], [125, 108, 52], [200, 88, 62], [275, 110, 52], [335, 140, 40], [200, 148, 56]],
  [[60, 150, 34], [120, 125, 46], [185, 105, 54], [250, 128, 44], [320, 150, 36], [190, 155, 50]],
  [[90, 145, 44], [160, 100, 60], [235, 112, 50], [300, 145, 40], [170, 152, 52]],
  [[50, 150, 30], [100, 120, 44], [160, 92, 50], [225, 80, 56], [290, 105, 48], [345, 138, 38], [200, 150, 58]],
  [[80, 148, 36], [140, 118, 48], [210, 108, 56], [280, 130, 44], [345, 150, 30], [210, 156, 46]],
];

interface CloudSpec {
  v: number;
  top: number;
  w: number;
  layer: 0 | 1 | 2;
  dur: number;
  phase: number;
  rev?: boolean;
  special?: boolean;
}

const CLOUDS: CloudSpec[] = [
  { v: 0, top: 6, w: 420, layer: 0, dur: 260, phase: 0.1 },
  { v: 3, top: 30, w: 560, layer: 1, dur: 200, phase: 0.3 },
  { v: 1, top: 70, w: 700, layer: 2, dur: 150, phase: 0.4 },
  { v: 2, top: 44, w: 600, layer: 2, dur: 130, phase: 0.75, special: true },
  { v: 4, top: 50, w: 460, layer: 1, dur: 220, phase: 0.65, rev: true },
  { v: 2, top: 18, w: 300, layer: 0, dur: 300, phase: 0.55 },
  { v: 1, top: 36, w: 360, layer: 0, dur: 280, phase: 0.85, rev: true },
  { v: 0, top: 80, w: 520, layer: 1, dur: 210, phase: 0.05 },
  { v: 3, top: 90, w: 640, layer: 2, dur: 190, phase: 0.9 },
  { v: 4, top: 12, w: 340, layer: 2, dur: 120, phase: 0.6 },
  { v: 2, top: 58, w: 400, layer: 0, dur: 240, phase: 0.2 },
  { v: 0, top: 24, w: 480, layer: 1, dur: 175, phase: 0.45 },
  { v: 1, top: 64, w: 760, layer: 2, dur: 170, phase: 0.8 },
];

const CLOUD_COUNT = [0, 6, 9, 13];
const SPEED = [0, 0.6, 1, 1.5];

function CloudSvg({ v }: { v: number }) {
  const puffs = SHAPES[v % SHAPES.length];

  return (
    <svg viewBox="0 0 400 200" aria-hidden="true">
      <g filter="url(#fluff)">
        {puffs.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="url(#cloudFill)" />
        ))}
      </g>
      <g filter="url(#soft)" opacity=".7">
        <ellipse cx="200" cy="170" rx="150" ry="22" fill="var(--c-bot)" />
        {puffs.slice(0, 4).map(([x, y, r], i) => (
          <circle
            key={i}
            cx={x - 6}
            cy={y - 12}
            r={r * 0.55}
            fill="var(--c-hi)"
          />
        ))}
      </g>
    </svg>
  );
}

// ---- birds --------------------------------------------------------------

const WING = {
  up: "M2 6 Q10 -3 20 10 Q30 -3 38 6",
  mid: "M2 10 Q10 3 20 10 Q30 3 38 10",
  down: "M2 14 Q10 15 20 10 Q30 15 38 14",
};

function birdSvg(w: number, flap: number): string {
  return `<svg viewBox="0 -4 40 24" width="${w}" height="${w * 0.6}" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="${WING.mid}"><animate attributeName="d" dur="${flap}s" begin="-${rand(0, flap).toFixed(2)}s" repeatCount="indefinite" values="${WING.up};${WING.mid};${WING.down};${WING.mid};${WING.up}"/></path></svg>`;
}

const PLANE = `<svg viewBox="0 0 48 28" width="38" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12 L46 2 L30 26 L24 15 Z M24 15 L46 2"/></svg>`;

type Mood = "normal" | "loop" | "upside" | "plane";

function spawnFlock(
  host: HTMLElement,
  opts: {
    count: number;
    mood: Mood;
    dir: 1 | -1;
    y: number;
    size: number;
    dur: number;
  },
  onDone: () => void
) {
  const { count, mood, dir, y, size, dur } = opts;

  const wrap = document.createElement("div");
  wrap.className = "flock";
  wrap.style.top = `${y}%`;

  const OFFS: [number, number][] = [
    [0, 0], [-30, -14], [-30, 14], [-60, -28], [-60, 28],
  ];

  const parts: HTMLElement[] = [];

  for (let i = 0; i < count; i++) {
    const b = document.createElement("div");
    b.className = "bird";

    const [ox, oy] = OFFS[i];
    b.style.transform = `translate(${ox * dir * -1}px, ${oy}px)`;

    const inner = document.createElement("div");
    inner.innerHTML =
      mood === "plane"
        ? PLANE
        : birdSvg(size * (i ? rand(0.8, 0.95) : 1), rand(0.8, 1.1));

    if (dir === -1) inner.style.transform = "scaleX(-1)";

    const mover = document.createElement("div");
    mover.append(inner);
    b.append(mover);
    wrap.append(b);
    parts.push(mover);

    mover.animate(
      [
        { transform: "translateY(0)" },
        { transform: `translateY(${rand(-18, -6)}px)` },
        { transform: `translateY(${rand(6, 18)}px)` },
        { transform: "translateY(0)" },
      ],
      {
        duration: rand(3500, 5500),
        iterations: Infinity,
        easing: "ease-in-out",
        delay: -rand(0, 3000),
      }
    );
  }

  host.append(wrap);

  const vw = window.innerWidth;
  const from = dir === 1 ? -120 : vw + 120;
  const to = dir === 1 ? vw + 120 : -120;

  const fly = wrap.animate(
    [{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }],
    {
      duration: dur * 1000,
      easing: "linear",
      fill: "forwards",
    }
  );

  if (mood === "loop") {
    parts[0].animate(
      [{ rotate: "0deg" }, { rotate: `${-360 * dir}deg` }],
      { duration: 1800, delay: dur * 450, easing: "ease-in-out" }
    );
  }

  if (mood === "upside") {
    parts[0].animate(
      [
        { scale: "1 1" },
        { scale: "1 -1", offset: 0.15 },
        { scale: "1 -1", offset: 0.85 },
        { scale: "1 1" },
      ],
      { duration: 3600, delay: dur * 400 }
    );
  }

  if (mood === "plane") {
    parts[0].animate(
      [
        { rotate: "0deg" },
        { rotate: "-14deg", offset: 0.3 },
        { rotate: "12deg", offset: 0.7 },
        { rotate: "0deg" },
      ],
      { duration: dur * 1000, easing: "ease-in-out" }
    );
  }

  fly.onfinish = () => {
    wrap.remove();
    onDone();
  };

  return () => {
    fly.onfinish = null;
    wrap.remove();
  };
}

function meteor(host: HTMLElement) {
  const m = document.createElement("div");
  m.className = "meteor";

  const ang = rand(18, 32);
  m.style.cssText = `left:${rand(25, 95)}%;top:${rand(2, 35)}%;rotate:${ang}deg`;

  host.append(m);

  const a = m.animate(
    [
      { transform: "translateX(0)", opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { transform: "translateX(-340px)", opacity: 0 },
    ],
    { duration: rand(700, 1100), easing: "ease-in" }
  );

  a.onfinish = () => m.remove();
}

// ---- stars --------------------------------------------------------------

function useStars() {
  return useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        i,
        x: Math.random() * 100,
        y: Math.random() * 78,
        s: rand(1, 2.6),
        d: rand(1.8, 5),
        dl: rand(-5, 0),
      })),
    []
  );
}

// ---- main component -----------------------------------------------------

export default function Sky({
  clouds,
  birds,
  intensity,
  timeSky,
  easterEggs,
  hour,
}: SkyProps) {
  const root = useRef<HTMLDivElement>(null);
  const sun = useRef<HTMLDivElement>(null);
  const moon = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const birdHost = useRef<HTMLDivElement>(null);
  const fx = useRef<HTMLDivElement>(null);

  const night = useRef(0);
  const lapse = useRef(false);

  const reduce = useReducedMotion();
  const stars = useStars();

  const [vw, setVw] = useState(window.innerWidth);

  const count = clouds ? CLOUD_COUNT[intensity] ?? 6 : 0;
  const list = CLOUDS.slice(0, count);

  const displayedHour = () => {
    if (hour !== undefined && hour !== null) return hour;
    return timeSky ? currentHour() : 11.5;
  };

  // ---- time of day and time machine ------------------------------------

  useEffect(() => {
    const el = root.current!;
    let lapseId = 0;

    const paint = (h: number) => {
      const s = skyAt(h);

      for (const [k, v] of Object.entries(s.vars)) {
        el.style.setProperty(k, v);
      }

      night.current = s.night;

      document.documentElement.dataset.theme =
        s.night > 0.5 ? "night" : "day";

      if (sun.current) {
        sun.current.style.transform =
          `translate(${s.sun.x}vw, ${s.sun.y}vh)`;
        sun.current.style.opacity = String(s.sun.opacity);
      }

      if (moon.current) {
        moon.current.style.transform =
          `translate(${s.moon.x}vw, ${s.moon.y}vh)`;
        moon.current.style.opacity = String(s.moon.opacity);
      }
    };

    const now = displayedHour;

    const apply = () => {
      if (!lapse.current) paint(now());
    };

    apply();

    const raf = requestAnimationFrame(() => el.classList.add("ready"));
    const id = window.setInterval(apply, 10000);

    const vis = () => {
      if (!document.hidden) apply();
    };

    document.addEventListener("visibilitychange", vis);

    // Easter egg: one complete day in 20 seconds.
    const run = () => {
      if (lapse.current || reduce) return;

      lapse.current = true;
      el.classList.add("lapse");

      const start = performance.now();
      const h0 = now();

      lapseId = window.setInterval(() => {
        const t = (performance.now() - start) / 20000;

        if (t >= 1) {
          clearInterval(lapseId);
          lapse.current = false;
          el.classList.remove("lapse");
          paint(now());
          return;
        }

        paint((h0 + t * 24) % 24);
      }, 120);
    };

    window.addEventListener("archive:timelapse", run);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
      clearInterval(lapseId);

      lapse.current = false;
      el.classList.remove("lapse");

      window.removeEventListener("archive:timelapse", run);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [timeSky, reduce, hour]);

  // ---- responsive viewport --------------------------------------------

  useEffect(() => {
    let w = window.innerWidth;
    let t = 0;

    const f = () => {
      clearTimeout(t);

      t = window.setTimeout(() => {
        if (window.innerWidth !== w) {
          w = window.innerWidth;
          setVw(w);
        }
      }, 300);
    };

    window.addEventListener("resize", f);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", f);
    };
  }, []);

  // ---- clouds ----------------------------------------------------------

  useEffect(() => {
    const els = root.current!.querySelectorAll<HTMLElement>(".cloud");
    const anims: { a: Animation; base: number }[] = [];

    els.forEach((el) => {
      // Use the original CLOUDS index, not DOM order.
      const index = Number(el.dataset.cloudIndex);
      const spec = CLOUDS[index];

      if (!spec) return;

      const cw = Math.min(spec.w, vw * 0.8);
      const travel = vw + cw;

      el.style.setProperty("--cw", `${cw}px`);

      if (reduce) {
        el.style.transform =
          `translate3d(${spec.phase * travel}px,0,0)`;
        return;
      }

      const a = el.animate(
        [
          { transform: "translate3d(0,0,0)" },
          { transform: `translate3d(${travel}px,0,0)` },
        ],
        {
          duration: spec.dur * 1000 * (travel / 1600 + 0.35),
          iterations: Infinity,
          easing: "linear",
          direction: spec.rev ? "reverse" : "normal",
        }
      );

      a.currentTime =
        spec.phase * (a.effect!.getTiming().duration as number);

      const base = SPEED[intensity] * rand(0.8, 1.25);
      a.playbackRate = base;

      anims.push({ a, base });
    });

    if (reduce || !anims.length) return;

    let wind = 1;
    let target = 1;

    const gust = () => {
      target = pick([0.8, 0.9, 1, 1, 1.1, 1.25]);
    };

    const gustId = window.setInterval(gust, rand(20000, 36000));

    const easeId = window.setInterval(() => {
      const diff = target - wind;
      if (Math.abs(diff) < 0.005) return;
      wind += diff * 0.03;

      for (const { a, base } of anims) {
        const nextRate = base * wind;
        if (Math.abs(a.playbackRate - nextRate) > 0.02) {
          a.playbackRate = nextRate;
        }
      }
    }, 250);

    return () => {
      clearInterval(gustId);
      clearInterval(easeId);
      anims.forEach(({ a }) => a.cancel());
    };
  }, [count, intensity, reduce, vw]);

  // ---- birds -----------------------------------------------------------

  useEffect(() => {
    const host = birdHost.current!;

    if (!birds || reduce) return;

    let alive = true;
    let active = 0;
    let timer = 0;

    const cleanups = new Set<() => void>();
    const timeouts = new Set<number>();

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timeouts.delete(id);
        if (alive) fn();
      }, ms);

      timeouts.add(id);
      return id;
    };

    const fly = (
      o: Partial<Parameters<typeof spawnFlock>[1]> = {}
    ) => {
      if (!alive || active >= 3 + intensity) return;

      active++;

      const size = o.size ?? rand(20, 34);

      const cleanup = spawnFlock(
        host,
        {
          count: 1,
          mood: "normal",
          dir: Math.random() < 0.8 ? 1 : -1,
          y: rand(6, 55),
          size,
          dur: rand(28, 52) * (34 / size),
          ...o,
        },
        () => {
          active--;
        }
      );

      cleanups.add(cleanup);
    };

    const next = () => {
      if (!alive) return;

      if (!document.hidden && night.current < 0.7) {
        const r = Math.random();

        if (easterEggs && r < 0.1) {
          fly({ mood: "loop", count: 1, size: 30 });
        } else if (easterEggs && r < 0.17) {
          fly({ mood: "upside", count: 1, size: 30 });
        } else if (easterEggs && r < 0.22) {
          fly({ mood: "plane", count: 1, dur: 30 });
        } else {
          fly({ count: r < 0.55 ? pick([3, 4, 5]) : 1 });
        }
      }

      timer = later(
        next,
        rand(9000, 24000) / (0.6 + intensity * 0.4)
      );
    };

    timer = later(() => {
      fly({ count: 3, y: 18 });
      next();
    }, 1200);

    const burst = () => {
      for (let i = 0; i < 7; i++) {
        later(
          () =>
            fly({
              count: 2,
              y: rand(5, 70),
              dur: rand(9, 16),
              size: rand(18, 30),
            }),
          i * 220
        );
      }
    };

    window.addEventListener("archive:burst", burst);

    return () => {
      alive = false;
      clearTimeout(timer);

      timeouts.forEach(clearTimeout);
      timeouts.clear();

      window.removeEventListener("archive:burst", burst);

      cleanups.forEach((c) => c());
      host.replaceChildren();
    };
  }, [birds, intensity, easterEggs, reduce]);

  // ---- shooting stars --------------------------------------------------

  useEffect(() => {
    const host = fx.current!;

    if (reduce) return;

    let timer = 0;
    const timeouts = new Set<number>();

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timeouts.delete(id);
        fn();
      }, ms);

      timeouts.add(id);
      return id;
    };

    const loop = () => {
      if (!document.hidden && night.current > 0.8) {
        meteor(host);
      }

      timer = window.setTimeout(loop, rand(7000, 20000));
    };

    timer = window.setTimeout(loop, 4000);

    const shower = () => {
      for (let i = 0; i < 12; i++) {
        later(() => meteor(host), i * 260);
      }
    };

    const wish = () => meteor(host);

    window.addEventListener("archive:meteors", shower);
    window.addEventListener("archive:wish", wish);

    return () => {
      clearTimeout(timer);
      timeouts.forEach(clearTimeout);
      timeouts.clear();

      window.removeEventListener("archive:meteors", shower);
      window.removeEventListener("archive:wish", wish);
    };
  }, [reduce]);

  // ---- scroll parallax -------------------------------------------------

  useEffect(() => {
    if (reduce) return;

    let raf = 0;

    const f = () => {
      cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() =>
        layers.current.forEach((l, i) => {
          if (l) {
            l.style.transform =
              `translate3d(0,${-window.scrollY * [0.015, 0.04, 0.09][i]}px,0)`;
          }
        })
      );
    };

    window.addEventListener("scroll", f, { passive: true });

    return () => {
      window.removeEventListener("scroll", f);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  // ---- sun and moon greetings -----------------------------------------

  const hello = (moonClick: boolean) => {
    if (!easterEggs) return;

    const orb = moonClick ? moon.current : sun.current;

    if (!orb || parseFloat(getComputedStyle(orb).opacity) < 0.5) {
      return;
    }

    const h = displayedHour();

    toast(
      moonClick
        ? "The moon is out. Tomorrow's projects can wait."
        : `${h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"}. Your clock told me the time. I never asked where you are.`
    );
  };

  // ---- rainbow easter egg ---------------------------------------------

  const rainbow = () => {
    if (!easterEggs) return;

    const host = fx.current!;

    const r = document.createElement("div");
    r.className = "rainbow";

    const cols = [
      "#ff6b6b",
      "#ffa94d",
      "#ffe066",
      "#69db7c",
      "#4dabf7",
      "#74c0fc",
    ];

    r.innerHTML = `<svg viewBox="0 0 400 210" preserveAspectRatio="xMidYMax meet" fill="none" stroke-linecap="round">${cols
      .map(
        (c, i) =>
          `<path d="M${20 + i * 11} 205 A${180 - i * 11} ${
            180 - i * 11
          } 0 0 1 ${380 - i * 11} 205" stroke="${c}" stroke-width="9" pathLength="1"/>`
      )
      .join("")}</svg>`;

    host.append(r);

    r.animate(
      [
        { opacity: 0 },
        { opacity: 0.9, offset: 0.2 },
        { opacity: 0.9, offset: 0.8 },
        { opacity: 0 },
      ],
      { duration: 7000 }
    ).onfinish = () => r.remove();

    toast("You found the rainbow cloud.");
  };

  // ---- render ----------------------------------------------------------

  return (
    <div className="sky" ref={root} aria-hidden="true">
      <svg
        className="sky-defs"
        width="0"
        height="0"
        focusable="false"
      >
        <defs>
          <linearGradient
            id="cloudFill"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="40"
            x2="0"
            y2="200"
          >
            <stop offset="0" style={{ stopColor: "var(--c-top)" }} />
            <stop offset=".55" style={{ stopColor: "var(--c-top)" }} />
            <stop offset="1" style={{ stopColor: "var(--c-bot)" }} />
          </linearGradient>

          <filter
            id="fluff"
            x="-15%"
            y="-30%"
            width="130%"
            height="170%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.022"
              numOctaves="3"
              seed="7"
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale="34"
              result="d"
            />
            <feGaussianBlur in="d" stdDeviation="2.2" />
          </filter>

          <filter
            id="soft"
            x="-20%"
            y="-40%"
            width="140%"
            height="180%"
          >
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
      </svg>

      <div className="sky-bg" />

      <div className="stars">
        {stars.map((s) => (
          <i
            key={s.i}
            className="star"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.s,
              height: s.s,
              animationDuration: `${s.d}s`,
              animationDelay: `${s.dl}s`,
            }}
          />
        ))}
      </div>

      <div className="orb sun" ref={sun}>
        <div className="halo" />

        <svg
          className="sun-art"
          viewBox="-60 -60 120 120"
          fill="none"
          strokeLinecap="round"
          onClick={() => hello(false)}
        >
          <g className="rays" stroke="var(--sun-core)" strokeWidth="3.2">
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                transform={`rotate(${i * 30})`}
                d={`M${i % 2 ? 40 : 38} ${i % 3 - 1} L${i % 2 ? 52 : 56} ${(i % 3) * 1.5 - 1.5}`}
              />
            ))}
          </g>

          <circle r="29" fill="var(--sun-core)" />

          <path
            d="M-29 -3 C-27 -22 -10 -31 5 -29 C22 -27 31 -12 29 4"
            stroke="rgba(255,255,255,.55)"
            strokeWidth="3"
          />
        </svg>
      </div>

      <div className="orb moon" ref={moon}>
        <div className="halo moon-halo" />

        <svg
          className="moon-art"
          viewBox="-40 -40 80 80"
          onClick={() => hello(true)}
        >
          <mask id="crescent">
            <rect
              x="-40"
              y="-40"
              width="80"
              height="80"
              fill="#fff"
            />
            <circle cx="14" cy="-6" r="26" fill="#000" />
          </mask>

          <circle r="26" fill="#f5f1de" mask="url(#crescent)" />
        </svg>
      </div>

      {[0, 1, 2].map((layer) => (
        <div
          key={layer}
          className={`layer l${layer}`}
          ref={(el) => {
            layers.current[layer] = el;
          }}
        >
          {list.map(
            (c, i) =>
              c.layer === layer && (
                <div
                  key={i}
                  data-cloud-index={i}
                  className={`cloud${c.special ? " special" : ""}`}
                  style={{
                    top: `${c.top}%`,
                  }}
                  onClick={c.special ? rainbow : undefined}
                >
                  <div className="cloud-bob">
                    <CloudSvg v={c.v} />
                  </div>
                </div>
              )
          )}
        </div>
      ))}

      <div className="birds" ref={birdHost} />
      <div className="fx" ref={fx} />
    </div>
  );
}
