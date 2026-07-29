export class SaveManager {
    constructor(options = {}) {
        this.enabled = options.enabled ?? true;
        this.storageKey = options.storageKey || "webNovel.save";
        this.storage = options.storage || this._getDefaultStorage();
        this.lastError = null;
    }

    _getDefaultStorage() {
        if (typeof localStorage === "undefined") {
            return null;
        }

        return localStorage;
    }

    canSaveNode(node) {
        if (!this.enabled || !node) {
            return false;
        }

        if (node.save === false || node.canSave === false || node.can_save === false) {
            return false;
        }

        return !(node.auto_next || node.skip_auto || node.skipAuto);
    }

    createSnapshot(engine) {
        const node = engine?.nodeManager?.current?.();

        if (!this.canSaveNode(node)) {
            return null;
        }

        return {
            currentNodeId: engine.nodeManager.currentNodeId,
            currentNodeIndex: engine.nodeManager.currentNodeIndex,
            settings: engine.settings?.snapshot?.() ?? null,
            savedAt: new Date().toISOString()
        };
    }

    save(engine) {
        const snapshot = this.createSnapshot(engine);

        if (!snapshot) {
            return null;
        }

        if (this.storage?.setItem) {
            try {
                this.storage.setItem(this.storageKey, JSON.stringify(snapshot));
            } catch (error) {
                this.lastError = error;
                return null;
            }
        }

        return snapshot;
    }

    load() {
        if (!this.storage?.getItem) {
            return null;
        }

        try {
            return JSON.parse(this.storage.getItem(this.storageKey) || "null");
        } catch (error) {
            this.lastError = error;
            return null;
        }
    }

    clear() {
        this.storage?.removeItem?.(this.storageKey);
    }
}
