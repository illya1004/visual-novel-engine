export class Config {
    constructor(options = {}) {
        this.textSpeed = options.textSpeed ?? 50;
        this.autoPlay = options.autoPlay ?? false;
        this.language = options.language ?? "uk";
        this.target_id = options.target_id ?? "background_image";

        this.audio = {
            volume: options.audio?.volume ?? 1
        };

        this.save = {
            enabled: options.save?.enabled ?? true
        };
    }
}