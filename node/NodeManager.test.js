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
