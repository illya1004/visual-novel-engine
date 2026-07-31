import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine } from './engine.js';

test('engine marks explicit end nodes as finished', () => {
    const engine = new Engine({});
    const stops = [];
    engine.nodeManager = {
        currentNodeId: 5,
        isEndNode: (node) => node.type === 'end'
    };
    engine.save = {
        stopAutoSave: () => stops.push('stop')
    };

    const state = engine._syncState({ id: 5, type: 'end' });

    assert.equal(state.status, 'finished');
    assert.equal(state.currentNodeId, 5);
    assert.deepEqual(stops, ['stop']);
});

test('engine restart starts from the first loaded node', async () => {
    const engine = new Engine({});
    const calls = [];
    engine.dialogue = { cancel: () => calls.push('dialogue') };
    engine.choice = { clear: () => calls.push('choice') };
    engine.endScreen = { hide: () => calls.push('end') };
    engine.characters = { clearCharacters: () => calls.push('characters') };
    engine.background = { clear: () => calls.push('background') };
    engine.sound = { stopAll: () => calls.push('sound') };
    engine.save = {
        startAutoSave: () => calls.push('autosave')
    };
    engine.nodeManager = {
        nodes: [{ id: 1, type: 'dialogue' }],
        currentNodeId: 1,
        isEndNode: () => false,
        start: async () => {
            calls.push('start');
            return { id: 1, type: 'dialogue' };
        }
    };

    const node = await engine.restart();

    assert.equal(node.id, 1);
    assert.equal(engine.state.status, 'running');
    assert.deepEqual(calls, ['dialogue', 'choice', 'end', 'characters', 'background', 'sound', 'start', 'autosave']);
});

test('engine next finishes active typewriter instead of advancing', async () => {
    const engine = new Engine({});
    const calls = [];
    engine.dialogue = {
        isTyping: () => true,
        finish: () => calls.push('finish')
    };
    engine.nodeManager = {
        current: () => ({ id: 3, type: 'dialogue' }),
        next: async () => {
            calls.push('next');
            return { id: 4, type: 'dialogue' };
        },
        isEndNode: () => false
    };

    const node = await engine.next();

    assert.equal(node.id, 3);
    assert.deepEqual(calls, ['finish']);
    assert.equal(engine.state.currentNodeId, 3);
});
