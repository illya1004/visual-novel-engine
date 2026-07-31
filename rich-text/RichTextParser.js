const STYLE_TAGS = new Set([
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "size",
    "font",
    "cps",
    "shake",
    "blink",
    "glitch",
    "wave",
    "fade"
]);

const SELF_CLOSING_TAGS = new Set(["wait", "break"]);

const TAG_ALIASES = {
    b: "bold",
    strong: "bold",
    i: "italic",
    em: "italic",
    u: "underline",
    s: "strike",
    del: "strike",
    colour: "color",
    c: "color",
    speed: "cps",
    br: "break",
    n: "break",
    w: "wait",
    wait: "wait",
    pause: "wait",
    p: "wait"
};

export class RichTextParser {
    parse(value = "") {
        const source = String(value ?? "");
        const tokens = [];
        const marks = [];
        let buffer = "";

        const flush = () => {
            if (!buffer) {
                return;
            }

            tokens.push({
                type: "text",
                text: buffer,
                attrs: this.mergeMarks(marks)
            });
            buffer = "";
        };

        for (let index = 0; index < source.length;) {
            const char = source[index];
            const isBraceTag = char === "{";
            const isBracketTag = char === "[";

            if ((isBraceTag && source[index + 1] === "{") || (isBracketTag && source[index + 1] === "[")) {
                buffer += char;
                index += 2;
                continue;
            }

            if (isBraceTag || isBracketTag) {
                const closeChar = isBraceTag ? "}" : "]";
                const endIndex = source.indexOf(closeChar, index + 1);

                if (endIndex !== -1) {
                    const tag = this.parseTag(source.slice(index + 1, endIndex));

                    if (tag) {
                        flush();
                        this.applyTag(tag, marks, tokens);
                        index = endIndex + 1;
                        continue;
                    }
                }
            }

            buffer += char;
            index += 1;
        }

        flush();
        return tokens;
    }

    parseTag(rawTag = "") {
        const raw = String(rawTag).trim();

        if (!raw) {
            return null;
        }

        const closing = raw.startsWith("/");
        const body = closing ? raw.slice(1).trim() : raw;
        const equalIndex = body.indexOf("=");
        const name = equalIndex === -1 ? body : body.slice(0, equalIndex).trim();
        const value = equalIndex === -1 ? null : body.slice(equalIndex + 1).trim();
        const normalizedName = this.normalizeTagName(name);

        if (!normalizedName || (!STYLE_TAGS.has(normalizedName) && !SELF_CLOSING_TAGS.has(normalizedName))) {
            return null;
        }

        return {
            closing,
            name: normalizedName,
            value
        };
    }

    normalizeTagName(name = "") {
        const normalized = String(name).trim().toLowerCase();

        if (!normalized) {
            return "";
        }

        return TAG_ALIASES[normalized] ?? normalized;
    }

    applyTag(tag, marks, tokens) {
        if (tag.closing) {
            for (let index = marks.length - 1; index >= 0; index -= 1) {
                if (marks[index].name === tag.name) {
                    marks.splice(index, 1);
                    break;
                }
            }
            return;
        }

        if (tag.name === "wait") {
            tokens.push({
                type: "wait",
                ms: this.parseWaitMs(tag.value)
            });
            return;
        }

        if (tag.name === "break") {
            tokens.push({ type: "break" });
            return;
        }

        const mark = this.createMark(tag);

        if (mark) {
            marks.push(mark);
        }
    }

    createMark(tag) {
        const value = this.sanitizeCssValue(tag.value);

        switch (tag.name) {
            case "bold":
                return { name: tag.name, style: { fontWeight: "700" } };
            case "italic":
                return { name: tag.name, style: { fontStyle: "italic" } };
            case "underline":
                return { name: tag.name, style: { textDecoration: "underline" } };
            case "strike":
                return { name: tag.name, style: { textDecoration: "line-through" } };
            case "color":
                return value ? { name: tag.name, style: { color: value } } : null;
            case "size":
                return value ? { name: tag.name, style: { fontSize: this.normalizeSize(value) } } : null;
            case "font":
                return value ? { name: tag.name, style: { fontFamily: value } } : null;
            case "cps":
                return { name: tag.name, cps: this.parseCps(tag.value) };
            case "shake":
            case "blink":
            case "glitch":
            case "wave":
            case "fade":
                return this.createEffectMark(tag.name, value);
            default:
                return null;
        }
    }

    createEffectMark(name, value = null) {
        const style = {};

        if (name === "shake" && value) {
            style["--rt-shake-distance"] = /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value;
        }

        return {
            name,
            classes: [`rt-${name}`],
            style
        };
    }

    mergeMarks(marks = []) {
        const attrs = {
            classes: [],
            style: {},
            cps: null
        };
        const classNames = new Set();

        for (const mark of marks) {
            Object.assign(attrs.style, mark.style || {});

            for (const className of mark.classes || []) {
                classNames.add(className);
            }

            if (mark.cps !== null && mark.cps !== undefined) {
                attrs.cps = mark.cps;
            }
        }

        attrs.classes = [...classNames];
        return attrs;
    }

    parseCps(value) {
        const cps = Number(value);
        return Number.isFinite(cps) && cps > 0 ? cps : null;
    }

    parseWaitMs(value) {
        const duration = Number(value);

        if (!Number.isFinite(duration) || duration <= 0) {
            return 0;
        }

        return duration <= 10 ? duration * 1000 : duration;
    }

    normalizeSize(value) {
        return /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value;
    }

    sanitizeCssValue(value) {
        if (value === null || value === undefined) {
            return null;
        }

        const stringValue = String(value).trim();

        if (!stringValue || /[;{}<>]/.test(stringValue)) {
            return null;
        }

        return stringValue;
    }

    toPlainText(value) {
        const tokens = Array.isArray(value) ? value : this.parse(value);

        return tokens
            .map((token) => {
                if (token.type === "break") {
                    return "\n";
                }

                return token.type === "text" ? token.text : "";
            })
            .join("");
    }
}
