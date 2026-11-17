/**
 * kong.sole: make your browser console look good.
 * Zero dependencies. ES module. Falls back to plain text outside browsers.
 */

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const FORMAT = {
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
const COLOR = {
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

const GLOBAL = {
    format: `${FORMAT.fontDefault}; ${FORMAT.size}`,
    badge: `${FORMAT.borderRadius}; ${FORMAT.fontDefault}; ${FORMAT.padding}; ${FORMAT.sizeM}`,
    mono: `${FORMAT.fontMono}; ${FORMAT.size}`,
};

/* ------------------------------------------------------------------ */
/* Core: styled output                                                 */
/* ------------------------------------------------------------------ */

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

const state = { enabled: true, groups: [] };
const history = []; // tagged lines, warnings and errors, so kong.clear(tag) can replay what must stay

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
const T = () => THEMES[mode()];
const faint = () => `color:${T().muted};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px`;

/**
 * Print several styled segments in a single console call.
 * @param {"log"|"info"|"warn"|"error"} method
 * @param {Array<[string, string]>} parts  [text, css] pairs
 * @param {Array} rest  extra values (objects, arrays…) logged untouched
 */
function print(method, parts, rest) {
    if (!isBrowser) {
        console[method](parts.map(([text]) => text).join(""), ...rest);
        return;
    }
    const format = parts.map(() => "%c%s").join("");
    const args = parts.flatMap(([text, css]) => [css, text]);
    console[method](format, ...args, ...rest);
}

function emit(method, parts, rest = [], tag) {
    if (!state.enabled) return;
    if (tag || method === "warn" || method === "error") {
        history.push({ tag, method, parts, rest });
        if (history.length > 300) history.shift();
    }
    print(method, parts, rest);
}

/** Split arguments into printable text and raw values (objects stay inspectable). */
function split(args) {
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

const kong = {};

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

function mix(from, to, t) {
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

/* ------------------------------------------------------------------ */
/* Creative text                                                       */
/* ------------------------------------------------------------------ */

/** Custom one-off style. kong.custom("hi", { bg, color, icon, css }) */
kong.custom = (text, { bg = COLOR.grey, color = COLOR.white, icon = "", css = "" } = {}) =>
    emit("log", [[icon ? `${icon} ${text}` : text, `background:${bg};color:${color};${GLOBAL.badge};${css}`]]);

/** Gradient text, one color per letter. */
kong.gradient = (text, from = COLOR.brand1, to = T().brand2, { size = 24 } = {}) => {
    if (!state.enabled) return;
    const chars = [...text];
    const tail = `;font-size:${size}px;font-weight:bold;${FORMAT.fontDefault}`;
    const last = Math.max(chars.length - 1, 1);
    emit("log", chars.map((c, i) => [c, `color:${mix(from, to, i / last)}${tail}`]));
};

/** Rainbow text. */
kong.rainbow = (text, { size = 24 } = {}) => {
    if (!state.enabled) return;
    const chars = [...text];
    const tail = `,90%,60%);font-size:${size}px;font-weight:bold;${FORMAT.fontDefault}`;
    emit("log", chars.map((c, i) => [c, `color:hsl(${Math.round((i / chars.length) * 360)}${tail}`]));
};

/** Glowing text. */
kong.neon = (text, color = "#0ff", { size = 20 } = {}) =>
    emit("log", [[text, `color:#fff;background:#111;padding:6px 12px;font-size:${size}px;font-weight:bold;${FORMAT.fontDefault};text-shadow:0 0 4px ${color},0 0 10px ${color},0 0 20px ${color}`]]);

/** Text inside a box-drawing frame. */
kong.box = (text, { color = COLOR.brand1 } = {}) => {
    const lines = String(text).split("\n");
    const width = Math.max(...lines.map((l) => [...l].length));
    const pad = (l) => l + " ".repeat(width - [...l].length);
    const out = [`╔═${"═".repeat(width)}═╗`, ...lines.map((l) => `║ ${pad(l)} ║`), `╚═${"═".repeat(width)}═╝`].join("\n");
    emit("log", [[out, `color:${color};${GLOBAL.mono};line-height:1.2`]]);
};

/* ------------------------------------------------------------------ */
/* Images, base64 & SVG                                                */
/* ------------------------------------------------------------------ */

function paintBox(url, w, h) {
    // A 1px font + padding makes an inline box of exactly w×h that holds the background.
    return `font-size:1px;padding:${Math.round(h / 2)}px ${Math.round(w / 2)}px;background:url("${url}") no-repeat center/contain`;
}

const withNs = (markup) => (/xmlns=/.test(markup) ? markup : markup.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'));
const isSvgMarkup = (s) => typeof s === "string" && /^\s*<(svg|\?xml)/i.test(s);
const escapeXml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// First base64 characters of common image formats.
const MIME_SIGNATURES = [
    ["iVBOR", "image/png"],
    ["/9j/", "image/jpeg"],
    ["R0lGOD", "image/gif"],
    ["UklGR", "image/webp"],
    ["PHN2Zy", "image/svg+xml"],
    ["PD94bW", "image/svg+xml"],
    ["AAABAA", "image/x-icon"],
];
const sniffMime = (b64) => (MIME_SIGNATURES.find(([sig]) => b64.startsWith(sig)) || [])[1] || "image/png";

/** Anything image-like to a CSS-safe URL: SVG markup, data URI, URL or raw base64. */
function toUrl(src, mime) {
    const s = String(src).trim();
    if (isSvgMarkup(s)) return `data:image/svg+xml;utf8,${encodeURIComponent(withNs(s))}`;
    if (/^(data:|blob:|https?:|\/|\.\/|\.\.\/)/i.test(s)) return s;
    return `data:${mime || sniffMime(s)};base64,${s.replace(/\s+/g, "")}`;
}

const readBlob = (blob) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });

const loadImage = (url) =>
    new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });

/**
 * Draw an SVG string in the console (best in Chrome / Edge).
 * Size comes from options, then the svg width/height, then its viewBox.
 */
kong.svg = (markup, { width, height } = {}) => {
    const attr = (name) => (markup.match(new RegExp(`<svg[^>]*\\s${name}="([\\d.]+)(?:px)?"`)) || [])[1];
    const vb = (markup.match(/viewBox="[\d.\s-]*?([\d.]+)[\s,]+([\d.]+)"/) || []).slice(1);
    const w = width || Number(attr("width")) || Number(vb[0]) || 100;
    const h = height || (width && (Number(attr("height")) * width) / (Number(attr("width")) || width)) || Number(attr("height")) || Number(vb[1]) || w;
    emit("log", [[" ", paintBox(toUrl(markup), w, h)]]);
};

/**
 * Draw an image in the console. Accepts raw base64, data URIs, URLs, SVG markup
 * and File / Blob objects. Resolves once printed.
 *   await kong.image("iVBORw0KGgo...")
 *   await kong.image(fileInput.files[0], { width: 200 })
 */
kong.image = async (src, { width, height, scale = 1, max = 480, mime } = {}) => {
    if (!isBrowser || !state.enabled) return;
    if (isSvgMarkup(src)) return kong.svg(src, { width, height });
    let url;
    try {
        url = typeof Blob !== "undefined" && src instanceof Blob ? await readBlob(src) : toUrl(src, mime);
    } catch {
        return kong.warning("kong.image: could not read the source");
    }
    const img = await loadImage(url);
    if (!img) return kong.warning("kong.image: could not load the image (is it valid base64?)");
    const nw = img.naturalWidth || 100;
    const nh = img.naturalHeight || 100;
    let w = width || nw * scale;
    let h = height || (width ? (nh * width) / nw : nh * scale);
    if (!width && !height && w > max) {
        h = (h * max) / w;
        w = max;
    }
    emit("log", [[" ", paintBox(url, w, h)]]);
};

/** Explicit alias: kong.base64("iVBORw0KGgo...") */
kong.base64 = (b64, options) => kong.image(b64, options);

/**
 * Play an animated GIF or SVG in the console. It takes the same sources as
 * kong.image (URL, base64, data URI, File or Blob, SVG markup) and keeps the
 * original bytes, so the animation is never re-encoded.
 *   kong.anima("https://example.com/cat.gif")
 *   kong.anima(fileInput.files[0], { width: 200 })
 */
kong.anima = (src, options = {}) => kong.image(src, { max: 360, ...options });

/** Text (for example SVG markup) to a raw base64 string. */
kong.encode = (text) => {
    const bytes = new TextEncoder().encode(String(text));
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
};

/** File, Blob or URL to a raw base64 string (or a full data URI with { dataUri: true }). */
kong.toBase64 = async (source, { dataUri = false } = {}) => {
    const blob = source instanceof Blob ? source : await (await fetch(source)).blob();
    const uri = await readBlob(blob);
    return dataUri ? uri : uri.slice(uri.indexOf(",") + 1);
};

/* ------------------------------------------------------------------ */
/* Banners                                                             */
/* ------------------------------------------------------------------ */

/**
 * Block letters (3x5 pixel font). Works in every browser and in Node.
 *   kong.ascii("KONG")
 */
const FONT = {
    A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110",
    E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
    I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
    M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
    Q: "010101101111011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
    U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
    Y: "101101010010010", Z: "111001010100111",
    0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110",
    4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010",
    8: "111101111101111", 9: "111101111001110",
    ".": "000000000000010", "!": "010010010000010", "?": "110001010000010", "-": "000000111000000",
    ":": "000010000010000", _: "000000000000111", " ": "000000000000000",
};

const glyphCache = new Map();

/** The 5 rows of a glyph as strings, cached per (block, char). */
function glyphRows(c, block) {
    const key = block + c;
    let rows = glyphCache.get(key);
    if (!rows) {
        const glyph = FONT[c] || FONT["?"];
        const off = " ".repeat(block.length);
        rows = [0, 1, 2, 3, 4].map((r) => [...glyph.slice(r * 3, r * 3 + 3)].map((bit) => (bit === "1" ? block : off)).join(""));
        glyphCache.set(key, rows);
    }
    return rows;
}

kong.ascii = (text, { from = COLOR.brand1, to = T().brand2, block = "██" } = {}) => {
    if (!state.enabled) return;
    const chars = [...String(text).toUpperCase()];
    const gap = " ".repeat(block.length);
    const last = Math.max(chars.length - 1, 1);
    const tail = `;${FORMAT.fontMono};font-size:12px;line-height:1.05`;
    const glyphs = chars.map((c, i) => ({ rows: glyphRows(c, block), css: `color:${mix(from, to, i / last)}${tail}` }));
    const parts = [];
    for (let row = 0; row < 5; row++) {
        glyphs.forEach((g, i) => parts.push([g.rows[row] + (i === glyphs.length - 1 ? "\n" : gap), g.css]));
    }
    emit("log", parts);
};

/**
 * A banner drawn as an SVG: gradient title, optional subtitle, grid texture,
 * gradient border and an animated underline.
 *   kong.banner("my app", { subtitle: "v1.0", from: "#0ff", to: "#f0f" })
 */
kong.banner = (text, { subtitle = "", from = COLOR.brand1, to = T().brand2, bg = T().card, size = 56, pad = 28, width, border = true, animate = true } = {}) => {
    if (!isBrowser) return kong.ascii(text, { from, to });
    const title = String(text);
    const sub = String(subtitle);
    const subSize = Math.max(12, Math.round(size * 0.28));
    const textW = [...title].length * size * 0.62;
    const subW = [...sub].length * subSize * 0.75;
    const w = Math.round(width || Math.max(textW, subW) + pad * 2);
    const h = Math.round(pad * 2 + size + (sub ? subSize * 2 : 0));
    const mono = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>
<pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="${T().edge}" stroke-opacity=".05"/></pattern>
</defs>
<rect width="${w}" height="${h}" rx="14" fill="${bg}"/>
<rect width="${w}" height="${h}" rx="14" fill="url(#p)"/>
${border ? `<rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="13" fill="none" stroke="url(#g)" stroke-width="1.5"/>` : ""}
<text x="${w / 2}" y="${pad + size * 0.8}" text-anchor="middle" font-family="${mono}" font-size="${size}" font-weight="700" fill="url(#g)">${escapeXml(title)}</text>
${sub ? `<text x="${w / 2}" y="${pad + size + subSize * 1.2}" text-anchor="middle" font-family="${mono}" font-size="${subSize}" letter-spacing="2" fill="${T().muted}">${escapeXml(sub)}</text>` : ""}
${animate ? `<rect x="${pad}" y="${h - 9}" width="0" height="3" rx="1.5" fill="url(#g)"><animate attributeName="width" values="0;${w - pad * 2};0" dur="3.2s" repeatCount="indefinite"/></rect>` : ""}
</svg>`;
    kong.svg(svg);
};

/**
 * Matrix rain with a word formed by the drops. It is an animated SVG (SMIL),
 * so it moves on its own and never needs console.clear().
 *   kong.matrix("KONG")
 */
kong.matrix = (text = "KONG", { width = 480, height = 220, color = "#00ff66", fontSize = 14, speed = 1, bg = "#020a05", charset = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789" } = {}) => {
    if (!isBrowser) return kong.ascii(text);
    const chars = [...charset];
    const pick = () => escapeXml(chars[(Math.random() * chars.length) | 0]);
    const cols = Math.floor(width / fontSize);
    const lineH = fontSize * 1.15;
    const trail = Math.max(8, Math.round(height / lineH * 0.6));
    const span = Math.round(trail * lineH);
    let rain = "";
    for (let c = 0; c < cols; c++) {
        const dur = (3 + Math.random() * 4) / speed;
        const letters = Array.from({ length: trail }, () => `<tspan x="0" dy="${lineH}">${pick()}</tspan>`).join("");
        rain +=
            `<g transform="translate(${c * fontSize} 0)"><g><text>${letters}</text>` +
            `<animateTransform attributeName="transform" type="translate" values="0 ${-span};0 ${height + span}" dur="${dur.toFixed(2)}s" begin="${(-Math.random() * dur).toFixed(2)}s" repeatCount="indefinite"/></g></g>`;
    }
    const word = escapeXml(text);
    const big = Math.round(Math.min(height * 0.62, (width / Math.max(word.length, 1)) * 1.25));
    const label = `x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="central" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="${big}" font-weight="900" letter-spacing="${Math.round(big * 0.08)}"`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
<linearGradient id="dim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${span}"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".85" stop-color="${color}" stop-opacity=".75"/><stop offset="1" stop-color="#c8ffd9"/></linearGradient>
<linearGradient id="hot" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${span}"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff"/></linearGradient>
<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
<clipPath id="k"><text ${label}>${word}</text></clipPath>
<g id="rain" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="${fontSize}">${rain}</g>
</defs>
<rect width="${width}" height="${height}" fill="${bg}"/>
<use href="#rain" fill="url(#dim)" opacity=".6"/>
<text ${label} fill="${color}" fill-opacity=".12" stroke="${color}" stroke-opacity=".55" stroke-width="1.4">${word}</text>
<use href="#rain" fill="url(#hot)" clip-path="url(#k)" filter="url(#glow)" opacity=".9"/>
<use href="#rain" fill="url(#hot)" clip-path="url(#k)"/>
</svg>`;
    kong.svg(svg);
};

/** The kong.sole logo. */
kong.logo = () => kong.banner("kong.sole", { subtitle: "make your console look good" });

/** Progress bar. kong.progress(72, { label: "build" }) */
kong.progress = (value, { label = "", width = 24 } = {}) => {
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    const filled = Math.round((pct / 100) * width);
    const color = pct < 34 ? T().err : pct < 67 ? T().warn : T().ok;
    emit("log", [
        [label ? `${label} ` : "", `${GLOBAL.mono};${FORMAT.bold}`],
        ["█".repeat(filled), `color:${color};${GLOBAL.mono}`],
        ["░".repeat(width - filled), `color:${T().muted};${GLOBAL.mono}`],
        [` ${Math.round(pct)}%`, `${GLOBAL.mono};${FORMAT.bold}`],
    ]);
};

/* ------------------------------------------------------------------ */
/* Characters that talk                                                */
/* ------------------------------------------------------------------ */

const CHARACTERS = {
    wizard: ["   \\   🧙", "    \\ /|\\", "      / \\"],
    cat: ["   \\    /\\_/\\", "    \\  ( o.o )", "        > ^ <"],
    robot: ["   \\   [o_o]", "    \\ /|=|\\", "       d b"],
    ghost: ["   \\   .-.", "    \\ (o o)", "      | O \\", "       \\   \\"],
};

/** Speech bubble. kong.say("Hello", "wizard" | "cat" | "robot" | "ghost") */
kong.say = (text, who = "cat") => {
    const lines = String(text).split("\n");
    const width = Math.max(...lines.map((l) => [...l].length));
    const body =
        lines.length === 1
            ? [`< ${lines[0]} >`]
            : lines.map((l, i) => {
                  const [a, b] = i === 0 ? ["/", "\\"] : i === lines.length - 1 ? ["\\", "/"] : ["|", "|"];
                  return `${a} ${l}${" ".repeat(width - [...l].length)} ${b}`;
              });
    const art = (CHARACTERS[who] || CHARACTERS.cat).join("\n");
    const out = [` ${"_".repeat(width + 2)}`, ...body, ` ${"-".repeat(width + 2)}`, art].join("\n");
    emit("log", [[out, `${GLOBAL.mono};line-height:1.2`]]);
};

/* ------------------------------------------------------------------ */
/* Panels, dashboards & animated titles                                */
/* ------------------------------------------------------------------ */

const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const MONO_SVG = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const STATUS_COLOR = { ok: COLOR.success, warn: COLOR.warning, error: COLOR.error };
const pairs = (rows) => (Array.isArray(rows) ? rows : Object.entries(rows || {})).map(([k, v]) => [String(k), String(v)]);
const textWidth = (str, px) => [...String(str)].length * px * 0.6;

/**
 * Info panel with a title, optional subtitle and aligned rows.
 *   kong.card("Service ready", { Listening: ":3000", Region: "eu-west-1" }, { status: "ok" })
 * status: "ok" | "warn" | "error" adds a pulsing dot. accent colors the left edge.
 */
kong.card = (title, rows = {}, { subtitle = "", accent = COLOR.brand1, status, bg = T().card, width = 440 } = {}) => {
    const list = pairs(rows);
    if (!isBrowser) {
        const kw = Math.max(0, ...list.map(([k]) => k.length));
        return kong.box([title, ...(subtitle ? [subtitle] : []), "", ...list.map(([k, v]) => `${k.padEnd(kw)}  ${v}`)].join("\n"));
    }
    const pad = 24;
    const rowH = 28;
    const keyW = Math.max(96, ...list.map(([k]) => textWidth(k, 11) + 28));
    const valX = pad + 8 + keyW;
    const w = Math.round(Math.max(width, valX + Math.max(0, ...list.map(([, v]) => textWidth(v, 13))) + pad));
    const headH = subtitle ? 62 : 44;
    const y0 = pad + headH + 16;
    const h = Math.round(list.length ? y0 + (list.length - 1) * rowH + pad : pad + headH);
    const dot = STATUS_COLOR[status];
    const body = list
        .map(([k, v], i) => `<text x="${pad + 8}" y="${y0 + i * rowH}" font-family="${SANS}" font-size="11" letter-spacing="1.2" fill="${T().muted}">${escapeXml(k.toUpperCase())}</text><text x="${valX}" y="${y0 + i * rowH}" font-family="${MONO_SVG}" font-size="13" fill="${T().fg2}">${escapeXml(v)}</text>`)
        .join("");
    kong.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><clipPath id="c"><rect width="${w}" height="${h}" rx="12"/></clipPath></defs>
<rect width="${w}" height="${h}" rx="12" fill="${bg}"/>
<rect width="6" height="${h}" fill="${accent}" clip-path="url(#c)"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="11.5" fill="none" stroke="${T().edge}" stroke-opacity=".08"/>
<text x="${pad + 8}" y="${pad + 18}" font-family="${SANS}" font-size="18" font-weight="700" fill="${T().fg}">${escapeXml(title)}</text>
${subtitle ? `<text x="${pad + 8}" y="${pad + 40}" font-family="${SANS}" font-size="12" fill="${T().muted}">${escapeXml(subtitle)}</text>` : ""}
${dot ? `<circle cx="${w - pad}" cy="${pad + 12}" r="5" fill="${dot}"/><circle cx="${w - pad}" cy="${pad + 12}" r="5" fill="none" stroke="${dot}"><animate attributeName="r" values="5;14" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="1.8s" repeatCount="indefinite"/></circle>` : ""}
${list.length ? `<line x1="${pad + 8}" y1="${pad + headH - 6}" x2="${w - pad}" y2="${pad + headH - 6}" stroke="${T().edge}" stroke-opacity=".1"/>` : ""}
${body}
</svg>`);
};

/**
 * Metric tiles. Values can be plain or { value, delta, good }.
 *   kong.stats({ "p95 latency": { value: "184 ms", delta: "-12%" }, Errors: "0.12%" })
 */
kong.stats = (items, { accent = COLOR.brand1, bg = T().card, perRow = 4 } = {}) => {
    const entries = Object.entries(items).map(([label, v]) => [label, typeof v === "object" && v !== null ? v : { value: v }]);
    if (!isBrowser) {
        return emit("log", [[entries.map(([l, v]) => `${l}: ${v.value}${v.delta ? ` (${v.delta})` : ""}`).join("   "), GLOBAL.mono]]);
    }
    const tw = 140;
    const th = 92;
    const gap = 12;
    const cols = Math.min(perRow, entries.length);
    const rows = Math.ceil(entries.length / cols);
    const w = cols * tw + (cols - 1) * gap;
    const h = rows * th + (rows - 1) * gap;
    const tiles = entries
        .map(([label, v], i) => {
            const x = (i % cols) * (tw + gap);
            const y = Math.floor(i / cols) * (th + gap);
            const deltaColor = v.good === undefined ? T().muted : v.good ? T().ok : T().err;
            return `<g transform="translate(${x} ${y})"><rect width="${tw}" height="${th}" rx="10" fill="${bg}"/><rect width="${tw}" height="3" rx="1.5" fill="${accent}" opacity=".9"/><rect x=".5" y=".5" width="${tw - 1}" height="${th - 1}" rx="9.5" fill="none" stroke="${T().edge}" stroke-opacity=".08"/>
<text x="16" y="28" font-family="${SANS}" font-size="11" letter-spacing="1.2" fill="${T().muted}">${escapeXml(label.toUpperCase())}</text>
<text x="16" y="58" font-family="${SANS}" font-size="24" font-weight="700" fill="${T().fg}">${escapeXml(v.value)}</text>
${v.delta ? `<text x="16" y="79" font-family="${MONO_SVG}" font-size="12" fill="${deltaColor}">${escapeXml(v.delta)}</text>` : ""}</g>`;
        })
        .join("");
    kong.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${tiles}</svg>`);
};

