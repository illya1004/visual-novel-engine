export class Typewriter {
    constructor(target, options = {}) {
        this.target = target;
        this.isTyping = false;
        this.skip = false;
        this.speedMultiplier = options.speedMultiplier ?? 1;
        this._writeId = 0;
    }

    async write(text, speed = 30) {
        const writeId = ++this._writeId;
        this.target.textContent = "";
        this.isTyping = true;
        this.skip = false;

        const effectiveSpeed = Math.max(1, speed * this.speedMultiplier);

        for (const char of text) {
            if (writeId !== this._writeId) {
                return;
            }

            if (this.skip) {
                this.target.textContent = text;
                break;
            }

            this.target.textContent += char;
            await this.sleep(effectiveSpeed);
        }

        if (writeId === this._writeId) {
            this.isTyping = false;
        }
    }

    finish() {
        this.skip = true;
    }

    cancel() {
        this._writeId += 1;
        this.isTyping = false;
        this.skip = false;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
