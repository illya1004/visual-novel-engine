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
        this.renderer = new CharacterRenderer(this.htmlElements, this.characterSlots);
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

        if (!activeSpeakerId) {
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
        return this.characters.find(character => character.id === id);
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

        if (nextCharacterId === null || nextCharacterId === undefined) {
            for (const state of Object.values(this.states)) {
                state.setSpeaking(false);
            }
            this.speakingCharacterId = null;
            this.refreshCharacterDisplay();
            return null;
        }

        this.speakingCharacterId = nextCharacterId;
        const state = this.getState(nextCharacterId);
        state.show();
        state.setSpeaking(true);

        for (const [characterIdKey, otherState] of Object.entries(this.states)) {
            if (String(characterIdKey) !== String(nextCharacterId)) {
                otherState.setSpeaking(false);
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
        const isAlreadyVisible = state.visible && state.image === character.image && state.position === position;

        state.show();
        state.setImage(character.image);
        state.setPosition(position);

        const shouldSpeak = this._getCharacterSpeakingFlag(character, { speaking: options?.speaking ?? options?.isSpeaking ?? options?.is_speaking ?? null });

        if (shouldSpeak) {
            this.setSpeakingCharacter(id, options);
        } else if (!this.speakingCharacterId && state.visible) {
            this.setSpeakingCharacter(id, options);
        }

        this.renderer.setActiveCharacter(this.speakingCharacterId);
        const rendered = this.renderer.render(state, character, style);

        if (rendered?.slotElement && rendered.slotElement.classList) {
            const isActive = this.speakingCharacterId === id;
            rendered.slotElement.classList.toggle("active", isActive);
            rendered.slotElement.classList.toggle("dim", !isActive);
        }

        return isAlreadyVisible ? null : state;
    }

    showDialogueCharacter(dialogue = {}) {
        const characterId = dialogue?.characterId ?? dialogue?.character_id ?? null;

        if (characterId === null || characterId === undefined) {
            return null;
        }

        const character = this.getCharacterById(characterId);
        if (!character) {
            return null;
        }

        const state = this.getState(characterId);
        const position = state.visible
            ? state.position
            : (character.defaultPosition || character.default_position || "center");

        const shouldSpeak = dialogue?.speaking ?? dialogue?.isSpeaking ?? dialogue?.is_speaking ?? true;
        this.showCharacter(characterId, position, {}, { speaking: shouldSpeak });
        this.setSpeakingCharacter(characterId, { speaking: shouldSpeak });
        return character;
    }

    hideCharacter(id) {
        const state = this.getState(id);
        state.hide();
        this.renderer.render(state, this.getCharacterById(id));

        if (this.speakingCharacterId === id) {
            const nextSpeakerId = Object.keys(this.states).find(characterId => this.states[characterId].visible) ?? null;
            this.speakingCharacterId = nextSpeakerId;
            if (nextSpeakerId) {
                this.setSpeakingCharacter(nextSpeakerId);
            } else {
                this.refreshCharacterDisplay();
            }
        }

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
