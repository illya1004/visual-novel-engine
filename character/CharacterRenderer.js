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
                left: (scale) => ({ left: "0", right: "auto", transform: `scale(${scale})` }),
                right: (scale) => ({ left: "auto", right: "0", transform: `scale(${scale})` }),
                center: (scale) => ({ left: "50%", right: "auto", transform: `translateX(-50%) scale(${scale})` })
            },
            speakOpacity: 1,
            idleOpacity: 0.65,
            speakScale: 1.15,
            idleScale: 1,
            ...config
        };
        this.activeCharacterId = null;
    }

    setActiveCharacter(characterId) {
        this.activeCharacterId = characterId;
    }

    getDisplayContainer() {
        const containerId = this.htmlElements.container_id;
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

        return container;
    }

    getOrCreateSlot(characterId) {
        const slot = this.slots?.get(characterId);

        if (slot) {
            return slot;
        }

        const container = this.getDisplayContainer();
        const slotElement = document.createElement("div");
        slotElement.className = "character-slot";
        slotElement.style.position = "absolute";
        slotElement.style.bottom = "0";
        slotElement.style.display = "flex";
        slotElement.style.flexDirection = "column";
        slotElement.style.alignItems = "center";
        slotElement.style.justifyContent = "flex-end";
        slotElement.style.transition = "opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease";
        slotElement.style.opacity = "1";
        slotElement.style.transform = "scale(1)";
        slotElement.style.filter = "brightness(1)";

        const imgElement = document.createElement("img");
        imgElement.alt = characterId;
        imgElement.style.maxHeight = "80vh";
        imgElement.style.width = "auto";
        imgElement.style.height = "auto";
        imgElement.style.objectFit = "contain";

        const nameElement = document.createElement("div");
        nameElement.style.marginTop = "8px";
        nameElement.style.textAlign = "center";
        nameElement.style.color = "#fff";
        nameElement.style.textShadow = "0 0 6px rgba(0, 0, 0, 0.8)";

        slotElement.appendChild(imgElement);
        slotElement.appendChild(nameElement);
        container.appendChild(slotElement);

        const createdSlot = { slotElement, imgElement, nameElement };
        this.slots?.set(characterId, createdSlot);

        return createdSlot;
    }

    applySlotAppearance(slot, state, isSpeaking) {
        const opacity = isSpeaking ? this.config.speakOpacity : this.config.idleOpacity;
        const scale = isSpeaking ? this.config.speakScale : this.config.idleScale;
        const filter = isSpeaking ? "brightness(1)" : "brightness(0.65)";
        const positionBuilder = this.config.positions[state.position] || this.config.positions.center;
        const positionStyles = positionBuilder(scale);

        Object.assign(slot.slotElement.style, {
            ...positionStyles,
            opacity: String(opacity),
            filter,
            transform: positionStyles.transform
        });
        slot.imgElement.style.opacity = String(opacity);
        slot.imgElement.style.filter = filter;
    }

    render(state, character, style = {}) {
        if (!state.visible) {
            const slot = this.slots?.get(state.id);

            if (slot) {
                slot.slotElement.style.display = "none";
            }

            return slot || null;
        }

        const slot = this.getOrCreateSlot(state.id);
        const imageUrl = state.image || character?.image || null;
        const displayName = character?.name || state.id;
        const isSpeaking = this.activeCharacterId === state.id;

        slot.imgElement.src = imageUrl;
        slot.nameElement.textContent = displayName;
        slot.slotElement.style.display = "flex";

        Object.assign(slot.slotElement.style, {
            width: "30%",
            maxWidth: "280px",
            minWidth: "180px",
            zIndex: "2",
            ...style
        });

        this.applySlotAppearance(slot, state, isSpeaking);

        return slot;
    }
}
