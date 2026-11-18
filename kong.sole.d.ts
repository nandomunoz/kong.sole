/**
 * Types for kong.sole. The same declarations serve the full build and the add-on modules
 * (`kong.sole/core`, `kong.sole/inspect`...). A method that belongs to a module you did not
 * load is `undefined` at runtime.
 */

export type Method = "log" | "info" | "warn" | "error";
export type Theme = "auto" | "dark" | "light";

/** Console values after the text: objects, arrays and functions stay inspectable. */
export type Args = unknown[];

export interface ImageOptions {
    width?: number;
    height?: number;
    /** Multiplies the natural size. */
    scale?: number;
    /** Largest width when no size is given. Default 480 (360 for `anima`). */
    max?: number;
    /** Force the type of a raw base64 string. */
    mime?: string;
}

export interface BannerOptions {
    subtitle?: string;
    from?: string;
    to?: string;
    bg?: string;
    size?: number;
    pad?: number;
    width?: number;
    border?: boolean;
    animate?: boolean;
}

export interface CardOptions {
    subtitle?: string;
    status?: "ok" | "warn" | "error";
    accent?: string;
    bg?: string;
    width?: number;
}

export type StepStatus = "done" | "running" | "pending" | "failed";
export type Step = [label: string, status: StepStatus, note?: string] | { label: string; status: StepStatus; note?: string };

export interface StatItem {
    value: string | number;
    delta?: string;
    good?: boolean;
}

export interface ObjectOptions {
    label?: string;
    /** Also list nested properties as `profile.city`. */
    depth?: number;
    /** Row limit. Default 60. */
    max?: number;
    /** Match property names (string or RegExp). */
    filter?: string | RegExp;
    /** Match a type name, for example `"string"`. */
    type?: string;
    /** Include non-enumerable properties. */
    all?: boolean;
    /** Walk the prototype chain. */
    inherited?: boolean;
}

export interface TableOptions {
    columns?: string[];
    /** Quick filter on any cell. */
    search?: string;
    depth?: number;
    max?: number;
    title?: string;
}

export interface TimerStats {
    runs: number;
    min: number;
    avg: number;
    max: number;
    total: number;
}

export interface Tagged {
    log(...args: Args): void;
    debug(...args: Args): void;
    info(...args: Args): void;
    success(...args: Args): void;
    warn(...args: Args): void;
    error(...args: Args): void;
}

export interface Kong {
    /** Set to `false` to turn every helper into a no-op (production). */
    enabled: boolean;
    /** Reading returns the mode in use ("dark" or "light"). Writing accepts "auto", "dark" or "light". */
    theme: Theme;

    /* core: status, headings, format */
    success(...args: Args): void;
    info(...args: Args): void;
    warning(...args: Args): void;
    /** Alias of `warning`. */
    warn(...args: Args): void;
    error(...args: Args): void;
    h1(...args: Args): void;
    h2(...args: Args): void;
    h3(...args: Args): void;
    bold(...args: Args): void;
    italic(...args: Args): void;
    underline(...args: Args): void;
    uppercase(...args: Args): void;
    strikethrough(...args: Args): void;
    red(...args: Args): void;
    blue(...args: Args): void;
    green(...args: Args): void;
    poo(...args: Args): void;
    gandalf(...args: Args): void;
    wonderwoman(...args: Args): void;

    /* text */
    custom(text: string, options?: { bg?: string; color?: string; icon?: string; css?: string }): void;
    gradient(text: string, from?: string, to?: string, options?: { size?: number }): void;
    rainbow(text: string, options?: { size?: number }): void;
    neon(text: string, color?: string, options?: { size?: number }): void;
    box(text: string, options?: { color?: string }): void;

    /* images */
    svg(markup: string, options?: { width?: number; height?: number }): void;
    image(source: string | Blob, options?: ImageOptions): Promise<void>;
    /** Alias of `image`, for raw base64 strings. */
    base64(base64: string, options?: ImageOptions): Promise<void>;
    /** Animated GIF or SVG, same sources as `image`. */
    anima(source: string | Blob, options?: ImageOptions): Promise<void>;
    /** Text to base64. */
    encode(text: string): string;
    toBase64(source: string | Blob, options?: { dataUri?: boolean }): Promise<string>;

