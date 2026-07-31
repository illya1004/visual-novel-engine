import test from 'node:test';
import assert from 'node:assert/strict';
import { CharactersManager } from './CharactersManager.js';

class FakeElement {
    constructor(id = '') {
        this.id = id;
        this.children = [];
        this.style = {};
        this.textContent = '';
        this.src = '';
        this.parentNode = null;
        this.classList = {
            values: new Set(),
            add: (...classes) => classes.forEach((className) => this.classList.values.add(className)),
            toggle: (className, enabled) => {
                if (enabled) {
                    this.classList.values.add(className);
                } else {
                    this.classList.values.delete(className);
                }
            },
            contains: (className) => this.classList.values.has(className)
        };
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }
}

function createFakeDocument() {
    const elements = new Map();

    global.document = {
        getElementById(id) {
            return elements.get(id) || null;
        },
        createElement(tagName) {
            return new FakeElement(tagName);
        }
    };

    return {
        registerElement(id, element) {
            elements.set(id, element);
            return element;
        }
    };
}

function createApi() {
    return {
        async getCharacters() {
            return [
                { id: 'a', name: 'Alice', image: '/alice.png' },
                { id: 'b', name: 'Bob', image: '/bob.png' }
            ];
        },
        async getCharacterEmotion() {
            return {
                happy: '/alice-happy.png',
                sad: '/alice-sad.png'
            };
        }
    };
}

test('narration without a character id preserves the active speaker by default', async () => {
    const { registerElement } = createFakeDocument();
    registerElement('character-container', new FakeElement('character-container'));

    const manager = new CharactersManager(createApi(), { container_id: 'character-container' });
    await manager.loadCharacters();

    manager.showDialogueCharacter({ characterId: 'a', text: 'Hello' });
    manager.showDialogueCharacter({ speakerName: 'Narrator', text: 'A quiet room.' });

    assert.equal(manager.speakingCharacterId, 'a');
    assert.equal(manager.getState('a').speaking, true);
});

test('narration can explicitly clear the active speaker', async () => {
    const { registerElement } = createFakeDocument();
    registerElement('character-container', new FakeElement('character-container'));

    const manager = new CharactersManager(createApi(), { container_id: 'character-container' });
    await manager.loadCharacters();

    manager.showDialogueCharacter({ characterId: 'a', text: 'Hello' });
    manager.showDialogueCharacter({ speakerName: 'Narrator', text: 'A quiet room.', clearSpeaking: true });

    assert.equal(manager.speakingCharacterId, null);
    assert.equal(manager.getState('a').speaking, false);
});

test('narration clearing can be enabled through manager options', async () => {
    const { registerElement } = createFakeDocument();
    registerElement('character-container', new FakeElement('character-container'));

    const manager = new CharactersManager(createApi(), {
        container_id: 'character-container',
        clearSpeakingOnNarration: true
    });
    await manager.loadCharacters();

    manager.showDialogueCharacter({ characterId: 'a', text: 'Hello' });
    manager.showDialogueCharacter({ speakerName: 'Narrator', text: 'A quiet room.' });

    assert.equal(manager.speakingCharacterId, null);
    assert.equal(manager.getState('a').speaking, false);
});

test('changed emotion persists across later dialogue renders', async () => {
    const { registerElement } = createFakeDocument();
    const container = registerElement('character-container', new FakeElement('character-container'));

    const manager = new CharactersManager(createApi(), { container_id: 'character-container' });
    await manager.loadCharacters();

    manager.showCharacter('a', 'left');
    await manager.changeEmotion('a', 'happy');
    manager.showDialogueCharacter({ characterId: 'a', text: 'Still happy.' });

    const state = manager.getState('a');
    const slot = container.children[0];
    const image = slot.children[0];

    assert.equal(state.emotion, 'happy');
    assert.equal(state.image, '/alice-happy.png');
    assert.equal(image.src, '/alice-happy.png');
});

test('emotion can be reset to the base character image explicitly', async () => {
    const { registerElement } = createFakeDocument();
    registerElement('character-container', new FakeElement('character-container'));

    const manager = new CharactersManager(createApi(), { container_id: 'character-container' });
    await manager.loadCharacters();

    manager.showCharacter('a', 'left');
    await manager.changeEmotion('a', 'happy');
    manager.showCharacter('a', 'left', {}, { resetEmotion: true });

    const state = manager.getState('a');

    assert.equal(state.emotion, null);
    assert.equal(state.image, '/alice.png');
});

