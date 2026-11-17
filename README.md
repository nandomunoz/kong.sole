<div align="center">

<img src="./assets/banner.jpg" alt="kong.sole landing: a retro poster with a red beam, a deco tower and a console window" width="100%" />

# kong.sole

**Make your browser console look good.**
`kong.error()`, `kong.success()`, SVG, base64 images, banners and more. Dark and light aware, zero dependencies, 14.3 KB gzipped.

[![npm](https://img.shields.io/npm/v/kong.sole?style=flat-square&color=E21143)](https://www.npmjs.com/package/kong.sole)
[![jsDelivr](https://img.shields.io/jsdelivr/npm/hm/kong.sole?style=flat-square&color=282828)](https://www.jsdelivr.com/package/npm/kong.sole)
[![License: MIT](https://img.shields.io/badge/license-MIT-E21143?style=flat-square)](./LICENSE)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-FFB03A?style=flat-square)
![ES Module](https://img.shields.io/badge/ES-module-282828?style=flat-square)
![Size](https://img.shields.io/github/size/nandovejer/kong.sole/kong.sole.js?style=flat-square&label=source&color=E21143)

[Install](#install) ·
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
- **Inspection:** objects, tables, diffs, snapshots, types and charts
- **Debugging:** tagged loggers, watchers, timers, counters, assertions and clean stack traces
- **Themes:** colors that stay readable in dark and light consoles

## Install

### npm

```sh
npm install kong.sole
```

```js
import kong from 'kong.sole';

kong.h1('Hello console');
kong.success('Everything works');
```

Works with Vite, webpack, esbuild and any bundler that reads ES modules. The package ships the readable `kong.sole.js` and the minified `kong.sole.min.js` (`kong.sole/min`).

### CDN

No build step needed. Pin a version so an update never changes your page.

```html
<script type="module">
  import kong from 'https://cdn.jsdelivr.net/npm/kong.sole@0.4.0/kong.sole.min.js';

  kong.h1('Hello console');
  kong.success('Everything works');
</script>
```

| CDN | URL |
| --- | --- |
| jsDelivr (npm) | `https://cdn.jsdelivr.net/npm/kong.sole@0.4.0/kong.sole.min.js` |
| unpkg | `https://unpkg.com/kong.sole@0.4.0/kong.sole.min.js` |
| jsDelivr (GitHub tag) | `https://cdn.jsdelivr.net/gh/nandovejer/kong.sole@0.4.0/kong.sole.min.js` |

> [!NOTE]
> The `@0.4.0` links start working once version 0.4.0 is published to npm and tagged on GitHub. Before that, use `@0.3.0`, which has the core helpers but not the inspect, debug and measure sections.

### Local copy

Download [`kong.sole.min.js`](./kong.sole.min.js) (or the readable [`kong.sole.js`](./kong.sole.js)) into your project and import it:

```js
import kong from './kong.sole.min.js';

kong.info('Ready to go');
```

> [!TIP]
> Open [`index.html`](./index.html) in your browser, then open DevTools (<kbd>F12</kbd>) to see every style in action.

> [!NOTE]
> The default export is `kong`, a small object that sits next to the native `console`: `kong.error('boom')`. You can name it whatever you like when you import it.

## Demo

The landing page ([`index.html`](./index.html)) is a live playground: pick a recipe, press **Run** and the output shows up in a console panel on the page and in your real DevTools.

```sh
git clone https://github.com/nandovejer/kong.sole.git
cd kong.sole
python3 -m http.server 8000   # any static server works
```

Then open <http://localhost:8000> and press <kbd>F12</kbd>.

The page takes its surfaces, text colors, dividers, focus ring and spacing from the design tokens of [LUZ](https://github.com/nandovejer/luz) (`@luz-ds/tokens`, only the tokens, no components or fonts). They follow the light, dark and high contrast modes, and the Theme button on the page sets the same `data-theme` attribute. The tokens are a **dev dependency of the landing only**: the published `kong.sole` package has no dependencies. The CSS is vendored in `assets/luz-tokens.min.css` (MIT, see `assets/LUZ-LICENSE`); run `npm install` and `npm run vendor` to refresh it.

> [!NOTE]
> A static server is needed because the page loads `kong.sole.js` as an ES module, which browsers block on `file://`.

## API

Text helpers take a string (or several values) and print it with their style. Inspection helpers take any value.

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

### Inspect

```js
const user = { id: 42, name: 'Ada', roles: ['admin'], profile: { city: 'London' }, lastLogin: null };

kong.object(user, { label: 'user' });               // every property: key, type, value, size, plus frozen/circular flags and the prototype chain
kong.object(user, { depth: 1, max: 40 });           // also list nested properties as profile.city
kong.dir(user, { filter: 'name', type: 'string' }); // walks the prototype chain; filter by name (string or RegExp) or by type
kong.type(user.roles, 'roles');                     // prints the precise type and returns it: "array"
```

`kong.type()` uses the same subtype names as [js-subtype](https://github.com/nandovejer/js-subtype) (`integer`, `float`, `array`, `date`, `map`, `set`, `promise`...). It is built in, so there is no dependency to install. Class instances return their class name and `NaN` returns `nan`.

```js
kong.table(orders);                              // nested objects become columns: customer.name, customer.tier
kong.table(orders, { search: 'pro', max: 20 });  // quick filter on any cell, and a row limit
kong.log(state, { depth: 2, label: 'state' });   // logs a copy, so later mutations do not change what you see
const frozen = kong.snapshot(state, 'before');   // frozen deep copy, logged and returned
kong.diff(before, after);                        // changed, added and removed properties, by path
kong.chart([12, 18, 9, 22], { type: 'line', title: 'Signups' }); // or { type: 'bar' }; objects work too
kong.date();                                     // time, weekday, ISO week, day of year, offset, zone, ISO and unix
kong.date('2026-12-25', { timeZone: 'Asia/Tokyo' });
await kong.copy({ build: 'a9f3c21' });           // to the clipboard: strings as they are, other values as JSON
```

### Debug

```js
const auth = kong.tag('auth');   // a named logger with its own color
auth.info('Login ok');           // also .log .debug .success .warn .error
kong.mute('db');                 // hide a channel (kong.unmute() brings all back)
kong.solo('auth');               // show only one channel (kong.solo() resets)
kong.clear('auth');              // removes that channel; errors always stay. kong.clear() clears everything

kong.once('Config loaded');      // prints the first time only, returns whether it printed
const stop = kong.watch(cart, 'total', { label: 'cart' }); // logs every change of cart.total
stop();

kong.assert(user.active, 'User must be active', { pause: true }); // pause: true also stops in the debugger
kong.trace('who called me?', { hide: ['node_modules'], limit: 8 }); // stack trace without library frames
```

### Measure

```js
kong.time('render');
render();
const ms = kong.timeEnd('render');  // prints the time and returns it as a number
kong.timers();                      // runs, min, avg, max and total for every timer, returned as an object

for (const job of jobs) kong.count('retry', { max: 100 }); // warns once at 100 and then stays quiet
kong.measure('Charge card', () => charge());               // time a function (sync or async)

kong.section('Checkout', () => { /* ... */ }, { collapsed: true });   // folded group
kong.section('Payment', () => { /* ... */ }, { closeOnError: true }); // an error inside ends the group
kong.closeAll();                    // closes every group still open
```

### Themes

Every color that touches text, a table or an SVG panel comes from a dark or a light palette, so output stays readable in either DevTools theme.

```js
kong.theme;            // "dark" or "light": the mode in use
kong.theme = 'light';  // force it ("dark" too); kong.theme = 'auto' follows prefers-color-scheme again
```

The landing page does the same: it follows your system and has a Theme button (auto, dark, light). The preview console on the page switches with it.

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

- **14.3 KB** minified and gzipped (12.8 KB with brotli). Use `kong.sole.min.js` from a CDN or your bundler. It is one object, so bundlers cannot drop unused helpers yet; splitting it into modules is on the roadmap.
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

Firefox is detected from its user agent: it lays out console lines differently and cuts tall images (charts, cards, banners) to one row, so there the image box gets a fixed height. Chrome and Edge keep the original method.

Each browser supports a different set of CSS properties inside the console, so logs can look a little different from one to another. Please [open an issue](https://github.com/nandovejer/kong.sole/issues) if something looks off.

## Roadmap

- [x] `svg()`, `image()` (base64, data URI, URL, File), `encode()` and `toBase64()`
- [x] `banner()`, `ascii()`, `progress()` and `logo()`
- [x] `gradient()`, `rainbow()`, `neon()` and `box()`
- [x] `say()` with characters
- [x] `badge()`, `bar()`, `spark()`, `json()`, `diff()`, `section()` and `measure()`
- [x] `signature()`
- [x] Plain text fallback outside the browser
- [x] Dark and light themes (`kong.theme`)
- [x] `object()`, `dir()`, `type()`, `table()`, `snapshot()`, `chart()`, `date()` and `copy()`
- [x] `tag()`, `once()`, `watch()`, `trace()`, `assert()`, `time()`, `timers()` and `count()`
- [ ] Split into modules so bundlers can drop what you do not use
- [ ] ANSI colors in Node.js
- [ ] Publish to npm, with TypeScript types
- [ ] Tests and CI
- [ ] Interactive demo on GitHub Pages

Have an idea? [Open an issue](https://github.com/nandovejer/kong.sole/issues)

## Contributing

Contributions are very welcome.

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-cool-style`
3. Add your style to `STYLES` (and an icon to `ICON`, if it has one), or a new helper, in [`kong.sole.js`](./kong.sole.js)
4. Rebuild the minified file with `npm run build` (needs `terser`)
5. Try it out in [`index.html`](./index.html) (add a recipe to the `RECIPES` list to show it in the playground). Colors of the page come from the LUZ tokens, so use `var(--luz-...)` for neutral surfaces and text instead of new hex values
6. Open a pull request

## License

[MIT](./LICENSE) © Nando Muñoz

<div align="center">
<sub>If you believe in magic, open the console.</sub>
</div>
