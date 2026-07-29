import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportManager } from './ViewportManager.js';

function createClassList() {
    const values = new Set();

    return {
        values,
        add: (...classes) => classes.forEach((className) => values.add(className)),
        contains: (className) => values.has(className)
    };
}

function createElement(id = '') {
    return {
        id,
        dataset: {},
        classList: createClassList(),
        style: {
            values: {},
            setProperty(name, value) {
                this.values[name] = value;
            }
        }
    };
}

test('viewport manager applies landscape and portrait stage settings', () => {
    const root = createElement('game');
    const body = createElement('body');
    const originalDocument = globalThis.document;

    globalThis.document = {
        body,
        getElementById(id) {
            return id === 'game' ? root : null;
        }
    };

    try {
        const manager = new ViewportManager({
            orientation: 'portrait',
            portraitAspectRatio: '3 / 4'
        });

        const applied = manager.apply();

        assert.equal(applied.orientation, 'portrait');
        assert.equal(applied.aspectRatio, '3 / 4');
        assert.equal(root.dataset.novelOrientation, 'portrait');
        assert.equal(root.dataset.novelFit, 'contain');
        assert.equal(root.style.values['--wn-stage-aspect-ratio'], '3 / 4');
        assert.equal(root.classList.contains('web-novel-root'), true);
        assert.equal(body.classList.contains('web-novel-page'), true);

        manager.setOrientation('landscape');

        assert.equal(root.dataset.novelOrientation, 'landscape');
        assert.equal(root.style.values['--wn-stage-aspect-ratio'], '16 / 9');
    } finally {
        globalThis.document = originalDocument;
    }
});

test('viewport manager can auto-detect current orientation', () => {
    const root = createElement('game');
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;

    globalThis.document = {
        body: createElement('body'),
        getElementById() {
            return root;
        }
    };
    globalThis.window = {
        innerWidth: 500,
        innerHeight: 900
    };

    try {
        const manager = new ViewportManager({ orientation: 'auto' });

        assert.equal(manager.apply().orientation, 'portrait');
        assert.equal(root.dataset.novelOrientationMode, 'auto');
    } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
    }
});
