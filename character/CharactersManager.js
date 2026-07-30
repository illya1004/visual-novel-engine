import { CharacterState } from "../character/CharacterState.js";
import { CharacterRenderer } from "../character/CharacterRenderer.js";

export class CharactersManager {

    constructor(api, htmlElements = {}) {
        this.api = api;
        this.characters = [];
        this.charactersEmotions = {};
        this.htmlElements = {
            container_id: "character-container",
            target_id: "background_image",
            positions: {
                left: (scale) => ({ left: "0", right: "auto", transform: `scale(${scale})` }),
                right: (scale) => ({ left: "auto", right: "0", transform: `scale(${scale})` }),
                center: (scale) => ({ left: "50%", right: "auto", transform: `translateX(-50%) scale(${scale})` })
            },
            ...htmlElements
        };

        if (typeof document !== "undefined" && !document.getElementById(this.htmlElements.container_id)) {
            if (document.getElementById("characters")) {
                this.htmlElements.container_id = "characters";
            } else if (document.getElementById("character-container")) {
                this.htmlElements.container_id = "character-container";
            }
        }

        this.states = {};
        this.characterSlots = new Map();
        this.speakingCharacterId = null;
        this.showCharacterNames = this._coerceBooleanFlag(
            htmlElements.showCharacterNames
                ?? htmlElements.show_character_names
                ?? htmlElements.displayCharacterNames
                ?? htmlElements.display_character_names,
            false
        );
        this.autoDeactivateOtherSpeakers = htmlElements.autoDeactivateOtherSpeakers
            ?? htmlElements.autoDeactivateOtherCharacters
            ?? htmlElements.singleActiveSpeaker
            ?? true;
        const preserveSpeakerOnNarration = htmlElements.preserveSpeakerOnNarration
            ?? htmlElements.preserve_speaker_on_narration
            ?? htmlElements.keepSpeakerOnNarration
            ?? htmlElements.keep_speaker_on_narration
            ?? null;
        this.clearSpeakingOnNarration = htmlElements.clearSpeakingOnNarration
            ?? htmlElements.clear_speaking_on_narration
            ?? htmlElements.clearSpeakerOnNarration
            ?? htmlElements.clear_speaker_on_narration
            ?? htmlElements.deactivateSpeakersOnNarration
            ?? htmlElements.deactivate_speakers_on_narration
            ?? (preserveSpeakerOnNarration === null
                ? false
                : !this._coerceBooleanFlag(preserveSpeakerOnNarration));
        this.renderer = new CharacterRenderer(this.htmlElements, this.characterSlots, {
            positions: this.htmlElements.positions,
            showCharacterNames: this.showCharacterNames
        });
    }

    _firstDefined(...values) {
        return values.find(value => value !== undefined && value !== null);
    }

    _coerceBooleanFlag(value, fallback = false) {
        if (value === undefined || value === null) {
            return fallback;
        }

        if (typeof value === "boolean") {
            return value;
        }

        if (typeof value === "number") {
            return value !== 0;
        }

        if (typeof value === "string") {
            const normalizedValue = value.trim().toLowerCase();

            if (["false", "0", "no", "off"].includes(normalizedValue)) {
                return false;
            }

            if (["true", "1", "yes", "on"].includes(normalizedValue)) {
                return true;
            }
        }

        return Boolean(value);
    }

    shouldClearSpeakingForNarration(dialogue = {}) {
        const preserveValue = this._firstDefined(
            dialogue?.preserveSpeaker,
            dialogue?.preserve_speaker,
            dialogue?.keepSpeaker,
            dialogue?.keep_speaker,
            dialogue?.keepCharactersActive,
            dialogue?.keep_characters_active
        );

        if (preserveValue !== undefined) {
            return !this._coerceBooleanFlag(preserveValue, true);
        }

        const clearValue = this._firstDefined(
            dialogue?.clearSpeaking,
            dialogue?.clear_speaking,
            dialogue?.clearSpeaker,
            dialogue?.clear_speaker,
            dialogue?.clearActiveSpeaker,
            dialogue?.clear_active_speaker,
            dialogue?.deactivateSpeakers,
            dialogue?.deactivate_speakers,
            dialogue?.deactivateCharacters,
            dialogue?.deactivate_characters
        );

        if (clearValue !== undefined) {
            return this._coerceBooleanFlag(clearValue);
        }

        const speakingValue = this._firstDefined(
            dialogue?.speaking,
            dialogue?.isSpeaking,
            dialogue?.is_speaking
        );

        if (speakingValue !== undefined) {
            return this._coerceBooleanFlag(speakingValue, true) === false;
        }

        return this._coerceBooleanFlag(this.clearSpeakingOnNarration);
    }

