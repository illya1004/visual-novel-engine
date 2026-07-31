import test from 'node:test';
import assert from 'node:assert/strict';
import { EndScreenManager } from './EndScreenManager.js';

class FakeElement {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.children = [];
        this.dataset = {};
        this.hidden = false;
        this.textContent = '';
        this.className = '';
        this.type = '';
        this.listeners = {};
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    append(...children) {
        children.forEach((child) => this.appendChild(child));
    }

    addEventListener(type, callback) {
        this.listeners[type] = callback;
    }

    querySelector(selector) {
        const dataKey = selector.match(/^\[data-(.+)\]$/)?.[1]
            ?.replace(/-([a-z])/g, (_match, char) => char.toUpperCase());

        if (!dataKey) {
            return null;
        }

        return this.find((element) => element.dataset?.[dataKey] !== undefined);
    }

    find(predicate) {
        if (predicate(this)) {
            return this;
        }

        for (const child of this.children) {
            const result = child.find?.(predicate);
            if (result) {
                return result;
            }
        }

        return null;
    }
}

function createFakeDocument() {
    const root = new FakeElement('main');

    global.document = {
        body: new FakeElement('body'),
        getElementById: (id) => id === 'game' ? root : null,
        createElement: (tagName) => new FakeElement(tagName)
    };

    return root;
}

test('end screen shows configured buttons and replays through callback', async () => {
    const root = createFakeDocument();
    const calls = [];
    const manager = new EndScreenManager({
        rootTargetId: 'game',
        backUrl: '/menu',
        onReplay: () => calls.push('replay')
    });

    const overlay = manager.show({
        type: 'end',
        replayLabel: 'Зіграти знову'
    });

    assert.equal(root.children.includes(overlay), true);
    assert.equal(overlay.hidden, false);
    assert.equal(overlay.querySelector('[data-end-back]').textContent, 'Назад');
    assert.equal(overlay.querySelector('[data-end-replay]').textContent, 'Зіграти знову');

    await manager.replay();

    assert.deepEqual(calls, ['replay']);
    assert.equal(overlay.hidden, true);
});
