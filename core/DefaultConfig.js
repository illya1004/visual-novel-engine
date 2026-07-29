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
            enabled: options.save?.enabled ?? true,
            storageKey: options.save?.storageKey ?? "webNovel.save",
            storage: options.save?.storage ?? null
        };

        this.settings = {
            ...(options.settings || {}),
            textSpeed: options.settings?.textSpeed ?? this.textSpeed,
            textSize: options.settings?.textSize ?? options.textSize ?? null,
            protagonistName: options.settings?.protagonistName ?? options.protagonistName ?? options.heroName ?? "",
            protagonistCharacterId: options.settings?.protagonistCharacterId ?? options.protagonistCharacterId ?? options.heroCharacterId ?? null,
            promptForProtagonistName: options.settings?.promptForProtagonistName ?? options.promptForProtagonistName ?? true,
            userAccountId: options.settings?.userAccountId
                ?? options.settings?.user_account_id
                ?? options.userAccountId
                ?? options.user_account_id
                ?? options.accountId
                ?? options.account_id
                ?? null,
            novelId: options.settings?.novelId
                ?? options.settings?.novel_id
                ?? options.novelId
                ?? options.novel_id
                ?? null
        };

        this.gallery = {
            enabled: options.gallery?.enabled ?? true
        };

        this.interface = {
            enabled: options.interface?.enabled ?? true,
            autoCreateControls: options.interface?.autoCreateControls ?? options.autoCreateInterfaceControls ?? true,
            ...(options.interface || {})
        };
    }
}
