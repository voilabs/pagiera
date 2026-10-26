/**
 * A small, safe expression language for `{{…}}` templates.
 *
 * Authors need more than a field path: "if the status is draft say Taslak",
 * "the names of the tags, comma separated", "the price with VAT". Plain
 * JavaScript would do it, but templates are rendered on the server, and
 * anyone who can edit a page — including an AI with an MCP token — would then
 * run code next to the database credentials. So this is a JavaScript-shaped
 * language that is interpreted, never `eval`ed:
 *
 * - literals: numbers, 'strings', "strings", true, false, null, [lists]
 * - the row's fields by name (`title`, `author.name`, `tags[0]`); `$` or
 *   `item` is the row itself
 * - operators: `+ - * / %`, `== != === !== < <= > >=`, `&& || ??`, `!`,
 *   `cond ? a : b`, optional chaining `?.`
 * - methods on strings and lists from a fixed list (replace, split, map,
 *   filter, find, join…) and arrow functions as their arguments
 * - helpers: `Math.round(x)`, `String(x)`, `Number(x)`, `date(x, "d MMMM")`,
 *   `number(x, 2)`, `upper(x)`, `lower(x)`, `len(x)`
 *
 * There is no access to globals, prototypes or the host: identifiers only
 * read the row, member access only reads own data properties, and only the
 * listed methods can be called. Every evaluation has a step budget and caps
 * on string and list sizes, so a template cannot hang or bloat a render. Any
 * error makes the expression produce `undefined`, which the template then
 * shows as empty (or as its `default`).
 */

import { formatValue } from "./format";

const MAX_SOURCE = 500;
const MAX_STEPS = 20_000;
const MAX_STRING = 10_000;
const MAX_LIST = 1_000;

type Node =
    | { type: "lit"; value: unknown }
    | { type: "id"; name: string }
    | { type: "list"; items: Node[] }
    | { type: "member"; object: Node; property: Node; optional: boolean; computed: boolean }
    | { type: "call"; callee: Node; args: Node[]; optional: boolean }
    | { type: "unary"; op: string; arg: Node }
    | { type: "binary"; op: string; left: Node; right: Node }
    | { type: "cond"; test: Node; then: Node; else: Node }
    | { type: "arrow"; params: string[]; body: Node };

class ExpressionError extends Error {}

/* ---------------------------------------------------------------- tokenizer */

type Token = { kind: "num" | "str" | "id" | "op" | "end"; value: string };

const OPERATORS = [
    "===", "!==", "?.", "??", "&&", "||", "==", "!=", "<=", ">=", "=>",
    "+", "-", "*", "/", "%", "<", ">", "!", "?", ":", ".", ",", "(", ")", "[", "]",
];

function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < source.length) {
        const char = source[i]!;
        if (/\s/.test(char)) { i++; continue; }
        if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(source[i + 1] ?? ""))) {
            const match = /^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i.exec(source.slice(i))!;
            tokens.push({ kind: "num", value: match[0] });
            i += match[0].length;
            continue;
        }
        if (char === '"' || char === "'") {
            let value = "";
            i++;
            while (i < source.length && source[i] !== char) {
                if (source[i] === "\\" && i + 1 < source.length) {
                    const next = source[i + 1]!;
                    value += next === "n" ? "\n" : next === "t" ? "\t" : next;
                    i += 2;
                } else value += source[i++];
            }
            if (source[i] !== char) throw new ExpressionError("Unterminated string");
            i++;
            tokens.push({ kind: "str", value });
            continue;
        }
        if (/[A-Za-z_$À-￿]/.test(char)) {
            const match = /^[A-Za-z_$À-￿][\w$À-￿]*/.exec(source.slice(i))!;
            tokens.push({ kind: "id", value: match[0] });
            i += match[0].length;
            continue;
        }
        const op = OPERATORS.find((candidate) => source.startsWith(candidate, i));
        if (!op) throw new ExpressionError(`Unexpected "${char}"`);
        // `a?.5:b` is a ternary with a decimal, not optional chaining.
        if (op === "?." && /[0-9]/.test(source[i + 2] ?? "")) {
            tokens.push({ kind: "op", value: "?" });
            i += 1;
            continue;
        }
        tokens.push({ kind: "op", value: op });
        i += op.length;
    }
    tokens.push({ kind: "end", value: "" });
    return tokens;
}

