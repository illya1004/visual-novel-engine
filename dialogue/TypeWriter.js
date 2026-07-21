export class Typewriter {
    constructor(target, options = {}) {
        this.target = target;
        this.isTyping = false;
        this.skip = false;
        this.speedMultiplier = options.speedMultiplier ?? 1;
    }

    async write(text, speed = 30) {
        this.target.textContent = "";
        this.isTyping = true;
        this.skip = false;

        const effectiveSpeed = Math.max(1, speed * this.speedMultiplier);

        for (const char of text) {
            if (this.skip) {
                this.target.textContent = text;
                break;
            }

            this.target.textContent += char;
            await this.sleep(effectiveSpeed);
        }

        this.isTyping = false;
    }

    finish() {
        this.skip = true;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}