export class CharactersApi {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }

    async getCharacters() {
        return this.request(`${this.baseUrl}/characters/`);
    }

    async getCharacter(id) {
        return this.request(`${this.baseUrl}/characters/${id}/`);
    }

    async getCharacterEmotion(id) {
        return this.request(`${this.baseUrl}/characters/${id}/emotion/`);
    }

    async getDialogues() {
        return this.request(`${this.baseUrl}/dialogues/`);
    }

    async getNodes() {
        return this.request(`${this.baseUrl}/nodes/`);
    }
}