/**
 * kong.sole · Core: styled output, themes, status logs and formatting
 */

/**
 * kong.sole: make your browser console look good.
 * Zero dependencies. ES module. Falls back to plain text outside browsers.
 */

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

export const FORMAT = {
    bold: "font-weight: bold",
    italic: "font-style: italic",
    underline: "text-decoration: underline",
    uppercase: "text-transform: uppercase",
    strikethrough: "text-decoration: line-through",
    fontDefault: "font-family: system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontHeading: "font-family: Georgia, serif",
    fontMono: "font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    size: "font-size: 14px",
    sizeM: "font-size: 16px",
    sizeL: "font-size: 24px",
    sizeXL: "font-size: 32px",
    borderRadius: "border-radius: 3px",
    padding: "padding: 4px 8px",
};

// Colors chosen to stay readable on both light and dark DevTools themes.
export const COLOR = {
    info: "#3b82f6",
    infoDark: "#1e3a8a",
    infoLight: "#bfdbfe",
    warning: "#facc15",
    error: "#ef4444",
    success: "#22c55e",
    successDark: "#14532d",
    successLight: "#bbf7d0",
    white: "#fff",
    black: "#222",
    brown: "#f5deb3",
    brownDark: "#8b4513",
    purple: "#7e22ce",
    grey: "#6b7280",
    brand1: "#E21143",
    brand2: "#FFB03A",
};

export const GLOBAL = {
    format: `${FORMAT.fontDefault}; ${FORMAT.size}`,
    badge: `${FORMAT.borderRadius}; ${FORMAT.fontDefault}; ${FORMAT.padding}; ${FORMAT.sizeM}`,
    mono: `${FORMAT.fontMono}; ${FORMAT.size}`,
};

/* ------------------------------------------------------------------ */
/* Core: styled output                                                 */
/* ------------------------------------------------------------------ */

export const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

export const state = { enabled: true, groups: [] };
export const history = []; // tagged lines, warnings and errors, so kong.clear(tag) can replay what must stay

/* ------------------------------------------------------------------ */
/* Theme: every color that touches text or a panel depends on it       */
/* ------------------------------------------------------------------ */

const THEMES = {
    dark: {
        card: "#14141b", fg: "#ffffff", fg2: "#f2f3f7", muted: "#9aa0ac", edge: "#ffffff",
        ok: "#22c55e", warn: "#facc15", err: "#ef4444", info: "#60a5fa", brand2: "#FFB03A",
        type: { string: "#4ade80", integer: "#fbbf24", float: "#fbbf24", bigint: "#fbbf24", nan: "#fb7185", infinity: "#fb7185", boolean: "#f472b6", null: "#9ca3af", undefined: "#9ca3af", symbol: "#c084fc", function: "#c084fc", class: "#c084fc", asyncfunction: "#c084fc", generatorfunction: "#c084fc", array: "#60a5fa", object: "#60a5fa", date: "#2dd4bf", regexp: "#2dd4bf", map: "#38bdf8", set: "#38bdf8", error: "#fb7185", promise: "#c084fc" },
        json: { key: "#60a5fa", string: "#4ade80", number: "#fbbf24", boolean: "#f472b6", null: "#9ca3af" },
    },
    light: {
        card: "#ffffff", fg: "#14161d", fg2: "#1d2029", muted: "#5b6172", edge: "#000000",
        ok: "#15803d", warn: "#a16207", err: "#b91c1c", info: "#1d4ed8", brand2: "#D9480F",
        type: { string: "#15803d", integer: "#b45309", float: "#b45309", bigint: "#b45309", nan: "#be123c", infinity: "#be123c", boolean: "#be185d", null: "#6b7280", undefined: "#6b7280", symbol: "#7e22ce", function: "#7e22ce", class: "#7e22ce", asyncfunction: "#7e22ce", generatorfunction: "#7e22ce", array: "#1d4ed8", object: "#1d4ed8", date: "#0f766e", regexp: "#0f766e", map: "#0369a1", set: "#0369a1", error: "#be123c", promise: "#7e22ce" },
        json: { key: "#1d4ed8", string: "#15803d", number: "#b45309", boolean: "#be185d", null: "#6b7280" },
    },
};

let themeSetting = "auto";
const scheme = typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
const mode = () => (themeSetting !== "auto" ? themeSetting : scheme && !scheme.matches ? "light" : "dark");
export const T = () => THEMES[mode()];
export const faint = () => `color:${T().muted};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px`;

/**
 * Print several styled segments in a single console call.
 * @param {"log"|"info"|"warn"|"error"} method
 * @param {Array<[string, string]>} parts  [text, css] pairs
 * @param {Array} rest  extra values (objects, arrays…) logged untouched
 */
export function print(method, parts, rest) {
    if (!isBrowser) {
        console[method](parts.map(([text]) => text).join(""), ...rest);
        return;
    }
    const format = parts.map(() => "%c%s").join("");
    const args = parts.flatMap(([text, css]) => [css, text]);
    console[method](format, ...args, ...rest);
}

export function emit(method, parts, rest = [], tag) {
    if (!state.enabled) return;
    if (tag || method === "warn" || method === "error") {
        history.push({ tag, method, parts, rest });
        if (history.length > 300) history.shift();
    }
    print(method, parts, rest);
}

