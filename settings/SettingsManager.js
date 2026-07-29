export class SettingsManager {
    constructor(options = {}) {
        this.storageKey = options.storageKey || "webNovel.settings";
        this.storage = options.storage || this._getDefaultStorage();
        this.api = options.api || null;
        this.prompt = options.prompt || null;
        this.protagonistCharacterId = options.protagonistCharacterId ?? options.heroCharacterId ?? null;
        this.promptForProtagonistName = options.promptForProtagonistName ?? true;
        this.protagonistPromptText = options.protagonistPromptText || "Введіть ім'я головного героя";
        this.userAccountId = options.userAccountId ?? options.user_account_id ?? options.accountId ?? options.account_id ?? null;
        this.novelId = options.novelId ?? options.novel_id ?? null;
        this.protagonistName = options.protagonistName || options.heroName || "";
        this.lastProtagonistPayload = null;
        this.defaults = {
            soundEnabled: true,
            musicEnabled: true,
            soundEffectsEnabled: true,
            volume: 1,
            musicVolume: 1,
            soundVolume: 1,
            textSpeed: options.textSpeed ?? 50,
            textSize: options.textSize ?? null
        };
        this.values = {
            ...this.defaults,
            ...this._loadStoredValues(),
            ...options.values
        };
        delete this.values.protagonistName;
        delete this.values.heroName;
    }

    _getDefaultStorage() {
        if (typeof localStorage === "undefined") {
            return null;
        }

        return localStorage;
    }

    _loadStoredValues() {
        if (!this.storage?.getItem) {
            return {};
        }

        try {
            const values = JSON.parse(this.storage.getItem(this.storageKey) || "{}") || {};
            delete values.protagonistName;
            delete values.heroName;
            return values;
        } catch {
            return {};
        }
    }

    _persist() {
        if (!this.storage?.setItem) {
            return;
        }

        this.storage.setItem(this.storageKey, JSON.stringify(this.values));
    }

    get(key) {
        return this.values[key];
    }

    snapshot() {
        return { ...this.values };
    }

    update(values = {}, options = {}) {
        const nextValues = { ...values };
        delete nextValues.protagonistName;
        delete nextValues.heroName;

        this.values = {
            ...this.values,
            ...nextValues
        };

        if (options.persist !== false) {
            this._persist();
        }

        return this.snapshot();
    }

    async promptForNovelStart(options = {}) {
        if (!this.promptForProtagonistName && !options.force) {
            return this.protagonistName;
        }

        const promptFn = this.prompt || (typeof window !== "undefined" ? window.prompt?.bind(window) : null);

        if (!promptFn) {
            return this.protagonistName;
        }

        const nextName = promptFn(this.protagonistPromptText, options.defaultName ?? "");

        if (nextName !== null && nextName !== undefined && String(nextName).trim()) {
            this.setProtagonistName(String(nextName).trim());
            await this.saveProtagonistName();
        }

        return this.protagonistName;
    }

    setProtagonistName(name) {
        this.protagonistName = String(name || "").trim();
        return this.protagonistName;
    }

    createProtagonistNamePayload(overrides = {}) {
        return {
            name: overrides.name ?? this.protagonistName,
            userAccountId: overrides.userAccountId ?? overrides.user_account_id ?? this.userAccountId,
            novelId: overrides.novelId ?? overrides.novel_id ?? this.novelId
        };
    }

    async saveProtagonistName(overrides = {}) {
        const payload = this.createProtagonistNamePayload(overrides);

        if (!payload.name) {
            return null;
        }

        this.lastProtagonistPayload = payload;

        if (!this.api?.saveProtagonistName) {
            return payload;
        }

        return await this.api.saveProtagonistName(payload);
    }

    applyToSound(soundManager) {
        if (!soundManager) {
            return;
        }

        soundManager.setMasterVolume?.(this.values.volume);
        soundManager.setMusicVolume?.(this.values.musicVolume);
        soundManager.setSoundVolume?.(this.values.soundVolume);
        soundManager.setEnabled?.(this.values.soundEnabled);
        soundManager.setMusicEnabled?.(this.values.musicEnabled);
        soundManager.setSoundEnabled?.(this.values.soundEffectsEnabled);
    }

    applyToDialogue(dialogueManager) {
        if (!dialogueManager) {
            return;
        }

        dialogueManager.setTypewriterSpeed?.(this.values.textSpeed);
        dialogueManager.setTextSize?.(this.values.textSize);
    }

    applyToCharacters(charactersManager) {
        if (!charactersManager || this.protagonistCharacterId === null || this.protagonistCharacterId === undefined) {
            return;
        }

        const character = charactersManager.getCharacterById?.(this.protagonistCharacterId);
        if (character && this.protagonistName) {
            character.name = this.protagonistName;
        }
    }

    applyAll(managers = {}) {
        this.applyToSound(managers.soundManager);
        this.applyToDialogue(managers.dialogueManager);
        this.applyToCharacters(managers.charactersManager);
    }

    replaceVariables(value) {
        if (typeof value !== "string") {
            return value;
        }

        const protagonistName = this.protagonistName || "";
        return value
            .replaceAll("{{heroName}}", protagonistName)
            .replaceAll("{{playerName}}", protagonistName)
            .replaceAll("{heroName}", protagonistName)
            .replaceAll("{playerName}", protagonistName)
            .replaceAll("[heroName]", protagonistName)
            .replaceAll("[playerName]", protagonistName);
    }

    applyToDialogueData(dialogue) {
        if (!dialogue || typeof dialogue !== "object") {
            return dialogue;
        }

        return {
            ...dialogue,
            text: this.replaceVariables(dialogue.text),
            speakerName: this.replaceVariables(dialogue.speakerName),
            speaker_name: this.replaceVariables(dialogue.speaker_name)
        };
    }
}
