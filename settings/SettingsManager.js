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
        const initialVariables = options.variables
            ?? options.customVariables
            ?? options.custom_variables
            ?? {};
        const initialCharacterNameColors = options.characterNameColors
            ?? options.character_name_colors
            ?? options.nameColors
            ?? options.name_colors
            ?? {};
        this.defaults = {
            soundEnabled: true,
            musicEnabled: true,
            soundEffectsEnabled: true,
            volume: 1,
            musicVolume: 1,
            soundVolume: 1,
            textSpeed: options.textSpeed ?? 50,
            textSize: options.textSize ?? null,
            activeCharacterScale: options.activeCharacterScale
                ?? options.active_character_scale
                ?? options.characterActiveScale
                ?? options.character_active_scale
                ?? options.speakingScale
                ?? options.speaking_scale
                ?? options.speak_scale
                ?? options.speakScale
                ?? 1.15,
            inactiveCharacterScale: options.inactiveCharacterScale
                ?? options.inactive_character_scale
                ?? options.characterInactiveScale
                ?? options.character_inactive_scale
                ?? options.inactiveScale
                ?? options.inactive_scale
                ?? options.idle_scale
                ?? options.idleScale
                ?? 1,
            variables: this._normalizeStringMap(initialVariables),
            characterNameColors: this._normalizeStringMap(initialCharacterNameColors)
        };
        this.values = {
            ...this.defaults,
            ...this._loadStoredValues(),
            ...this._normalizeSettingValues(options.values || {})
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
            return this._normalizeSettingValues(values);
        } catch {
            return {};
        }
    }

    _normalizeStringMap(value = {}) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(value)
                .filter(([, mapValue]) => mapValue !== undefined && mapValue !== null)
                .map(([mapKey, mapValue]) => [String(mapKey), String(mapValue)])
        );
    }

    _normalizeSettingValues(values = {}) {
        const nextValues = { ...values };

        nextValues.activeCharacterScale = nextValues.activeCharacterScale
            ?? nextValues.active_character_scale
            ?? nextValues.characterActiveScale
            ?? nextValues.character_active_scale
            ?? nextValues.activeScale
            ?? nextValues.active_scale
            ?? nextValues.speakingScale
            ?? nextValues.speaking_scale
            ?? nextValues.speak_scale
            ?? nextValues.speakScale;
        nextValues.inactiveCharacterScale = nextValues.inactiveCharacterScale
            ?? nextValues.inactive_character_scale
            ?? nextValues.characterInactiveScale
            ?? nextValues.character_inactive_scale
            ?? nextValues.inactiveScale
            ?? nextValues.inactive_scale
            ?? nextValues.idle_scale
            ?? nextValues.idleScale;
        nextValues.variables = nextValues.variables
            ?? nextValues.customVariables
            ?? nextValues.custom_variables;
        nextValues.characterNameColors = nextValues.characterNameColors
            ?? nextValues.character_name_colors
            ?? nextValues.nameColors
            ?? nextValues.name_colors;

        delete nextValues.protagonistName;
        delete nextValues.heroName;
        delete nextValues.active_character_scale;
        delete nextValues.inactive_character_scale;
        delete nextValues.characterActiveScale;
        delete nextValues.characterInactiveScale;
        delete nextValues.character_active_scale;
        delete nextValues.character_inactive_scale;
        delete nextValues.activeScale;
        delete nextValues.inactiveScale;
        delete nextValues.active_scale;
        delete nextValues.inactive_scale;
        delete nextValues.speakingScale;
        delete nextValues.speaking_scale;
        delete nextValues.speakScale;
        delete nextValues.speak_scale;
        delete nextValues.idleScale;
        delete nextValues.idle_scale;
        delete nextValues.customVariables;
        delete nextValues.custom_variables;
        delete nextValues.character_name_colors;
        delete nextValues.nameColors;
        delete nextValues.name_colors;

        if (nextValues.activeCharacterScale === undefined) {
            delete nextValues.activeCharacterScale;
        }

        if (nextValues.inactiveCharacterScale === undefined) {
            delete nextValues.inactiveCharacterScale;
        }

        if (nextValues.variables === undefined) {
            delete nextValues.variables;
        } else {
            nextValues.variables = this._normalizeStringMap(nextValues.variables);
        }

        if (nextValues.characterNameColors === undefined) {
            delete nextValues.characterNameColors;
        } else {
            nextValues.characterNameColors = this._normalizeStringMap(nextValues.characterNameColors);
        }

        return nextValues;
    }

    _persist() {
        if (!this.storage?.setItem) {
            return;
        }

        this.storage.setItem(this.storageKey, JSON.stringify(this.values));
    }

    get(key) {
        if (key === "variables" || key === "characterNameColors") {
            return { ...(this.values[key] || {}) };
        }

        return this.values[key];
    }

    snapshot() {
        return {
            ...this.values,
            variables: { ...(this.values.variables || {}) },
            characterNameColors: { ...(this.values.characterNameColors || {}) }
        };
    }

    update(values = {}, options = {}) {
        const nextValues = this._normalizeSettingValues(values);

        this.values = {
            ...this.values,
            ...nextValues,
            variables: nextValues.variables
                ? { ...(this.values.variables || {}), ...nextValues.variables }
                : this.values.variables,
            characterNameColors: nextValues.characterNameColors
                ? { ...(this.values.characterNameColors || {}), ...nextValues.characterNameColors }
                : this.values.characterNameColors
        };

        if (options.persist !== false) {
            this._persist();
        }

        return this.snapshot();
    }

    setVariable(key, value, options = {}) {
        if (!key) {
            return this.snapshot();
        }

        return this.update({
            variables: {
                [String(key)]: value
            }
        }, options);
    }

    setCharacterNameColor(characterId, color, options = {}) {
        if (characterId === null || characterId === undefined) {
            return this.snapshot();
        }

        return this.update({
            characterNameColors: {
                [String(characterId)]: color
            }
        }, options);
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
        if (!charactersManager) {
            return;
        }

        charactersManager.setCharacterScales?.({
            activeCharacterScale: this.values.activeCharacterScale,
            inactiveCharacterScale: this.values.inactiveCharacterScale
        });
        charactersManager.setCharacterNameColors?.(this.values.characterNameColors || {});

        if (this.protagonistCharacterId !== null && this.protagonistCharacterId !== undefined) {
            const character = charactersManager.getCharacterById?.(this.protagonistCharacterId);
            if (character && this.protagonistName) {
                character.name = this.protagonistName;
            }
        }
    }

    applyAll(managers = {}) {
        this.applyToSound(managers.soundManager);
        this.applyToDialogue(managers.dialogueManager);
        this.applyToCharacters(managers.charactersManager);
    }

    normalizeVariableKey(key = "") {
        return String(key)
            .trim()
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            .replace(/[-.\s]+/g, "_")
            .toLowerCase();
    }

    getVariableReplacements() {
        const protagonistName = this.protagonistName || "";
        const variables = {
            ...(this.values.variables || {})
        };

        return {
            ...variables,
            heroName: protagonistName,
            hero_name: protagonistName,
            playerName: protagonistName,
            player_name: protagonistName,
            protagonistName,
            protagonist_name: protagonistName
        };
    }

    resolveVariable(key, replacements = this.getVariableReplacements()) {
        const normalizedKey = this.normalizeVariableKey(key);

        for (const [candidateKey, value] of Object.entries(replacements)) {
            if (candidateKey === key || this.normalizeVariableKey(candidateKey) === normalizedKey) {
                return value;
            }
        }

        return undefined;
    }

    replaceVariables(value) {
        if (typeof value !== "string") {
            return value;
        }

        const replacements = this.getVariableReplacements();

        return value
            .replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (match, key) => {
                const replacement = this.resolveVariable(key, replacements);
                return replacement === undefined ? match : String(replacement);
            })
            .replace(/\{\s*([A-Za-z0-9_.-]+)\s*\}/g, (match, key) => {
                const replacement = this.resolveVariable(key, replacements);
                return replacement === undefined ? match : String(replacement);
            })
            .replace(/\[([A-Za-z0-9_.-]+)\]/g, (match, key) => {
                const replacement = this.resolveVariable(key, replacements);
                return replacement === undefined ? match : String(replacement);
            });
    }

    applyToDialogueData(dialogue) {
        if (!dialogue || typeof dialogue !== "object") {
            return dialogue;
        }

        return {
            ...dialogue,
            text: this.replaceVariables(dialogue.text),
            speakerName: this.replaceVariables(dialogue.speakerName),
            speaker_name: this.replaceVariables(dialogue.speaker_name),
            speakerNameColor: this.replaceVariables(dialogue.speakerNameColor),
            speaker_name_color: this.replaceVariables(dialogue.speaker_name_color),
            nameColor: this.replaceVariables(dialogue.nameColor),
            name_color: this.replaceVariables(dialogue.name_color),
            characterNameColor: this.replaceVariables(dialogue.characterNameColor),
            character_name_color: this.replaceVariables(dialogue.character_name_color)
        };
    }
}