/* ------------------------------------------------------------------- parser */

const BINARY_PRECEDENCE: Record<string, number> = {
    "??": 1, "||": 2, "&&": 3,
    "==": 4, "!=": 4, "===": 4, "!==": 4,
    "<": 5, "<=": 5, ">": 5, ">=": 5,
    "+": 6, "-": 6,
    "*": 7, "/": 7, "%": 7,
};

function parse(source: string): Node {
    if (source.length > MAX_SOURCE) throw new ExpressionError("Expression too long");
    const tokens = tokenize(source);
    let at = 0;
    const peek = (offset = 0) => tokens[at + offset]!;
    const next = () => tokens[at++]!;
    const isOp = (value: string, offset = 0) => peek(offset).kind === "op" && peek(offset).value === value;
    const expect = (value: string) => {
        if (!isOp(value)) throw new ExpressionError(`Expected "${value}"`);
        next();
    };

    const expression = (): Node => conditional();

    const conditional = (): Node => {
        const test = binary(1);
        if (!isOp("?")) return test;
        next();
        const then = expression();
        expect(":");
        return { type: "cond", test, then, else: expression() };
    };

    const binary = (min: number): Node => {
        let left = unary();
        for (;;) {
            const token = peek();
            const precedence = token.kind === "op" ? BINARY_PRECEDENCE[token.value] : undefined;
            if (precedence === undefined || precedence < min) return left;
            next();
            left = { type: "binary", op: token.value, left, right: binary(precedence + 1) };
        }
    };

    const unary = (): Node => {
        if (isOp("!") || isOp("-") || isOp("+")) {
            const op = next().value;
            return { type: "unary", op, arg: unary() };
        }
        return postfix(primary());
    };

    const args = (): Node[] => {
        const list: Node[] = [];
        expect("(");
        while (!isOp(")")) {
            list.push(argument());
            if (!isOp(")")) expect(",");
        }
        next();
        return list;
    };

    /** An argument may be an arrow function: `t => t.name` or `(a, i) => a`. */
    const argument = (): Node => {
        if (peek().kind === "id" && isOp("=>", 1)) {
            const name = next().value;
            next();
            return { type: "arrow", params: [name], body: expression() };
        }
        if (isOp("(")) {
            let offset = 1;
            const params: string[] = [];
            while (peek(offset).kind === "id" && (isOp(",", offset + 1) || isOp(")", offset + 1))) {
                params.push(peek(offset).value);
                offset += isOp(",", offset + 1) ? 2 : 1;
                if (isOp(")", offset)) break;
            }
            if ((params.length > 0 || isOp(")", 1)) && isOp(")", offset) && isOp("=>", offset + 1)) {
                at += offset + 2;
                return { type: "arrow", params, body: expression() };
            }
        }
        return expression();
    };

    const postfix = (node: Node): Node => {
        for (;;) {
            if (isOp(".") || isOp("?.")) {
                const optional = next().value === "?.";
                if (optional && isOp("(")) {
                    node = { type: "call", callee: node, args: args(), optional: true };
                    continue;
                }
                if (optional && isOp("[")) {
                    next();
                    const property = expression();
                    expect("]");
                    node = { type: "member", object: node, property, optional: true, computed: true };
                    continue;
                }
                const name = next();
                if (name.kind !== "id") throw new ExpressionError("Expected a property name");
                node = { type: "member", object: node, property: { type: "lit", value: name.value }, optional, computed: false };
            } else if (isOp("[")) {
                next();
                const property = expression();
                expect("]");
                node = { type: "member", object: node, property, optional: false, computed: true };
            } else if (isOp("(")) {
                node = { type: "call", callee: node, args: args(), optional: false };
            } else return node;
        }
    };

    const primary = (): Node => {
        const token = next();
        if (token.kind === "num") return { type: "lit", value: Number(token.value) };
        if (token.kind === "str") return { type: "lit", value: token.value };
        if (token.kind === "id") {
            if (token.value === "true") return { type: "lit", value: true };
            if (token.value === "false") return { type: "lit", value: false };
            if (token.value === "null") return { type: "lit", value: null };
            if (token.value === "undefined") return { type: "lit", value: undefined };
            return { type: "id", name: token.value };
        }
        if (token.kind === "op" && token.value === "(") {
            const inner = expression();
            expect(")");
            return inner;
        }
        if (token.kind === "op" && token.value === "[") {
            const items: Node[] = [];
            while (!isOp("]")) {
                items.push(expression());
                if (!isOp("]")) expect(",");
            }
            next();
            return { type: "list", items };
        }
        throw new ExpressionError(`Unexpected "${token.value}"`);
    };

    const tree = expression();
    if (peek().kind !== "end") throw new ExpressionError(`Unexpected "${peek().value}"`);
    return tree;
}

