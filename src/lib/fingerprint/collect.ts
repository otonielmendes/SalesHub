/**
 * Device fingerprint collector
 *
 * Extracted and adapted from Koin's track.html (reverse-engineered).
 * Collects the exact same signals sent to /risk/fingerprint/v1/sessions.
 * No external dependencies — pure browser APIs only.
 */

import type { DeviceSignals, SessionSignals, CpuSpeedResult } from "@/types/demos";

// ─── SHA-256 (verbatim from track.html) ───────────────────────────────────────

/* eslint-disable @typescript-eslint/no-unused-expressions */
const sha256 = (function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let e: any, n = 1;
  const t: number[] = [], i: number[] = [];
  for (; ++n < 18; ) for (e = n * n; e < 312; e += n) t[e] = 1;
  function o(e: number, n: number) { return (Math.pow(e, 1 / n) % 1) * 4294967296 | 0; }
  for (n = 1, e = 0; n < 313; ) t[++n] || (i[e] = o(n, 2), (t as number[])[e++] = o(n, 3));
  function r(e: number, n: number) { return (e >>> n) | (e << (32 - n)); }
  return function (input: string): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let a: any, s: any, d: any;
    const c = i.slice((n = 0));
    const l = unescape(encodeURI(input));
    const u: number[] = [];
    const w = l.length;
    const f: number[] = [];
    for (; n < w; ) f[n >> 2] |= (255 & l.charCodeAt(n)) << (8 * (3 - (n++ % 4)));
    f[(w * 8) >> 5] |= 128 << (24 - ((w * 8) % 32));
    f[(d = ((w * 8) + 64) >> 5 | 15)] = w * 8;
    for (n = 0; n < d; n += 16) {
      const _a = c.slice((e = 0), 8);
      for (; e < 64; _a[4] += s)
        u[e] = e < 16
          ? f[e + n]
          : (r((s = u[e - 2]), 17) ^ r(s, 19) ^ (s >>> 10)) +
            (0 | u[e - 7]) +
            (r((s = u[e - 15]), 7) ^ r(s, 18) ^ (s >>> 3)) +
            (0 | u[e - 16]),
          _a.unshift(
            (s =
              (_a.pop()! +
                (r((a = _a[4]), 6) ^ r(a, 11) ^ r(a, 25)) +
                (((a & _a[5]) ^ (~a & _a[6])) + (t as number[])[e]) |
              0) +
              (0 | u[e++])) +
              (r((w as unknown as number), 2) ^
                r((w as unknown as number), 13) ^
                r((w as unknown as number), 22)) +
              ((w as unknown as number) & _a[1] ^
                _a[1] & _a[2] ^
                _a[2] & (w as unknown as number))
          );
      for (e = 8; e--; ) c[e] = _a[e] + c[e];
    }
    let result = "";
    for (e = 0; e < 63; )
      result += ((c[++e >> 3] >> (4 * (7 - (e % 8)))) & 15).toString(16);
    return result;
  };
})();
/* eslint-enable @typescript-eslint/no-unused-expressions */

// ─── UUID helpers ─────────────────────────────────────────────────────────────

function scode(): string {
  return ((65536 * (1 + Math.random())) | 0).toString(16).substring(1);
}

export function generateUUID(): string {
  return scode() + scode() + scode() + scode() + scode() + scode() + scode() + scode();
}

// ─── Cookie / Storage helpers ─────────────────────────────────────────────────

function fpCookie(): boolean {
  try {
    let enabled = !!(window.navigator && window.navigator.cookieEnabled);
    if (typeof navigator.cookieEnabled === "undefined" && !enabled) {
      document.cookie = "__fp_test_Cookie";
      enabled = document.cookie.indexOf("__fp_test_Cookie") !== -1;
    }
    return enabled;
  } catch {
    return false;
  }
}

function getLocalStorage(): boolean {
  try {
    return window.localStorage !== undefined;
  } catch {
    return false;
  }
}

function hasSessionStorage(): boolean {
  try {
    return !!window.sessionStorage;
  } catch {
    return true;
  }
}

function hasIndexedDB(): boolean {
  return !!window.indexedDB;
}

function doNotTrack(): boolean {
  return !!navigator.doNotTrack;
}

function readCookie(name: string): string | null {
  const prefix = name + "=";
  const parts = document.cookie.split(";");
  for (const part of parts) {
    if (part.indexOf(prefix) > -1) return part.split("=")[1];
  }
  if (getLocalStorage() && window.localStorage.getItem(name)) {
    return window.localStorage.getItem(name);
  }
  return null;
}

