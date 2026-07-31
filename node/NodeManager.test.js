import test from 'node:test';
import assert from 'node:assert/strict';
import { NodeManager } from './NodeManager.js';

test('dialogue nodes forward top-level narration speaker controls', async () => {
    const calls = [];
    const dialogueManager = {
        show(dialogue) {
            calls.push(['dialogue', dialogue.speakerName, dialogue.clearSpeaking, dialogue.text]);
            return dialogue;
        }
    };
    const charactersManager = {
        showDialogueCharacter(dialogue) {
            calls.push(['speaker', dialogue.speakerName, dialogue.clearSpeaking]);
            return null;
        }
    };

    const nodeManager = new NodeManager({}, {
        dialogueManager,
        charactersManager
    });

    await nodeManager.executeNode({
        id: 1,
        type: 'dialogue',
        dialogue: {
            speakerName: 'Narrator',
            text: 'A quiet room.'
        },
        clearSpeaking: true
    });

    assert.deepEqual(calls, [
        ['speaker', 'Narrator', true],
        ['dialogue', 'Narrator', true, 'A quiet room.']
    ]);
});

test('character nodes forward explicit emotion reset controls', async () => {
    const calls = [];
    const charactersManager = {
        showCharacter(id, position, style, options = {}) {
            calls.push(['showCharacter', id, position, style, options]);
        }
    };
    const nodeManager = new NodeManager({}, { charactersManager });

    await nodeManager.executeNode({
        id: 1,
        type: 'character',
        characterId: 'a',
        position: 'left',
        resetEmotion: true
    });

    assert.deepEqual(calls, [
        ['showCharacter', 'a', 'left', {}, { resetEmotion: true }]
    ]);
});

test('node manager executes explicit end nodes through the end screen manager', async () => {
    const calls = [];
    const nodeManager = new NodeManager({}, {
        endScreenManager: {
            show(node) {
                calls.push(['end', node.backUrl]);
            }
        },
        choiceManager: {
            clear() {
                calls.push(['choice-clear']);
            }
        }
    });

    const node = await nodeManager.executeNode({
        id: 9,
        type: 'кінець',
        backUrl: '/menu'
    });

    assert.equal(nodeManager.isEndNode(node), true);
    assert.deepEqual(calls, [
        ['choice-clear'],
        ['end', '/menu']
    ]);
});

test('node manager forwards standalone and inline visual effects', async () => {
    const calls = [];
    const nodeManager = new NodeManager({}, {
        backgroundManager: {
            load() {}
        },
        charactersManager: {
            showCharacter() {}
        },
        effectsManager: {
            applyNode(node) {
                calls.push(['effect-node', node.effect, node.target]);
            },
            applyEffectsFromNode(node, defaults) {
                calls.push(['inline-effect', node.effect, defaults.target, defaults.characterId ?? null]);
            }
        }
    });

    await nodeManager.executeNode({ id: 1, type: 'effect', target: 'background', effect: 'shake' });
    await nodeManager.executeNode({ id: 2, type: 'background', image: '/bg.webp', effect: 'blink' });
    await nodeManager.executeNode({ id: 3, type: 'character', characterId: 'a', effect: 'glitch' });

    assert.deepEqual(calls, [
        ['effect-node', 'shake', 'background'],
        ['inline-effect', 'blink', 'background', null],
        ['inline-effect', 'glitch', 'character', 'a']
    ]);
});

test('character hide nodes play visual effects before hiding the sprite', async () => {
    const calls = [];
    const nodeManager = new NodeManager({}, {
        charactersManager: {
            hideCharacter(id) {
                calls.push(['hide', id]);
            }
        },
        effectsManager: {
            applyEffectsFromNode(node, defaults) {
                calls.push(['effect', node.effect, defaults.target, defaults.characterId]);
                return [{}];
            },
            getNodeEffectRuntime() {
                return 1;
            }
        }
    });

    await nodeManager.executeNode({
        id: 1,
        type: 'character',
        characterId: 'a',
        action: 'hide',
        effect: 'fadeout'
    });

    assert.deepEqual(calls, [
        ['effect', 'fadeout', 'character', 'a'],
        ['hide', 'a']
    ]);
});
