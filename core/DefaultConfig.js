export class Config {
    constructor(options = {}) {
        const coerceBooleanFlag = (value, fallback = false) => {
            if (value === undefined || value === null) {
                return fallback;
            }

            if (typeof value === "boolean") {
                return value;
            }

            if (typeof value === "number") {
                return value !== 0;
            }

            if (typeof value === "string") {
                const normalizedValue = value.trim().toLowerCase();

                if (["false", "0", "no", "off"].includes(normalizedValue)) {
                    return false;
                }

                if (["true", "1", "yes", "on"].includes(normalizedValue)) {
                    return true;
                }
            }

            return Boolean(value);
        };

        this.textSpeed = options.textSpeed ?? 50;
        this.autoPlay = options.autoPlay ?? false;
        this.language = options.language ?? "uk";
        const viewportOptions = options.viewport || {};
        const orientationOptions = typeof options.orientation === "object"
            ? options.orientation
            : {};
        const orientationMode = typeof options.orientation === "string"
            ? options.orientation
            : orientationOptions.mode;

        this.viewport = {
            rootTargetId: viewportOptions.rootTargetId
                ?? viewportOptions.root_target_id
                ?? options.rootTargetId
                ?? options.root_target_id
                ?? options.gameRootId
                ?? options.game_root_id
                ?? "game",
            orientation: viewportOptions.orientation
                ?? orientationMode
                ?? options.screenOrientation
                ?? options.screen_orientation
                ?? "landscape",
            aspectRatio: viewportOptions.aspectRatio
                ?? viewportOptions.aspect_ratio
                ?? orientationOptions.aspectRatio
                ?? orientationOptions.aspect_ratio
                ?? options.aspectRatio
                ?? options.aspect_ratio
                ?? null,
            landscapeAspectRatio: viewportOptions.landscapeAspectRatio
                ?? viewportOptions.landscape_aspect_ratio
                ?? orientationOptions.landscapeAspectRatio
                ?? orientationOptions.landscape_aspect_ratio
                ?? "16 / 9",
            portraitAspectRatio: viewportOptions.portraitAspectRatio
                ?? viewportOptions.portrait_aspect_ratio
                ?? orientationOptions.portraitAspectRatio
                ?? orientationOptions.portrait_aspect_ratio
                ?? "9 / 16",
            fit: viewportOptions.fit
                ?? orientationOptions.fit
                ?? options.viewportFit
                ?? options.viewport_fit
                ?? "contain",
            centerStage: viewportOptions.centerStage
                ?? viewportOptions.center_stage
                ?? orientationOptions.centerStage
                ?? orientationOptions.center_stage
                ?? true
        };
        this.target_id = options.target_id ?? options.targetId ?? "background_image";
        this.dialogueTargetId = options.dialogueTargetId ?? options.dialogue_target_id ?? "dialogue_text";
        this.speakerNameTargetId = options.speakerNameTargetId
            ?? options.speaker_name_target_id
            ?? options.dialogueNameTargetId
            ?? options.dialogue_name_target_id
            ?? "name";
        this.dialogueBoxTargetId = options.dialogueBoxTargetId
            ?? options.dialogue_box_target_id
            ?? options.dialogueContainerId
            ?? options.dialogue_container_id
            ?? "dialogue";
        this.dialogueLayout = {
            position: options.dialogueLayout?.position
                ?? options.dialoguePosition
                ?? options.dialogue_position
                ?? "full",
            width: options.dialogueLayout?.width
                ?? options.dialogueWidth
                ?? options.dialogue_width
                ?? null
        };
        this.richText = {
            enabled: options.richText?.enabled ?? options.rich_text?.enabled ?? options.richTextEnabled ?? options.rich_text_enabled ?? true
        };
        this.characterContainerId = options.characterContainerId ?? options.character_container_id ?? "characters";
        const characterScaleOptions = options.characterScale ?? options.character_scale ?? {};
        this.activeCharacterScale = options.activeCharacterScale
            ?? options.active_character_scale
            ?? options.characterActiveScale
            ?? options.character_active_scale
            ?? options.speakingScale
            ?? options.speaking_scale
            ?? options.speak_scale
            ?? options.speakScale
            ?? characterScaleOptions.active
            ?? characterScaleOptions.activeCharacterScale
            ?? characterScaleOptions.active_character_scale
            ?? characterScaleOptions.characterActiveScale
            ?? characterScaleOptions.character_active_scale
            ?? characterScaleOptions.speakingScale
            ?? characterScaleOptions.speaking_scale
            ?? characterScaleOptions.speak_scale
            ?? characterScaleOptions.speakScale
            ?? 1.15;
        this.inactiveCharacterScale = options.inactiveCharacterScale
            ?? options.inactive_character_scale
            ?? options.characterInactiveScale
            ?? options.character_inactive_scale
            ?? options.inactiveScale
            ?? options.inactive_scale
            ?? options.idle_scale
            ?? options.idleScale
            ?? characterScaleOptions.inactive
            ?? characterScaleOptions.inactiveCharacterScale
            ?? characterScaleOptions.inactive_character_scale
            ?? characterScaleOptions.characterInactiveScale
            ?? characterScaleOptions.character_inactive_scale
            ?? characterScaleOptions.inactiveScale
            ?? characterScaleOptions.inactive_scale
            ?? characterScaleOptions.idle_scale
            ?? characterScaleOptions.idleScale
            ?? 1;
        this.showCharacterNames = coerceBooleanFlag(
            options.showCharacterNames
                ?? options.show_character_names
                ?? options.displayCharacterNames
                ?? options.display_character_names,
            false
        );
        this.autoDeactivateOtherSpeakers = options.autoDeactivateOtherSpeakers
            ?? options.autoDeactivateOtherCharacters
            ?? options.singleActiveSpeaker
            ?? true;
        const preserveSpeakerOnNarration = options.preserveSpeakerOnNarration
            ?? options.preserve_speaker_on_narration
            ?? options.keepSpeakerOnNarration
            ?? options.keep_speaker_on_narration
            ?? null;
        this.clearSpeakingOnNarration = options.clearSpeakingOnNarration
            ?? options.clear_speaking_on_narration
            ?? options.clearSpeakerOnNarration
            ?? options.clear_speaker_on_narration
            ?? options.deactivateSpeakersOnNarration
            ?? options.deactivate_speakers_on_narration
            ?? (preserveSpeakerOnNarration === null ? false : !coerceBooleanFlag(preserveSpeakerOnNarration));
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
            storage: options.save?.storage ?? null,
            autoSaveEnabled: options.save?.autoSaveEnabled ?? options.save?.auto_save_enabled ?? options.autoSaveEnabled ?? true,
            autoSaveIntervalMs: options.save?.autoSaveIntervalMs
                ?? options.save?.auto_save_interval_ms
                ?? options.autoSaveIntervalMs
                ?? 600000
        };

        this.settings = {
            ...(options.settings || {}),
            textSpeed: options.settings?.textSpeed ?? this.textSpeed,
            textSize: options.settings?.textSize ?? options.textSize ?? null,
            activeCharacterScale: options.settings?.activeCharacterScale
                ?? options.settings?.active_character_scale
                ?? options.settings?.characterActiveScale
                ?? options.settings?.character_active_scale
                ?? options.settings?.speakingScale
                ?? options.settings?.speaking_scale
                ?? options.settings?.speak_scale
                ?? options.settings?.speakScale
                ?? this.activeCharacterScale,
            inactiveCharacterScale: options.settings?.inactiveCharacterScale
                ?? options.settings?.inactive_character_scale
                ?? options.settings?.characterInactiveScale
                ?? options.settings?.character_inactive_scale
                ?? options.settings?.inactiveScale
                ?? options.settings?.inactive_scale
                ?? options.settings?.idle_scale
                ?? options.settings?.idleScale
                ?? this.inactiveCharacterScale,
            protagonistName: options.settings?.protagonistName ?? options.protagonistName ?? options.heroName ?? "",
            protagonistCharacterId: options.settings?.protagonistCharacterId ?? options.protagonistCharacterId ?? options.heroCharacterId ?? null,
            promptForProtagonistName: options.settings?.promptForProtagonistName ?? options.promptForProtagonistName ?? true,
            variables: options.settings?.variables
                ?? options.settings?.customVariables
                ?? options.settings?.custom_variables
                ?? options.variables
                ?? {},
            characterNameColors: options.settings?.characterNameColors
                ?? options.settings?.character_name_colors
                ?? options.characterNameColors
                ?? options.character_name_colors
                ?? options.nameColors
                ?? options.name_colors
                ?? {},
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

        this.effects = {
            enabled: options.effects?.enabled ?? options.effectsEnabled ?? true,
            defaultDuration: options.effects?.defaultDuration
                ?? options.effects?.default_duration
                ?? options.effectDuration
                ?? options.effect_duration
                ?? 700
        };

        this.endScreen = {
            enabled: options.endScreen?.enabled ?? options.end_screen?.enabled ?? options.endScreenEnabled ?? true,
            rootTargetId: options.endScreen?.rootTargetId
                ?? options.endScreen?.root_target_id
                ?? options.end_screen?.rootTargetId
                ?? options.end_screen?.root_target_id
                ?? this.viewport.rootTargetId,
            backUrl: options.endScreen?.backUrl
                ?? options.endScreen?.back_url
                ?? options.end_screen?.backUrl
                ?? options.end_screen?.back_url
                ?? options.backUrl
                ?? options.back_url
                ?? null,
            title: options.endScreen?.title ?? options.end_screen?.title ?? "Кінець",
            backLabel: options.endScreen?.backLabel
                ?? options.endScreen?.back_label
                ?? options.end_screen?.backLabel
                ?? options.end_screen?.back_label
                ?? "Назад",
            replayLabel: options.endScreen?.replayLabel
                ?? options.endScreen?.replay_label
                ?? options.end_screen?.replayLabel
                ?? options.end_screen?.replay_label
                ?? "Зіграти знову"
        };
    }
}
