/**
 * kong.sole · Tags, once, watch, trace, assert, clear, groups, time, timers and count
 */

import { kong, gate, COLOR, FORMAT, GLOBAL, T, boldMono, brandBold, emit, faint, history, print, split, state } from "./core.js";
import { preview, printGrid } from "./inspect.js";

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

/* Groups and measure */

const isThenable = (v) => v && typeof v.then === "function";


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

/* When disabled, output helpers do no work at all. */
gate(["trace"]);

export default kong;