const STEP = { done: ["✓", "ok"], running: ["●", "warn"], pending: ["○", "muted"], failed: ["✕", "err"] };

/**
 * Checklist of steps with aligned notes.
 *   kong.steps([["Connect database", "done", "12 ms"], ["Run migrations", "running"], ["Seed data", "pending"]])
 */
kong.steps = (list) => {
    const items = list.map((s) => (Array.isArray(s) ? { label: s[0], status: s[1], note: s[2] } : s));
    const width = Math.max(...items.map((i) => [...String(i.label)].length));
    const parts = [];
    items.forEach((item, idx) => {
        const [symbol, tone] = STEP[item.status] || STEP.pending;
        const color = T()[tone];
        const pending = item.status === "pending" ? `;color:${T().muted}` : "";
        parts.push([`  ${symbol}  `, `color:${color};${FORMAT.bold};${GLOBAL.mono}`]);
        parts.push([String(item.label).padEnd(width), `${GLOBAL.mono}${pending}`]);
        parts.push([`${item.note ? `   ${item.note}` : ""}${idx < items.length - 1 ? "\n" : ""}`, `color:${T().muted};${GLOBAL.mono}`]);
    });
    emit("log", parts);
};

/** Section divider with a centered label and breathing room above. */
kong.divider = (label = "", { width = 44, color = T().muted } = {}) => {
    const side = "─".repeat(Math.max(2, Math.floor((width - String(label).length - 2) / 2)));
    const line = label ? `${side} ${String(label).toUpperCase()} ${side}` : "─".repeat(width);
    emit("log", [[`\n${line}`, `color:${color};${GLOBAL.mono};${FORMAT.bold}`]]);
};

