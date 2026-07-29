export class ViewportManager {
    constructor(options = {}) {
        this.rootTargetId = options.rootTargetId
            || options.root_target_id
            || options.gameRootId
            || options.game_root_id
            || "game";
        this.rootElement = options.rootElement || null;
        this.orientation = options.orientation || options.mode || "landscape";
        this.aspectRatio = options.aspectRatio || options.aspect_ratio || null;
        this.landscapeAspectRatio = options.landscapeAspectRatio || options.landscape_aspect_ratio || "16 / 9";
        this.portraitAspectRatio = options.portraitAspectRatio || options.portrait_aspect_ratio || "9 / 16";
        this.fit = options.fit || "contain";
        this.centerStage = options.centerStage ?? options.center_stage ?? true;
        this._handleResize = () => this.apply();
    }

    getRootElement() {
        if (this.rootElement) {
            return this.rootElement;
        }

        if (typeof document === "undefined") {
            return null;
        }

        this.rootElement = document.getElementById(this.rootTargetId)
            || document.querySelector?.("[data-web-novel-root]")
            || null;
        return this.rootElement;
    }

    normalizeOrientation(orientation = this.orientation) {
        const normalized = String(orientation || "landscape").toLowerCase();
        return ["landscape", "portrait", "auto"].includes(normalized) ? normalized : "landscape";
    }

    normalizeFit(fit = this.fit) {
        const normalized = String(fit || "contain").toLowerCase();
        return ["contain", "fill"].includes(normalized) ? normalized : "contain";
    }

    getCurrentOrientation() {
        const normalized = this.normalizeOrientation();

        if (normalized !== "auto") {
            return normalized;
        }

        if (typeof window !== "undefined" && window.innerHeight > window.innerWidth) {
            return "portrait";
        }

        return "landscape";
    }

    getAspectRatio(orientation = this.getCurrentOrientation()) {
        return this.aspectRatio
            || (orientation === "portrait" ? this.portraitAspectRatio : this.landscapeAspectRatio);
    }

    parseAspectRatio(value) {
        if (typeof value === "number" && Number.isFinite(value) && value > 0) {
            return { width: value, height: 1, css: `${value} / 1` };
        }

        const parts = String(value || "16 / 9")
            .split("/")
            .map((part) => Number(part.trim()));

        if (parts.length === 2 && parts.every((part) => Number.isFinite(part) && part > 0)) {
            return { width: parts[0], height: parts[1], css: `${parts[0]} / ${parts[1]}` };
        }

        return { width: 16, height: 9, css: "16 / 9" };
    }

    apply() {
        const root = this.getRootElement();

        if (!root) {
            return null;
        }

        const orientation = this.getCurrentOrientation();
        const aspect = this.parseAspectRatio(this.getAspectRatio(orientation));

        root.classList?.add?.("web-novel-root");
        root.dataset.webNovelRoot = "true";
        root.dataset.novelOrientationMode = this.normalizeOrientation();
        root.dataset.novelOrientation = orientation;
        root.dataset.novelFit = this.normalizeFit();
        root.style?.setProperty?.("--wn-stage-aspect-ratio", aspect.css);
        root.style?.setProperty?.("--wn-stage-aspect-width", String(aspect.width));
        root.style?.setProperty?.("--wn-stage-aspect-height", String(aspect.height));

        if (this.centerStage && typeof document !== "undefined") {
            document.body?.classList?.add?.("web-novel-page");
        }

        return {
            orientation,
            aspectRatio: aspect.css,
            fit: this.normalizeFit()
        };
    }

    start() {
        const applied = this.apply();

        if (typeof window !== "undefined" && window.addEventListener) {
            window.addEventListener("resize", this._handleResize);
            window.addEventListener("orientationchange", this._handleResize);
        }

        return applied;
    }

    stop() {
        if (typeof window !== "undefined" && window.removeEventListener) {
            window.removeEventListener("resize", this._handleResize);
            window.removeEventListener("orientationchange", this._handleResize);
        }
    }

    setOrientation(orientation, options = {}) {
        this.orientation = orientation ?? this.orientation;

        if (options.aspectRatio ?? options.aspect_ratio) {
            this.aspectRatio = options.aspectRatio ?? options.aspect_ratio;
        }

        if (options.fit) {
            this.fit = options.fit;
        }

        return this.apply();
    }

    applyNode(node = {}) {
        const values = node.viewport || node.layout || node.data || node;

        return this.setOrientation(
            values.orientation ?? values.mode ?? values.screenOrientation ?? values.screen_orientation ?? values.value,
            {
                aspectRatio: values.aspectRatio ?? values.aspect_ratio,
                fit: values.fit
            }
        );
    }
}
