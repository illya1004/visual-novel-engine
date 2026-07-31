const EFFECT_CLASSES = {
    shake: "wn-effect-shake",
    blink: "wn-effect-blink",
    glitch: "wn-effect-glitch",
    pulse: "wn-effect-pulse",
    flash: "wn-effect-flash",
    fadein: "wn-effect-fadein",
    fadeout: "wn-effect-fadeout"
};

const EFFECT_ALIASES = {
    tremble: "shake",
    flicker: "blink",
    corrupt: "glitch",
    fade: "fadein",
    appear: "fadein",
    show: "fadein",
    disappear: "fadeout",
    hide: "fadeout"
};

const EFFECT_OPTION_KEYS = [
    "duration",
    "durationMs",
    "duration_ms",
    "speed",
    "speedMs",
    "speed_ms",
    "animationDuration",
    "animation_duration",
    "animationSpeed",
    "animation_speed",
    "iterations",
    "iterationCount",
    "iteration_count",
    "count",
    "repeat",
    "repeats",
    "repeatCount",
    "repeat_count",
    "times",
    "loop",
    "loops",
    "infinite",
    "persist",
    "intensity",
    "easing"
];

export class EffectsManager {
    constructor(managers = {}, options = {}) {
        this.backgroundManager = managers.backgroundManager || managers.background || null;
        this.charactersManager = managers.charactersManager || managers.characters || null;
        this.dialogueManager = managers.dialogueManager || managers.dialogue || null;
        this.enabled = options.enabled ?? true;
        const defaultDuration = Number(options.defaultDuration ?? options.default_duration ?? 700);
        this.defaultDuration = Number.isFinite(defaultDuration) && defaultDuration > 0 ? defaultDuration : 700;
        this.timers = new WeakMap();
    }

