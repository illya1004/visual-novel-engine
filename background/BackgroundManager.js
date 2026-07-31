export class BackgroundManager {

    constructor(config) {
        this.target_id = config.target_id || config.targetId || "background_image";
        this.image_id = config.image_id || "bg_img";
        this.currentImage = null;
        this.currentType = null;
        this.currentOptions = {};
    }

    _getSourceFromValue(value) {
        if (!value) {
            return null;
        }

        if (typeof value === "string") {
            return value;
        }

        if (typeof value === "object") {
            return value.image
                ?? value.gif
                ?? value.src
                ?? value.source
                ?? value.url
                ?? value.media
                ?? value.file
                ?? null;
        }

        return null;
    }

    getBackgroundSource(node = {}) {
        if (typeof node === "string") {
            return node;
        }

        return this._getSourceFromValue(node.image)
            ?? this._getSourceFromValue(node.gif)
            ?? this._getSourceFromValue(node.src)
            ?? this._getSourceFromValue(node.source)
            ?? this._getSourceFromValue(node.url)
            ?? this._getSourceFromValue(node.media)
            ?? this._getSourceFromValue(node.background);
    }

    getBackgroundOptions(node = {}) {
        if (!node || typeof node !== "object") {
            return {};
        }

        const getOptions = (value) => value && typeof value === "object" ? value : {};
        const nestedBackgroundOptions = node.background && typeof node.background === "object"
            ? getOptions(node.background.options)
            : {};

        return {
            ...nestedBackgroundOptions,
            ...getOptions(node.backgroundOptions ?? node.background_options),
            ...getOptions(node.options)
        };
    }

    getMediaType(source, options = {}) {
        const explicitType = options.mediaType
            ?? options.media_type
            ?? options.kind
            ?? null;

        if (explicitType) {
            return String(explicitType).toLowerCase();
        }

        const sourcePath = String(source ?? "")
            .split("?")[0]
            .split("#")[0]
            .toLowerCase();

        return sourcePath.endsWith(".gif") ? "gif" : "image";
    }

    load(node = {}) {
        const image = this.getBackgroundSource(node);
        const options = this.getBackgroundOptions(node);

        if (!image) {
            return null;
        }

        return this.ShowBackground(image, options);
    }

    showBackground(image, options = {}) {
        return this.ShowBackground(image, options);
    }

    ShowBackground(image, options = {}) {
        const targetElement = document.getElementById(this.target_id);

        if (!targetElement) {
            throw new Error(`Target element '${this.target_id}' not found`);
        }
        targetElement.classList?.add?.("web-novel-background");

        let img = document.getElementById(this.image_id);

        if (!img) {
            img = document.createElement("img");
            img.id = this.image_id;
            img.alt = "";
            img.style.position = "absolute";
            img.style.inset = "0";
            img.style.display = "block";
            img.style.zIndex = "0";
            targetElement.appendChild(img);
        }

        const mediaType = this.getMediaType(image, options);

        img.src = image;
        img.style.width = options.width ?? "100%";
        img.style.height = options.height ?? "100%";
        img.style.opacity = options.opacity ?? 1;
        img.style.objectFit = options.objectFit ?? "cover";
        img.style.objectPosition = options.objectPosition ?? options.object_position ?? "center";
        if (img.dataset) {
            img.dataset.backgroundMediaType = mediaType;
        }
        this.currentImage = image;
        this.currentType = mediaType;
        this.currentOptions = options;
        return { image, options, type: mediaType };
    }

    getElement() {
        if (typeof document === "undefined") {
            return null;
        }

        return document.getElementById(this.image_id);
    }

    getTargetElement() {
        if (typeof document === "undefined") {
            return null;
        }

        return document.getElementById(this.target_id);
    }

    clear() {
        if (typeof document === "undefined") {
            return;
        }

        const img = document.getElementById(this.image_id);
        if (img) {
            img.removeAttribute("src");
            if (img.dataset) {
                delete img.dataset.backgroundMediaType;
            }
        }
        this.currentImage = null;
        this.currentType = null;
        this.currentOptions = {};
    }


    PlayFlashEffect(options = {}) {
        const img = document.getElementById(this.image_id);

        if (!img) return;

        img.style.transition =
            `opacity ${options.fade_time ?? 0.5}s`;
    }


    StopFlashEffect() {
        const img = document.getElementById(this.image_id);

        if (!img) return;

        img.style.transition = "";
    }
}