/* -------------------------------------------------------------- interpreter */

/** A function value inside the language: an arrow, or a helper. */
type Callable = { __pagieraCallable: true; call: (args: unknown[]) => unknown };
const callable = (call: (args: unknown[]) => unknown): Callable => ({ __pagieraCallable: true, call });
const isCallable = (value: unknown): value is Callable =>
    Boolean(value) && typeof value === "object" && (value as Callable).__pagieraCallable === true;

const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor", "__pagieraCallable", "call"]);

function capString(value: string) {
    if (value.length > MAX_STRING) throw new ExpressionError("Text too long");
    return value;
}

/** A length about to be produced; refused before the work is done. */
function sized(length: number) {
    if (!Number.isFinite(length) || length > MAX_STRING) throw new ExpressionError("Text too long");
    return Math.max(0, length);
}

function capList<T>(value: T[]) {
    if (value.length > MAX_LIST) throw new ExpressionError("List too long");
    return value;
}

const toText = (value: unknown) =>
    value === null || value === undefined ? "" : typeof value === "object" ? "" : String(value);

/** Loose equality between plain values, so `id == "3"` matches 3. */
function looseEqual(a: unknown, b: unknown) {
    if (a === b) return true;
    if (a === null || a === undefined || b === null || b === undefined) return a == b;
    if (typeof a === "object" || typeof b === "object") return false;
    return String(a) === String(b);
}

const MATH: Record<string, (...args: number[]) => number> = {
    round: (x, digits = 0) => {
        const factor = 10 ** Math.min(Math.max(Math.trunc(digits), 0), 10);
        return Math.round(x * factor) / factor;
    },
    floor: Math.floor,
    ceil: Math.ceil,
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    trunc: Math.trunc,
    sign: Math.sign,
    sqrt: Math.sqrt,
    pow: (x, y) => Math.pow(x, Math.min(y, 100)),
};

export type ExpressionScope = {
    /** The current row: its fields are the expression's variables. */
    row?: Record<string, unknown>;
};

