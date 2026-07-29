import test from 'node:test';
import assert from 'node:assert/strict';
import { SettingsManager } from './SettingsManager.js';

test('settings manager stores values and applies them to dialogue and sound', () => {
    const stored = new Map();
    const storage = {
        getItem: (key) => stored.get(key) ?? null,
        setItem: (key, value) => stored.set(key, value)
    };
    const calls = [];
    const settings = new SettingsManager({
        storage,
        textSpeed: 25,
        values: {
            volume: 0.5,
            musicVolume: 0.4,
            soundVolume: 0.3,
            textSize: 22
        }
    });

    settings.update({ textSpeed: 12 });
    settings.applyToDialogue({
        setTypewriterSpeed: (speed) => calls.push(['speed', speed]),
        setTextSize: (size) => calls.push(['size', size])
    });
    settings.applyToSound({
        setMasterVolume: (volume) => calls.push(['master', volume]),
        setMusicVolume: (volume) => calls.push(['music', volume]),
        setSoundVolume: (volume) => calls.push(['sound', volume]),
        setEnabled: (enabled) => calls.push(['enabled', enabled]),
        setMusicEnabled: (enabled) => calls.push(['musicEnabled', enabled]),
        setSoundEnabled: (enabled) => calls.push(['soundEnabled', enabled])
    });

    assert.ok(stored.has('webNovel.settings'));
    assert.deepEqual(calls, [
        ['speed', 12],
        ['size', 22],
        ['master', 0.5],
        ['music', 0.4],
        ['sound', 0.3],
        ['enabled', true],
        ['musicEnabled', true],
        ['soundEnabled', true]
    ]);
});

test('settings manager prompts for protagonist name and replaces placeholders', async () => {
    const saved = [];
    const settings = new SettingsManager({
        storage: null,
        prompt: () => 'Mira',
        userAccountId: 7,
        novelId: 3,
        api: {
            async saveProtagonistName(payload) {
                saved.push(payload);
                return payload;
            }
        }
    });

    await settings.promptForNovelStart();
    const dialogue = settings.applyToDialogueData({
        speakerName: '{heroName}',
        text: 'Hello, {{playerName}}.'
    });

    assert.equal(settings.get('protagonistName'), undefined);
    assert.equal(settings.protagonistName, 'Mira');
    assert.equal(dialogue.speakerName, 'Mira');
    assert.equal(dialogue.text, 'Hello, Mira.');
    assert.deepEqual(saved, [{
        name: 'Mira',
        userAccountId: 7,
        novelId: 3
    }]);
});

test('settings manager does not persist protagonist name in settings', () => {
    let storedValue = null;
    const storage = {
        getItem: () => JSON.stringify({ protagonistName: 'Old', textSpeed: 15 }),
        setItem: (_key, value) => {
            storedValue = value;
        }
    };
    const settings = new SettingsManager({ storage });

    settings.update({ protagonistName: 'New', textSpeed: 20 });

    assert.equal(settings.get('protagonistName'), undefined);
    assert.equal(settings.protagonistName, '');
    assert.deepEqual(JSON.parse(storedValue), {
        soundEnabled: true,
        musicEnabled: true,
        soundEffectsEnabled: true,
        volume: 1,
        musicVolume: 1,
        soundVolume: 1,
        textSpeed: 20,
        textSize: null
    });
});
