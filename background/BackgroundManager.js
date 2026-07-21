export class BackgroundManager {

    constructor(config) {
        this.target_id = config.target_id || config.targetId || "background_image";
        this.image_id = config.image_id || "bg_img";
        this.currentImage = null;
        this.currentOptions = {};
    }

    load(node = {}) {
        const image = node.image || node.background || null;
        const options = node.options || {};

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

        let img = document.getElementById(this.image_id);

        if (!img) {
            img = document.createElement("img");
            img.id = this.image_id;
            targetElement.appendChild(img);
        }

        img.src = image;
        img.style.width = options.width ?? "100%";
        img.style.height = options.height ?? "100%";
        img.style.opacity = options.opacity ?? 1;
        img.style.objectFit = options.objectFit ?? "cover";
        this.currentImage = image;
        this.currentOptions = options;
        return { image, options };
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