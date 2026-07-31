export class SaveManager {
    constructor(options = {}) {
        this.enabled = options.enabled ?? true;
        this.storageKey = options.storageKey || "webNovel.save";
        this.storage = options.storage || this._getDefaultStorage();
        this.autoSaveEnabled = options.autoSaveEnabled ?? options.auto_save_enabled ?? true;
        this.autoSaveIntervalMs = Number(options.autoSaveIntervalMs ?? options.auto_save_interval_ms ?? 600000);
        this.autoSaveTimer = null;
        this.lastSave = null;
        this.lastAutoSave = null;
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

        const type = String(node.type ?? "").trim().toLowerCase();

        if (node.end === true || ["end", "ending", "finish", "finished", "кінець"].includes(type)) {
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

    save(engine, options = {}) {
        const snapshot = this.createSnapshot(engine);

        if (!snapshot) {
            return null;
        }

        snapshot.reason = options.reason ?? "manual";

        if (this.storage?.setItem) {
            try {
                this.storage.setItem(this.storageKey, JSON.stringify(snapshot));
            } catch (error) {
                this.lastError = error;
                return null;
            }
        }

        this.lastSave = snapshot;

        if (snapshot.reason === "auto") {
            this.lastAutoSave = snapshot;
        }

        return snapshot;
    }

    autoSave(engine) {
        return this.save(engine, { reason: "auto" });
    }

    startAutoSave(engine) {
        if (!this.enabled || !this.autoSaveEnabled || this.autoSaveTimer !== null || typeof setInterval === "undefined") {
            return null;
        }

        const intervalMs = Number.isFinite(this.autoSaveIntervalMs) && this.autoSaveIntervalMs > 0
            ? this.autoSaveIntervalMs
            : 600000;

        this.autoSaveTimer = setInterval(() => {
            this.autoSave(engine);
        }, intervalMs);

        return this.autoSaveTimer;
    }

    stopAutoSave() {
        if (this.autoSaveTimer === null || typeof clearInterval === "undefined") {
            return;
        }

        clearInterval(this.autoSaveTimer);
        this.autoSaveTimer = null;
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