/** Split arguments into printable text and raw values (objects stay inspectable). */
export function split(args) {
    if (args.length === 1 && typeof args[0] === "string") return [args[0], []];
    const text = [];
    const rest = [];
    args.forEach((a) => (typeof a === "object" && a !== null) || typeof a === "function" ? rest.push(a) : text.push(String(a)));
    return [text.join(" "), rest];
}

/* ------------------------------------------------------------------ */
/* Built-in styles                                                     */
/* ------------------------------------------------------------------ */

const STYLES = {
    // Format
    bold: [FORMAT.bold, GLOBAL.format],
    italic: [FORMAT.italic, GLOBAL.format],
    underline: [FORMAT.underline, GLOBAL.format],
    uppercase: [FORMAT.uppercase, GLOBAL.format],
    strikethrough: [FORMAT.strikethrough, GLOBAL.format],
    red: [`color: ${COLOR.error}`, GLOBAL.format],
    blue: [`color: ${COLOR.info}`, GLOBAL.format],
    green: [`color: ${COLOR.success}`, GLOBAL.format],
    // Status
    success: [`background-color: ${COLOR.successLight}`, `color: ${COLOR.successDark}`, GLOBAL.badge],
    info: [`background-color: ${COLOR.infoLight}`, `color: ${COLOR.infoDark}`, GLOBAL.badge],
    warning: [`background-color: ${COLOR.warning}`, `color: ${COLOR.black}`, GLOBAL.badge],
    error: [`background-color: ${COLOR.error}`, `color: ${COLOR.white}`, GLOBAL.badge],
    // Headings
    h1: [FORMAT.sizeXL, FORMAT.bold, FORMAT.fontHeading],
    h2: [FORMAT.sizeL, FORMAT.bold, FORMAT.fontHeading],
    h3: [FORMAT.sizeM, FORMAT.bold, FORMAT.fontHeading],
    // Nerd
    poo: [`background-color: ${COLOR.brown}`, `color: ${COLOR.brownDark}`, GLOBAL.badge],
    gandalf: [`background-color: ${COLOR.infoLight}`, `color: ${COLOR.infoDark}`, GLOBAL.badge],
    wonderwoman: [`background-color: ${COLOR.purple}`, `color: ${COLOR.white}`, GLOBAL.badge],
};

const ICON = {
    success: "✓ ",
    info: "ℹ ",
    warning: "▲ ",
    error: "✕ ",
    poo: "💩 ",
    gandalf: "🧙 ",
    wonderwoman: "🦸‍♀️ ",
};

// Status logs use the native severity so DevTools filters and stack traces work.
const METHOD = { info: "info", warning: "warn", error: "error" };

export const kong = {};

const THEMED_TEXT = { red: "err", blue: "info", green: "ok" };

Object.keys(STYLES).forEach((key) => {
    if (THEMED_TEXT[key]) {
        kong[key] = (...args) => {
            if (!state.enabled) return;
            const [text, rest] = split(args);
            emit("log", [[text, `color:${T()[THEMED_TEXT[key]]};${GLOBAL.format}`]], rest);
        };
        return;
    }
    const css = STYLES[key].join(";"); // built once, not on every call
    const prefix = ICON[key] || "";
    const method = METHOD[key] || "log";
    kong[key] = (...args) => {
        if (!state.enabled) return;
        if (key === "error") closeGroupsOnError();
        const [text, rest] = split(args);
        emit(method, [[prefix + text, css]], rest);
    };
});

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

/** "auto" follows prefers-color-scheme; "dark" or "light" forces it. Reading returns the mode in use. */
Object.defineProperty(kong, "theme", {
    get: () => mode(),
    set: (v) => {
        themeSetting = v === "light" || v === "dark" ? v : "auto";
    },
    enumerable: true,
});

Object.defineProperty(kong, "enabled", {
    get: () => state.enabled,
    set: (v) => {
        state.enabled = Boolean(v);
    },
    enumerable: true,
});

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */

const rgbCache = new Map();

function hexToRgb(hex) {
    let rgb = rgbCache.get(hex);
    if (!rgb) {
        let h = hex.replace("#", "");
        if (h.length === 3) h = [...h].map((c) => c + c).join("");
        const n = parseInt(h, 16);
        rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        rgbCache.set(hex, rgb);
    }
    return rgb;
}

export function mix(from, to, t) {
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

/** Closes the groups that asked to end on an error (used by kong.error). */
function closeGroupsOnError() {
    for (let i = state.groups.length - 1; i >= 0; i--) {
        const g = state.groups[i];
        if (!g.closeOnError) break;
        if (!g.closed) {
            g.closed = true;
            console.groupEnd();
        }
    }
}
export const escapeXml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const MONO_SVG = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
export const boldMono = `${GLOBAL.mono};${FORMAT.bold}`;
export const brandBold = `${GLOBAL.format};${FORMAT.bold};color:${COLOR.brand1}`;

/** Wraps output helpers so that kong.enabled = false skips all of their work. */
export const gate = (names) =>
    names.forEach((name) => {
        const fn = kong[name];
        kong[name] = (...args) => (state.enabled ? fn(...args) : undefined);
    });

kong.warn = kong.warning;

export default kong;
