/**
 * kong.sole · Creative text: custom, gradient, rainbow, neon, box
 */

import { kong, gate, COLOR, FORMAT, GLOBAL, T, emit, mix, state } from "./core.js";

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

/* When disabled, output helpers do no work at all. */
gate(["custom", "neon", "box"]);

export default kong;