    _ensureCharacterData(characterId) {
        if (characterId === null || characterId === undefined) {
            return null;
        }

        if (!this.characters.length) {
            return null;
        }

        return this.getCharacterById(characterId);
    }

    getState(characterId) {
        if (!this.states[characterId]) {
            this.states[characterId] = new CharacterState(characterId);
        }

        return this.states[characterId];
    }

    _getCharacterSpeakingFlag(character = {}, options = {}) {
        const speakingValue = options?.speaking ?? options?.isSpeaking ?? options?.is_speaking ?? character?.speaking ?? character?.isSpeaking ?? character?.is_speaking ?? character?.activeSpeaker ?? character?.active_speaker ?? null;

        if (speakingValue === null || speakingValue === undefined) {
            return false;
        }

        if (typeof speakingValue === 'string' || typeof speakingValue === 'number') {
            return String(speakingValue) === String(character?.id);
        }

        return Boolean(speakingValue);
    }

    _syncSpeakerStatesFromCharacters() {
        let activeSpeakerId = null;

        for (const character of this.characters) {
            const state = this.getState(character.id);
            const isSpeaking = this._getCharacterSpeakingFlag(character);
            state.setSpeaking(isSpeaking);

            if (isSpeaking) {
                activeSpeakerId = character.id;
            }
        }

        if (activeSpeakerId && this.autoDeactivateOtherSpeakers) {
            for (const character of this.characters) {
                this.getState(character.id).setSpeaking(String(character.id) === String(activeSpeakerId));
            }
        } else if (!activeSpeakerId) {
            for (const state of Object.values(this.states)) {
                state.setSpeaking(false);
            }
        }

        this.speakingCharacterId = activeSpeakerId ?? null;
        this.refreshCharacterDisplay();
        return this.speakingCharacterId;
    }

    async loadCharacters() {
        const response = await this.api.getCharacters();
        this.characters = Array.isArray(response) ? response : (response?.results ?? []);
        this._syncSpeakerStatesFromCharacters();
        return this.characters;
    }

    async loadCharacterEmotions(characterId) {
        const emotions = await this.api.getCharacterEmotion(characterId);
        this.charactersEmotions[characterId] = emotions;
    }

    getCharacterById(id) {
        if (id === null || id === undefined) {
            return null;
        }

        return this.characters.find(character => String(character.id) === String(id)) ?? null;
    }

    getCharacterEmotion(id) {
        return this.charactersEmotions[id] || null;
    }

    applyCharacterAppearance(characterId) {
        const state = this.getState(characterId);
        const character = this.getCharacterById(characterId);

        if (!character) {
            return null;
        }

        this.renderer.setActiveCharacter(this.speakingCharacterId);
        this.renderer.render(state, character);

        return state;
    }

    refreshCharacterDisplay() {
        for (const characterId of Object.keys(this.states)) {
            const state = this.states[characterId];
            if (!state?.visible) {
                continue;
            }
            this.applyCharacterAppearance(characterId);
        }
    }

    setSpeakingCharacter(characterId, options = {}) {
        const nextCharacterId = characterId ?? options.characterId ?? null;
        const shouldSpeak = options?.speaking !== undefined
            ? Boolean(options.speaking)
            : true;
        const autoDeactivateOtherSpeakers = options?.autoDeactivateOtherSpeakers
            ?? options?.autoDeactivateOtherCharacters
            ?? options?.singleActiveSpeaker
            ?? this.autoDeactivateOtherSpeakers;

        if (nextCharacterId === null || nextCharacterId === undefined) {
            for (const state of Object.values(this.states)) {
                state.setSpeaking(false);
            }
            this.speakingCharacterId = null;
            this.refreshCharacterDisplay();
            return null;
        }

        const state = this.getState(nextCharacterId);
        state.show();
        state.setSpeaking(shouldSpeak);

        if (shouldSpeak) {
            this.speakingCharacterId = nextCharacterId;
        } else if (String(this.speakingCharacterId) === String(nextCharacterId)) {
            this.speakingCharacterId = null;
        }

        if (autoDeactivateOtherSpeakers) {
            for (const [characterIdKey, otherState] of Object.entries(this.states)) {
                if (String(characterIdKey) !== String(nextCharacterId)) {
                    otherState.setSpeaking(false);
                }
            }
        }

        this.refreshCharacterDisplay();
        return state;
    }

