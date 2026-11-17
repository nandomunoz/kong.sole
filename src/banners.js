/**
 * kong.sole · Banners: ascii, banner, matrix, logo, progress
 */

import { kong, gate, COLOR, FORMAT, GLOBAL, T, emit, escapeXml, isBrowser, mix, state } from "./core.js";
import "./images.js";

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

/* When disabled, output helpers do no work at all. */
gate(["banner", "matrix", "progress", "logo"]);

export default kong;
