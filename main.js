import { Config } from "./core/DefaultConfig.js";
import { BackgroundManager } from "./background/BackgroundManager.js";
import { Engine } from "./core/engine.js";
import { CharactersManager } from "./character/CharactersManager.js";
import { DialogueManager } from "./dialogue/DialogueManager.js";
import { CharactersApi } from "./api/CharactersApi.js";
import { NodeManager } from "./node/NodeManager.js";
import { ChoiceManager } from "./choice/ChoiceManager.js";
import { SoundManager } from "./sound/SoundManager.js";
import { SettingsManager } from "./settings/SettingsManager.js";
import { SaveManager } from "./save/SaveManager.js";
import { GalleryManager } from "./gallery/GalleryManager.js";
import { InterfaceManager } from "./ui/InterfaceManager.js";
import { ViewportManager } from "./layout/ViewportManager.js";

export function createEngine(options = {}) {

    const config = new Config(options);
    const api = config.charactersApi || new CharactersApi(config.apiBaseUrl || "");

    const engine = new Engine(config);
    engine.viewport = new ViewportManager(config.viewport);
    engine.viewport.apply();
    engine.settings = new SettingsManager({
        ...config.settings,
        api,
        values: {
            soundEnabled: config.audio.enabled,
            musicEnabled: config.audio.musicEnabled,
            soundEffectsEnabled: config.audio.soundEnabled,
            volume: config.audio.volume,
            musicVolume: config.audio.musicVolume,
            soundVolume: config.audio.soundVolume,
            textSpeed: config.settings.textSpeed,
            textSize: config.settings.textSize
        }
    });

    engine.characters = new CharactersManager(api, {
        container_id: config.characterContainerId,
        target_id: config.target_id,
        autoDeactivateOtherSpeakers: config.autoDeactivateOtherSpeakers
    });
    engine.background = new BackgroundManager(config);
    engine.dialogue = new DialogueManager(api, {
        target_id: config.dialogueTargetId,
        speakerNameTargetId: config.speakerNameTargetId,
        dialogueBoxTargetId: config.dialogueBoxTargetId,
        typewriterSpeed: config.textSpeed,
        layout: config.dialogueLayout
    });
    engine.sound = new SoundManager(config.audio);
    engine.save = new SaveManager(config.save);
    engine.gallery = new GalleryManager(api, config.gallery);
    engine.choice = new ChoiceManager();
    engine.nodeManager = new NodeManager(api, {
        dialogueManager: engine.dialogue,
        backgroundManager: engine.background,
        charactersManager: engine.characters,
        soundManager: engine.sound,
        settingsManager: engine.settings,
        galleryManager: engine.gallery,
        choiceManager: engine.choice,
        viewportManager: engine.viewport
    });
    engine.settings.applyAll({
        soundManager: engine.sound,
        dialogueManager: engine.dialogue,
        charactersManager: engine.characters
    });
    engine.interface = new InterfaceManager(engine, config.interface);

    return engine;
}
