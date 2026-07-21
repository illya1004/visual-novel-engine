import { Typewriter } from "./TypeWriter.js";

export class DialogueManager {
    constructor(api, options = {}) {
        this.api = api;
        this.dialogues = [];
        this.currentIndex = 0;
        this.currentDialogue = null;
        this.target_id = options.target_id || options.targetId || null;
        this.targetElement = options.targetElement || null;
        this.typewriter = options.typewriter || null;
        this.typewriterSpeed = options.typewriterSpeed ?? 25;
        this.typewriterSpeedMultiplier = options.typewriterSpeedMultiplier ?? 1;
        this._bindTargetElement();
    }

    _bindTargetElement() {
        if (!this.targetElement && this.target_id && typeof document !== "undefined") {
            this.targetElement = document.getElementById(this.target_id);
        }

        if (!this.typewriter && this.targetElement) {
            this.typewriter = new Typewriter(this.targetElement, {
                speedMultiplier: this.typewriterSpeedMultiplier
            });
        }
    }

    async load() {
        if (!this.api?.getDialogues) {
            this.dialogues = [];
            this.currentIndex = 0;
            this.currentDialogue = null;
            return this.dialogues;
        }

        this.dialogues = await this.api.getDialogues();
        this.currentIndex = 0;
        this.currentDialogue = null;
        return this.dialogues;
    }

    normalizeDialogue(dialogue) {
        if (dialogue && typeof dialogue === "object" && "text" in dialogue) {
            return dialogue;
        }

        if (typeof dialogue === "string") {
            return { text: dialogue };
        }

        return null;
    }

    async show(dialogue) {
        const dialogueData = this.normalizeDialogue(dialogue);

        if (!dialogueData) {
            return null;
        }

        this.currentDialogue = dialogueData;

        if (this.typewriter) {
            await this.typewriter.write(dialogueData.text || "", this.typewriterSpeed);
        } else if (this.targetElement) {
            this.targetElement.textContent = dialogueData.text || "";
        }

        return dialogueData;
    }

    current() {
        return this.currentDialogue ?? this.dialogues[this.currentIndex] ?? null;
    }

    next() {
        if (this.currentIndex >= this.dialogues.length) {
            return null;
        }

        const dialogue = this.dialogues[this.currentIndex++];
        return this.show(dialogue);
    }

    hasNext() {
        return this.currentIndex < this.dialogues.length;
    }

    reset() {
        this.currentIndex = 0;
        this.currentDialogue = null;
    }

    finish() {
        this.typewriter?.finish();
    }
}