test('character names are not rendered under sprites by default', async () => {
    const { registerElement } = createFakeDocument();
    const container = registerElement('character-container', new FakeElement('character-container'));

    const manager = new CharactersManager(createApi(), { container_id: 'character-container' });
    await manager.loadCharacters();
    manager.showCharacter('a', 'left');

    const slot = container.children[0];

    assert.equal(slot.children.length, 1);
    assert.equal(slot.children[0].src, '/alice.png');
});

test('character names under sprites can be enabled through options', async () => {
    const { registerElement } = createFakeDocument();
    const container = registerElement('character-container', new FakeElement('character-container'));

    const manager = new CharactersManager(createApi(), {
        container_id: 'character-container',
        showCharacterNames: true
    });
    await manager.loadCharacters();
    manager.showCharacter('a', 'left');

    const slot = container.children[0];
    const name = slot.children[1];

    assert.equal(slot.children.length, 2);
    assert.equal(name.textContent, 'Alice');
    assert.equal(name.style.display, 'block');
});

test('character name colors can be configured and refreshed', async () => {
    const { registerElement } = createFakeDocument();
    const container = registerElement('character-container', new FakeElement('character-container'));

    const manager = new CharactersManager(createApi(), {
        container_id: 'character-container',
        showCharacterNames: true,
        characterNameColors: {
            a: '#ff88aa'
        }
    });
    await manager.loadCharacters();
    manager.showCharacter('a', 'left');

    const name = container.children[0].children[1];
    assert.equal(name.style.color, '#ff88aa');

    manager.setCharacterNameColor('a', '#99ddff');

    assert.equal(name.style.color, '#99ddff');
    assert.equal(manager.getCharacterNameColor('a'), '#99ddff');
});

test('character active and inactive scales can be customized at runtime', async () => {
    const { registerElement } = createFakeDocument();
    const container = registerElement('character-container', new FakeElement('character-container'));

    const manager = new CharactersManager(createApi(), {
        container_id: 'character-container',
        activeCharacterScale: 1.35,
        inactiveCharacterScale: 0.8
    });
    await manager.loadCharacters();

    manager.showCharacter('a', 'left');
    manager.showCharacter('b', 'right');
    manager.setSpeakingCharacter('a');

    const [firstSlot, secondSlot] = container.children;
    assert.match(firstSlot.style.transform, /1\.35/);
    assert.match(secondSlot.style.transform, /0\.8/);

    manager.setCharacterScales({
        activeCharacterScale: 1.1,
        inactiveCharacterScale: 0.9
    });

    assert.match(firstSlot.style.transform, /1\.1/);
    assert.match(secondSlot.style.transform, /0\.9/);

    manager.setCharacterScales(1.05, 0.95);

    assert.match(firstSlot.style.transform, /1\.05/);
    assert.match(secondSlot.style.transform, /0\.95/);
});

test('character scale stays bottom anchored and cannot exceed stage height', async () => {
    const { registerElement } = createFakeDocument();
    const container = registerElement('character-container', new FakeElement('character-container'));

    const manager = new CharactersManager(createApi(), {
        container_id: 'character-container',
        activeCharacterScale: 1.5,
        inactiveCharacterScale: 0.75
    });
    await manager.loadCharacters();

    manager.showCharacter('a', 'left', { imageMaxHeight: '100%', offsetX: '24', offsetY: -12 }, { speaking: true });

    const slot = container.children[0];
    const image = slot.children[0];

    assert.equal(slot.style.top, '0');
    assert.equal(slot.style.bottom, '0');
    assert.equal(slot.style.height, '100%');
    assert.equal(slot.style.display, 'flex');
    assert.equal(slot.style.transformOrigin, 'bottom left');
    assert.match(slot.style.transform, /translate\(24px, -12px\)/);
    assert.equal(image.style.maxHeight, '66.66666666666667%');

    manager.setSpeakingCharacter('a', { speaking: false });

    assert.equal(slot.style.transformOrigin, 'bottom left');
    assert.equal(image.style.maxHeight, '100%');
});