    /* banners */
    ascii(text: string, options?: { from?: string; to?: string; block?: string }): void;
    banner(text: string, options?: BannerOptions): void;
    matrix(
        text?: string,
        options?: { width?: number; height?: number; color?: string; fontSize?: number; speed?: number; bg?: string; charset?: string },
    ): void;
    logo(): void;
    progress(value: number, options?: { label?: string; width?: number }): void;

    /* say */
    say(text: string, who?: "cat" | "wizard" | "robot" | "ghost"): void;

    /* panels */
    card(title: string, rows?: Record<string, unknown> | Array<[string, unknown]>, options?: CardOptions): void;
    stats(items: Record<string, StatItem>, options?: { accent?: string; bg?: string; perRow?: number }): void;
    steps(list: Step[]): void;
    divider(label?: string, options?: { width?: number; color?: string }): void;
    splash(name: string, options?: { tagline?: string; info?: Record<string, unknown>; from?: string; to?: string }): void;
    loader(label?: string, options?: { color?: string; width?: number }): void;
    aurora(text: string, options?: { subtitle?: string; colors?: string[]; size?: number; width?: number; speed?: number }): void;

    /* helpers */
    badge(label: string, value: string | number, color?: string): void;
    bar(data: Record<string, number>, options?: { width?: number }): void;
    spark(values: number[], options?: { label?: string; unit?: string }): void;
    json(value: unknown): void;
    diff(a: unknown, b: unknown): void;
    signature(name: string, link?: string): void;

    /* inspect */
    /** Prints the precise type and returns it ("array", "integer", a class name...). */
    type(value: unknown, label?: string): string;
    object<T>(value: T, options?: ObjectOptions): T;
    dir<T>(value: T, options?: ObjectOptions): T;
    table(data: unknown, options?: TableOptions): void;
    /** Logs a copy, so later mutations do not change what you see. */
    log<T>(value: T, options?: { depth?: number; label?: string }): T;
    /** Frozen deep copy, logged and returned. */
    snapshot<T>(value: T, label?: string): Readonly<T>;
    chart(data: number[] | Record<string, number>, options?: { type?: "bar" | "line"; title?: string; width?: number; height?: number; color?: string }): void;
    date(input?: Date | string | number, options?: { locale?: string; timeZone?: string }): Date;
    copy(data: unknown): Promise<string>;

    /* debug */
    tag(name: string, options?: { color?: string }): Tagged;
    mute(...names: string[]): void;
    unmute(...names: string[]): void;
    solo(name?: string): void;
    /** Removes a tag's lines (errors stay). With no argument it clears everything. */
    clear(tag?: string): void;
    /** Prints the first time only. Returns whether it printed. */
    once(...args: Args): boolean;
    /** Logs every change of `obj[prop]`. Returns a function that stops watching. */
    watch<T extends object>(obj: T, prop: keyof T & string, options?: { label?: string }): () => void;
    trace(label?: string, options?: { hide?: string[]; limit?: number }): void;
    assert(condition: unknown, message?: string, options?: { pause?: boolean }): void;
    time(label?: string): void;
    /** Prints the time and returns it in milliseconds (NaN if the timer was not started). */
    timeEnd(label?: string, options?: { silent?: boolean }): number;
    timers(): Record<string, TimerStats>;
    /** Returns the new count. Warns once at `max` and then stays quiet. */
    count(label?: string, options?: { max?: number }): number;
    countReset(label?: string): boolean;
    section<T>(title: string, fn: () => T, options?: { collapsed?: boolean; closeOnError?: boolean }): T;
    /** Closes every group that is still open. */
    closeAll(): void;
    /** Times a function (sync or async) and returns its result. */
    measure<T>(label: string, fn: () => T): T;
}

declare const kong: Kong;
export default kong;
