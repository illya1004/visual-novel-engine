export class CharacterRenderer {
    constructor(htmlElements = {}, slots = new Map(), config = {}) {
        this.htmlElements = {
            container_id: "character-container",
            target_id: "background_image",
            ...htmlElements
        };
        this.slots = slots;
        this.config = {
            positions: {
                left: (scale) => ({ left: "0", right: "auto", transform: `scale(${scale})`, transformOrigin: "bottom left" }),
                right: (scale) => ({ left: "auto", right: "0", transform: `scale(${scale})`, transformOrigin: "bottom right" }),
                center: (scale) => ({ left: "50%", right: "auto", transform: `translateX(-50%) scale(${scale})`, transformOrigin: "bottom center" })
            },
            speakOpacity: 1,
            idleOpacity: 0.65,
            speakScale: 1.15,
            idleScale: 1,
            showCharacterNames: false,
            ...config
        };
        this.setCharacterScales({
            activeCharacterScale: this.config.activeCharacterScale,
            inactiveCharacterScale: this.config.inactiveCharacterScale,
            active_character_scale: this.config.active_character_scale,
            inactive_character_scale: this.config.inactive_character_scale,
            activeScale: this.config.activeScale,
            inactiveScale: this.config.inactiveScale,
            characterActiveScale: this.config.characterActiveScale,
            characterInactiveScale: this.config.characterInactiveScale,
            character_active_scale: this.config.character_active_scale,
            character_inactive_scale: this.config.character_inactive_scale,
            speakingScale: this.config.speakingScale,
            speaking_scale: this.config.speaking_scale,
            idleScale: this.config.idleScale,
            idle_scale: this.config.idle_scale,
            speakScale: this.config.speakScale,
            speak_scale: this.config.speak_scale
        });
        this.activeCharacterId = null;
    }

    _coerceScale(value, fallback) {
        const scale = Number(value);
        return Number.isFinite(scale) && scale > 0 ? scale : fallback;
    }

    setCharacterScales(scales = {}, inactiveScaleValue = undefined) {
        const nextScales = typeof scales === "object" && scales !== null
            ? scales
            : {
                activeCharacterScale: scales,
                inactiveCharacterScale: inactiveScaleValue
            };
        const activeScale = nextScales.active
            ?? nextScales.activeCharacterScale
            ?? nextScales.active_character_scale
            ?? nextScales.characterActiveScale
            ?? nextScales.character_active_scale
            ?? nextScales.speakingScale
            ?? nextScales.speaking_scale
            ?? nextScales.speak_scale
            ?? nextScales.speakScale;
        const inactiveScale = nextScales.inactive
            ?? nextScales.inactiveCharacterScale
            ?? nextScales.inactive_character_scale
            ?? nextScales.characterInactiveScale
            ?? nextScales.character_inactive_scale
            ?? nextScales.inactiveScale
            ?? nextScales.inactive_scale
            ?? nextScales.idle_scale
            ?? nextScales.idleScale;

        this.config.speakScale = this._coerceScale(activeScale, this.config.speakScale);
        this.config.idleScale = this._coerceScale(inactiveScale, this.config.idleScale);

        return this.getCharacterScales();
    }

    getTransformOrigin(position = "center") {
        if (position === "left") {
            return "bottom left";
        }

        if (position === "right") {
            return "bottom right";
        }

        return "bottom center";
    }

    normalizeAppearanceStyle(style = {}) {
        const {
            imageMaxHeight,
            image_max_height,
            imageHeight,
            image_height,
            imageMaxWidth,
            image_max_width,
            scale,
            characterScale,
            character_scale,
            offsetX,
            offset_x,
            offsetY,
            offset_y,
            transform,
            transformOrigin,
            transform_origin,
            ...slotStyle
        } = style || {};

        return {
            slotStyle,
            imageStyle: {
                maxHeight: imageMaxHeight ?? image_max_height ?? imageHeight ?? image_height ?? "100%",
                maxWidth: imageMaxWidth ?? image_max_width ?? "100%"
            },
            scale: this._coerceScale(scale ?? characterScale ?? character_scale, 1),
            offsetX: this.normalizeLength(offsetX ?? offset_x ?? "0px"),
            offsetY: this.normalizeLength(offsetY ?? offset_y ?? "0px"),
            transformOrigin: transformOrigin ?? transform_origin ?? null,
            extraTransform: transform || ""
        };
    }

    normalizeLength(value, fallback = "0px") {
        if (value === undefined || value === null || value === "") {
            return fallback;
        }

        if (typeof value === "number") {
            return value === 0 ? "0px" : `${value}px`;
        }

        const text = String(value).trim();

        if (!text) {
            return fallback;
        }

        if (/^-?\d+(\.\d+)?$/.test(text)) {
            return `${text}px`;
        }

        return text;
    }

    getScaleBoundedMaxHeight(value, scale) {
        const maxVisualPercent = 100 / this._coerceScale(scale, 1);
        const rawValue = value === undefined || value === null || value === "" ? "100%" : String(value);
        const percentMatch = /^\s*(\d+(?:\.\d+)?)%\s*$/.exec(rawValue);

        if (percentMatch) {
            return `${Math.min(Number(percentMatch[1]), maxVisualPercent)}%`;
        }

        return `min(${rawValue}, ${maxVisualPercent}%)`;
    }

    withOffsetTransform(transform, offsetX = "0px", offsetY = "0px", extraTransform = "") {
        const offsetTransform = `translate(${offsetX || "0px"}, ${offsetY || "0px"})`;
        return [transform, offsetTransform, extraTransform].filter(Boolean).join(" ");
    }

    getCharacterScales() {
        return {
            activeCharacterScale: this.config.speakScale,
            inactiveCharacterScale: this.config.idleScale
        };
    }

    getPreferredContainerId() {
        const configuredId = this.htmlElements.container_id;

        if (typeof document !== "undefined" && configuredId && document.getElementById(configuredId)) {
            return configuredId;
        }

        const fallbackIds = ["characters", "character-container"];
        for (const id of fallbackIds) {
            if (typeof document !== "undefined" && document.getElementById(id)) {
                return id;
            }
        }

        return configuredId || "character-container";
    }

    setActiveCharacter(characterId) {
        this.activeCharacterId = characterId;
    }

    getDisplayContainer() {
        const containerId = this.getPreferredContainerId();
        this.htmlElements.container_id = containerId;
        let container = containerId ? document.getElementById(containerId) : null;

        if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            container.style.position = "absolute";
            container.style.inset = "0";
            container.style.pointerEvents = "none";

            const targetElement = this.htmlElements.target_id
                ? document.getElementById(this.htmlElements.target_id)
                : null;

            if (targetElement && typeof targetElement.appendChild === "function") {
                targetElement.appendChild(container);
            } else if (document.body && typeof document.body.appendChild === "function") {
                document.body.appendChild(container);
            }
        }
        container.classList?.add?.("web-novel-characters");

        return container;
    }

    getLegacySlot(position = "center") {
        if (typeof document === "undefined") {
            return null;
        }

        const legacyIds = {
            left: "character-left",
            center: "character-center",
            right: "character-right"
        };
        const element = document.getElementById(legacyIds[position] || legacyIds.center);

        if (!element) {
            return null;
        }

        const isAlreadyUsed = [...this.slots.values()]
            .some(slot => slot.slotElement === element);

        return isAlreadyUsed ? null : { slotElement: element, imgElement: element, nameElement: null };
    }

    getOrCreateSlot(characterId, position = "center") {
        const slot = this.slots?.get(characterId);

        if (slot) {
            return slot;
        }

        const legacySlot = this.getLegacySlot(position);
        if (legacySlot) {
            this.slots?.set(characterId, legacySlot);
            return legacySlot;
        }

        const container = this.getDisplayContainer();
        const slotElement = document.createElement("div");
        slotElement.className = "character-slot";
        slotElement.style.position = "absolute";
        slotElement.style.top = "0";
        slotElement.style.bottom = "0";
        slotElement.style.height = "100%";
        slotElement.style.display = "flex";
        slotElement.style.flexDirection = "column";
        slotElement.style.alignItems = "center";
        slotElement.style.justifyContent = "flex-end";
        slotElement.style.transition = "opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease";
        slotElement.style.opacity = "1";
        slotElement.style.transform = "scale(1)";
        slotElement.style.transformOrigin = "bottom center";
        slotElement.style.filter = "brightness(1)";

        const imgElement = document.createElement("img");
        imgElement.alt = characterId;
        imgElement.style.maxHeight = "100%";
        imgElement.style.maxWidth = "100%";
        imgElement.style.width = "auto";
        imgElement.style.height = "auto";
        imgElement.style.objectFit = "contain";

        let nameElement = null;

        slotElement.appendChild(imgElement);

        if (this.config.showCharacterNames) {
            nameElement = document.createElement("div");
            nameElement.style.marginTop = "8px";
            nameElement.style.textAlign = "center";
            nameElement.style.color = "#fff";
            nameElement.style.textShadow = "0 0 6px rgba(0, 0, 0, 0.8)";
            slotElement.appendChild(nameElement);
        }

        container.appendChild(slotElement);

        const createdSlot = { slotElement, imgElement, nameElement };
        this.slots?.set(characterId, createdSlot);

        return createdSlot;
    }

    applySlotAppearance(slot, state, isSpeaking, appearance = {}) {
        const opacity = isSpeaking ? this.config.speakOpacity : this.config.idleOpacity;
        const baseScale = isSpeaking ? this.config.speakScale : this.config.idleScale;
        const scale = baseScale * this._coerceScale(appearance.scale, 1);
        const filter = isSpeaking ? "brightness(1)" : "brightness(0.65)";
        const positionBuilder = this.config.positions[state.position] || this.config.positions.center;
        const positionStyles = positionBuilder(scale);
        const transformOrigin = appearance.transformOrigin || positionStyles.transformOrigin || this.getTransformOrigin(state.position);

        Object.assign(slot.slotElement.style, {
            ...positionStyles,
            top: positionStyles.top ?? "0",
            bottom: positionStyles.bottom ?? "0",
            height: positionStyles.height ?? "100%",
            opacity: String(opacity),
            filter,
            transform: this.withOffsetTransform(positionStyles.transform, appearance.offsetX, appearance.offsetY, appearance.extraTransform),
            transformOrigin,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            visibility: "visible"
        });

        if (slot.imgElement) {
            slot.imgElement.style.maxHeight = this.getScaleBoundedMaxHeight(appearance.imageStyle?.maxHeight, scale);
            slot.imgElement.style.maxWidth = appearance.imageStyle?.maxWidth || "100%";
            slot.imgElement.style.opacity = String(opacity);
            slot.imgElement.style.filter = filter;
            slot.imgElement.style.display = "block";
            slot.imgElement.style.visibility = "visible";
        }

        if (slot.nameElement && this.config.showCharacterNames) {
            slot.nameElement.style.opacity = String(opacity);
        }

        if (slot.slotElement.classList) {
            slot.slotElement.classList.toggle("active", state.speaking);
            slot.slotElement.classList.toggle("dim", !state.speaking);
        }
    }

    getCharacterNameColor(character = {}, state = {}) {
        return state.nameColor
            ?? character.nameColor
            ?? character.name_color
            ?? character.nameColour
            ?? character.name_colour
            ?? character.speakerColor
            ?? character.speaker_color
            ?? character.color
            ?? null;
    }

    render(state, character, style = {}) {
        if (!state.visible) {
            const slot = this.slots?.get(state.id);

            if (slot) {
                slot.slotElement.style.display = "none";
            }

            return slot || null;
        }

        const slot = this.getOrCreateSlot(state.id, state.position);
        const imageUrl = state.image || character?.image || null;
        const displayName = character?.name || state.id;
        const isSpeaking = state.speaking;
        const nameColor = this.getCharacterNameColor(character, state);
        const appearance = this.normalizeAppearanceStyle(style);

        if (slot.imgElement) {
            slot.imgElement.src = imageUrl;
        }

        if (slot.nameElement && this.config.showCharacterNames) {
            slot.nameElement.textContent = displayName;
            slot.nameElement.style.display = "block";
            slot.nameElement.style.color = nameColor || "#fff";
        } else if (slot.nameElement) {
            slot.nameElement.textContent = "";
            slot.nameElement.style.display = "none";
        }

        slot.slotElement.style.display = "block";

        Object.assign(slot.slotElement.style, {
            width: "30%",
            maxWidth: "280px",
            minWidth: "180px",
            zIndex: "2",
            ...appearance.slotStyle
        });

        this.applySlotAppearance(slot, state, isSpeaking, appearance);

        return slot;
    }
}
