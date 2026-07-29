export class Engine {

    constructor(config) {
        this.config = config;
        this.state = {
            status: "idle",
            currentNodeId: null,
            isWaitingForChoice: false
        };
    }

    _syncState(node) {
        this.state.currentNodeId = node?.id ?? this.nodeManager?.currentNodeId ?? null;
        this.state.isWaitingForChoice = node?.type === "choice";
        this.state.status = node ? "running" : "finished";
        return this.state;
    }

    async start() {
        this.state.status = "loading";
        await this.settings?.promptForNovelStart?.();
        await this.characters?.loadCharacters?.();
        this.settings?.applyAll?.({
            soundManager: this.sound,
            dialogueManager: this.dialogue,
            charactersManager: this.characters
        });
        await this.nodeManager?.loadNodes?.();

        const node = await this.nodeManager?.start?.();
        this._syncState(node);
        return node;
    }

    async next() {
        const node = await this.nodeManager?.next?.();
        this._syncState(node);
        return node;
    }

    async selectChoice(index) {
        const node = await this.nodeManager?.selectChoice?.(index);
        this._syncState(node);
        return node;
    }

    updateSettings(values = {}) {
        const settings = this.settings?.update?.(values) ?? null;
        this.settings?.applyAll?.({
            soundManager: this.sound,
            dialogueManager: this.dialogue,
            charactersManager: this.characters
        });
        return settings;
    }

    saveGame() {
        return this.save?.save?.(this) ?? null;
    }

    async loadGame() {
        const snapshot = this.save?.load?.();

        if (!snapshot || snapshot.currentNodeId === null || snapshot.currentNodeId === undefined) {
            return null;
        }

        if (snapshot.settings) {
            this.updateSettings(snapshot.settings);
        }

        if (!this.characters?.characters?.length) {
            await this.characters?.loadCharacters?.();
        }
        this.settings?.applyToCharacters?.(this.characters);

        if (!this.nodeManager?.nodes?.length) {
            await this.nodeManager?.loadNodes?.();
        }

        const node = this.nodeManager?.goTo?.(snapshot.currentNodeId);
        const result = await this.nodeManager?.executeNode?.(node);
        this._syncState(result);
        return result;
    }

    toggleInterface(forceHidden) {
        return this.interface?.toggleInterface?.(forceHidden) ?? false;
    }

    reset() {
        this.dialogue?.cancel?.();
        this.choice?.clear?.();
        this.characters?.clearCharacters?.();
        this.sound?.stopAll?.();
        this.state = {
            status: "idle",
            currentNodeId: null,
            isWaitingForChoice: false
        };
        return this.state;
    }
}