// ─── Canvas fingerprint ───────────────────────────────────────────────────────

function fpCanvas(): string | null {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`~1!2@3#4$5%6^7&8*9(0)-_=+[{]}|;:',<.>/?";
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.height = 200;
    canvas.width = 500;
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText(chars, 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText(chars, 4, 17);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgb(255,0,255)";
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgb(0,255,255)";
    ctx.beginPath();
    ctx.arc(100, 50, 50, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgb(255,255,0)";
    ctx.beginPath();
    ctx.arc(75, 100, 50, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgb(255,0,255)";
    ctx.arc(75, 75, 75, 0, 2 * Math.PI, true);
    ctx.arc(75, 75, 25, 0, 2 * Math.PI, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx as any).mozFillRule = "evenodd";
    ctx.fill("evenodd");
    return sha256(canvas.toDataURL().replace("data:image/png;base64,", ""));
  } catch {
    return null;
  }
}

// ─── OS detection ─────────────────────────────────────────────────────────────

function getWindowsOS(appVersion: string): string {
  if (appVersion.indexOf("Windows NT 10.") !== -1) return "Windows 10";
  if (appVersion.indexOf("Windows NT 6.3") !== -1) return "Windows 8.1";
  if (appVersion.indexOf("Windows NT 6.2") !== -1) return "Windows 8";
  if (appVersion.indexOf("Windows NT 6.1") !== -1) return "Windows 7";
  if (appVersion.indexOf("Windows NT 6.0") !== -1) return "Windows Vista";
  if (appVersion.indexOf("Windows NT 5.1") !== -1) return "Windows XP";
  return "Windows OS, Version unknown";
}

function getOsVersion(nav: Navigator): string {
  if (nav.appVersion.indexOf("Windows") !== -1) return getWindowsOS(nav.appVersion);
  return nav.platform;
}

// ─── Browser plugins ──────────────────────────────────────────────────────────

function getPlugins(): string {
  const result: string[] = [];
  const plugins = navigator.plugins;
  for (let i = 0; i < plugins.length; i++) {
    const p = plugins[i];
    const mimeTypes = [];
    for (let j = 0; j < p.length; j++) {
      mimeTypes.push(p[j].type + "~" + p[j].suffixes);
    }
    result.push(p.name + "::" + p.description + "::" + mimeTypes.join(","));
  }
  return [...new Set(result)].join(",");
}

// ─── CPU speed benchmark ──────────────────────────────────────────────────────

function getCpuSpeed(): CpuSpeedResult {
  function bench(): number {
    const start = performance.now();
    const n = 1e7;
    for (let i = n; i > 0; i--);
    return (1.156e-8 * n) / (performance.now() - start) * 1e3;
  }
  try {
    const samples: number[] = [];
    const t0 = Date.now();
    for (let r = 0; r < 40; r++) samples[r] = bench();
    const elapsed = Date.now() - t0;

    // IQR outlier filtering
    const sorted = [...samples].sort((a, b) => a - b);
    const q1 = sorted[Math.round(0.25 * sorted.length)];
    const q3 = sorted[Math.round(0.75 * sorted.length)];
    const iqr = q3 - q1;
    const filtered = sorted.filter((v) => v >= q1 - 0.1 * iqr && v <= q3 + 0.1 * iqr);
    const average = filtered.reduce((a, b) => a + b) / filtered.length;

    return { average, time: elapsed, version: 3 };
  } catch {
    return { average: null, time: null, version: 3 };
  }
}

// ─── Browser detection (for incognito check) ──────────────────────────────────

function identifyBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) return "Opera";
  if (ua.indexOf("Edg") !== -1) return "Edge";
  if (ua.indexOf("Chrome") !== -1) return "Chrome";
  if (ua.indexOf("Safari") !== -1) return "Safari";
  if (ua.indexOf("Firefox") !== -1) return "Firefox";
  if (ua.indexOf("MSIE") !== -1 || !!(document as unknown as { documentMode: unknown }).documentMode) return "IE";
  return "Unknown";
}

function getQuotaLimit(): number {
  return (window as unknown as { performance?: { memory?: { jsHeapSizeLimit?: number } } })
    ?.performance?.memory?.jsHeapSizeLimit ?? 1073741824;
}

async function checkIncognito(): Promise<boolean | null> {
  const browser = identifyBrowser();
  try {
    switch (browser) {
      case "Chrome":
      case "Opera":
      case "Edge": {
        if (typeof Promise !== "undefined" && Promise.allSettled !== undefined) {
          const est = await navigator?.storage?.estimate();
          return (est?.quota ?? Infinity) < getQuotaLimit();
        }
        return null;
      }
      case "Firefox":
        return navigator.serviceWorker === undefined;
      case "Safari":
        return null;
      case "IE":
        return window.indexedDB === undefined;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ─── Accept content & Java ────────────────────────────────────────────────────

function getAcceptContent(): string {
  if (navigator.mimeTypes && navigator.mimeTypes.length > 0) {
    return Array.from(navigator.mimeTypes).some((m) => m.type === "text/html")
      ? "text/html"
      : "*/*";
  }
  return "*/*";
}

function isJavaEnabled(): boolean {
  return !!(navigator.javaEnabled && navigator.javaEnabled());
}

function getTimezoneName(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

// ─── Device ID (persisted cookie) ─────────────────────────────────────────────

const DEVICE_ID_COOKIE = "__ksh_deviceId";
const SESSION_ID_COOKIE = "__ksh_sessionId";

function getOrCreateDeviceId(): string {
  let id = readCookie(DEVICE_ID_COOKIE);
  if (!id) {
    id = generateUUID();
    // 1 year persistence (8760h)
    document.cookie = `${DEVICE_ID_COOKIE}=${id}; max-age=31536000; path=/; SameSite=Strict`;
    try { window.localStorage.setItem(DEVICE_ID_COOKIE, id); } catch { /* ignore */ }
  }
  return id;
}

function getOrCreateSessionId(): string {
  let id = readCookie(SESSION_ID_COOKIE);
  if (!id) {
    id = generateUUID();
    // 24h persistence
    document.cookie = `${SESSION_ID_COOKIE}=${id}; max-age=86400; path=/; SameSite=Strict`;
  }
  return id;
}

// ─── Main collector ───────────────────────────────────────────────────────────

export async function collectSignals(): Promise<DeviceSignals> {
  const [isIncognito, canvasId] = await Promise.all([
    checkIncognito(),
    Promise.resolve(fpCanvas()),
  ]);

  const cpuSpeed = getCpuSpeed();

  const gl = document.createElement("canvas").getContext("webgl");
  const dbgInfo = gl ? gl.getExtension("WEBGL_debug_renderer_info") : null;

  const nav = window.navigator;
  const scr = window.screen;

  const session: SessionSignals = {
    userAgent: nav.userAgent,
    os: nav.platform,
    osVersion: getOsVersion(nav),
    platform: nav.platform,
    lang: nav.language,
    timezone: (new Date().getTimezoneOffset() / 60) * -1,
    timezoneName: getTimezoneName(),
    browsingUrl:
      (window.location as unknown as { ancestorOrigins?: { 0?: string } })
        .ancestorOrigins?.[0] ?? document.referrer,
    screen: {
      width: scr.width,
      height: scr.height,
      availWidth: scr.availWidth,
      availHeight: scr.availHeight,
      availLeft: (scr as unknown as { availLeft?: number }).availLeft ?? null,
      availTop: (scr as unknown as { availTop?: number }).availTop ?? null,
      colorDepth: scr.colorDepth,
      orientation:
        (scr.orientation || ({} as ScreenOrientation)).type ??
        (scr as unknown as { mozOrientation?: string }).mozOrientation ??
        (scr as unknown as { msOrientation?: string }).msOrientation ??
        null,
    },
    cpuSpeed,
    plugins: getPlugins(),
    sessionStorage: hasSessionStorage(),
    localStorage: getLocalStorage(),
    indexedDB: hasIndexedDB(),
    cookiesEnabled: fpCookie(),
    doNotTrack: doNotTrack(),
    canvasId,
    gpuVendor: dbgInfo ? gl!.getParameter(dbgInfo.UNMASKED_VENDOR_WEBGL) : null,
    gpuName: dbgInfo ? gl!.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL) : null,
    cores: nav.hardwareConcurrency ?? null,
    deviceMemory: (nav as unknown as { deviceMemory?: number }).deviceMemory ?? null,
    devicePixelRatio: window.devicePixelRatio,
    privateBrowsing: isIncognito,
    acceptContent: getAcceptContent(),
    javaEnabled: isJavaEnabled(),
    javaScriptEnabled: true,
  };

  return {
    sessionId: getOrCreateSessionId(),
    deviceId: getOrCreateDeviceId(),
    capturedAt: new Date().toISOString(),
    session,
  };
}
