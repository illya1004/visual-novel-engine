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
