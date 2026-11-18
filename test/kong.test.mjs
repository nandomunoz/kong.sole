// Run with: npm test (node --test). No dependencies: node:test and node:assert only.
// Outside a browser kong prints plain text, which is what these tests read.
import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const load = async (file) => (await import(pathToFileURL(resolve(file)).href + "?" + Math.random())).default;

/** Runs fn with the console stubbed and returns what was printed as [method, ...args]. */
async function capture(fn) {
    const calls = [];
    const saved = {};
    for (const m of ["log", "info", "warn", "error", "group", "groupCollapsed", "groupEnd", "table", "trace", "assert", "clear"]) {
        saved[m] = console[m];
        console[m] = (...a) => calls.push([m, ...a]);
    }
    try {
        await fn();
    } finally {
        Object.assign(console, saved);
    }
    return calls;
}
const text = (calls) => calls.map((c) => c.slice(1).join(" ")).join("\n");

for (const [name, file] of [["source (kong.sole.js)", "kong.sole.js"], ["minified (kong.sole.min.js)", "kong.sole.min.js"]]) {
    test(name, async (t) => {
        const kong = await load(file);

        await t.test("status logs use the native severity", async () => {
            assert.equal((await capture(() => kong.success("ok")))[0][0], "log");
            assert.equal((await capture(() => kong.info("i")))[0][0], "info");
            assert.equal((await capture(() => kong.warning("w")))[0][0], "warn");
            assert.equal((await capture(() => kong.warn("w")))[0][0], "warn");
            const err = await capture(() => kong.error("boom", { id: 1 }));
            assert.equal(err[0][0], "error");
            assert.match(err[0][1], /boom/);
            assert.deepEqual(err[0][2], { id: 1 }); // objects stay inspectable
        });

        await t.test("enabled = false silences everything and returns early", async () => {
            kong.enabled = false;
            try {
                const calls = await capture(() => {
                    kong.info("x"); kong.gradient("x"); kong.banner("x"); kong.table([{ a: 1 }]); kong.json({});
                });
                assert.equal(calls.length, 0);
                assert.equal(kong.measure("m", () => 42), 42); // still runs the function
            } finally {
                kong.enabled = true;
            }
            assert.equal(kong.enabled, true);
        });

        await t.test("theme getter and setter", () => {
            kong.theme = "light";
            assert.equal(kong.theme, "light");
            kong.theme = "dark";
            assert.equal(kong.theme, "dark");
            kong.theme = "nonsense"; // falls back to auto, which is dark outside a browser
            assert.equal(kong.theme, "dark");
        });

        await t.test("type() returns precise names", async () => {
            let got;
            await capture(() => {
                got = [kong.type(1), kong.type(1.5), kong.type([]), kong.type(new Date()), kong.type(new Map()), kong.type(null), kong.type(NaN), kong.type(class A {}), kong.type(new (class User {})())];
            });
            assert.deepEqual(got, ["integer", "float", "array", "date", "map", "null", "nan", "class", "User"]);
        });

        await t.test("object() prints a row per property and returns the value", async () => {
            const user = { id: 42, name: "Ada", roles: ["admin"] };
            let ret;
            const out = text(await capture(() => { ret = kong.object(user, { label: "user" }); }));
            assert.equal(ret, user);
            for (const w of ["id", "name", "roles", "Ada", "integer", "string", "array"]) assert.ok(out.includes(w), w);
        });

        await t.test("table() searches and limits rows", async () => {
            const rows = [{ name: "free", n: 1 }, { name: "pro", n: 2 }, { name: "pro-plus", n: 3 }];
            const out = text(await capture(() => kong.table(rows, { search: "pro" })));
            assert.ok(out.includes("pro-plus") && !out.includes("free"));
        });

        await t.test("diff() reports changed, added and removed by path", async () => {
            const out = text(await capture(() => kong.diff({ a: 1, gone: true, deep: { x: 1 } }, { a: 2, added: 1, deep: { x: 1 } })));
            assert.ok(out.includes("a") && out.includes("gone") && out.includes("added"));
            assert.ok(!out.includes("deep.x"));
        });

        await t.test("snapshot() returns a frozen deep copy", async () => {
            const src = { a: { b: 1 } };
            let snap;
            await capture(() => { snap = kong.snapshot(src, "before"); });
            src.a.b = 2;
            assert.equal(snap.a.b, 1);
            assert.ok(Object.isFrozen(snap) && Object.isFrozen(snap.a));
        });

        await t.test("tag(), mute(), solo() and clear()", async () => {
            const auth = kong.tag("auth");
            const db = kong.tag("db");
            assert.equal((await capture(() => auth.info("login"))).length, 1);
            kong.mute("db");
            assert.equal((await capture(() => db.info("query"))).length, 0);
            kong.unmute();
            kong.solo("auth");
            assert.equal((await capture(() => db.info("query"))).length, 0);
            kong.solo();
            assert.equal((await capture(() => db.info("query"))).length, 1);
            // clear(tag) replays what must stay: errors are always kept
            auth.error("kept");
            const replay = await capture(() => kong.clear("auth"));
            assert.ok(text(replay).includes("kept"));
        });

        await t.test("once() prints the first time only", async () => {
            const key = "once-" + Math.random();
            assert.equal((await capture(() => kong.once(key))).length, 1);
            assert.equal((await capture(() => kong.once(key))).length, 0);
        });

        await t.test("watch() logs changes until stopped", async () => {
            const cart = { total: 1 };
            let stop;
            await capture(() => { stop = kong.watch(cart, "total", { label: "cart" }); });
            assert.ok(text(await capture(() => { cart.total = 5; })).includes("1"));
            stop();
            assert.equal((await capture(() => { cart.total = 9; })).length, 0);
            assert.equal(cart.total, 9);
        });

        await t.test("count() warns once at max, then stays quiet", async () => {
            const label = "c" + Math.random();
            const calls = await capture(() => { for (let i = 0; i < 5; i++) kong.count(label, { max: 3 }); });
            assert.equal(calls.filter((c) => c[0] === "warn").length, 1);
            assert.equal(calls.length, 3);
        });

        await t.test("time(), timeEnd() and timers()", async () => {
            const label = "t" + Math.random();
            await capture(() => kong.time(label));
            let ms;
            await capture(() => { ms = kong.timeEnd(label); });
            assert.equal(typeof ms, "number");
            assert.ok(ms >= 0);
            let timers;
            await capture(() => { timers = kong.timers(); });
            assert.equal(timers[label].runs, 1);
            await capture(() => {});
            assert.ok(Number.isNaN(kong.timeEnd("never-started", { silent: true })));
        });

        await t.test("measure() and section() return the function result, sync or async", async () => {
            let a, b, c;
            await capture(async () => {
                a = kong.measure("sync", () => 7);
                b = await kong.measure("async", async () => 8);
                c = kong.section("s", () => 9);
            });
            assert.deepEqual([a, b, c], [7, 8, 9]);
        });

        await t.test("section() closes groups opened with closeOnError when an error is logged", async () => {
            const calls = await capture(() => {
                kong.section("outer", () => { kong.error("inside"); }, { closeOnError: true });
            });
            assert.ok(calls.filter((c) => c[0] === "groupEnd").length >= 1);
        });

        await t.test("assert() only prints when the condition fails", async () => {
            assert.equal((await capture(() => kong.assert(true, "fine"))).length, 0);
            assert.ok((await capture(() => kong.assert(false, "nope"))).length >= 1);
        });

        await t.test("date() returns a Date and prints the zone", async () => {
            let d;
            const out = text(await capture(() => { d = kong.date("2026-12-25T10:00:00Z", { timeZone: "Asia/Tokyo" }); }));
            assert.ok(d instanceof Date);
            assert.ok(out.includes("Tokyo") || out.includes("JST") || out.includes("2026"));
        });

        await t.test("encode() turns text into base64", () => {
            assert.equal(kong.encode("kong"), Buffer.from("kong").toString("base64"));
        });

        await t.test("ascii(), banner() and card() print plain text in Node", async () => {
            const out = text(await capture(() => {
                kong.ascii("KONG");
                kong.card("Service", { Listening: ":3000" });
            }));
            assert.ok(out.includes("█") && out.includes("Service") && out.includes(":3000"));
        });

        await t.test("every documented method exists", () => {
            const expected = ["success", "info", "warning", "warn", "error", "h1", "h2", "h3", "bold", "red", "gradient", "rainbow", "neon", "box", "custom", "svg", "image", "base64", "anima", "encode", "toBase64", "ascii", "banner", "matrix", "logo", "progress", "say", "card", "stats", "steps", "divider", "splash", "loader", "aurora", "badge", "bar", "spark", "json", "diff", "signature", "type", "object", "dir", "table", "log", "snapshot", "chart", "date", "copy", "tag", "mute", "unmute", "solo", "clear", "once", "watch", "trace", "assert", "time", "timeEnd", "timers", "count", "countReset", "section", "closeAll", "measure"];
            const missing = expected.filter((k) => typeof kong[k] !== "function");
            assert.deepEqual(missing, []);
        });
    });
}
