<div align="center">

<img src="./assets/banner.jpg" alt="kong.sole landing: a retro poster with a red beam, a deco tower and a console window" width="100%" />

# kong.sole

**Make your browser console look good.**
`kong.error()`, `kong.success()`, SVG, base64 images, banners and more. Zero dependencies, 7.9 KB gzipped.

[![License: MIT](https://img.shields.io/badge/license-MIT-E21143?style=flat-square)](./LICENSE)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-FFB03A?style=flat-square)
![ES Module](https://img.shields.io/badge/ES-module-282828?style=flat-square)
![Size](https://img.shields.io/github/size/nandovejer/console.cool/kong.sole.js?style=flat-square&label=source&color=E21143)

[Quick start](#quick-start) ·
[Demo](#demo) ·
[API](#api) ·
[Roadmap](#roadmap) ·
[Contributing](#contributing)

</div>

---

## Why

`console.log` gets the job done, but it isn't nice to look at. **kong.sole** gives you one-line helpers for:

- **Status logs:** success, info, warning and error, each with its own badge and icon
- **Headings:** `h1`, `h2` and `h3` to split long debugging sessions into sections
- **Formatting:** bold, italic, underline, strikethrough, uppercase and colors
- **Creative text:** gradients, rainbow, neon and boxes
- **Banners:** SVG banners and block-letter titles
- **Images:** SVG, base64, data URIs, URLs and Files drawn right in the console
- **Characters** that talk in speech bubbles
- **Debug helpers:** badges, bars, sparklines, colored JSON, diffs and timers
- **Nerd mode:** because debugging should be fun

## Quick start

### From a CDN

```html
<script type="module">
  import kong from 'https://cdn.jsdelivr.net/gh/nandovejer/console.cool@0.3.0/kong.sole.min.js';

  kong.h1('Hello console ');
  kong.success('Everything works');
</script>
```

### Local copy

Download [`kong.sole.js`](./kong.sole.js) into your project and import it:

```js
import kong from './kong.sole.js';

kong.info('Ready to go');
```

> [!TIP]
> Open [`index.html`](./index.html) in your browser, then open DevTools (<kbd>F12</kbd>) to see every style in action.

> [!NOTE]
> The default export is `kong`, a small object that sits next to the native `console`: `kong.error('boom')`. You can name it whatever you like when you import it.

## Demo

The landing page ([`index.html`](./index.html)) is a live playground: pick a recipe, press **Run** and the output shows up in a console panel on the page and in your real DevTools.

```sh
git clone https://github.com/nandovejer/console.cool.git
cd console.cool
python3 -m http.server 8000   # any static server works
```

Then open <http://localhost:8000> and press <kbd>F12</kbd>.

> [!NOTE]
> A static server is needed because the page loads `kong.sole.js` as an ES module, which browsers block on `file://`.

## API

Every method takes a **string** and prints it with its style.

### Status

| Method | Example |
| --- | --- |
| `kong.success(text)` | `kong.success('Connected to postgres', { latency: '12 ms' })` |
| `kong.info(text)` | `kong.info('Listening on :3000')` |
| `kong.warning(text)` | `kong.warning('Cache miss ratio 38%')` |
| `kong.error(text)` | `kong.error('Webhook failed', { orderId })` |

### Panels and dashboards

Clear, spaced-out output for services, scripts and CI logs.

```js
// Boot banner: block-letter title plus aligned details (text only, works everywhere)
kong.splash('ACME', {
  tagline: 'Payments API',
  info: { Version: '2.4.1', Environment: 'production', Region: 'eu-west-1' },
});

// Info card with a pulsing status dot
kong.card('Service ready', {
  Listening: 'http://localhost:3000',
  Database: 'postgres  12 ms',
  Workers: '4 of 4 online',
}, { status: 'ok', subtitle: 'All health checks passed' });

// Metric tiles, a sparkline and bars
kong.stats({
  'p95 latency': { value: '184 ms', delta: '-12%', good: true },
  'Error rate': { value: '0.12%', delta: '+0.03%', good: false },
});
kong.spark([3, 5, 4, 8, 6, 9, 12], { label: 'req/s', unit: 'k' });

// A checklist and a section divider
kong.divider('Boot sequence');
kong.steps([
  ['Connect database', 'done', '12 ms'],
  ['Warm cache', 'running'],
  ['Start workers', 'pending'],
]);
```

| Helper | What it prints | Options |
| --- | --- | --- |
| `splash(name, opts)` | Block letters, tagline and aligned rows | `tagline`, `info`, `from`, `to` |
| `card(title, rows, opts)` | Titled panel with aligned rows | `subtitle`, `status` (`ok`, `warn`, `error`), `accent`, `width` |
| `stats(items, opts)` | Metric tiles with optional delta | `accent`, `perRow` |
| `steps(list)` | Checklist: `done`, `running`, `pending`, `failed` | none |
| `divider(label, opts)` | Labeled rule with space above | `width`, `color` |

### Headings

| Method | Example |
| --- | --- |
| `kong.h1(text)` | `kong.h1('Checkout flow')` |
| `kong.h2(text)` | `kong.h2('Step 1: cart')` |
| `kong.h3(text)` | `kong.h3('Validating items')` |

### Format

| Method | Result |
| --- | --- |
| `kong.bold(text)` | **bold** |
| `kong.italic(text)` | *italic* |
| `kong.underline(text)` | <ins>underline</ins> |
| `kong.strikethrough(text)` | ~~strikethrough~~ |
| `kong.uppercase(text)` | UPPERCASE |
| `kong.red(text)` | red text |
| `kong.blue(text)` | blue text |
| `kong.green(text)` | green text |

### Creative text

```js
kong.gradient('Hello', '#E21143', '#FFB03A');
kong.rainbow('Rainbow');
kong.neon('Glow', '#0ff');
kong.box('Important\nmessage');
kong.custom('my style', { bg: '#7e22ce', color: '#fff', icon: '' });
```

### Banners

```js
kong.banner('my app', { subtitle: 'v1.0.0' });                      // SVG banner with gradient and animated underline
kong.banner('LAUNCH', { from: '#00e5ff', to: '#b400ff', size: 44 });
kong.ascii('KONG.SOLE');                                            // block letters, works in every browser and Node
kong.progress(72, { label: 'build' });                              // progress bar
kong.logo();                                                        // the kong.sole logo
```

| Option | Applies to | Default |
| --- | --- | --- |
| `subtitle` | `banner` | none |
| `from`, `to` | `banner`, `ascii` | brand gradient |
| `bg`, `size`, `pad`, `width` | `banner` | dark card, 56px |
| `border`, `animate` | `banner` | `true` |

### Animated

These are SVG animations (SMIL), so they move on their own and never call `console.clear()`.

```js
kong.aurora('kong.sole', { subtitle: 'make your console look good' }); // flowing gradient title
kong.loader('Deploying to production');                                  // indeterminate progress bar
kong.matrix('KONG');                                                     // matrix rain forming a word
await kong.anima('https://example.com/cat.gif');                         // any animated GIF or SVG
```

> [!NOTE]
> Animations run where the console renders SVG backgrounds (Chrome and Edge). Check yours in the DevTools before relying on them.

### Images, base64 and SVG

`kong.image()` takes almost anything and draws it in the console:

```js
await kong.image('iVBORw0KGgoAAAANSUhEUg...');          // raw base64 (the format is detected: png, jpeg, gif, webp, svg)
await kong.image('data:image/png;base64,iVBOR...');     // data URI
await kong.image('./photo.jpg', { width: 200 });        // URL, keeps the aspect ratio
await kong.image(fileInput.files[0]);                   // File or Blob
kong.svg('<svg width="120" height="120">...</svg>');    // SVG markup, animated SVG too
await kong.anima('https://example.com/cat.gif');           // animated GIF or SVG, same sources as image()

const b64 = kong.encode('<svg xmlns="http://www.w3.org/2000/svg">...</svg>'); // text to base64
const png = await kong.toBase64('./photo.png');                              // URL or File to base64
kong.base64(png);                                                            // explicit alias of image()
```

| Option | Meaning |
| --- | --- |
| `width`, `height` | Size in pixels. With only `width`, the aspect ratio is kept. |
| `scale` | Multiplies the natural size. |
| `max` | Largest width when no size is given. Default `480` (`360` for `anima`). |
| `mime` | Force the type of a raw base64 string. |

> [!NOTE]
> Images and SVG use `background-image` inside `%c`, which **Chrome and Edge** render fully. Other browsers may ignore it.

### Characters

```js
kong.say('You shall not pass!', 'wizard'); // wizard | cat | robot | ghost
```

```
 _____________________
< You shall not pass! >
 ---------------------
   \   (o_o)
    \ /|\
      / \
```

### Debug helpers

```js
kong.badge('build', 'passing'); // two-tone badge
kong.badge('coverage', '72%', '#facc15');
kong.bar({ js: 70, css: 20, html: 10 }); // horizontal bars
kong.spark([1, 5, 3, 8, 2]); // ▁▅▃█▂
kong.json({ name: 'cool', tags: ['log'] }); // syntax colors
kong.diff({ a: 1 }, { a: 2 }); // red / green lines
kong.section('Auth', () => { /* … */ }); // styled group, sync or async
kong.measure('fetch', () => fetchUsers()); // green < 100ms, yellow < 500ms, red
```

### Signature

```js
kong.signature('Ada', 'ada.dev'); // a gradient name and a link for curious devs
```

### Options

```js
kong.enabled = false; // silence everything (for example in production)
```

- Every text method accepts **several arguments**. Strings are joined and objects are passed through untouched, so they stay inspectable: `kong.info('user', user)`.
- `error` and `warning` use the native `console.error` and `console.warn`, so DevTools filters and stack traces keep working. `kong.warn` is an alias of `kong.warning`.
- Outside a browser (Node) everything prints as plain text.

### Production

`kong.enabled = false` turns every method into a no-op (about 0.02 µs per call). Decide the value once, at startup:

```js
// Bundler (Vite, webpack, esbuild...)
kong.enabled = process.env.NODE_ENV !== 'production';

// No bundler: only on your own domain
kong.enabled = location.hostname !== 'myapp.com';

// Switch it back on in production for support, without redeploying
kong.enabled = new URLSearchParams(location.search).has('debug')
  || localStorage.getItem('kong') === '1';
```

To ship **zero bytes**, load it only in development and let the bundler drop the rest (`sideEffects: false` is already set):

```js
if (import.meta.env.DEV) {
  const { default: kong } = await import('kong.sole');
  kong.h1('dev mode');
}
```

Or strip the calls with terser:

```js
// terser options
{ compress: { pure_funcs: ['kong.info', 'kong.success', 'kong.json', 'kong.card'] } }
```

> [!WARNING]
> `kong.json` and `kong.card` print whatever you give them. Do not pass passwords, tokens or personal data, and keep `kong.enabled = false` in production.

> [!NOTE]
> `kong` never touches `window` or the native `console`; everything lives under the object you import. It does not clash with Sentry, Datadog or similar tools, and `error` and `warning` still go through the native `console`. It is unrelated to Kong Gateway, so import it under any name you like.

### Extras

| Method |
| --- |
| `kong.poo(text)` |
| `kong.gandalf(text)` |
| `kong.wonderwoman(text)` |

## Performance

- **7.9 KB** minified and gzipped (7.0 KB with brotli). Use `kong.sole.min.js` from a CDN or your bundler. `sideEffects: false` lets bundlers drop what you do not use.
- **Free when off.** With `kong.enabled = false` every helper returns before doing any work. A call costs about 0.02 microseconds, so you can leave the logs in production code.
- **Cheap when on.** Styles are built once at load, colors are cached and block letters are cached per character. `kong.ascii('KONG.SOLE')` is about 6x faster than in 0.2 and `kong.gradient()` about 3.5x faster.
- Calls that print images are the only async ones (`kong.image`), because the browser has to decode the picture to know its size.

| Call (20 chars) | Enabled | Disabled |
| --- | --- | --- |
| `kong.info('text')` | 0.13 us | 0.02 us |
| `kong.gradient(text)` | 2.9 us | 0.03 us |
| `kong.ascii('KONG.SOLE')` | 6.6 us | 0.03 us |

Measured on Node 22 with `console` stubbed out, so it counts only the library work.

## Browser support

Styling relies on the `%c` directive of the browser console.

| Feature | Chrome / Edge | Firefox | Safari |
| --- | :---: | :---: | :---: |
| Colors, fonts, badges | Yes | Yes | Yes |
| Gradient, rainbow, neon | Yes | Yes | Partial, some CSS ignored |
| `svg()`, `image()`, `banner()` | Yes | Limited | Limited |

Each browser supports a different set of CSS properties inside the console, so logs can look a little different from one to another. Please [open an issue](https://github.com/nandovejer/console.cool/issues) if something looks off.

## Roadmap

- [x] `svg()`, `image()` (base64, data URI, URL, File), `encode()` and `toBase64()`
- [x] `banner()`, `ascii()`, `progress()` and `logo()`
- [x] `gradient()`, `rainbow()`, `neon()` and `box()`
- [x] `say()` with characters
- [x] `badge()`, `bar()`, `spark()`, `json()`, `diff()`, `section()` and `measure()`
- [x] `signature()`
- [x] Plain text fallback outside the browser
- [ ] Themes: `retro`, `vaporwave` and `auto` (light/dark aware)
- [ ] ANSI colors in Node.js
- [ ] Publish to npm, with TypeScript types
- [ ] Tests and CI
- [ ] Interactive demo on GitHub Pages

Have an idea? [Open an issue](https://github.com/nandovejer/console.cool/issues)

## Contributing

Contributions are very welcome.

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-cool-style`
3. Add your style to `STYLES` (and an icon to `ICON`, if it has one), or a new helper, in [`kong.sole.js`](./kong.sole.js)
4. Rebuild the minified file with `npm run build` (needs `terser`)
5. Try it out in [`index.html`](./index.html) (add a recipe to the `RECIPES` list to show it in the playground)
6. Open a pull request

## License

[MIT](./LICENSE) © Nando Muñoz

<div align="center">
<sub>If you believe in magic, open the console.</sub>
</div>
