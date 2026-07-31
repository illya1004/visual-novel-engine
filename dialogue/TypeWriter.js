import { RichTextParser } from "../rich-text/RichTextParser.js";

export class Typewriter {
    constructor(target, options = {}) {
        this.target = target;
        this.isTyping = false;
        this.skip = false;
        this.speedMultiplier = options.speedMultiplier ?? 1;
        this.richTextEnabled = options.richTextEnabled ?? options.richText ?? true;
        this.parser = options.parser || new RichTextParser();
        this._writeId = 0;
        this._sleepResolve = null;
    }

    async write(text, speed = 30, options = {}) {
        const writeId = ++this._writeId;
        const tokens = this.richTextEnabled
            ? this.parser.parse(text ?? "")
            : [{ type: "text", text: String(text ?? ""), attrs: { classes: [], style: {}, cps: null } }];

        this.clearTarget();
        this.isTyping = true;
        this.skip = false;

        const effectiveSpeed = Math.max(1, speed * this.speedMultiplier);

        for (const token of tokens) {
            if (writeId !== this._writeId) {
                return;
            }

            if (this.skip) {
                this.renderComplete(tokens);
                break;
            }

            if (token.type === "wait") {
                await this.sleep(token.ms);
                continue;
            }

            if (token.type === "break") {
                this.appendBreak();
                continue;
            }

            if (token.type !== "text") {
                continue;
            }

            const container = this.createTextContainer(token.attrs);
            const delay = this.getDelay(effectiveSpeed, token.attrs, options);

            for (const char of token.text) {
                if (writeId !== this._writeId) {
                    return;
                }

                if (this.skip) {
                    this.renderComplete(tokens);
                    break;
                }

                this.appendCharacter(container, char);
                await this.sleep(delay);
            }
        }

        if (writeId === this._writeId) {
            this.isTyping = false;
        }
    }

    finish() {
        this.skip = true;
        if (this._sleepResolve) {
            this._sleepResolve();
            this._sleepResolve = null;
        }
    }

    cancel() {
        this._writeId += 1;
        this.isTyping = false;
        this.skip = false;
        if (this._sleepResolve) {
            this._sleepResolve();
            this._sleepResolve = null;
        }
    }

    canRenderRichText() {
        return Boolean(
            this.richTextEnabled
            && this.target
            && typeof document !== "undefined"
            && typeof document.createElement === "function"
            && typeof this.target.appendChild === "function"
        );
    }

    clearTarget() {
        if (!this.target) {
            return;
        }

        if (typeof this.target.replaceChildren === "function") {
            this.target.replaceChildren();
            return;
        }

        if (typeof this.target.textContent === "string") {
            this.target.textContent = "";
        }

        if (Array.isArray(this.target.children)) {
            this.target.children.length = 0;
        }
    }

    renderComplete(tokens = []) {
        this.clearTarget();

        for (const token of tokens) {
            if (token.type === "break") {
                this.appendBreak();
            } else if (token.type === "text") {
                const container = this.createTextContainer(token.attrs);
                this.appendCharacter(container, token.text);
            }
        }
    }

    createTextContainer(attrs = {}) {
        if (!this.canRenderRichText()) {
            return this.target;
        }

        const element = document.createElement("span");

        if (attrs.classes?.length) {
            element.className = attrs.classes.join(" ");
        }

        for (const [property, value] of Object.entries(attrs.style || {})) {
            if (property.startsWith("--") && element.style?.setProperty) {
                element.style.setProperty(property, value);
            } else if (element.style) {
                element.style[property] = value;
            }
        }

        this.target.appendChild(element);
        return element;
    }

    appendCharacter(container, char) {
        if (!container) {
            return;
        }

        container.textContent = `${container.textContent || ""}${char}`;
    }

    appendBreak() {
        if (!this.canRenderRichText()) {
            this.target.textContent = `${this.target.textContent || ""}\n`;
            return;
        }

        this.target.appendChild(document.createElement("br"));
    }

    getDelay(baseSpeed, attrs = {}, options = {}) {
        const cps = Number(attrs.cps ?? options.cps ?? options.charactersPerSecond ?? options.characters_per_second);

        if (Number.isFinite(cps) && cps > 0) {
            return Math.max(1, 1000 / cps) * this.speedMultiplier;
        }

        return baseSpeed;
    }

    sleep(ms) {
        if (this.skip) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const timer = setTimeout(() => {
                if (this._sleepResolve === done) {
                    this._sleepResolve = null;
                }
                resolve();
            }, ms);
            const done = () => {
                clearTimeout(timer);
                resolve();
            };
            this._sleepResolve = done;
        });
    }
}
