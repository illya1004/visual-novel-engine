export class Config {
    constructor(options = {}) {
        this.textSpeed = options.textSpeed ?? 50;
        this.autoPlay = options.autoPlay ?? false;
        this.language = options.language ?? "uk";
        this.target_id = options.target_id ?? options.targetId ?? "background_image";
        this.dialogueTargetId = options.dialogueTargetId ?? options.dialogue_target_id ?? "dialogue_text";
        this.speakerNameTargetId = options.speakerNameTargetId
            ?? options.speaker_name_target_id
            ?? options.dialogueNameTargetId
            ?? options.dialogue_name_target_id
            ?? "name";
        this.characterContainerId = options.characterContainerId ?? options.character_container_id ?? "characters";
        this.autoDeactivateOtherSpeakers = options.autoDeactivateOtherSpeakers
            ?? options.autoDeactivateOtherCharacters
            ?? options.singleActiveSpeaker
            ?? true;
        this.apiBaseUrl = options.apiBaseUrl ?? options.api_base_url ?? "";
        this.charactersApi = options.charactersApi ?? null;

        this.audio = {
            enabled: options.audio?.enabled ?? options.audioEnabled ?? true,
            musicEnabled: options.audio?.musicEnabled ?? options.musicEnabled ?? true,
            soundEnabled: options.audio?.soundEnabled ?? options.soundEnabled ?? options.effectsEnabled ?? true,
            volume: options.audio?.volume ?? options.audio?.masterVolume ?? options.volume ?? 1,
            musicVolume: options.audio?.musicVolume ?? options.musicVolume ?? 1,
            soundVolume: options.audio?.soundVolume ?? options.audio?.effectsVolume ?? options.soundVolume ?? options.effectsVolume ?? 1,
            audioFactory: options.audio?.audioFactory ?? options.audioFactory ?? null
        };

        this.save = {
            enabled: options.save?.enabled ?? true
        };
    }
}
