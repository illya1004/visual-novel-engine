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
        await this.characters?.loadCharacters?.();
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

    reset() {
        this.dialogue?.cancel?.();
        this.choice?.clear?.();
        this.characters?.clearCharacters?.();
        this.state = {
            status: "idle",
            currentNodeId: null,
            isWaitingForChoice: false
        };
        return this.state;
    }
}
