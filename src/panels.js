/**
 * kong.sole · Panels, dashboards and animated titles
 */

import { kong, gate, COLOR, FORMAT, GLOBAL, T, emit, escapeXml, isBrowser } from "./core.js";
import "./text.js";
import "./images.js";
import "./banners.js";

/* ------------------------------------------------------------------ */
/* Panels, dashboards & animated titles                                */
/* ------------------------------------------------------------------ */

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

/* When disabled, output helpers do no work at all. */
gate(["card", "stats", "steps", "divider", "splash", "loader", "aurora"]);

export default kong;
