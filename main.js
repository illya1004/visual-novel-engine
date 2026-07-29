import { Config } from "./core/DefaultConfig.js";
import { BackgroundManager } from "./background/BackgroundManager.js";
import { Engine } from "./core/engine.js";
import { CharactersManager } from "./character/CharactersManager.js";
import { DialogueManager } from "./dialogue/DialogueManager.js";
import { CharactersApi } from "./api/CharactersApi.js";
import { NodeManager } from "./node/NodeManager.js";
import { ChoiceManager } from "./choice/ChoiceManager.js";
import { SoundManager } from "./sound/SoundManager.js";

export function createEngine(options = {}) {

    const config = new Config(options);
    const api = config.charactersApi || new CharactersApi(config.apiBaseUrl || "");

    const engine = new Engine(config);

    engine.characters = new CharactersManager(api, {
        container_id: config.characterContainerId,
        target_id: config.target_id,
        autoDeactivateOtherSpeakers: config.autoDeactivateOtherSpeakers
    });
    engine.background = new BackgroundManager(config);
    engine.dialogue = new DialogueManager(api, {
        target_id: config.dialogueTargetId,
        speakerNameTargetId: config.speakerNameTargetId,
        typewriterSpeed: config.textSpeed
    });
    engine.sound = new SoundManager(config.audio);
    engine.choice = new ChoiceManager();
    engine.nodeManager = new NodeManager(api, {
        dialogueManager: engine.dialogue,
        backgroundManager: engine.background,
        charactersManager: engine.characters,
        soundManager: engine.sound,
        choiceManager: engine.choice
    });

    return engine;
}
