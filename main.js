import { Config } from "./core/DefaultConfig.js";
import { BackgroundManager } from "./background/BackgroundManager.js";
import { Engine } from "./core/engine.js";

export function createEngine(options = {}) {

    const config = new Config(options);

    const engine = new Engine(config);


    engine.background = new BackgroundManager(config);


    return engine;
}