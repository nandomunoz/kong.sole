/**
 * kong.sole: make your browser console look good.
 * Zero dependencies. ES module. Falls back to plain text outside browsers.
 *
 * This is the full build: every module registers its helpers on the same `kong` object.
 * To load only what you use, import `kong.sole/core` and add the modules you want:
 *   import kong from "kong.sole/core";
 *   import "kong.sole/inspect";
 */
import kong from "./src/core.js";
import "./src/text.js";
import "./src/images.js";
import "./src/banners.js";
import "./src/say.js";
import "./src/panels.js";
import "./src/helpers.js";
import "./src/inspect.js";
import "./src/debug.js";

export default kong;