/**
 * Text splash: block-letter title plus aligned details. Works everywhere, Node included.
 *   kong.splash("ACME", { tagline: "Payments API", info: { Version: "2.4.1", Region: "eu-west-1" } })
 */
kong.splash = (name, { tagline = "", info = {}, from, to } = {}) => {
    kong.ascii(name, { from, to });
    const rows = pairs(info);
    const keyW = Math.max(0, ...rows.map(([k]) => k.length));
    const parts = [["\n", ""]];
    if (tagline) parts.push([`${tagline}\n\n`, `${GLOBAL.format};${FORMAT.italic};color:${T().muted}`]);
    rows.forEach(([k, v], i) => {
        parts.push([`${k.padEnd(keyW)}   `, `color:${T().muted};${GLOBAL.mono}`]);
        parts.push([v + (i < rows.length - 1 ? "\n" : "\n "), `${GLOBAL.mono};${FORMAT.bold}`]);
    });
    emit("log", parts);
};

/** Animated indeterminate progress bar. kong.loader("Deploying to production") */
kong.loader = (label = "Loading", { color = COLOR.brand1, width = 380 } = {}) => {
    if (!isBrowser) return emit("log", [[`${label}...`, GLOBAL.mono]]);
    const bar = Math.round(width * 0.34);
    kong.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="50" viewBox="0 0 ${width} 50">
<defs><clipPath id="t"><rect y="30" width="${width}" height="6" rx="3"/></clipPath><linearGradient id="g"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
<text x="0" y="18" font-family="${SANS}" font-size="13" fill="${T().muted}">${escapeXml(label)}</text>
<rect y="30" width="${width}" height="6" rx="3" fill="${T().muted}" fill-opacity=".25"/>
<g clip-path="url(#t)"><rect x="${-bar}" y="30" width="${bar}" height="6" fill="url(#g)"><animate attributeName="x" values="${-bar};${width}" dur="1.4s" repeatCount="indefinite"/></rect></g>
</svg>`);
};

/**
 * Title with a flowing gradient (animated SVG).
 *   kong.aurora("kong.sole", { subtitle: "make your console look good" })
 */
kong.aurora = (text, { subtitle = "", colors = ["#E21143", "#FFB03A", "#22c55e", "#3b82f6"], size = 48, width, speed = 1 } = {}) => {
    if (!isBrowser) return kong.gradient(text, colors[0], colors[colors.length - 1]);
    const w = Math.round(width || textWidth(text, size) + 24);
    const h = Math.round(size * 1.35 + (subtitle ? 26 : 8));
    const stops = [...colors, colors[0]].map((c, i, a) => `<stop offset="${(i / (a.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join("");
    kong.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="a" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="0" spreadMethod="repeat">${stops}<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="${w} 0" dur="${(5 / speed).toFixed(2)}s" repeatCount="indefinite"/></linearGradient></defs>
<text x="12" y="${size}" font-family="${MONO_SVG}" font-size="${size}" font-weight="800" fill="url(#a)">${escapeXml(text)}</text>
${subtitle ? `<text x="14" y="${size + 22}" font-family="${SANS}" font-size="13" letter-spacing="2" fill="${T().muted}">${escapeXml(subtitle)}</text>` : ""}
</svg>`);
};

/* ------------------------------------------------------------------ */
/* Debugging helpers                                                   */
/* ------------------------------------------------------------------ */

/** Two-tone badge. kong.badge("build", "passing", "#22c55e") */
kong.badge = (label, value, color = COLOR.success) =>
    emit("log", [
        [label, `background:#555;color:#fff;${GLOBAL.badge};border-radius:3px 0 0 3px`],
        [String(value), `background:${color};color:#fff;${GLOBAL.badge};border-radius:0 3px 3px 0`],
    ]);

