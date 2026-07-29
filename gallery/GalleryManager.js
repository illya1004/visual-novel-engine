export class GalleryManager {
    constructor(api, options = {}) {
        this.api = api;
        this.enabled = options.enabled ?? true;
        this.unlocked = new Map();
        this.lastError = null;
    }

    _getGalleryMarker(node = {}) {
        return node.gallery
            ?? node.galleryImage
            ?? node.gallery_image
            ?? node.galleryId
            ?? node.gallery_id
            ?? node.unlockGallery
            ?? node.unlock_gallery
            ?? null;
    }

    shouldUnlock(node = {}) {
        if (!this.enabled || node.type !== "background" || !node.image) {
            return false;
        }

        const marker = this._getGalleryMarker(node);
        return marker === true || typeof marker === "string" || typeof marker === "number" || typeof marker === "object";
    }

    createPayload(node = {}) {
        const marker = this._getGalleryMarker(node);
        const markerData = marker && typeof marker === "object" ? marker : {};

        return {
            id: node.galleryId ?? node.gallery_id ?? markerData.id ?? markerData.galleryId ?? markerData.gallery_id ?? (marker === true ? node.id : marker),
            nodeId: node.id,
            image: node.image,
            title: node.title ?? node.name ?? markerData.title ?? markerData.name ?? null,
            chapter: node.chapter ?? null
        };
    }

    async unlockFromNode(node = {}) {
        if (!this.shouldUnlock(node)) {
            return null;
        }

        const payload = this.createPayload(node);
        const key = String(payload.id ?? payload.image);

        if (this.unlocked.has(key)) {
            return this.unlocked.get(key);
        }

        try {
            const result = this.api?.unlockGalleryImage
                ? await this.api.unlockGalleryImage(payload)
                : payload;
            const unlocked = result ?? payload;
            this.unlocked.set(key, unlocked);
            return unlocked;
        } catch (error) {
            this.lastError = error;
            return null;
        }
    }

    async loadUnlocked() {
        if (!this.api?.getGalleryImages) {
            return [...this.unlocked.values()];
        }

        const items = await this.api.getGalleryImages();
        this.unlocked.clear();

        for (const item of items) {
            this.unlocked.set(String(item.id ?? item.image), item);
        }

        return [...this.unlocked.values()];
    }
}
