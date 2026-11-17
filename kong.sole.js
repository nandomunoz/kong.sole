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

const state = { enabled: true };

/**
 * Print several styled segments in a single console call.
 * @param {"log"|"info"|"warn"|"error"} method
 * @param {Array<[string, string]>} parts  [text, css] pairs
 * @param {Array} rest  extra values (objects, arrays…) logged untouched
 */
function emit(method, parts, rest = []) {
    if (!state.enabled) return;
    if (!isBrowser) {
        console[method](parts.map(([text]) => text).join(""), ...rest);
        return;
    }
    const format = parts.map(() => "%c%s").join("");
    const args = parts.flatMap(([text, css]) => [css, text]);
    console[method](format, ...args, ...rest);
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
    success: "💚 ",
    info: "💡 ",
    warning: "🔔 ",
    error: "💣 ",
    poo: "💩 ",
    gandalf: "🧙 ",
    wonderwoman: "🦸‍♀️ ",
};

// Status logs use the native severity so DevTools filters and stack traces work.
const METHOD = { info: "info", warning: "warn", error: "error" };

const kong = {};

Object.keys(STYLES).forEach((key) => {
    const css = STYLES[key].join(";"); // built once, not on every call
    const prefix = ICON[key] || "";
    const method = METHOD[key] || "log";
    kong[key] = (...args) => {
        if (!state.enabled) return;
        const [text, rest] = split(args);
        emit(method, [[prefix + text, css]], rest);
    };
});

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

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
kong.gradient = (text, from = COLOR.brand1, to = COLOR.brand2, { size = 24 } = {}) => {
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

kong.ascii = (text, { from = COLOR.brand1, to = COLOR.brand2, block = "██" } = {}) => {
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
kong.banner = (text, { subtitle = "", from = COLOR.brand1, to = COLOR.brand2, bg = "#14141b", size = 56, pad = 28, width, border = true, animate = true } = {}) => {
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
<pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#fff" stroke-opacity=".05"/></pattern>
</defs>
<rect width="${w}" height="${h}" rx="14" fill="${bg}"/>
<rect width="${w}" height="${h}" rx="14" fill="url(#p)"/>
${border ? `<rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="13" fill="none" stroke="url(#g)" stroke-width="1.5"/>` : ""}
<text x="${w / 2}" y="${pad + size * 0.8}" text-anchor="middle" font-family="${mono}" font-size="${size}" font-weight="700" fill="url(#g)">${escapeXml(title)}</text>
${sub ? `<text x="${w / 2}" y="${pad + size + subSize * 1.2}" text-anchor="middle" font-family="${mono}" font-size="${subSize}" letter-spacing="2" fill="#9aa0b4">${escapeXml(sub)}</text>` : ""}
${animate ? `<rect x="${pad}" y="${h - 9}" width="0" height="3" rx="1.5" fill="url(#g)"><animate attributeName="width" values="0;${w - pad * 2};0" dur="3.2s" repeatCount="indefinite"/></rect>` : ""}
</svg>`;
    kong.svg(svg);
};

/** The kong.sole logo. */
kong.logo = () => kong.banner("kong.sole", { subtitle: "make your console look good" });

/** Progress bar. kong.progress(72, { label: "build" }) */
kong.progress = (value, { label = "", width = 24 } = {}) => {
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    const filled = Math.round((pct / 100) * width);
    const color = pct < 34 ? COLOR.error : pct < 67 ? COLOR.warning : COLOR.success;
    emit("log", [
        [label ? `${label} ` : "", `${GLOBAL.mono};${FORMAT.bold}`],
        ["█".repeat(filled), `color:${color};${GLOBAL.mono}`],
        ["░".repeat(width - filled), `color:${COLOR.grey};${GLOBAL.mono}`],
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
kong.spark = (values) => {
    const ticks = "▁▂▃▄▅▆▇█";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const line = values.map((v) => ticks[max === min ? 0 : Math.round(((v - min) / (max - min)) * 7)]).join("");
    emit("log", [[line, `color:${COLOR.info};font-size:20px;${FORMAT.fontMono}`]]);
};

/** JSON with syntax colors (the object is also logged so it stays inspectable). */
kong.json = (value) => {
    const text = JSON.stringify(value, null, 2);
    if (text === undefined) return emit("log", [[String(value), GLOBAL.mono]]);
    const colors = { key: "#60a5fa", string: "#4ade80", number: "#fbbf24", boolean: "#f472b6", null: "#9ca3af" };
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
            if (A[i] !== undefined) parts.push([`- ${A[i]}\n`, `color:${COLOR.error};${GLOBAL.mono}`]);
            if (B[i] !== undefined) parts.push([`+ ${B[i]}\n`, `color:${COLOR.success};${GLOBAL.mono}`]);
        }
    }
    emit("log", parts);
};

const isThenable = (v) => v && typeof v.then === "function";

/** Styled console.group. Works with sync and async callbacks. */
kong.section = (title, fn) => {
    if (!state.enabled) return fn && fn();
    console.group(`%c${title}`, `${FORMAT.bold};color:${COLOR.brand1};${GLOBAL.format}`);
    let result;
    try {
        result = fn && fn();
    } catch (e) {
        console.groupEnd();
        throw e;
    }
    if (isThenable(result)) return result.finally(() => console.groupEnd());
    console.groupEnd();
    return result;
};

/** Time a function. Green < 100ms, yellow < 500ms, red otherwise. */
kong.measure = (label, fn) => {
    if (!state.enabled) return fn();
    const start = performance.now();
    const done = () => {
        const ms = performance.now() - start;
        const color = ms < 100 ? COLOR.success : ms < 500 ? COLOR.warning : COLOR.error;
        emit("log", [
            [`⏱ ${label}`, `${GLOBAL.format};${FORMAT.bold}`],
            [` ${ms.toFixed(1)} ms `, `background:${color};color:${COLOR.black};${GLOBAL.badge}`],
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
    kong.gradient(name, COLOR.brand1, COLOR.brand2, { size: 28 });
    if (link) kong.blue(`🔗 ${link}`);
};

/* ------------------------------------------------------------------ */
/* Production switch: when disabled, output helpers do no work at all  */
/* ------------------------------------------------------------------ */

["custom", "neon", "box", "svg", "say", "badge", "bar", "spark", "json", "diff", "banner", "progress", "logo", "signature"].forEach((name) => {
    const fn = kong[name];
    kong[name] = (...args) => (state.enabled ? fn(...args) : undefined);
});

kong.warn = kong.warning;

export default kong;