/** Horizontal bars. kong.bar({ js: 70, css: 20 }) */
kong.bar = (data, { width = 30 } = {}) => {
    const entries = Object.entries(data);
    const max = Math.max(...entries.map(([, v]) => v), 1);
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    const label = Math.max(...entries.map(([k]) => k.length));
    const out = entries
        .map(([k, v]) => `${k.padEnd(label)} ${"█".repeat(Math.max(1, Math.round((v / max) * width)))} ${v} (${Math.round((v / total) * 100)}%)`)
        .join("\n");
    emit("log", [[out, `color:${COLOR.brand1};${GLOBAL.mono}`]]);
};

/** Sparkline. kong.spark([1, 5, 3, 8]) */
kong.spark = (values, { label = "", unit = "" } = {}) => {
    const ticks = "▁▂▃▄▅▆▇█";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const line = values.map((v) => ticks[max === min ? 0 : Math.round(((v - min) / (max - min)) * 7)]).join("");
    emit("log", [
        [label ? `${label}  ` : "", `${GLOBAL.mono};color:${T().muted}`],
        [line, `color:${T().info};font-size:20px;${FORMAT.fontMono}`],
        [`  ${values[values.length - 1]}${unit}`, `${GLOBAL.mono};${FORMAT.bold}`],
    ]);
};

/** JSON with syntax colors (the object is also logged so it stays inspectable). */
kong.json = (value) => {
    const text = JSON.stringify(value, null, 2);
    if (text === undefined) return emit("log", [[String(value), GLOBAL.mono]]);
    const colors = T().json;
    const parts = [];
    let last = 0;
    const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
    let m;
    while ((m = re.exec(text))) {
        if (m.index > last) parts.push([text.slice(last, m.index), GLOBAL.mono]);
        const type = m[1] ? (m[2] ? "key" : "string") : m[3] ? "boolean" : m[0] === "null" ? "null" : "number";
        parts.push([m[1] && m[2] ? m[1] : m[0], `color:${colors[type]};${GLOBAL.mono}`]);
        if (m[1] && m[2]) parts.push([m[2], GLOBAL.mono]);
        last = re.lastIndex;
    }
    if (last < text.length) parts.push([text.slice(last), GLOBAL.mono]);
    emit("log", parts);
};

/** Diff two values line by line (strings or JSON-serializable). */
kong.diff = (a, b) => {
    const lines = (v) => (typeof v === "string" ? v : JSON.stringify(v, null, 2)).split("\n");
    const A = lines(a);
    const B = lines(b);
    const parts = [];
    const n = Math.max(A.length, B.length);
    for (let i = 0; i < n; i++) {
        if (A[i] === B[i]) parts.push([`  ${A[i]}\n`, GLOBAL.mono]);
        else {
            if (A[i] !== undefined) parts.push([`- ${A[i]}\n`, `color:${T().err};${GLOBAL.mono}`]);
            if (B[i] !== undefined) parts.push([`+ ${B[i]}\n`, `color:${T().ok};${GLOBAL.mono}`]);
        }
    }
    emit("log", parts);
};

const isThenable = (v) => v && typeof v.then === "function";

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

/** Closes every group that is still open, with a single call. */
kong.closeAll = () => {
    state.groups.forEach((g) => {
        if (!g.closed) {
            g.closed = true;
            console.groupEnd();
        }
    });
    state.groups.length = 0;
};

