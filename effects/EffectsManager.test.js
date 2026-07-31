import test from 'node:test';
import assert from 'node:assert/strict';
import { EffectsManager } from './EffectsManager.js';

class FakeElement {
    constructor(id = '') {
        this.id = id;
        this.dataset = {};
        this.style = {
            values: {},
            setProperty(name, value) {
                this.values[name] = value;
            }
        };
        this.classList = {
            values: new Set(),
            add: (...classes) => classes.forEach((className) => this.classList.values.add(className)),
            remove: (...classes) => classes.forEach((className) => this.classList.values.delete(className)),
            contains: (className) => this.classList.values.has(className)
        };
    }
}

test('effects manager applies background effects', () => {
    const background = new FakeElement('bg_img');
    const manager = new EffectsManager({
        backgroundManager: {
            getElement: () => background
        }
    });

    const elements = manager.applyEffectsFromNode({
        type: 'background',
        effect: 'shake',
        duration: 400,
        persist: true
    }, { target: 'background' });

    assert.deepEqual(elements, [background]);
    assert.equal(background.classList.contains('wn-effect-shake'), true);
    assert.equal(background.style.values['--wn-effect-duration'], '400ms');
    assert.equal(background.dataset.wnEffect, 'wn-effect-shake');
});

test('effects manager targets a specific character', () => {
    const character = new FakeElement('anna');
    const manager = new EffectsManager({
        charactersManager: {
            getCharacterElement: (id) => id === 'a' ? character : null
        }
    });

    const elements = manager.applyNode({
        type: 'effect',
        target: 'character',
        characterId: 'a',
        effect: 'glitch',
        persist: true
    });

    assert.deepEqual(elements, [character]);
    assert.equal(character.classList.contains('wn-effect-glitch'), true);
});

test('effects manager applies timing aliases from nested options to string effects', () => {
    const character = new FakeElement('anna');
    const manager = new EffectsManager({
        charactersManager: {
            getCharacterElement: (id) => id === 'a' ? character : null
        }
    });

    const elements = manager.applyNode({
        type: 'effect',
        target: 'character',
        characterId: 'a',
        options: {
            effect: 'pulse',
            speed: 250,
            repeat: 4,
            persist: true
        }
    });

    assert.deepEqual(elements, [character]);
    assert.equal(character.classList.contains('wn-effect-pulse'), true);
    assert.equal(character.style.values['--wn-effect-duration'], '250ms');
    assert.equal(character.style.values['--wn-effect-iterations'], '4');
});

test('effects manager supports character fade in and fade out aliases', () => {
    const character = new FakeElement('anna');
    const manager = new EffectsManager({
        charactersManager: {
            getCharacterElement: (id) => id === 'a' ? character : null
        }
    });

    manager.applyNode({
        type: 'effect',
        target: 'character',
        characterId: 'a',
        effect: 'fade-out',
        duration: 300,
        persist: true
    });

    assert.equal(character.classList.contains('wn-effect-fadeout'), true);
    assert.equal(character.style.values['--wn-effect-duration'], '300ms');
});

test('effects manager treats repeat true as an infinite animation', () => {
    const background = new FakeElement('bg_img');
    const manager = new EffectsManager({
        backgroundManager: {
            getElement: () => background
        }
    });

    manager.applyNode({
        type: 'effect',
        target: 'background',
        effect: 'pulse',
        repeat: true
    });

    assert.equal(background.classList.contains('wn-effect-pulse'), true);
    assert.equal(background.style.values['--wn-effect-iterations'], 'infinite');
});