    showCharacter(id, position = "center", style = {}, options = {}) {
        const character = this._ensureCharacterData(id);

        if (!character) {
            return null;
        }

        const state = this.getState(id);
        const shouldResetEmotion = this._coerceBooleanFlag(
            options.resetEmotion ?? options.reset_emotion,
            false
        );
        const shouldUseBaseImage = shouldResetEmotion || !state.emotion || !state.image;
        const nextImage = shouldUseBaseImage ? character.image : state.image;
        const isAlreadyVisible = state.visible && state.image === nextImage && state.position === position;

        state.show();
        if (shouldResetEmotion) {
            state.resetAppearance(character.image);
        } else if (shouldUseBaseImage) {
            state.setImage(character.image);
        }
        state.setPosition(position);

        const hasSpeakingOption = options?.speaking !== undefined
            || options?.isSpeaking !== undefined
            || options?.is_speaking !== undefined;
        const shouldSpeak = this._getCharacterSpeakingFlag(character, {
            speaking: options?.speaking ?? options?.isSpeaking ?? options?.is_speaking ?? null
        });

        if (hasSpeakingOption || shouldSpeak) {
            this.setSpeakingCharacter(id, {
                ...options,
                speaking: shouldSpeak
            });
        }

        this.renderer.setActiveCharacter(this.speakingCharacterId);
        const rendered = this.renderer.render(state, character, style);

        if (rendered?.slotElement && rendered.slotElement.classList) {
            const isActive = state.speaking;
            rendered.slotElement.classList.toggle("active", isActive);
            rendered.slotElement.classList.toggle("dim", !isActive);
        }

        return isAlreadyVisible ? null : state;
    }

    resetEmotion(id) {
        const character = this.getCharacterById(id);

        if (!character) {
            return null;
        }

        const state = this.getState(id);
        state.resetAppearance(character.image);

        this.renderer.setActiveCharacter(this.speakingCharacterId);
        this.renderer.render(state, character);

        return state;
    }

    showDialogueCharacter(dialogue = {}) {
        const characterId = dialogue?.characterId ?? dialogue?.character_id ?? null;

        if (characterId === null || characterId === undefined) {
            if (this.shouldClearSpeakingForNarration(dialogue)) {
                this.setSpeakingCharacter(null);
            }
            return null;
        }

        const character = this.getCharacterById(characterId);
        if (!character) {
            this.setSpeakingCharacter(null);
            return null;
        }

        const state = this.getState(characterId);
        const position = state.visible
            ? state.position
            : (character.defaultPosition || character.default_position || "center");

        const shouldSpeak = dialogue?.speaking ?? dialogue?.isSpeaking ?? dialogue?.is_speaking ?? true;

        this.showCharacter(characterId, position, {}, { speaking: shouldSpeak });

        return character;
    }

    hideCharacter(id) {
        const state = this.getState(id);
        state.hide();
        this.renderer.render(state, this.getCharacterById(id));

        if (String(this.speakingCharacterId) === String(id)) {
            this.speakingCharacterId = null;
        }

        this.refreshCharacterDisplay();
        return state;
    }

    clearCharacters() {
        for (const characterId of Object.keys(this.states)) {
            this.hideCharacter(characterId);
        }
        this.speakingCharacterId = null;
    }

    async changeEmotion(id, newEmotion) {
        const character = this.getCharacterById(id);

        if (!character) {
            throw new Error(`Character with id '${id}' not found`);
        }

        let emotionData = this.getCharacterEmotion(id);

        if (!emotionData) {
            emotionData = await this.api.getCharacterEmotion(id);
            this.charactersEmotions[id] = emotionData;
        }

        if (!emotionData[newEmotion]) {
            throw new Error(
                `Emotion '${newEmotion}' not found for character '${id}'`
            );
        }

        const imageUrl = emotionData[newEmotion];
        const state = this.getState(id);

        state.setEmotion(newEmotion);
        state.setImage(imageUrl);

        this.renderer.setActiveCharacter(this.speakingCharacterId);
        this.renderer.render(state, character);
    }
}
