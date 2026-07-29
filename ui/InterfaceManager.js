export class InterfaceManager {
    constructor(engine, options = {}) {
        this.engine = engine;
        this.options = {
            enabled: true,
            autoCreateControls: true,
            hideSelectors: ["#dialogue", "#choices", "#panel", "[data-novel-ui-hideable]"],
            ...options
        };
        this.hidden = false;
        this.toolbar = null;
        this.settingsPanel = null;
        this.nonEssentialButtons = [];
        this.previousHiddenStates = new Map();

        if (this.options.enabled && this.options.autoCreateControls && typeof document !== "undefined") {
            this.createControls();
        }
    }

    _createButton(label, title, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "web-novel-tool-button";
        button.textContent = label;
        button.title = title;
        button.setAttribute("aria-label", title);
        button.style.width = "38px";
        button.style.height = "38px";
        button.style.border = "0";
        button.style.borderRadius = "8px";
        button.style.background = "rgba(7, 11, 22, 0.78)";
        button.style.color = "#fff";
        button.style.cursor = "pointer";
        button.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.3)";
        button.addEventListener("click", onClick);
        return button;
    }

    createControls() {
        if (this.toolbar) {
            return this.toolbar;
        }

        this.toolbar = document.createElement("div");
        this.toolbar.className = "web-novel-toolbar";
        this.toolbar.dataset.novelUi = "toolbar";
        Object.assign(this.toolbar.style, {
            position: "fixed",
            top: "14px",
            right: "14px",
            zIndex: "9999",
            display: "flex",
            gap: "8px"
        });

        const settingsButton = this._createButton("⚙", "Налаштування", () => this.toggleSettingsPanel());
        const saveButton = this._createButton("💾", "Зберегти", () => this.engine?.saveGame?.());
        const eyeButton = this._createButton("👁", "Показати або приховати інтерфейс", () => this.toggleInterface());

        this.nonEssentialButtons = [settingsButton, saveButton];
        this.toolbar.append(settingsButton, saveButton, eyeButton);
        document.body.appendChild(this.toolbar);
        this.settingsPanel = this._createSettingsPanel();
        document.body.appendChild(this.settingsPanel);
        return this.toolbar;
    }

    _createSettingsPanel() {
        const panel = document.createElement("form");
        panel.className = "web-novel-settings-panel";
        panel.dataset.novelUi = "settings";
        panel.hidden = true;
        Object.assign(panel.style, {
            position: "fixed",
            top: "62px",
            right: "14px",
            zIndex: "9999",
            display: "grid",
            gap: "10px",
            width: "min(320px, calc(100vw - 28px))",
            padding: "14px",
            borderRadius: "8px",
            background: "rgba(7, 11, 22, 0.92)",
            color: "#fff",
            boxShadow: "0 14px 40px rgba(0, 0, 0, 0.38)"
        });

        const settings = this.engine?.settings;
        const addInput = (labelText, input) => {
            const label = document.createElement("label");
            label.style.display = "grid";
            label.style.gap = "4px";
            label.style.fontSize = "13px";
            label.textContent = labelText;
            label.appendChild(input);
            panel.appendChild(label);
            return input;
        };

        const textSpeed = addInput("Швидкість тексту", document.createElement("input"));
        textSpeed.type = "number";
        textSpeed.min = "1";
        textSpeed.value = settings?.get?.("textSpeed") ?? 50;

        const textSize = addInput("Розмір тексту", document.createElement("input"));
        textSize.type = "number";
        textSize.min = "10";
        textSize.value = settings?.get?.("textSize") ?? "";

        const soundEnabled = addInput("Звук увімкнено", document.createElement("input"));
        soundEnabled.type = "checkbox";
        soundEnabled.checked = settings?.get?.("soundEnabled") ?? true;

        const musicEnabled = addInput("Музика увімкнена", document.createElement("input"));
        musicEnabled.type = "checkbox";
        musicEnabled.checked = settings?.get?.("musicEnabled") ?? true;

        const soundEffectsEnabled = addInput("Ефекти увімкнені", document.createElement("input"));
        soundEffectsEnabled.type = "checkbox";
        soundEffectsEnabled.checked = settings?.get?.("soundEffectsEnabled") ?? true;

        const volume = addInput("Гучність", document.createElement("input"));
        volume.type = "range";
        volume.min = "0";
        volume.max = "1";
        volume.step = "0.05";
        volume.value = settings?.get?.("volume") ?? 1;

        const musicVolume = addInput("Гучність музики", document.createElement("input"));
        musicVolume.type = "range";
        musicVolume.min = "0";
        musicVolume.max = "1";
        musicVolume.step = "0.05";
        musicVolume.value = settings?.get?.("musicVolume") ?? 1;

        const soundVolume = addInput("Гучність ефектів", document.createElement("input"));
        soundVolume.type = "range";
        soundVolume.min = "0";
        soundVolume.max = "1";
        soundVolume.step = "0.05";
        soundVolume.value = settings?.get?.("soundVolume") ?? 1;

        panel.addEventListener("input", () => {
            this.engine?.updateSettings?.({
                textSpeed: Number(textSpeed.value) || 1,
                textSize: textSize.value ? Number(textSize.value) : null,
                soundEnabled: soundEnabled.checked,
                musicEnabled: musicEnabled.checked,
                soundEffectsEnabled: soundEffectsEnabled.checked,
                volume: Number(volume.value),
                musicVolume: Number(musicVolume.value),
                soundVolume: Number(soundVolume.value)
            });
        });
        panel.addEventListener("submit", (event) => event.preventDefault());

        return panel;
    }

    toggleSettingsPanel() {
        if (!this.settingsPanel) {
            return false;
        }

        this.settingsPanel.hidden = !this.settingsPanel.hidden;
        return !this.settingsPanel.hidden;
    }

    toggleInterface(forceHidden) {
        this.hidden = forceHidden ?? !this.hidden;

        for (const selector of this.options.hideSelectors) {
            document.querySelectorAll(selector).forEach((element) => {
                if (this.hidden) {
                    this.previousHiddenStates.set(element, element.hidden);
                    element.hidden = true;
                } else {
                    element.hidden = this.previousHiddenStates.get(element) ?? false;
                    this.previousHiddenStates.delete(element);
                }
            });
        }

        for (const button of this.nonEssentialButtons) {
            button.style.display = this.hidden ? "none" : "";
        }

        if (this.settingsPanel) {
            this.settingsPanel.hidden = true;
        }

        return this.hidden;
    }
}
