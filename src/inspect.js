/**
 * kong.sole · Inspect: type, object, dir, table, log, snapshot, diff, chart, date, copy
 */

import { kong, gate, COLOR, FORMAT, GLOBAL, T, boldMono, brandBold, emit, escapeXml, faint, isBrowser, state } from "./core.js";
import "./images.js";
import "./helpers.js";

/* ------------------------------------------------------------------ */
/* Inspect: type, object, dir, table, log, snapshot, diff, chart, date */
/* ------------------------------------------------------------------ */

const typeColor = (t) => T().type[t] || T().type.null;
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
export function preview(v, max = 44) {
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
export function printGrid(title, head, rows, footer) {
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

/* When disabled, output helpers do no work at all. */
gate(["diff", "chart", "table"]);

export default kong;
