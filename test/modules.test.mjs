// Each test file runs in its own process, so these start from a clean module cache:
// importing one module never sees helpers that another test registered.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

/** Imports a module in a fresh process and prints which helpers it has. */
const methods = (entry) =>
    JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `import k from ${JSON.stringify(entry)}; console.log(JSON.stringify(Object.keys(k).sort()))`], { encoding: "utf8" }));

const has = (list, ...names) => names.forEach((n) => assert.ok(list.includes(n), `missing ${n}`));
const lacks = (list, ...names) => names.forEach((n) => assert.ok(!list.includes(n), `unexpected ${n}`));

test("lite has the small helpers and nothing else", () => {
    const k = methods("./src/lite.js");
    has(k, "info", "error", "gradient", "badge", "json", "diff", "signature", "theme", "enabled");
    lacks(k, "image", "banner", "table", "tag", "card", "ascii", "time");
});

test("core alone has status logs and formatting only", () => {
    const k = methods("./src/core.js");
    has(k, "success", "warning", "error", "h1", "bold", "red", "poo");
    lacks(k, "gradient", "badge", "table", "image");
});

test("core plus one add-on: inspect pulls in helpers and images, not the rest", () => {
    const k = methods("./src/inspect.js");
    has(k, "table", "object", "type", "chart", "diff", "svg", "badge");
    lacks(k, "banner", "card", "tag", "say");
});

test("debug brings tags, timers and groups (and inspect for its tables)", () => {
    const k = methods("./src/debug.js");
    has(k, "tag", "once", "watch", "time", "timers", "count", "section", "measure", "table");
    lacks(k, "banner", "card", "say");
});

test("the lite bundle matches the lite entry", () => {
    const entry = methods("./src/lite.js");
    const min = methods("./kong.sole.lite.min.js");
    assert.deepEqual(min, entry);
});

test("the full entry has every module", () => {
    const k = methods("./kong.sole.js");
    has(k, "image", "banner", "say", "card", "table", "tag", "time", "gradient", "badge", "success");
});