export function evaluate(source: string, scope: ExpressionScope = {}): unknown {
    let steps = 0;
    const tick = () => {
        if (++steps > MAX_STEPS) throw new ExpressionError("Expression too costly");
    };
    const row = scope.row ?? {};

    const helpers: Record<string, unknown> = {
        Math: Object.fromEntries(Object.entries(MATH).map(([name, fn]) => [name, callable((args) => fn(...args.map(Number)))])),
        String: callable(([value]) => toText(value)),
        Number: callable(([value]) => (value === null || value === "" ? 0 : Number(value))),
        Boolean: callable(([value]) => Boolean(value)),
        len: callable(([value]) => (typeof value === "string" || Array.isArray(value) ? value.length : 0)),
        upper: callable(([value]) => toText(value).toUpperCase()),
        lower: callable(([value]) => toText(value).toLowerCase()),
        date: callable(([value, pattern, locale, timeZone]) =>
            formatValue(value, { kind: "date", pattern: toText(pattern) || undefined, locale: toText(locale) || undefined, timeZone: toText(timeZone) || undefined })),
        number: callable(([value, decimals, locale]) =>
            formatValue(value, { kind: "number", decimals: typeof decimals === "number" ? decimals : undefined, locale: toText(locale) || undefined })),
        default: callable(([value, fallback]) =>
            value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0) ? fallback : value),
    };

    const lookup = (name: string, locals: Map<string, unknown>) => {
        if (locals.has(name)) return locals.get(name);
        if (name === "$" || name === "item") return row;
        if (Object.hasOwn(row, name)) return row[name];
        if (Object.hasOwn(helpers, name)) return helpers[name];
        return undefined;
    };

    const read = (object: unknown, key: unknown): unknown => {
        if (object === null || object === undefined) return undefined;
        if (typeof key !== "string" && typeof key !== "number") return undefined;
        const name = String(key);
        if (BLOCKED_KEYS.has(name)) return undefined;
        if (typeof object === "string") {
            if (name === "length") return object.length;
            const index = Number(name);
            return Number.isInteger(index) ? object.at(index) : undefined;
        }
        if (Array.isArray(object)) {
            if (name === "length") return object.length;
            const index = Number(name);
            return Number.isInteger(index) ? object.at(index) : undefined;
        }
        if (typeof object === "object" && Object.hasOwn(object, name)) {
            const descriptor = Object.getOwnPropertyDescriptor(object, name);
            // Data properties only: a getter is code, and could have side effects.
            return descriptor && "value" in descriptor ? descriptor.value : undefined;
        }
        return undefined;
    };

    const fn = (value: unknown) => {
        if (!isCallable(value)) throw new ExpressionError("Not a function");
        return (...args: unknown[]) => value.call(args);
    };

    /** The methods that may be called, per receiver type. */
    const method = (receiver: unknown, name: string, args: unknown[]): unknown => {
        if (typeof receiver === "string") {
            const text = (index: number) => toText(args[index]);
            switch (name) {
                case "replace": return capString(receiver.replace(text(0), text(1)));
                case "replaceAll": return capString(text(0) ? receiver.split(text(0)).join(text(1)) : receiver);
                case "toUpperCase": return receiver.toUpperCase();
                case "toLowerCase": return receiver.toLowerCase();
                case "toLocaleUpperCase": return receiver.toLocaleUpperCase(text(0) || undefined);
                case "toLocaleLowerCase": return receiver.toLocaleLowerCase(text(0) || undefined);
                case "trim": return receiver.trim();
                case "trimStart": return receiver.trimStart();
                case "trimEnd": return receiver.trimEnd();
                case "slice": return receiver.slice(Number(args[0] ?? 0), args[1] === undefined ? undefined : Number(args[1]));
                case "substring": return receiver.substring(Number(args[0] ?? 0), args[1] === undefined ? undefined : Number(args[1]));
                case "split": return capList(receiver.split(text(0)));
                case "startsWith": return receiver.startsWith(text(0));
                case "endsWith": return receiver.endsWith(text(0));
                case "includes": return receiver.includes(text(0));
                case "indexOf": return receiver.indexOf(text(0));
                case "at": return receiver.at(Number(args[0] ?? 0));
                case "charAt": return receiver.charAt(Number(args[0] ?? 0));
                case "padStart": return receiver.padStart(sized(Number(args[0] ?? 0)), text(1) || " ");
                case "padEnd": return receiver.padEnd(sized(Number(args[0] ?? 0)), text(1) || " ");
                case "repeat": {
                    const times = Math.max(0, Math.trunc(Number(args[0] ?? 0)) || 0);
                    sized(receiver.length * times);
                    return receiver.repeat(times);
                }
                case "concat": return capString(receiver + args.map(toText).join(""));
                case "toString": return receiver;
            }
        }
        if (typeof receiver === "number") {
            switch (name) {
                case "toFixed": return receiver.toFixed(Math.min(Math.max(Number(args[0] ?? 0), 0), 20));
                case "toString": return String(receiver);
            }
        }
        if (Array.isArray(receiver)) {
            const each = () => fn(args[0]);
            switch (name) {
                case "map": { const f = each(); return capList(receiver.map((item, index) => f(item, index))); }
                case "filter": { const f = each(); return receiver.filter((item, index) => Boolean(f(item, index))); }
                case "find": { const f = each(); return receiver.find((item, index) => Boolean(f(item, index))); }
                case "findIndex": { const f = each(); return receiver.findIndex((item, index) => Boolean(f(item, index))); }
                case "some": { const f = each(); return receiver.some((item, index) => Boolean(f(item, index))); }
                case "every": { const f = each(); return receiver.every((item, index) => Boolean(f(item, index))); }
                case "join": return capString(receiver.map(toText).join(args[0] === undefined ? "," : toText(args[0])));
                case "slice": return receiver.slice(Number(args[0] ?? 0), args[1] === undefined ? undefined : Number(args[1]));
                case "includes": return receiver.some((item) => looseEqual(item, args[0]));
                case "indexOf": return receiver.findIndex((item) => looseEqual(item, args[0]));
                case "at": return receiver.at(Number(args[0] ?? 0));
                case "concat": return capList(receiver.concat(...args.map((arg) => (Array.isArray(arg) ? arg : [arg]))));
                case "reverse": return [...receiver].reverse();
                case "flat": return capList(receiver.flat());
                case "sort": {
                    const copy = [...receiver];
                    if (args[0] === undefined) return copy.sort((a, b) => (toText(a) < toText(b) ? -1 : toText(a) > toText(b) ? 1 : 0));
                    const f = fn(args[0]);
                    return copy.sort((a, b) => Number(f(a, b)) || 0);
                }
            }
        }
        throw new ExpressionError(`"${name}" is not available`);
    };

    const run = (node: Node, locals: Map<string, unknown>): unknown => {
        tick();
        switch (node.type) {
            case "lit": return node.value;
            case "id": return lookup(node.name, locals);
            case "list": return capList(node.items.map((item) => run(item, locals)));
            case "member": {
                const object = run(node.object, locals);
                if (node.optional && (object === null || object === undefined)) return undefined;
                return read(object, run(node.property, locals));
            }
            case "call": {
                const args = node.args.map((arg) => run(arg, locals));
                if (node.callee.type === "member") {
                    const receiver = run(node.callee.object, locals);
                    if ((node.optional || node.callee.optional) && (receiver === null || receiver === undefined)) return undefined;
                    const name = String(run(node.callee.property, locals));
                    // Helper objects (Math) hold callables as plain data.
                    const own = receiver && typeof receiver === "object" && !Array.isArray(receiver) ? read(receiver, name) : undefined;
                    if (isCallable(own)) return own.call(args);
                    return method(receiver, name, args);
                }
                const callee = run(node.callee, locals);
                if (node.optional && (callee === null || callee === undefined)) return undefined;
                return fn(callee)(...args);
            }
            case "unary": {
                const value = run(node.arg, locals);
                if (node.op === "!") return !value;
                if (node.op === "-") return -Number(value);
                return Number(value);
            }
            case "binary": {
                if (node.op === "&&") { const left = run(node.left, locals); return left ? run(node.right, locals) : left; }
                if (node.op === "||") { const left = run(node.left, locals); return left ? left : run(node.right, locals); }
                if (node.op === "??") { const left = run(node.left, locals); return left ?? run(node.right, locals); }
                const left = run(node.left, locals);
                const right = run(node.right, locals);
                switch (node.op) {
                    case "+":
                        return typeof left === "number" && typeof right === "number"
                            ? left + right
                            : capString(toText(left) + toText(right));
                    case "-": return Number(left) - Number(right);
                    case "*": return Number(left) * Number(right);
                    case "/": return Number(left) / Number(right);
                    case "%": return Number(left) % Number(right);
                    case "==": case "===": return looseEqual(left, right);
                    case "!=": case "!==": return !looseEqual(left, right);
                    case "<": return compare(left, right) < 0;
                    case "<=": return compare(left, right) <= 0;
                    case ">": return compare(left, right) > 0;
                    case ">=": return compare(left, right) >= 0;
                }
                throw new ExpressionError(`Unknown operator ${node.op}`);
            }
            case "cond": return run(node.test, locals) ? run(node.then, locals) : run(node.else, locals);
            case "arrow": {
                const outer = locals;
                return callable((args) => {
                    const scope = new Map(outer);
                    node.params.forEach((name, index) => scope.set(name, args[index]));
                    return run(node.body, scope);
                });
            }
        }
    };

    try {
        const result = run(parse(source), new Map());
        return isCallable(result) ? undefined : result;
    } catch {
        return undefined;
    }
}

function compare(a: unknown, b: unknown) {
    const x = typeof a === "number" ? a : Number.NaN;
    const y = typeof b === "number" ? b : Number.NaN;
    if (!Number.isNaN(x) && !Number.isNaN(y)) return x - y;
    const numberA = Number(a);
    const numberB = Number(b);
    if (a !== "" && b !== "" && !Number.isNaN(numberA) && !Number.isNaN(numberB)) return numberA - numberB;
    const textA = toText(a);
    const textB = toText(b);
    return textA < textB ? -1 : textA > textB ? 1 : 0;
}

/** Whether a template expression is just a field path, read the fast way. */
export function isPlainPath(source: string) {
    return /^\s*\$?\.?[A-Za-z_À-￿][\wÀ-￿]*(?:\s*(?:\.[\wÀ-￿]+|\[\d+\]))*\s*$/.test(source);
}
