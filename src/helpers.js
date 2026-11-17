/**
 * kong.sole · Debugging helpers: badge, bar, spark, json, diff, signature
 */

import { kong, gate, COLOR, FORMAT, GLOBAL, T, emit } from "./core.js";
import "./text.js";

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

/* ------------------------------------------------------------------ */
/* Easter egg                                                         */
/* ------------------------------------------------------------------ */

/** A signature for curious devs. kong.signature("Ada", "ada.dev") */
kong.signature = (name, link) => {
    kong.gradient(name, COLOR.brand1, T().brand2, { size: 28 });
    if (link) kong.blue(`🔗 ${link}`);
};

/* When disabled, output helpers do no work at all. */
gate(["badge", "bar", "spark", "json", "diff", "signature"]);

export default kong;