    normalizeEffectName(name = "") {
        const normalized = String(name || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
        return EFFECT_ALIASES[normalized] ?? normalized;
    }

    getEffectOptions(source = {}) {
        if (!source || typeof source !== "object") {
            return {};
        }

        return EFFECT_OPTION_KEYS.reduce((options, key) => {
            if (source[key] !== undefined) {
                options[key] = source[key];
            }

            return options;
        }, {});
    }

    getNodeDefaults(node = {}, defaults = {}) {
        const nodeOptions = node.options && typeof node.options === "object" && !Array.isArray(node.options)
            ? node.options
            : {};

        return {
            ...defaults,
            ...this.getEffectOptions(nodeOptions),
            ...this.getEffectOptions(node),
            target: node.target
                ?? node.effectTarget
                ?? node.effect_target
                ?? nodeOptions.target
                ?? nodeOptions.effectTarget
                ?? nodeOptions.effect_target
                ?? defaults.target,
            characterId: node.characterId
                ?? node.character_id
                ?? nodeOptions.characterId
                ?? nodeOptions.character_id
                ?? defaults.characterId,
            targetId: node.targetId
                ?? node.target_id
                ?? nodeOptions.targetId
                ?? nodeOptions.target_id
                ?? defaults.targetId,
            target_id: node.target_id
                ?? nodeOptions.target_id
                ?? defaults.target_id,
            element: node.element
                ?? nodeOptions.element
                ?? defaults.element,
            kind: node.kind
                ?? nodeOptions.kind
                ?? defaults.kind
        };
    }

    normalizePayload(effect, defaults = {}) {
        if (typeof effect === "string") {
            return {
                ...defaults,
                effect
            };
        }

        if (!effect || typeof effect !== "object") {
            return null;
        }

        return {
            ...defaults,
            ...effect,
            effect: effect.effect ?? effect.name ?? effect.action ?? defaults.effect
        };
    }

    getEffectsFromNode(node = {}) {
        const effects = [];
        const optionEffects = node.options?.effects ?? node.options?.effect ?? null;

        if (Array.isArray(node.effects)) {
            effects.push(...node.effects);
        } else if (node.effects) {
            effects.push(node.effects);
        }

        if (node.effect) {
            effects.push(node.effect);
        }

        if (Array.isArray(optionEffects)) {
            effects.push(...optionEffects);
        } else if (optionEffects) {
            effects.push(optionEffects);
        }

        return effects;
    }

    applyEffectsFromNode(node = {}, defaults = {}) {
        const effects = this.getEffectsFromNode(node);
        return this.applyEffects(effects, this.getNodeDefaults(node, defaults));
    }

    applyNode(node = {}) {
        const effects = this.getEffectsFromNode(node);

        if (!effects.length && node.effect === undefined) {
            effects.push(node);
        }

        return this.applyEffects(effects, this.getNodeDefaults(node));
    }

    getNodeEffectRuntime(node = {}, defaults = {}, options = {}) {
        const effects = this.getEffectsFromNode(node);

        if (!effects.length && options.includeNodeAsEffect === true && node.effect === undefined) {
            effects.push(node);
        }

        const nodeDefaults = this.getNodeDefaults(node, defaults);

        return effects.reduce((maxRuntime, effect) => {
            const payload = this.normalizePayload(effect, nodeDefaults);

            if (!payload) {
                return maxRuntime;
            }

            const name = this.normalizeEffectName(payload.effect ?? payload.name ?? payload.action);
            if (!EFFECT_CLASSES[name]) {
                return maxRuntime;
            }

            return Math.max(maxRuntime, this.getEffectRuntime(payload, options));
        }, 0);
    }

    applyEffects(effects = [], defaults = {}) {
        if (!this.enabled) {
            return [];
        }

        const list = Array.isArray(effects) ? effects : [effects];

        return list.flatMap((effect) => {
            const payload = this.normalizePayload(effect, defaults);
            return payload ? this.applyEffect(payload) : [];
        });
    }

    applyEffect(payload = {}) {
        const name = this.normalizeEffectName(payload.effect ?? payload.name ?? payload.action);
        const effectClass = EFFECT_CLASSES[name];

        if (!effectClass) {
            return [];
        }

        const elements = this.resolveElements(payload);

        for (const element of elements) {
            this.applyClass(element, effectClass, payload);
        }

        return elements;
    }

    resolveElements(payload = {}) {
        const target = String(payload.target ?? payload.kind ?? "background").toLowerCase();

        if (payload.element) {
            return [payload.element].filter(Boolean);
        }

        if (payload.targetId || payload.target_id) {
            const element = this.getElementById(payload.targetId ?? payload.target_id);
            return element ? [element] : [];
        }

        if (["background", "bg", "scene"].includes(target)) {
            return [
                this.backgroundManager?.getElement?.()
                    ?? this.getElementById(this.backgroundManager?.image_id)
                    ?? this.backgroundManager?.getTargetElement?.()
                    ?? this.getElementById(this.backgroundManager?.target_id)
            ].filter(Boolean);
        }

        if (["character", "characters", "sprite", "sprites"].includes(target)) {
            const characterId = payload.characterId ?? payload.character_id ?? payload.id;

            if (characterId !== null && characterId !== undefined) {
                return [this.charactersManager?.getCharacterElement?.(characterId)].filter(Boolean);
            }

            return this.charactersManager?.getVisibleCharacterElements?.() ?? [];
        }

        if (["dialogue", "text"].includes(target)) {
            return [
                this.dialogueManager?.targetElement,
                this.dialogueManager?.boxElement
            ].filter(Boolean);
        }

        return [];
    }

    getElementById(id) {
        if (!id || typeof document === "undefined") {
            return null;
        }

        return document.getElementById(id);
    }

    applyClass(element, effectClass, options = {}) {
        if (!element?.classList) {
            return;
        }

        const durationMs = this.getEffectDuration(options);
        const iterations = this.coerceIterations(options);

        this.clearElementEffect(element, effectClass);
        element.style?.setProperty?.("--wn-effect-duration", `${durationMs}ms`);
        element.style?.setProperty?.("--wn-effect-iterations", iterations);
        element.style?.setProperty?.("--wn-effect-opacity", this.getCurrentOpacity(element));

        if (options.intensity !== undefined) {
            element.style?.setProperty?.("--wn-effect-intensity", String(options.intensity));
        }

        if (options.easing !== undefined) {
            element.style?.setProperty?.("--wn-effect-easing", String(options.easing));
        }

        this.forceAnimationRestart(element);
        element.classList.add(effectClass);

        if (element.dataset) {
            element.dataset.wnEffect = effectClass;
        }

        if (iterations !== "infinite" && options.persist !== true) {
            const timer = setTimeout(() => {
                this.clearElementEffect(element, effectClass);
            }, this.getEffectRuntime(options) + 40);

            this.getTimerMap(element).set(effectClass, timer);
        }
    }

    getTimerMap(element) {
        let timerMap = this.timers.get(element);

        if (!timerMap) {
            timerMap = new Map();
            this.timers.set(element, timerMap);
        }

        return timerMap;
    }

    clearElementEffect(element, effectClass = null) {
        if (!element?.classList) {
            return;
        }

        const timerMap = this.timers.get(element);

        if (timerMap && effectClass) {
            const timer = timerMap.get(effectClass);

            if (timer) {
                clearTimeout(timer);
                timerMap.delete(effectClass);
            }
        } else if (timerMap) {
            for (const timer of timerMap.values()) {
                clearTimeout(timer);
            }
            timerMap.clear();
        }

        if (effectClass) {
            element.classList.remove(effectClass);
        } else {
            Object.values(EFFECT_CLASSES).forEach((className) => element.classList.remove(className));
        }

        if (element.dataset) {
            delete element.dataset.wnEffect;
        }

        if (timerMap && timerMap.size === 0) {
            this.timers.delete(element);
        }
    }

    coerceDuration(duration) {
        if (typeof duration === "string") {
            const text = duration.trim().toLowerCase();
            const milliseconds = /^(\d+(?:\.\d+)?)ms$/.exec(text);
            const seconds = /^(\d+(?:\.\d+)?)s$/.exec(text);

            if (milliseconds) {
                const value = Number(milliseconds[1]);
                return Number.isFinite(value) && value > 0 ? value : this.defaultDuration;
            }

            if (seconds) {
                const value = Number(seconds[1]) * 1000;
                return Number.isFinite(value) && value > 0 ? value : this.defaultDuration;
            }
        }

        const value = Number(duration ?? this.defaultDuration);
        return Number.isFinite(value) && value > 0 ? value : this.defaultDuration;
    }

    getEffectDuration(options = {}) {
        return this.coerceDuration(
            options.durationMs
                ?? options.duration_ms
                ?? options.duration
                ?? options.speedMs
                ?? options.speed_ms
                ?? options.speed
                ?? options.animationDuration
                ?? options.animation_duration
                ?? options.animationSpeed
                ?? options.animation_speed
        );
    }

    coerceIterations(options = {}) {
        const loopValue = options.loop ?? options.loops ?? options.infinite;

        if (this.isInfiniteLoopValue(loopValue)) {
            return "infinite";
        }

        const repeatValue = options.iterations
            ?? options.iterationCount
            ?? options.iteration_count
            ?? options.count
            ?? options.repeat
            ?? options.repeats
            ?? options.repeatCount
            ?? options.repeat_count
            ?? options.times
            ?? (typeof loopValue === "number" || typeof loopValue === "string" ? loopValue : undefined);

        if (this.isInfiniteLoopValue(repeatValue)) {
            return "infinite";
        }

        const iterations = Number(repeatValue ?? 1);

        return String(Number.isFinite(iterations) && iterations > 0 ? Math.floor(iterations) : 1);
    }

    isInfiniteLoopValue(value) {
        if (value === true) {
            return true;
        }

        if (typeof value === "string") {
            return ["true", "yes", "on", "infinite", "infinity", "loop"].includes(value.trim().toLowerCase());
        }

        return false;
    }

    getEffectRuntime(options = {}, runtimeOptions = {}) {
        const durationMs = this.getEffectDuration(options);
        const iterations = this.coerceIterations(options);

        if (iterations === "infinite") {
            return runtimeOptions.infiniteAsOneIteration ? durationMs : 0;
        }

        return durationMs * Number(iterations || 1);
    }

    getCurrentOpacity(element) {
        const inlineOpacity = Number(element?.style?.opacity);

        if (Number.isFinite(inlineOpacity)) {
            return String(inlineOpacity);
        }

        if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
            const computedOpacity = Number(window.getComputedStyle(element).opacity);

            if (Number.isFinite(computedOpacity)) {
                return String(computedOpacity);
            }
        }

        return "1";
    }

    forceAnimationRestart(element) {
        if (!element) {
            return;
        }

        if (typeof element.getBoundingClientRect === "function") {
            element.getBoundingClientRect();
            return;
        }

        void element.offsetWidth;
    }
}
