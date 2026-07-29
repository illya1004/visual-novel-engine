export class SoundManager {
    constructor(options = {}) {
        this.audioFactory = options.audioFactory || null;
        this.masterVolume = this._normalizeVolume(options.volume ?? options.masterVolume ?? 1);
        this.musicVolume = this._normalizeVolume(options.musicVolume ?? 1);
        this.soundVolume = this._normalizeVolume(options.soundVolume ?? options.effectsVolume ?? 1);
        this.enabled = options.enabled ?? true;
        this.musicEnabled = options.musicEnabled ?? true;
        this.soundEnabled = options.soundEnabled ?? options.effectsEnabled ?? true;
        this.currentMusic = null;
        this.currentMusicSource = null;
        this.activeSounds = new Map();
        this._soundCounter = 0;
        this.lastError = null;
    }

    _normalizeVolume(value) {
        const numberValue = Number(value);

        if (!Number.isFinite(numberValue)) {
            return 1;
        }

        return Math.min(1, Math.max(0, numberValue));
    }

    _createAudio(source) {
        if (!source) {
            return null;
        }

        if (this.audioFactory) {
            return this.audioFactory(source);
        }

        if (typeof Audio === "undefined") {
            return null;
        }

        return new Audio(source);
    }

    _setAudioVolume(audio, channelVolume, nodeVolume = 1) {
        if (!audio) {
            return;
        }

        audio.volume = this._normalizeVolume(this.masterVolume * channelVolume * this._normalizeVolume(nodeVolume));
    }

    async _play(audio) {
        if (!audio?.play) {
            return false;
        }

        try {
            await audio.play();
            return true;
        } catch (error) {
            this.lastError = error;
            return false;
        }
    }

    _stopAudio(audio) {
        if (!audio) {
            return;
        }

        audio.pause?.();

        try {
            audio.currentTime = 0;
        } catch {
            // Some browser-backed audio objects can reject seeking before metadata loads.
        }
    }

    _applyMusicVolume() {
        this._setAudioVolume(this.currentMusic, this.musicVolume);
    }

    _applySoundVolumes() {
        for (const item of this.activeSounds.values()) {
            this._setAudioVolume(item.audio, this.soundVolume, item.volume);
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = this._normalizeVolume(volume);
        this._applyMusicVolume();
        this._applySoundVolumes();
    }

    setMusicVolume(volume) {
        this.musicVolume = this._normalizeVolume(volume);
        this._applyMusicVolume();
    }

    setSoundVolume(volume) {
        this.soundVolume = this._normalizeVolume(volume);
        this._applySoundVolumes();
    }

    setEnabled(enabled) {
        this.enabled = Boolean(enabled);

        if (!this.enabled) {
            this.stopAll();
        }
    }

    enable() {
        this.setEnabled(true);
    }

    disable() {
        this.setEnabled(false);
    }

    setMuted(muted) {
        this.setEnabled(!muted);
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = Boolean(enabled);

        if (!this.musicEnabled) {
            this.stopMusic();
        }
    }

    enableMusic() {
        this.setMusicEnabled(true);
    }

    disableMusic() {
        this.setMusicEnabled(false);
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = Boolean(enabled);

        if (!this.soundEnabled) {
            this.stopAllSounds();
        }
    }

    setSoundEffectsEnabled(enabled) {
        this.setSoundEnabled(enabled);
    }

    enableSounds() {
        this.setSoundEnabled(true);
    }

    disableSounds() {
        this.setSoundEnabled(false);
    }

    async playMusic(source, options = {}) {
        if (!this.enabled || !this.musicEnabled || !source) {
            return null;
        }

        const restart = options.restart ?? source !== this.currentMusicSource;

        if (this.currentMusic && !restart) {
            this._setAudioVolume(this.currentMusic, this.musicVolume, options.volume ?? 1);
            await this._play(this.currentMusic);
            return this.currentMusic;
        }

        this.stopMusic();

        const audio = this._createAudio(source);
        if (!audio) {
            return null;
        }

        audio.src = audio.src || source;
        audio.loop = options.loop ?? true;
        this._setAudioVolume(audio, this.musicVolume, options.volume ?? 1);

        if (options.currentTime !== undefined || options.startTime !== undefined) {
            audio.currentTime = Number(options.currentTime ?? options.startTime) || 0;
        }

        this.currentMusic = audio;
        this.currentMusicSource = source;
        await this._play(audio);
        return audio;
    }

    pauseMusic() {
        this.currentMusic?.pause?.();
        return this.currentMusic;
    }

    async resumeMusic() {
        if (!this.enabled || !this.musicEnabled || !this.currentMusic) {
            return null;
        }

        await this._play(this.currentMusic);
        return this.currentMusic;
    }

    stopMusic() {
        this._stopAudio(this.currentMusic);
        this.currentMusic = null;
        this.currentMusicSource = null;
    }

    async playSound(source, options = {}) {
        if (!this.enabled || !this.soundEnabled || !source) {
            return null;
        }

        const audio = this._createAudio(source);
        if (!audio) {
            return null;
        }

        const soundId = options.id ?? options.soundId ?? options.sound_id ?? `sound-${++this._soundCounter}`;
        audio.src = audio.src || source;
        audio.loop = options.loop ?? false;
        this._setAudioVolume(audio, this.soundVolume, options.volume ?? 1);

        if (options.currentTime !== undefined || options.startTime !== undefined) {
            audio.currentTime = Number(options.currentTime ?? options.startTime) || 0;
        }

        if (this.activeSounds.has(soundId)) {
            this.stopSound(soundId);
        }

        this.activeSounds.set(soundId, {
            audio,
            source,
            volume: options.volume ?? 1
        });

        const cleanup = () => {
            if (!audio.loop) {
                this.activeSounds.delete(soundId);
            }
        };

        if (audio.addEventListener) {
            audio.addEventListener("ended", cleanup, { once: true });
        } else {
            audio.onended = cleanup;
        }

        await this._play(audio);
        return audio;
    }

    stopSound(soundId) {
        const item = this.activeSounds.get(soundId);

        if (!item) {
            return false;
        }

        this._stopAudio(item.audio);
        this.activeSounds.delete(soundId);
        return true;
    }

    stopAllSounds() {
        for (const soundId of [...this.activeSounds.keys()]) {
            this.stopSound(soundId);
        }
    }

    stopAll() {
        this.stopMusic();
        this.stopAllSounds();
    }
}
