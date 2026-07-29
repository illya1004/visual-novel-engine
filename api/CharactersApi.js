export class CharactersApi {
    constructor(baseUrl, options = {}) {
        this.baseUrl = baseUrl;
        this.defaultLimit = options.defaultLimit ?? 50;
        this.requestHeaders = options.requestHeaders || {};
    }

    async request(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.requestHeaders,
                ...(options.headers || {})
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        if (response.status === 204) {
            return null;
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    async postJson(url, payload = {}) {
        return this.request(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
    }

    unwrapCollection(response) {
        return Array.isArray(response) ? response : (response?.results ?? []);
    }

    async getCharacters(params = {}) {
        const query = new URLSearchParams({
            limit: String(params.limit ?? this.defaultLimit),
            offset: String(params.offset ?? 0),
            ...(params.filter ? { filter: params.filter } : {})
        });

        const response = await this.request(`${this.baseUrl}/characters/?${query.toString()}`);
        return this.unwrapCollection(response);
    }

    async getCharacter(id) {
        return this.request(`${this.baseUrl}/characters/${id}/`);
    }

    async getCharacterEmotion(id, params = {}) {
        const query = new URLSearchParams({
            limit: String(params.limit ?? this.defaultLimit),
            offset: String(params.offset ?? 0)
        });

        return this.request(`${this.baseUrl}/characters/${id}/emotion/?${query.toString()}`);
    }

    async getDialogues(params = {}) {
        const query = new URLSearchParams({
            limit: String(params.limit ?? this.defaultLimit),
            offset: String(params.offset ?? 0)
        });

        const response = await this.request(`${this.baseUrl}/dialogues/?${query.toString()}`);
        return this.unwrapCollection(response);
    }

    async getNodes(params = {}) {
        const query = new URLSearchParams({
            limit: String(params.limit ?? this.defaultLimit),
            offset: String(params.offset ?? 0)
        });

        const response = await this.request(`${this.baseUrl}/nodes/?${query.toString()}`);
        return this.unwrapCollection(response);
    }

    async unlockGalleryImage(payload = {}) {
        return this.postJson(`${this.baseUrl}/gallery/unlock/`, payload);
    }

    async getGalleryImages(params = {}) {
        const query = new URLSearchParams({
            limit: String(params.limit ?? this.defaultLimit),
            offset: String(params.offset ?? 0)
        });

        const response = await this.request(`${this.baseUrl}/gallery/?${query.toString()}`);
        return this.unwrapCollection(response);
    }

    async saveProtagonistName(payload = {}) {
        return this.postJson(`${this.baseUrl}/protagonist-names/`, payload);
    }
}