/**
 * Styled console.group. Works with sync and async callbacks.
 * Options: collapsed (start folded), closeOnError (an error logged inside ends the group
 * so it shows up at the level above).
 */
kong.section = (title, fn, { collapsed = false, closeOnError = false } = {}) => {
    if (!state.enabled) return fn && fn();
    console[collapsed ? "groupCollapsed" : "group"](`%c${title}`, `${FORMAT.bold};color:${COLOR.brand1};${GLOBAL.format}`);
    const g = { closed: false, closeOnError };
    state.groups.push(g);
    const end = () => {
        if (!g.closed) {
            g.closed = true;
            console.groupEnd();
        }
        const i = state.groups.indexOf(g);
        if (i >= 0) state.groups.splice(i, 1);
    };
    let result;
    try {
        result = fn && fn();
    } catch (e) {
        end();
        throw e;
    }
    if (isThenable(result)) return result.finally(end);
    end();
    return result;
};

/** Time a function. Green < 100ms, yellow < 500ms, red otherwise. */
kong.measure = (label, fn) => {
    if (!state.enabled) return fn();
    const start = performance.now();
    const done = () => {
        const ms = performance.now() - start;
        recordTime(label, ms);
        emit("log", [
            [label, `${GLOBAL.format};${FORMAT.bold}`],
            [` ${ms.toFixed(1)} ms `, `background:${msColor(ms)};color:${COLOR.black};${GLOBAL.badge}`],
        ]);
    };
    let result;
    try {
        result = fn();
    } catch (e) {
        done();
        throw e;
    }
    if (isThenable(result)) return result.finally(done);
    done();
    return result;
};

/* ------------------------------------------------------------------ */
/* Easter egg                                                         */
/* ------------------------------------------------------------------ */

/** A signature for curious devs. kong.signature("Ada", "ada.dev") */
kong.signature = (name, link) => {
    kong.gradient(name, COLOR.brand1, T().brand2, { size: 28 });
    if (link) kong.blue(`🔗 ${link}`);
};

/* ------------------------------------------------------------------ */
/* Inspect: type, object, dir, table, log, snapshot, diff, chart, date */
/* ------------------------------------------------------------------ */

const typeColor = (t) => T().type[t] || T().type.null;
const boldMono = `${GLOBAL.mono};${FORMAT.bold}`;
const brandBold = `${GLOBAL.format};${FORMAT.bold};color:${COLOR.brand1}`;
const short = (str, n) => (str.length > n ? `${str.slice(0, n - 1)}…` : str);
const isObj = (v) => v !== null && typeof v === "object" && !(v instanceof Date) && !(v instanceof RegExp);

/**
 * Precise type of any value. Same names as js-subtype:
 * undefined, null, boolean, integer, float, string, symbol, bigint, array, date, regexp,
 * map, set, weakmap, weakset, error, promise, function, object (or the class name).
 */
function subtype(v) {
    if (v === null) return "null";
    const t = typeof v;
    if (t === "number") return Number.isNaN(v) ? "nan" : !Number.isFinite(v) ? "infinity" : Number.isInteger(v) ? "integer" : "float";
    if (t === "function") {
        if (/^class[\s{]/.test(Function.prototype.toString.call(v))) return "class";
        const tag = Object.prototype.toString.call(v).slice(8, -1).toLowerCase();
        return tag === "asyncfunction" || tag === "generatorfunction" ? tag : "function";
    }
    if (t !== "object") return t;
    if (Array.isArray(v)) return "array";
    const tag = Object.prototype.toString.call(v).slice(8, -1).toLowerCase();
    if (tag !== "object") return tag;
    const ctor = Object.getPrototypeOf(v) && v.constructor && v.constructor.name;
    return ctor && ctor !== "Object" ? ctor : "object";
}

/** One-line, human-sized preview of a value. */
function preview(v, max = 44) {
    const t = subtype(v);
    let out;
    if (typeof Node !== "undefined" && v instanceof Node) out = v.nodeType === 1 ? `<${v.tagName.toLowerCase()}${v.id ? `#${v.id}` : ""}>` : v.nodeName;
    else if (t === "string") out = JSON.stringify(v);
    else if (t === "bigint") out = `${v}n`;
    else if (t === "symbol") out = v.toString();
    else if (t === "function" || t === "asyncfunction" || t === "generatorfunction") out = `ƒ ${v.name || "anonymous"}(${v.length ? "…" : ""})`;
    else if (t === "class") out = `class ${v.name}`;
    else if (t === "array") out = `[${v.slice(0, 4).map((x) => preview(x, 14)).join(", ")}${v.length > 4 ? ", …" : ""}]`;
    else if (t === "date") out = Number.isNaN(+v) ? "Invalid Date" : v.toISOString();
    else if (t === "regexp") out = String(v);
    else if (t === "map") out = `Map(${v.size})`;
    else if (t === "set") out = `Set(${v.size}) {${[...v].slice(0, 3).map((x) => preview(x, 12)).join(", ")}${v.size > 3 ? ", …" : ""}}`;
    else if (t === "error") out = `${v.name}: ${v.message}`;
    else if (t === "promise") out = "Promise";
    else if (v !== null && typeof v === "object") {
        let keys = [];
        try { keys = Object.keys(v); } catch { /* exotic object */ }
        out = `{${keys.slice(0, 4).join(", ")}${keys.length > 4 ? ", …" : ""}}`;
    } else out = String(v);
    return short(out, max);
}

function extraInfo(v) {
    const t = subtype(v);
    if (t === "string") return `${v.length} chars`;
    if (t === "array") return `${v.length} items`;
    if (t === "map" || t === "set") return `${v.size} entries`;
    if (t === "function" || t === "asyncfunction" || t === "generatorfunction") return `${v.length} args`;
    if (isObj(v) && !(typeof Node !== "undefined" && v instanceof Node)) {
        try { return `${Object.keys(v).length} keys`; } catch { return ""; }
    }
    return "";
}

/** kong.type(value, label): prints the precise type and returns it. */
kong.type = (value, label = "") => {
    const t = subtype(value);
    if (state.enabled) {
        emit("log", [
            [label ? `${label}  ` : "", faint()],
            [` ${t} `, `background:${typeColor(t)};color:#111;${boldMono};border-radius:3px`],
            [`  ${preview(value, 60)}`, GLOBAL.mono],
        ]);
    }
    return t;
};

/** Aligned grid printed as one log entry. cells are [text, css?] */
function printGrid(title, head, rows, footer) {
    const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => [...r[i][0]].length)));
    const gap = "  ";
    const parts = [];
    if (title) parts.push([`${title}\n`, brandBold]);
    parts.push([`${head.map((h, i) => h.toUpperCase().padEnd(widths[i])).join(gap)}\n`, `${faint()};${FORMAT.bold}`]);
    parts.push([`${"─".repeat(widths.reduce((a, b) => a + b, 0) + gap.length * (widths.length - 1))}\n`, faint()]);
    rows.forEach((row, r) => {
        row.forEach(([text, css], i) => {
            const end = i === row.length - 1 ? (r < rows.length - 1 || footer ? "\n" : "") : gap;
            parts.push([[...text].length < widths[i] ? text + " ".repeat(widths[i] - [...text].length) + end : text + end, css || GLOBAL.mono]);
        });
    });
    if (footer) parts.push([footer, faint()]);
    emit("log", parts);
}

function listKeys(obj, { all, inherited }) {
    if (!all && !inherited) return Object.keys(obj);
    const keys = new Set();
    for (let o = obj; o && o !== Object.prototype && o !== Function.prototype; o = inherited ? Object.getPrototypeOf(o) : null) {
        Reflect.ownKeys(o).forEach((k) => typeof k === "string" && k !== "constructor" && keys.add(k));
    }
    return [...keys];
}

