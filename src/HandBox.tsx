import { useLayoutEffect, useMemo, useRef, useState } from "react";

function rng(seed: string) {
  let h = 1779033703 ^ seed.length;

  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  let a = h >>> 0;

  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;

    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a deterministic, hand-drawn rectangle.
 * Each seed produces its own unique drawing.
 */
export function roughPath(
  seed: string,
  w: number,
  h: number,
  amp = 1.5
): string {
  if (w <= 0 || h <= 0) return "";

  const r = rng(seed);
  const j = (a: number) => (r() - 0.5) * 2 * a;

  const A = Math.min(
    amp * (0.7 + r() * 1.7),
    Math.min(w, h) / 18
  );

  const m = 2;
  const L = m;
  const R = w - m;
  const T = m;
  const B = h - m;

  const rad = () => Math.min(3 + r() * 11, w / 5, h / 5);

  const cTL = rad();
  const cTR = rad();
  const cBR = rad();
  const cBL = rad();

  const pts: [number, number][] = [];

  const add = (x: number, y: number, a = A) => {
    pts.push([x + j(a), y + j(a)]);
  };

  const edge = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const n = Math.max(
      1,
      Math.floor(Math.hypot(x2 - x1, y2 - y1) / 70)
    );

    const bow = j(A * 1.8);

    const nx = y2 - y1;
    const ny = x1 - x2;
    const len = Math.hypot(nx, ny) || 1;

    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1);
      const k = Math.sin(Math.PI * t) * bow;

      add(
        x1 + (x2 - x1) * t + (nx / len) * k,
        y1 + (y2 - y1) * t + (ny / len) * k,
        A * 0.7
      );
    }
  };

  // Top-left corner
  add(L, T + cTL * 1.6, A * 0.6);
  add(L + cTL * 0.3, T + cTL * 0.3, A * 0.5);
  add(L + cTL * 1.6, T, A * 0.6);

  // Top edge
  edge(L + cTL * 1.6, T, R - cTR * 1.6, T);

  // Top-right corner
  add(R - cTR * 1.6, T, A * 0.6);
  add(R - cTR * 0.3, T + cTR * 0.3, A * 0.5);
  add(R, T + cTR * 1.6, A * 0.6);

  // Right edge
  edge(R, T + cTR * 1.6, R, B - cBR * 1.6);

  // Bottom-right corner
  add(R, B - cBR * 1.6, A * 0.6);
  add(R - cBR * 0.3, B - cBR * 0.3, A * 0.5);
  add(R - cBR * 1.6, B, A * 0.6);

  // Bottom edge
  edge(R - cBR * 1.6, B, L + cBL * 1.6, B);

  // Bottom-left corner
  add(L + cBL * 1.6, B, A * 0.6);
  add(L + cBL * 0.3, B - cBL * 0.3, A * 0.5);
  add(L, B - cBL * 1.6, A * 0.6);

  // Left edge
  edge(L, B - cBL * 1.6, L, T + cTL * 1.6);

  // Random starting point
  const start = Math.floor(r() * pts.length);

  const ring = [
    ...pts.slice(start),
    ...pts.slice(0, start),
  ];

  // Slightly overshoot the starting point
  ring.push(
    ...ring.slice(0, 2).map(
      ([x, y]) => [x + j(2.5), y + j(2.5)] as [number, number]
    )
  );

  let d = `M${ring[0][0].toFixed(1)} ${ring[0][1].toFixed(1)}`;

  for (let i = 0; i < ring.length - 1; i++) {
    const p0 = ring[i - 1] ?? ring[i];
    const p1 = ring[i];
    const p2 = ring[i + 1];
    const p3 = ring[i + 2] ?? p2;

    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }

  return d;
}

interface Props {
  seed: string;
  fill?: boolean;
  echo?: boolean;
  sketch?: boolean;
  amp?: number;
  className?: string;
}

/**
 * Absolutely positioned hand-drawn outline.
 * Parent must have position: relative.
 */
export default function HandBox({
  seed,
  echo = false,
  sketch = false,
  amp = 1.5,
  className = "",
}: Props) {
  const ref = useRef<SVGSVGElement>(null);

  const [size, setSize] = useState<[number, number]>([0, 0]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;

      setSize((prev) =>
        Math.abs(prev[0] - w) > 1 || Math.abs(prev[1] - h) > 1
          ? [w, h]
          : prev
      );
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const [w, h] = size;

  const d = useMemo(
    () => (w && h ? roughPath(seed, w, h, amp) : ""),
    [seed, w, h, amp]
  );

  const d2 = useMemo(
    () => (echo && w && h ? roughPath(seed + "~echo", w, h, amp * 1.4) : ""),
    [echo, seed, w, h, amp]
  );

  const d3 = useMemo(
    () => (sketch && w && h ? roughPath(seed + "~sketch", w, h, amp * 0.9) : ""),
    [sketch, seed, w, h, amp]
  );

  return (
    <svg
      ref={ref}
      className={`hb ${className}`}
      viewBox={`0 0 ${w || 1} ${h || 1}`}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      {d && <path className="hb-fill" d={d + "Z"} />}

      {d3 && <path className="hb-sketch" d={d3} />}

      {d && <path className="hb-line" d={d} />}

      {d2 && (
        <path
          className="hb-echo"
          d={d2}
          pathLength={1}
        />
      )}
    </svg>
  );
}
