import test from 'node:test';
import assert from 'node:assert/strict';
import { SettingsManager } from './SettingsManager.js';

test('settings manager stores values and applies them to managers', () => {
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
    settings.applyToCharacters({
        setCharacterScales: (scales) => calls.push(['characterScales', scales])
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
        ['soundEnabled', true],
        ['characterScales', {
            activeCharacterScale: 1.15,
            inactiveCharacterScale: 1
        }]
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

test('settings manager replaces bracket variables and persists character name colors', () => {
    const stored = new Map();
    const storage = {
        getItem: (key) => stored.get(key) ?? null,
        setItem: (key, value) => stored.set(key, value)
    };
    const settings = new SettingsManager({
        storage,
        protagonistName: 'Mira',
        variables: {
            location_name: 'library'
        }
    });

    settings.setCharacterNameColor('a', '#ff88aa');
    settings.setVariable('mood', 'brave');

    assert.equal(settings.replaceVariables('[player_name] enters the [location_name] feeling [mood].'), 'Mira enters the library feeling brave.');

    const reloadedSettings = new SettingsManager({ storage });
    assert.deepEqual(reloadedSettings.get('characterNameColors'), { a: '#ff88aa' });
    assert.equal(reloadedSettings.get('variables').mood, 'brave');
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
        textSize: null,
        activeCharacterScale: 1.15,
        inactiveCharacterScale: 1,
        variables: {},
        characterNameColors: {}
    });
});

test('settings manager persists custom character scales', () => {
    const stored = new Map();
    const storage = {
        getItem: (key) => stored.get(key) ?? null,
        setItem: (key, value) => stored.set(key, value)
    };
    const calls = [];
    const settings = new SettingsManager({ storage });

    settings.update({
        speaking_scale: 1.3,
        idle_scale: 0.85
    });
    settings.applyToCharacters({
        setCharacterScales: (scales) => calls.push(scales)
    });

    const reloadedSettings = new SettingsManager({ storage });
    const storedSettings = JSON.parse(stored.get('webNovel.settings'));

    assert.equal(storedSettings.activeCharacterScale, 1.3);
    assert.equal(storedSettings.inactiveCharacterScale, 0.85);
    assert.equal(reloadedSettings.get('activeCharacterScale'), 1.3);
    assert.equal(reloadedSettings.get('inactiveCharacterScale'), 0.85);
    assert.deepEqual(calls, [{
        activeCharacterScale: 1.3,
        inactiveCharacterScale: 0.85
    }]);
});