function collectRows(obj, opts, prefix = "", level = 0, seen = new WeakSet(), rows = []) {
    let keys = [];
    try { keys = listKeys(obj, opts); } catch { /* exotic object */ }
    for (const k of keys) {
        let v;
        try { v = obj[k]; } catch (e) { v = e; }
        const path = prefix ? `${prefix}.${k}` : k;
        rows.push([path, v]);
        if (level < (opts.depth || 0) && isObj(v) && !seen.has(v)) {
            seen.add(v);
            collectRows(v, opts, path, level + 1, seen, rows);
        }
    }
    return rows;
}

function filterRows(rows, { filter, type }) {
    const test = filter instanceof RegExp ? (s) => filter.test(s) : typeof filter === "string" ? (s) => s.toLowerCase().includes(filter.toLowerCase()) : null;
    const types = type ? [].concat(type) : null;
    return rows.filter(([path, v]) => (!test || test(path)) && (!types || types.includes(subtype(v))));
}

function protoChain(obj) {
    const names = [];
    for (let o = Object.getPrototypeOf(obj); o; o = Object.getPrototypeOf(o)) names.push((o.constructor && o.constructor.name) || "Object");
    return names;
}

function isCircular(value) {
    try { JSON.stringify(value); return false; } catch (e) { return /circular/i.test(String(e && e.message)); }
}

/**
 * Everything worth knowing about an object, as an aligned table.
 *   kong.object(user)
 *   kong.object(user, { depth: 1, filter: "address", type: "string", max: 40 })
 */
kong.object = (value, opts = {}) => {
    if (!state.enabled) return value;
    if (value === null || (typeof value !== "object" && typeof value !== "function")) {
        kong.type(value, opts.label);
        return value;
    }
    const t = subtype(value);
    const all = collectRows(value, opts);
    const rows = filterRows(all, opts);
    const max = opts.max || 60;
    const flags = [
        Object.isFrozen(value) ? "frozen" : Object.isSealed(value) ? "sealed" : !Object.isExtensible(value) ? "non-extensible" : "",
        isCircular(value) ? "circular" : "",
    ].filter(Boolean);
    const filtered = rows.length !== all.length ? ` · ${rows.length} of ${all.length} shown` : "";
    const title = `${opts.label ? `${opts.label} · ` : ""}${t} · ${all.length} ${all.length === 1 ? "property" : "properties"}${flags.length ? ` · ${flags.join(" · ")}` : ""}${filtered}`;
    const body = rows.slice(0, max).map(([path, v]) => {
        const vt = subtype(v);
        return [[short(path, 28), boldMono], [vt, `color:${typeColor(vt)};${boldMono}`], [preview(v), GLOBAL.mono], [extraInfo(v), faint()]];
    });
    const chain = protoChain(value);
    const foot = [rows.length > max ? `… ${rows.length - max} more` : "", chain.length ? `Prototype  ${chain.join(" → ")}` : ""].filter(Boolean);
    if (!body.length) emit("log", [[`${title}\n(nothing matches)`, brandBold]]);
    else printGrid(title, ["Key", "Type", "Value", "Info"], body, foot.length ? `\n${foot.join("\n")}` : "");
    return value;
};

/** Like kong.object, but walks the prototype chain and is made for filtering. */
kong.dir = (value, opts = {}) => kong.object(value, { inherited: true, ...opts });

const cellText = (v) => (typeof v === "string" ? short(v, 28) : preview(v, 28));

function flatten(v, depth, prefix = "", out = {}) {
    if (isObj(v) && depth > 0 && !(typeof Node !== "undefined" && v instanceof Node)) {
        Object.keys(v).forEach((k) => flatten(v[k], depth - 1, prefix ? `${prefix}.${k}` : k, out));
        if (!Object.keys(v).length) out[prefix || "value"] = v;
    } else out[prefix || "value"] = v;
    return out;
}

/**
 * Table that understands nested objects and can filter rows.
 *   kong.table(orders)
 *   kong.table(orders, { search: "pro", depth: 2, columns: ["id", "customer.name"], max: 20 })
 */
kong.table = (data, { columns, search, depth = 2, max = 30, title = "table" } = {}) => {
    if (!state.enabled) return;
    const entries = Array.isArray(data) ? data.map((v, i) => [String(i), v]) : data instanceof Map ? [...data].map(([k, v]) => [String(k), v]) : data instanceof Set ? [...data].map((v, i) => [String(i), v]) : Object.entries(data || {});
    const flat = entries.map(([key, v]) => [key, flatten(v, depth)]);
    const cols = columns || [...new Set(flat.flatMap(([, f]) => Object.keys(f)))].slice(0, 8);
    let rows = flat.map(([key, f]) => [key, ...cols.map((c) => f[c])]);
    if (search) {
        const q = String(search).toLowerCase();
        rows = rows.filter((r) => r.some((c, i) => (i === 0 ? c : cellText(c)).toLowerCase().includes(q)));
    }
    const label = `${title} · ${rows.length}${search ? ` of ${entries.length}` : ""} ${rows.length === 1 ? "row" : "rows"}${search ? ` matching "${search}"` : ""}`;
    if (!rows.length) return emit("log", [[`${label}\n(no rows)`, brandBold]]);
    const body = rows.slice(0, max).map(([key, ...cells]) => [
        [key, faint()],
        ...cells.map((c) => {
            const t = subtype(c);
            return [cellText(c), t === "string" ? GLOBAL.mono : `color:${typeColor(t)};${GLOBAL.mono}`];
        }),
    ]);
    printGrid(label, ["#", ...cols], body, rows.length > max ? `\n… ${rows.length - max} more rows` : "");
};

/* ---- clone, log, snapshot ---- */

function clone(v, depth = Infinity, seen = new WeakMap(), level = 0) {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) return seen.get(v);
    if (v instanceof Date) return new Date(+v);
    if (v instanceof RegExp) return new RegExp(v.source, v.flags);
    if (level > depth) return Array.isArray(v) ? `[Array(${v.length})]` : `[${subtype(v) === "object" ? "Object" : subtype(v)}]`;
    if (v instanceof Map) {
        const m = new Map();
        seen.set(v, m);
        v.forEach((val, k) => m.set(clone(k, depth, seen, level + 1), clone(val, depth, seen, level + 1)));
        return m;
    }
    if (v instanceof Set) {
        const s = new Set();
        seen.set(v, s);
        v.forEach((x) => s.add(clone(x, depth, seen, level + 1)));
        return s;
    }
    const out = Array.isArray(v) ? [] : Object.create(Object.getPrototypeOf(v));
    seen.set(v, out);
    Object.keys(v).forEach((k) => {
        try { out[k] = clone(v[k], depth, seen, level + 1); } catch { /* throwing getter */ }
    });
    return out;
}

function deepFreeze(v, seen = new WeakSet()) {
    if (v === null || typeof v !== "object" || seen.has(v)) return v;
    seen.add(v);
    Object.keys(v).forEach((k) => deepFreeze(v[k], seen));
    return Object.freeze(v);
}

/**
 * Logs a copy, so you see the value as it was now, not as it ends up after later mutations.
 *   kong.log(state, { depth: 2, label: "state" })
 */
kong.log = (value, { depth, label } = {}) => {
    if (!state.enabled) return value;
    const copy = clone(value, depth === undefined ? Infinity : depth);
    if (label) emit("log", [[label, brandBold]], [copy]);
    else console.log(copy);
    return value;
};

/** Frozen deep copy of a value, logged. Returns the frozen copy. */
kong.snapshot = (value, label = "snapshot") => {
    const frozen = deepFreeze(clone(value));
    if (state.enabled) emit("log", [[`${label} `, brandBold], [`@ ${new Date().toLocaleTimeString()}`, faint()]], [frozen]);
    return frozen;
};

/* ---- diff ---- */

