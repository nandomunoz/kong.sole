/**
 * kong.sole · Characters that talk
 */

import { kong, gate, GLOBAL, emit } from "./core.js";

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

/* When disabled, output helpers do no work at all. */
gate(["say"]);

export default kong;
