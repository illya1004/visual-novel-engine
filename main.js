import { Config } from "./core/DefaultConfig.js";
import { BackgroundManager } from "./background/BackgroundManager.js";
import { Engine } from "./core/engine.js";
import { CharactersManager } from "./character/CharactersManager.js";
import { DialogueManager } from "./dialogue/DialogueManager.js";
import { CharactersApi } from "./api/CharactersApi.js";
import { NodeManager } from "./node/NodeManager.js";
import { ChoiceManager } from "./choice/ChoiceManager.js";

export function createEngine(options = {}) {

    const config = new Config(options);
    const api = config.charactersApi || new CharactersApi(config.apiBaseUrl || "");

    const engine = new Engine(config);

    engine.characters = new CharactersManager(api);
    engine.background = new BackgroundManager(config);
    engine.dialogue = new DialogueManager(api, {
        target_id: config.dialogueTargetId || config.dialogue_target_id || "dialogue_text"
    });
    engine.choice = new ChoiceManager();
    engine.nodeManager = new NodeManager(api, {
        dialogueManager: engine.dialogue,
        backgroundManager: engine.background,
        charactersManager: engine.characters,
        choiceManager: engine.choice
    });

    return engine;
}