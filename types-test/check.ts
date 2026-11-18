// Compiled by `npm run types` (tsc --noEmit). It only has to type-check: it is never run.
import kong, { type Kong, type Tagged } from "../kong.sole.js";

const k: Kong = kong;
const name: string = kong.type([1, 2]);
const ms: number = kong.timeEnd("render");
const stop: () => void = kong.watch({ total: 1 }, "total", { label: "cart" });
const frozen: Readonly<{ a: number }> = kong.snapshot({ a: 1 });
const log: Tagged = kong.tag("auth", { color: "#0f0" });
const first: boolean = kong.once("config loaded");
const n: number = kong.count("retry", { max: 100 });
const d: Date = kong.date("2026-12-25", { timeZone: "Asia/Tokyo" });
const timers: Record<string, { runs: number; avg: number }> = kong.timers();
const result: number = kong.measure("sum", () => 1 + 1);
const later: Promise<string> = kong.measure("fetch", async () => "ok");

kong.theme = "light";
kong.enabled = process.env.NODE_ENV !== "production";
kong.card("Service ready", { Listening: ":3000" }, { status: "ok" });
kong.steps([["Connect", "done", "12 ms"], ["Warm cache", "running"]]);
kong.table([{ a: 1 }], { search: "x", max: 20 });
kong.chart({ a: 1, b: 2 }, { type: "line", title: "Signups" });
kong.object({ a: 1 }, { depth: 1, filter: /a/, type: "integer" });
log.error("boom", new Error("x"));
void [k, name, ms, stop, frozen, first, n, d, timers, result, later];

// @ts-expect-error unknown method
kong.nope();
// @ts-expect-error theme only accepts auto, dark or light
kong.theme = "blue";
// @ts-expect-error status must be ok, warn or error
kong.card("x", {}, { status: "fine" });
