export class DialogueManager {
    constructor(api) {
        this.api = api;
        this.dialogues = [];
        this.currentIndex = 0;
    }

    async load() {
        this.dialogues = await this.api.getDialogues();
        this.currentIndex = 0;
    }

    current() {
        return this.dialogues[this.currentIndex] ?? null;
    }

    next() {
        if (this.currentIndex >= this.dialogues.length) {
            return null;
        }

        return this.dialogues[this.currentIndex++];
    }

    hasNext() {
        return this.currentIndex < this.dialogues.length;
    }

    reset() {
        this.currentIndex = 0;
    }
}