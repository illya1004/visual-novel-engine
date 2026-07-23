export class Config {
    constructor(options = {}) {
        this.textSpeed = options.textSpeed ?? 50;
        this.autoPlay = options.autoPlay ?? false;
        this.language = options.language ?? "uk";
        this.target_id = options.target_id ?? options.targetId ?? "background_image";
        this.dialogueTargetId = options.dialogueTargetId ?? options.dialogue_target_id ?? "dialogue_text";
        this.characterContainerId = options.characterContainerId ?? options.character_container_id ?? "characters";
        this.apiBaseUrl = options.apiBaseUrl ?? options.api_base_url ?? "";
        this.charactersApi = options.charactersApi ?? null;

        this.audio = {
            volume: options.audio?.volume ?? 1
        };

        this.save = {
            enabled: options.save?.enabled ?? true
        };
    }
}
