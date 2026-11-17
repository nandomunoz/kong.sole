/**
 * kong.sole · Images, base64 and SVG
 */

import { kong, gate, emit, isBrowser, state } from "./core.js";

/* ------------------------------------------------------------------ */
/* Images, base64 & SVG                                                */
/* ------------------------------------------------------------------ */

// Firefox lays out the console line differently from Chrome and Edge, so it needs its own box.
const isFirefox = isBrowser && typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);

function paintBox(url, w, h) {
    const W = Math.max(1, Math.round(w));
    const H = Math.max(1, Math.round(h));
    const bg = `background:url("${url}") no-repeat center/contain`;
    // Firefox ignores vertical padding when it sizes the line, so a tall image would be cut to one
    // row. There the text (a non-breaking space) gets a real height: font-size and line-height equal
    // to h, with horizontal padding for the width.
    if (isFirefox) return `font-size:${H}px;line-height:${H}px;padding:0 ${Math.round(W / 2)}px;${bg}`;
    // Chrome, Edge and the rest: a 1px font plus padding makes a box of exactly w by h.
    return `font-size:1px;padding:${Math.round(H / 2)}px ${Math.round(W / 2)}px;${bg}`;
}

const withNs = (markup) => (/xmlns=/.test(markup) ? markup : markup.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'));
const isSvgMarkup = (s) => typeof s === "string" && /^\s*<(svg|\?xml)/i.test(s);

// First base64 characters of common image formats.
const MIME_SIGNATURES = [
    ["iVBOR", "image/png"],
    ["/9j/", "image/jpeg"],
    ["R0lGOD", "image/gif"],
    ["UklGR", "image/webp"],
    ["PHN2Zy", "image/svg+xml"],
    ["PD94bW", "image/svg+xml"],
    ["AAABAA", "image/x-icon"],
];
const sniffMime = (b64) => (MIME_SIGNATURES.find(([sig]) => b64.startsWith(sig)) || [])[1] || "image/png";

/** Anything image-like to a CSS-safe URL: SVG markup, data URI, URL or raw base64. */
function toUrl(src, mime) {
    const s = String(src).trim();
    if (isSvgMarkup(s)) return `data:image/svg+xml;utf8,${encodeURIComponent(withNs(s))}`;
    if (/^(data:|blob:|https?:|\/|\.\/|\.\.\/)/i.test(s)) return s;
    return `data:${mime || sniffMime(s)};base64,${s.replace(/\s+/g, "")}`;
}

const readBlob = (blob) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });

const loadImage = (url) =>
    new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });

/**
 * Draw an SVG string in the console (best in Chrome / Edge).
 * Size comes from options, then the svg width/height, then its viewBox.
 */
kong.svg = (markup, { width, height } = {}) => {
    const attr = (name) => (markup.match(new RegExp(`<svg[^>]*\\s${name}="([\\d.]+)(?:px)?"`)) || [])[1];
    const vb = (markup.match(/viewBox="[\d.\s-]*?([\d.]+)[\s,]+([\d.]+)"/) || []).slice(1);
    const w = width || Number(attr("width")) || Number(vb[0]) || 100;
    const h = height || (width && (Number(attr("height")) * width) / (Number(attr("width")) || width)) || Number(attr("height")) || Number(vb[1]) || w;
    emit("log", [["\u00a0", paintBox(toUrl(markup), w, h)]]);
};

/**
 * Draw an image in the console. Accepts raw base64, data URIs, URLs, SVG markup
 * and File / Blob objects. Resolves once printed.
 *   await kong.image("iVBORw0KGgo...")
 *   await kong.image(fileInput.files[0], { width: 200 })
 */
kong.image = async (src, { width, height, scale = 1, max = 480, mime } = {}) => {
    if (!isBrowser || !state.enabled) return;
    if (isSvgMarkup(src)) return kong.svg(src, { width, height });
    let url;
    try {
        url = typeof Blob !== "undefined" && src instanceof Blob ? await readBlob(src) : toUrl(src, mime);
    } catch {
        return kong.warning("kong.image: could not read the source");
    }
    const img = await loadImage(url);
    if (!img) return kong.warning("kong.image: could not load the image (is it valid base64?)");
    const nw = img.naturalWidth || 100;
    const nh = img.naturalHeight || 100;
    let w = width || nw * scale;
    let h = height || (width ? (nh * width) / nw : nh * scale);
    if (!width && !height && w > max) {
        h = (h * max) / w;
        w = max;
    }
    emit("log", [["\u00a0", paintBox(url, w, h)]]);
};

/** Explicit alias: kong.base64("iVBORw0KGgo...") */
kong.base64 = (b64, options) => kong.image(b64, options);

/**
 * Play an animated GIF or SVG in the console. It takes the same sources as
 * kong.image (URL, base64, data URI, File or Blob, SVG markup) and keeps the
 * original bytes, so the animation is never re-encoded.
 *   kong.anima("https://example.com/cat.gif")
 *   kong.anima(fileInput.files[0], { width: 200 })
 */
kong.anima = (src, options = {}) => kong.image(src, { max: 360, ...options });

/** Text (for example SVG markup) to a raw base64 string. */
kong.encode = (text) => {
    const bytes = new TextEncoder().encode(String(text));
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
};

/** File, Blob or URL to a raw base64 string (or a full data URI with { dataUri: true }). */
kong.toBase64 = async (source, { dataUri = false } = {}) => {
    const blob = source instanceof Blob ? source : await (await fetch(source)).blob();
    const uri = await readBlob(blob);
    return dataUri ? uri : uri.slice(uri.indexOf(",") + 1);
};

/* When disabled, output helpers do no work at all. */
gate(["svg"]);

export default kong;
