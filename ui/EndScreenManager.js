export class EndScreenManager {
    constructor(options = {}) {
        this.options = {
            enabled: true,
            rootTargetId: "game",
            backUrl: null,
            title: "Кінець",
            backLabel: "Назад",
            replayLabel: "Зіграти знову",
            ...options
        };
        this.engine = options.engine || null;
        this.onReplay = options.onReplay || null;
        this.overlay = null;
        this.currentNode = null;
    }

    setEngine(engine) {
        this.engine = engine;
    }

    getNodeOptions(node = {}) {
        const nested = node.endScreen ?? node.end_screen ?? node.options ?? {};

        return {
            ...this.options,
            ...nested,
            backUrl: nested.backUrl
                ?? nested.back_url
                ?? node.backUrl
                ?? node.back_url
                ?? node.url
                ?? this.options.backUrl,
            title: nested.title ?? node.title ?? this.options.title,
            backLabel: nested.backLabel
                ?? nested.back_label
                ?? node.backLabel
                ?? node.back_label
                ?? this.options.backLabel,
            replayLabel: nested.replayLabel
                ?? nested.replay_label
                ?? node.replayLabel
                ?? node.replay_label
                ?? this.options.replayLabel
        };
    }

    show(node = {}) {
        if (!this.options.enabled || typeof document === "undefined") {
            return null;
        }

        this.currentNode = node;
        const options = this.getNodeOptions(node);

        if (!options.enabled) {
            return null;
        }

        const overlay = this.getOrCreateOverlay(options);

        this.setText("[data-end-title]", options.title || "");
        this.setText("[data-end-back]", options.backLabel || "Назад");
        this.setText("[data-end-replay]", options.replayLabel || "Зіграти знову");
        overlay.hidden = false;
        overlay.dataset.endVisible = "true";

        return overlay;
    }

    setText(selector, value) {
        const element = this.overlay?.querySelector?.(selector);

        if (element) {
            element.textContent = value;
        }
    }

    hide() {
        if (!this.overlay) {
            return false;
        }

        this.overlay.hidden = true;
        delete this.overlay.dataset.endVisible;
        return true;
    }

    getOrCreateOverlay(options = this.options) {
        if (this.overlay) {
            return this.overlay;
        }

        const root = this.getRootElement(options);
        const overlay = document.createElement("div");
        overlay.className = "web-novel-end-screen";
        overlay.dataset.novelUi = "end-screen";
        overlay.hidden = true;

        const panel = document.createElement("div");
        panel.className = "web-novel-end-screen__panel";

        const title = document.createElement("h2");
        title.className = "web-novel-end-screen__title";
        title.dataset.endTitle = "true";

        const actions = document.createElement("div");
        actions.className = "web-novel-end-screen__actions";

        const backButton = this.createButton("web-novel-end-screen__button", "back");
        backButton.dataset.endBack = "true";
        backButton.addEventListener("click", () => this.goBack());

        const replayButton = this.createButton("web-novel-end-screen__button web-novel-end-screen__button--primary", "replay");
        replayButton.dataset.endReplay = "true";
        replayButton.addEventListener("click", () => this.replay());

        actions.append(backButton, replayButton);
        panel.append(title, actions);
        overlay.appendChild(panel);
        root.appendChild(overlay);

        this.overlay = overlay;
        return overlay;
    }

    createButton(className, action) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.dataset.endAction = action;
        return button;
    }

    getRootElement(options = this.options) {
        const rootId = options.rootTargetId ?? options.root_target_id ?? this.options.rootTargetId;
        const root = rootId ? document.getElementById(rootId) : null;
        return root || document.body;
    }

    goBack() {
        const options = this.getNodeOptions(this.currentNode || {});
        const backUrl = options.backUrl ?? options.back_url ?? null;

        if (backUrl && typeof window !== "undefined") {
            window.location.assign(String(backUrl));
            return backUrl;
        }

        if (typeof window !== "undefined" && window.history?.back) {
            window.history.back();
            return null;
        }

        return null;
    }

    async replay() {
        this.hide();

        if (this.onReplay) {
            return await this.onReplay();
        }

        return await this.engine?.restart?.();
    }
}
