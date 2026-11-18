// Bundles the ES modules in src/ into single minified files for CDNs and <script type="module">.
//   kong.sole.min.js       everything (same API as kong.sole.js)
//   kong.sole.lite.min.js  status logs, formatting, creative text and small debug helpers
import { build } from "esbuild";
import { minify } from "terser";
import { readFile, writeFile } from "node:fs/promises";
import { gzipSync, brotliCompressSync } from "node:zlib";

const { version } = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const targets = [
    ["kong.sole.js", "kong.sole.min.js", "kong.sole"],
    ["src/lite.js", "kong.sole.lite.min.js", "kong.sole lite"],
];

for (const [entry, out, name] of targets) {
    const bundled = await build({ entryPoints: [entry], bundle: true, format: "esm", write: false, legalComments: "none" });
    const { code } = await minify(bundled.outputFiles[0].text, {
        module: true,
        ecma: 2020,
        compress: { passes: 2, pure_getters: true, drop_debugger: false }, // drop_debugger: kong.assert can pause
        mangle: { toplevel: true },
        format: { preamble: `/*! ${name} v${version} | MIT */` },
    });
    await writeFile(out, code + "\n");
    const buf = Buffer.from(code);
    console.log(`${out.padEnd(24)} ${(buf.length / 1024).toFixed(1)} KB, gzip ${(gzipSync(buf, { level: 9 }).length / 1024).toFixed(1)} KB, brotli ${(brotliCompressSync(buf).length / 1024).toFixed(1)} KB`);
}