function diffObjects(a, b, path = "", out = [], seen = new WeakSet()) {
    if (isObj(a) && isObj(b) && !seen.has(a)) {
        seen.add(a);
        [...new Set([...Object.keys(a), ...Object.keys(b)])].forEach((k) => {
            const p = path ? `${path}.${k}` : k;
            if (!(k in a)) out.push(["+", p, undefined, b[k]]);
            else if (!(k in b)) out.push(["-", p, a[k]]);
            else diffObjects(a[k], b[k], p, out, seen);
        });
    } else if (!Object.is(a, b) && !(a instanceof Date && b instanceof Date && +a === +b)) out.push(["~", path || "(root)", a, b]);
    return out;
}

const lineDiff = kong.diff;
const diffColor = (sign) => ({ "~": T().warn, "+": T().ok, "-": T().err })[sign];

/** Compares two objects property by property (or two strings line by line). */
kong.diff = (a, b) => {
    if (!state.enabled) return;
    if (!(isObj(a) && isObj(b))) return lineDiff(a, b);
    const changes = diffObjects(a, b);
    if (!changes.length) return emit("log", [["No differences", `${GLOBAL.mono};color:${T().ok};${FORMAT.bold}`]]);
    const count = (s) => changes.filter((c) => c[0] === s).length;
    const width = Math.max(...changes.map((c) => c[1].length));
    const summary = [`${count("~")} changed`, `${count("+")} added`, `${count("-")} removed`].join(" · ");
    const parts = [[`${summary}\n`, brandBold]];
    changes.forEach(([sign, path, from, to], i) => {
        const nl = i < changes.length - 1 ? "\n" : "";
        parts.push([`${sign} `, `color:${diffColor(sign)};${boldMono}`], [path.padEnd(width) + "  ", boldMono]);
        if (sign === "~") parts.push([preview(from, 30), `color:${T().err};${GLOBAL.mono}`], [" → ", faint()], [preview(to, 30) + nl, `color:${T().ok};${GLOBAL.mono}`]);
        else if (sign === "+") parts.push([preview(to, 50) + nl, `color:${T().ok};${GLOBAL.mono}`]);
        else parts.push([preview(from, 50) + nl, `color:${T().err};${GLOBAL.mono};text-decoration:line-through`]);
    });
    emit("log", parts);
};

/* ---- chart ---- */

/**
 * Bar or line chart as an SVG.
 *   kong.chart([12, 18, 9, 22], { type: "line", title: "Signups" })
 *   kong.chart({ Mon: 12, Tue: 18 }, { type: "bar" })
 */
kong.chart = (data, { type = "bar", title = "", width = 460, height = 210, color = COLOR.brand1 } = {}) => {
    if (!state.enabled) return;
    const entries = (Array.isArray(data) ? data.map((v, i) => [String(i + 1), v]) : Object.entries(data)).map(([k, v]) => [k, Number(v) || 0]);
    if (!entries.length) return;
    if (!isBrowser) return type === "line" ? kong.spark(entries.map((e) => e[1]), { label: title }) : kong.bar(Object.fromEntries(entries));
    const vals = entries.map((e) => e[1]);
    const max = Math.max(...vals, 0) || 1;
    const min = type === "line" ? Math.min(...vals) : 0;
    const padL = 40, padR = 14, padT = title ? 38 : 16, padB = 30;
    const cw = width - padL - padR;
    const ch = height - padT - padB;
    const x = (i) => padL + (type === "line" ? (entries.length === 1 ? cw / 2 : (i / (entries.length - 1)) * cw) : (i + 0.5) * (cw / entries.length));
    const y = (v) => padT + ch - ((v - min) / (max - min || 1)) * ch;
    const fmt = (n) => (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n * 10) / 10));
    const grid = [0, 1, 2, 3].map((i) => {
        const gy = padT + (ch / 3) * i;
        return `<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}" stroke="${T().edge}" stroke-opacity=".08"/><text x="${padL - 8}" y="${gy + 4}" text-anchor="end" font-family="${MONO_SVG}" font-size="10" fill="${T().muted}">${fmt(max - ((max - min) / 3) * i)}</text>`;
    }).join("");
    const bw = Math.min(44, (cw / entries.length) * 0.62);
    const marks = type === "line"
        ? `<polygon points="${x(0)},${padT + ch} ${entries.map((e, i) => `${x(i)},${y(e[1])}`).join(" ")} ${x(entries.length - 1)},${padT + ch}" fill="${color}" fill-opacity=".14"/><polyline points="${entries.map((e, i) => `${x(i)},${y(e[1])}`).join(" ")}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${entries.map((e, i) => `<circle cx="${x(i)}" cy="${y(e[1])}" r="3.5" fill="${T().card}" stroke="${color}" stroke-width="2"/>`).join("")}`
        : entries.map((e, i) => `<rect x="${x(i) - bw / 2}" y="${y(e[1])}" width="${bw}" height="${Math.max(1, padT + ch - y(e[1]))}" rx="3" fill="${color}"/>`).join("");
    const step = Math.ceil(entries.length / 8);
    const labels = entries.map((e, i) => (i % step ? "" : `<text x="${x(i)}" y="${height - 10}" text-anchor="middle" font-family="${MONO_SVG}" font-size="10" fill="${T().muted}">${escapeXml(short(e[0], 8))}</text>`)).join("");
    kong.svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" rx="12" fill="${T().card}"/><rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="11.5" fill="none" stroke="${T().edge}" stroke-opacity=".08"/>${title ? `<text x="${padL}" y="24" font-family="${SANS}" font-size="14" font-weight="700" fill="${T().fg}">${escapeXml(title)}</text>` : ""}${grid}${marks}${labels}</svg>`);
};

/* ---- date & copy ---- */

/**
 * Current (or given) date and time, readable at a glance. Returns the Date.
 *   kong.date()   kong.date("2026-12-25")   kong.date(new Date(), { timeZone: "Asia/Tokyo" })
 */
