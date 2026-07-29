import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveManager } from './SaveManager.js';

test('save manager saves regular nodes and skips auto nodes', () => {
    const stored = new Map();
    const storage = {
        getItem: (key) => stored.get(key) ?? null,
        setItem: (key, value) => stored.set(key, value),
        removeItem: (key) => stored.delete(key)
    };
    const manager = new SaveManager({ storage });
    const engine = {
        nodeManager: {
            currentNodeId: 2,
            currentNodeIndex: 1,
            current: () => ({ id: 2, type: 'dialogue' })
        },
        settings: {
            snapshot: () => ({ textSpeed: 10 })
        }
    };

    const snapshot = manager.save(engine);
    assert.equal(snapshot.currentNodeId, 2);
    assert.equal(manager.load().settings.textSpeed, 10);

    engine.nodeManager.current = () => ({ id: 3, type: 'background', skip_auto: true });
    assert.equal(manager.save(engine), null);
});

test('save manager starts and stops autosave timer', () => {
    const calls = [];
    const manager = new SaveManager({
        storage: null,
        autoSaveIntervalMs: 600000
    });
    const originalSetInterval = globalThis.setInterval;
    const originalClearInterval = globalThis.clearInterval;

    globalThis.setInterval = (callback, interval) => {
        calls.push(['setInterval', interval]);
        callback();
        return 12;
    };
    globalThis.clearInterval = (timer) => calls.push(['clearInterval', timer]);

    const engine = {
        nodeManager: {
            currentNodeId: 7,
            currentNodeIndex: 2,
            current: () => ({ id: 7, type: 'dialogue' })
        },
        settings: {
            snapshot: () => ({ textSpeed: 25 })
        }
    };

    try {
        assert.equal(manager.startAutoSave(engine), 12);
        assert.equal(manager.lastAutoSave.reason, 'auto');
        manager.stopAutoSave();
    } finally {
        globalThis.setInterval = originalSetInterval;
        globalThis.clearInterval = originalClearInterval;
    }

    assert.deepEqual(calls, [
        ['setInterval', 600000],
        ['clearInterval', 12]
    ]);
});
