import { Typewriter } from "./TypeWriter.js";

export class DialogueManager {
    constructor(api, options = {}) {
        this.api = api;
        this.dialogues = [];
        this.currentIndex = 0;
        this.currentDialogue = null;
        this.target_id = options.target_id || options.targetId || null;
        this.speakerNameTargetId = options.speakerNameTargetId
            || options.speaker_name_target_id
            || options.dialogueNameTargetId
            || options.dialogue_name_target_id
            || null;
        this.boxTargetId = options.boxTargetId
            || options.box_target_id
            || options.dialogueBoxTargetId
            || options.dialogue_box_target_id
            || null;
        this.targetElement = options.targetElement || null;
        this.speakerNameElement = options.speakerNameElement || null;
        this.boxElement = options.boxElement || null;
        this.typewriter = options.typewriter || null;
        this.typewriterSpeed = options.typewriterSpeed ?? 25;
        this.textSize = options.textSize ?? null;
        this.defaultLayout = {
            position: options.layout?.position ?? options.position ?? "full",
            width: options.layout?.width ?? options.width ?? null
        };
        this.layout = { ...this.defaultLayout };
        this.typewriterSpeedMultiplier = options.typewriterSpeedMultiplier ?? 1;
        this._bindTargetElement();
        this.setTextSize(this.textSize);
        this.setLayout(this.defaultLayout);
    }

    _bindTargetElement() {
        if (!this.targetElement && this.target_id && typeof document !== "undefined") {
            this.targetElement = document.getElementById(this.target_id);
        }

        if (!this.speakerNameElement && this.speakerNameTargetId && typeof document !== "undefined") {
            this.speakerNameElement = document.getElementById(this.speakerNameTargetId);
        }

        if (!this.boxElement && this.boxTargetId && typeof document !== "undefined") {
            this.boxElement = document.getElementById(this.boxTargetId);
        }

        this.targetElement?.classList?.add?.("web-novel-text");
        this.speakerNameElement?.classList?.add?.("web-novel-speaker");
        this.boxElement?.classList?.add?.("web-novel-dialogue");

        if (!this.typewriter && this.targetElement) {
            this.typewriter = new Typewriter(this.targetElement, {
                speedMultiplier: this.typewriterSpeedMultiplier
            });
        }
    }

    getSpeakerName(dialogue) {
        return dialogue?.speakerName ?? dialogue?.speaker_name ?? "";
    }

    showSpeakerName(dialogue) {
        if (!this.speakerNameElement) {
            return;
        }

        this.speakerNameElement.textContent = this.getSpeakerName(dialogue);
    }

    setTypewriterSpeed(speed) {
        const nextSpeed = Number(speed);

        if (Number.isFinite(nextSpeed) && nextSpeed > 0) {
            this.typewriterSpeed = nextSpeed;
        }
    }

    setTextSize(size) {
        this.textSize = size;

        if (!this.targetElement || size === null || size === undefined || size === "") {
            return;
        }

        this.targetElement.style.fontSize = typeof size === "number" ? `${size}px` : String(size);
    }

    setLayout(layout = {}, fallbackLayout = this.defaultLayout) {
        const position = layout?.position
            ?? layout?.dialoguePosition
            ?? layout?.dialogue_position
            ?? fallbackLayout.position
            ?? "full";
        const width = layout?.width
            ?? layout?.dialogueWidth
            ?? layout?.dialogue_width
            ?? fallbackLayout.width
            ?? null;
        this.layout = { position, width };

        if (!this.boxElement) {
            return;
        }

        const normalizedPosition = String(position).toLowerCase();
        const safePosition = ["left", "right", "center", "full"].includes(normalizedPosition)
            ? normalizedPosition
            : "full";

        this.boxElement.dataset.dialoguePosition = safePosition;
        this.boxElement.classList?.remove?.(
            "web-novel-dialogue--left",
            "web-novel-dialogue--right",
            "web-novel-dialogue--center",
            "web-novel-dialogue--full"
        );
        this.boxElement.classList?.add?.(`web-novel-dialogue--${safePosition}`);

        if (width) {
            this.boxElement.style.setProperty("--wn-dialogue-custom-width", typeof width === "number" ? `${width}px` : String(width));
        } else {
            this.boxElement.style.removeProperty("--wn-dialogue-custom-width");
        }
    }

    async load() {
        if (!this.api?.getDialogues) {
            this.dialogues = [];
            this.currentIndex = 0;
            this.currentDialogue = null;
            return this.dialogues;
        }

        const response = await this.api.getDialogues();
        this.dialogues = Array.isArray(response) ? response : (response?.results ?? []);
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
        this.showSpeakerName(dialogueData);
        this.setLayout({
            position: dialogueData.dialoguePosition ?? dialogueData.dialogue_position ?? dialogueData.boxPosition ?? dialogueData.box_position,
            width: dialogueData.dialogueWidth ?? dialogueData.dialogue_width ?? dialogueData.boxWidth ?? dialogueData.box_width
        });

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

    cancel() {
        this.typewriter?.cancel();
    }
}
