
// Illustrated time-of-day simulation.
// Uses ONLY the visitor's local clock.
// No location, weather or network.

type RGB = [number, number, number];

const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const css = (c: RGB) =>
  `rgb(${c.map(Math.round).join(",")})`;

const clamp = (v: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, v));

const smooth = (t: number) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};

// top, mid, bottom of sky,
// cloud top/bottom/highlight,
// bird ink

const NIGHT = [
  "#0b1736",
  "#142a5c",
  "#27457d",
  "#6a7ca8",
  "#2d3b66",
  "#8b9bc4",
  "#aebfe6",
];

const KEYS: [number, string[]][] = [
  [0, NIGHT],

  [
    4.5,
    [
      "#162858",
      "#44609a",
      "#c98a78",
      "#d5c2c8",
      "#6f6a8f",
      "#f0d9d6",
      "#2a2f4f",
    ],
  ],

  [
    5.75,
    [
      "#78b0e3",
      "#f5c7a0",
      "#ffb36b",
      "#fff0e0",
      "#f0a58a",
      "#fffaf2",
      "#3a3a52",
    ],
  ],

  [
    7.5,
    [
      "#86c5f0",
      "#bfe4f8",
      "#fbeed4",
      "#ffffff",
      "#cfe3f3",
      "#ffffff",
      "#25405e",
    ],
  ],

  [
    10.5,
    [
      "#8fd1f8",
      "#bde6fb",
      "#e6f6ff",
      "#ffffff",
      "#cde3f4",
      "#ffffff",
      "#1f3b5c",
    ],
  ],

  [
    12.5,
    [
      "#78c1f4",
      "#a6dcfa",
      "#dcf2ff",
      "#ffffff",
      "#c6dff2",
      "#ffffff",
      "#1d3a5c",
    ],
  ],

  [
    15.5,
    [
      "#83c5f2",
      "#b3e0f8",
      "#e9f5fc",
      "#ffffff",
      "#cbe1f1",
      "#ffffff",
      "#1f3b5c",
    ],
  ],

  [
    17.5,
    [
      "#77add9",
      "#f3d2a4",
      "#ffc684",
      "#fff0dc",
      "#eaa686",
      "#fffaf0",
      "#2f3a54",
    ],
  ],

  [
    18.75,
    [
      "#5a82c2",
      "#f4a46c",
      "#ffcc78",
      "#ffd6aa",
      "#de7a5c",
      "#ffe9c8",
      "#3b2f3f",
    ],
  ],

  [
    19.75,
    [
      "#2b3f7d",
      "#55689f",
      "#b5694f",
      "#e3a98f",
      "#5d5f8f",
      "#f3c7ac",
      "#20263f",
    ],
  ],

  [21, NIGHT],
  [24, NIGHT],
];

export function nightness(h: number): number {
  if (h >= 20.5 || h < 4.5) return 1;

  if (h >= 18.75) {
    return (h - 18.75) / 1.75;
  }

  if (h < 6) {
    return 1 - (h - 4.5) / 1.5;
  }

  return 0;
}

export interface SkyState {
  vars: Record<string, string>;

  sun: {
    x: number;
    y: number;
    opacity: number;
  };

  moon: {
    x: number;
    y: number;
    opacity: number;
  };

  night: number;
}

export function skyAt(h: number): SkyState {
  let i = 0;

  while (i < KEYS.length - 2 && h >= KEYS[i + 1][0]) {
    i++;
  }

  const [h0, a] = KEYS[i];
  const [h1, b] = KEYS[i + 1];

  const t = smooth((h - h0) / (h1 - h0));

  const c = a.map((v, k) =>
    mix(hex(v), hex(b[k]), t)
  );

  const night = nightness(h);

  // Sun: rises on the LEFT (east) at ~5am,
  // reaches the TOP around noon,
  // sets on the RIGHT (west) at ~7pm.

  const st = (h - 5) / 14;
  const elev = Math.sin(Math.PI * clamp(st, 0, 1));

  const sunOpacity = clamp(
    Math.min(
      (st + 0.04) / 0.05,
      (1.04 - st) / 0.05
    )
  );

  const warm = mix(
    hex("#ff8a3d"),
    hex("#fff2b0"),
    smooth(elev * 1.7)
  );

  // Moon: rises on the LEFT,
  // crosses the sky overnight,
  // sets on the RIGHT.

  const mt = ((h - 19 + 24) % 24) / 10;
  const moonUp = mt <= 1;

  return {
    vars: {
      "--sky-top": css(c[0]),
      "--sky-mid": css(c[1]),
      "--sky-bot": css(c[2]),

      "--c-top": css(c[3]),
      "--c-bot": css(c[4]),
      "--c-hi": css(c[5]),

      "--bird-ink": css(c[6]),

      "--sun-core": css(warm),

      "--sun-glow": `rgba(${warm
        .map(Math.round)
        .join(",")},${(0.55 - 0.2 * elev).toFixed(2)})`,

      "--stars": String(
        clamp((night - 0.2) / 0.8).toFixed(2)
      ),
    },

    sun: {
      x: 50 - 46 * Math.cos(Math.PI * clamp(st)),
      y: 88 - 83 * elev,
      opacity: sunOpacity,
    },

    moon: {
      x: 50 - 42 * Math.cos(Math.PI * clamp(mt, 0, 1)),
      y: 86 - 82 * Math.sin(Math.PI * clamp(mt, 0, 1)),
      opacity: moonUp ? clamp(night * 1.4) : 0,
    },

    night,
  };
}

/**
 * Local clock hour (0-24).
 *
 * ?hour=19.5 previews another time of day.
 * Nothing else is ever read.
 */

export function currentHour(): number {
  const q = new URLSearchParams(location.search).get("hour");

  if (q !== null && q !== "" && !Number.isNaN(Number(q))) {
    return clamp(Number(q), 0, 23.99);
  }

  const d = new Date();

  return (
    d.getHours() +
    d.getMinutes() / 60 +
    d.getSeconds() / 3600
  );
}
