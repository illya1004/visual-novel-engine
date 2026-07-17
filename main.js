import { Config } from "./core/DefaultConfig.js";
import { BackgroundManager } from "./background/BackgroundManager.js";
import { Engine } from "./core/engine.js";
import { CharactersManager } from "./character/CharactersManager.js";

export function createEngine(options = {}) {

    const config = new Config(options);
    const api = config.charactersApi || new CharactersApi(config.apiBaseUrl);

    const engine = new Engine(config);
    

    engine.characters = new CharactersManager(api);
    engine.background = new BackgroundManager(config);


    return engine;
}