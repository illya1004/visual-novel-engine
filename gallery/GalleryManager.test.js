import test from 'node:test';
import assert from 'node:assert/strict';
import { GalleryManager } from './GalleryManager.js';

test('gallery manager unlocks marked background nodes through the api', async () => {
    const calls = [];
    const manager = new GalleryManager({
        async unlockGalleryImage(payload) {
            calls.push(payload);
            return { ...payload, created: true };
        }
    });

    const result = await manager.unlockFromNode({
        id: 4,
        type: 'background',
        image: '/bg.png',
        gallery: true,
        title: 'Library'
    });

    assert.equal(result.created, true);
    assert.deepEqual(calls[0], {
        id: 4,
        nodeId: 4,
        image: '/bg.png',
        title: 'Library',
        chapter: null
    });
});

test('gallery manager ignores unmarked backgrounds', async () => {
    const manager = new GalleryManager({
        async unlockGalleryImage() {
            throw new Error('should not be called');
        }
    });

    const result = await manager.unlockFromNode({
        id: 1,
        type: 'background',
        image: '/bg.png'
    });

    assert.equal(result, null);
});