kong.date = (input = new Date(), { locale = "en-GB", timeZone } = {}) => {
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(+d)) {
        kong.warning("kong.date: invalid date");
        return d;
    }
    if (!state.enabled) return d;
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fmt = (o) => new Intl.DateTimeFormat(locale, { timeZone: tz, ...o }).format(d);
    const time = fmt({ hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const day = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const offset = fmt({ timeZoneName: "shortOffset" }).split(" ").pop();
    const ymd = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(d).filter((p) => p.type !== "literal").map((p) => [p.type, Number(p.value)]));
    const y = ymd.year;
    const m = ymd.month - 1;
    const dd = ymd.day;
    const doy = Math.floor((Date.UTC(y, m, dd) - Date.UTC(y, 0, 0)) / 864e5);
    const dt = new Date(Date.UTC(y, m, dd));
    dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
    const week = Math.ceil(((dt - Date.UTC(dt.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
    const diff = +d - Date.now();
    const abs = Math.abs(diff);
    const units = [["day", 864e5], ["hour", 36e5], ["minute", 6e4]];
    const unit = units.find(([, ms]) => abs >= ms);
    const rel = unit ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(diff / unit[1]), unit[0]) : "";
    emit("log", [
        [`${time}\n`, `${FORMAT.fontMono};font-size:26px;font-weight:bold;color:${COLOR.brand1}`],
        [`${day}${rel ? `  (${rel})` : ""}\n`, `${GLOBAL.format};${FORMAT.bold}`],
        [`Week ${week}  ·  day ${doy}  ·  ${offset}  ·  ${tz}\n`, faint()],
        [`${d.toISOString()}  ·  unix ${Math.floor(+d / 1000)}`, faint()],
    ]);
    return d;
};

/** Copies text, or any value as JSON, to the clipboard. Resolves with the copied text. */
kong.copy = async (data) => {
    const text = typeof data === "string" ? data : (JSON.stringify(data, null, 2) ?? String(data));
    let ok = false;
    try {
        await navigator.clipboard.writeText(text);
        ok = true;
    } catch {
        try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.cssText = "position:fixed;opacity:0";
            document.body.appendChild(ta);
            ta.select();
            ok = document.execCommand("copy");
            ta.remove();
        } catch { /* no clipboard available */ }
    }
    if (state.enabled) {
        emit(ok ? "log" : "warn", [[ok ? " copied " : " not copied ", `background:${ok ? COLOR.success : COLOR.warning};color:${COLOR.black};${boldMono};border-radius:3px`], [`  ${ok ? `${text.length} characters on the clipboard` : "the browser blocked clipboard access (needs a click or focus)"}`, faint()]]);
    }
    return text;
};

/* ------------------------------------------------------------------ */
/* Tags, once, watch, trace, assert, clear                             */
/* ------------------------------------------------------------------ */

const TAG_COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#fb7185", "#22d3ee", "#a3e635"];
const muted = new Set();
let soloTag = null;

/**
 * A named logger you can mute or solo. Warnings, errors and tagged lines are kept
 * in a small history so kong.clear("tag") can remove one channel and keep the rest.
 *   const auth = kong.tag("auth");  auth.info("Login ok");  kong.mute("auth");
 */
kong.tag = (name, { color } = {}) => {
    const c = color || TAG_COLORS[[...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % TAG_COLORS.length];
    const badge = `background:${c};color:#111;${boldMono};padding:1px 6px;border-radius:3px`;
    const make = (method, icon = "") => (...args) => {
        if (!state.enabled || muted.has(name) || (soloTag && soloTag !== name)) return;
        const [text, rest] = split(args);
        emit(method, [[` ${name} `, badge], [`  ${icon}${text}`, GLOBAL.format]], rest, name);
    };
    return { log: make("log"), debug: make("log"), info: make("info"), success: make("log", "✓ "), warn: make("warn", "▲ "), error: make("error", "✕ ") };
};
kong.mute = (...names) => names.forEach((n) => muted.add(n));
kong.unmute = (...names) => (names.length ? names.forEach((n) => muted.delete(n)) : muted.clear());
kong.solo = (name) => {
    soloTag = name || null;
};

/** Clears the console. With a tag, only that channel disappears; errors always stay. */
kong.clear = (tag) => {
    const keep = tag ? history.filter((e) => e.tag !== tag || e.method === "error") : [];
    history.length = 0;
    console.clear();
    keep.forEach((e) => {
        history.push(e);
        print(e.method, e.parts, e.rest);
    });
};

const onceSeen = new Set();
/** Prints only the first time it is called with the same message. */
kong.once = (...args) => {
    const key = args.map(String).join(" ");
    if (onceSeen.has(key)) return false;
    onceSeen.add(key);
    if (state.enabled) kong.info(...args);
    return true;
};
kong.once.reset = () => onceSeen.clear();

/** Logs every change of obj[prop]. Returns a function that stops watching. */
kong.watch = (obj, prop, { label = "obj" } = {}) => {
    const d = Object.getOwnPropertyDescriptor(obj, prop) || { enumerable: true };
    let value = obj[prop];
    Object.defineProperty(obj, prop, {
        configurable: true,
        enumerable: d.enumerable,
        get: () => value,
        set: (next) => {
            const old = value;
            value = next;
            if (!state.enabled) return;
            const t = new Date();
            emit("log", [
                [" watch ", `background:#a78bfa;color:#111;${boldMono};border-radius:3px`],
                [`  ${label}.${String(prop)}  `, boldMono],
                [preview(old, 30), `color:${T().err};${GLOBAL.mono}`],
                [" → ", faint()],
                [preview(next, 30), `color:${T().ok};${GLOBAL.mono}`],
                [`   ${t.toLocaleTimeString("en-GB")}.${String(t.getMilliseconds()).padStart(3, "0")}`, faint()],
            ]);
        },
    });
    return () => Object.defineProperty(obj, prop, { value, writable: true, configurable: true, enumerable: d.enumerable });
};

/** Stack trace without the noise. kong.trace("where", { hide: ["node_modules"], limit: 8 }) */
kong.trace = (label = "trace", { hide = ["node_modules"], limit = 8 } = {}) => {
    if (!state.enabled) return;
    const frames = (new Error().stack || "").split("\n").slice(1)
        .filter((l) => !/kong\.sole/.test(l) && !hide.some((h) => l.includes(h)))
        .slice(0, limit).map((l) => l.trim());
    emit("log", [[`trace · ${label}\n`, brandBold], [frames.length ? frames.join("\n") : `(no frames left after hiding ${hide.join(", ")})`, faint()]]);
};

/** Reports a failed condition. With { pause: true } it also stops in the debugger. Returns the condition. */
kong.assert = (condition, message = "Assertion failed", { pause = false } = {}) => {
    if (condition) return true;
    if (state.enabled) {
        kong.error(message);
        if (pause) debugger; // eslint-disable-line no-debugger
    }
    return false;
};

/* ------------------------------------------------------------------ */
/* Measure: time, timers, count                                        */
/* ------------------------------------------------------------------ */

const timerStart = new Map();
const timerStats = new Map();
const counters = new Map();
const msColor = (ms) => (ms < 100 ? COLOR.success : ms < 500 ? COLOR.warning : COLOR.error);

function recordTime(label, ms) {
    const s = timerStats.get(label) || { runs: 0, total: 0, min: Infinity, max: 0 };
    s.runs++;
    s.total += ms;
    s.min = Math.min(s.min, ms);
    s.max = Math.max(s.max, ms);
    timerStats.set(label, s);
}

/** kong.time("render") ... kong.timeEnd("render") returns the milliseconds as a number. */
kong.time = (label = "default") => {
    timerStart.set(label, performance.now());
};
kong.timeEnd = (label = "default", { silent = false } = {}) => {
    const start = timerStart.get(label);
    if (start === undefined) {
        if (state.enabled) kong.warning(`kong.timeEnd: no timer called "${label}"`);
        return NaN;
    }
    const ms = performance.now() - start;
    timerStart.delete(label);
    recordTime(label, ms);
    if (state.enabled && !silent) emit("log", [[label, `${GLOBAL.format};${FORMAT.bold}`], [` ${ms.toFixed(1)} ms `, `background:${msColor(ms)};color:${COLOR.black};${GLOBAL.badge}`]]);
    return ms;
};

/** Summary of every timer: runs, min, average, max and total. Returns the numbers. */
kong.timers = () => {
    const out = {};
    timerStats.forEach((s, label) => {
        out[label] = { runs: s.runs, min: s.min, avg: s.total / s.runs, max: s.max, total: s.total };
    });
    if (state.enabled && timerStats.size) {
        const ms = (n) => `${n.toFixed(1)} ms`;
        printGrid("timers", ["Label", "Runs", "Min", "Avg", "Max", "Total"], Object.entries(out).map(([l, s]) => [
            [l, boldMono], [String(s.runs)], [ms(s.min)], [ms(s.avg), `color:${msColor(s.avg)};${boldMono}`], [ms(s.max)], [ms(s.total), faint()],
        ]));
    }
    return out;
};

/** Counts calls per label. With { max } it warns once and then goes quiet (useful against runaway loops). */
kong.count = (label = "default", { max } = {}) => {
    const n = (counters.get(label) || 0) + 1;
    counters.set(label, n);
    if (!state.enabled || (max && n > max)) return n;
    if (max && n === max) emit("warn", [[` ${label} `, `background:${COLOR.warning};color:${COLOR.black};${boldMono};border-radius:3px`], [`  reached ${n}, the limit. Possible runaway loop? Further calls are silent.`, GLOBAL.format]]);
    else emit("log", [[`${label}  `, faint()], [`#${n}`, boldMono]]);
    return n;
};
kong.countReset = (label = "default") => counters.delete(label);

/* ------------------------------------------------------------------ */
/* Production switch: when disabled, output helpers do no work at all  */
/* ------------------------------------------------------------------ */

["custom", "neon", "box", "svg", "say", "badge", "bar", "spark", "json", "diff", "banner", "matrix", "progress", "logo", "signature", "card", "stats", "steps", "divider", "splash", "loader", "aurora", "chart", "table", "trace"].forEach((name) => {
    const fn = kong[name];
    kong[name] = (...args) => (state.enabled ? fn(...args) : undefined);
});

kong.warn = kong.warning;

export default kong;
