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

        this.states = {};
        this.characterSlots = new Map();
        this.speakingCharacterId = null;
        this.renderer = new CharacterRenderer(this.htmlElements, this.characterSlots);
    }

    getState(characterId) {
        if (!this.states[characterId]) {
            this.states[characterId] = new CharacterState(characterId);
        }

        return this.states[characterId];
    }

    async loadCharacters() {
        this.characters  = await this.api.getCharacters();
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

        this.renderer.setActiveCharacter(this.speakingCharacterId);
        this.renderer.render(state, character);
    }

    refreshCharacterDisplay() {
        for (const characterId of this.characterSlots.keys()) {
            this.applyCharacterAppearance(characterId);
        }
    }

    setSpeakingCharacter(characterId) {
        this.speakingCharacterId = characterId;
        this.refreshCharacterDisplay();
    }

    showCharacter(id, position = "center", style = {}) {
        const character = this.getCharacterById(id);

        if (!character) {
            throw new Error(`Character with id '${id}' not found`);
        }

        const state = this.getState(id);

        state.show();
        state.setImage(character.image);
        state.setPosition(position);

        this.renderer.setActiveCharacter(this.speakingCharacterId);
        this.renderer.render(state, character, style);
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