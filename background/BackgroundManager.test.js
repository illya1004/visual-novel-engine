import test from 'node:test';
import assert from 'node:assert/strict';
import { BackgroundManager } from './BackgroundManager.js';

class FakeElement {
    constructor(id = '') {
        this.id = id;
        this.children = [];
        this.style = {};
        this.dataset = {};
        this.src = '';
        this.alt = '';
        this.parentNode = null;
        this.classList = {
            values: new Set(),
            add: (...classes) => classes.forEach((className) => this.classList.values.add(className)),
            contains: (className) => this.classList.values.has(className)
        };
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    removeAttribute(name) {
        if (name === 'src') {
            this.src = '';
        }
    }
}

function createFakeDocument() {
    const elements = new Map();

    function findChildById(element, id) {
        if (element.id === id) {
            return element;
        }

        for (const child of element.children || []) {
            const result = findChildById(child, id);
            if (result) {
                return result;
            }
        }

        return null;
    }

    global.document = {
        getElementById(id) {
            if (elements.has(id)) {
                return elements.get(id);
            }

            for (const element of elements.values()) {
                const child = findChildById(element, id);
                if (child) {
                    return child;
                }
            }

            return null;
        },
        createElement(tagName) {
            return new FakeElement(tagName);
        }
    };

    return {
        registerElement(id, element) {
            element.id = id;
            elements.set(id, element);
            return element;
        }
    };
}

test('background manager supports gif sources explicitly', () => {
    const { registerElement } = createFakeDocument();
    const target = registerElement('background', new FakeElement('background'));
    const manager = new BackgroundManager({
        target_id: 'background',
        image_id: 'bg_img'
    });

    const result = manager.load({
        type: 'background',
        gif: '/media/backgrounds/rain.gif?version=1',
        options: {
            opacity: 0.8,
            objectFit: 'contain'
        }
    });

    const img = target.children[0];

    assert.equal(result.image, '/media/backgrounds/rain.gif?version=1');
    assert.equal(result.type, 'gif');
    assert.equal(manager.currentType, 'gif');
    assert.equal(img.src, '/media/backgrounds/rain.gif?version=1');
    assert.equal(img.dataset.backgroundMediaType, 'gif');
    assert.equal(img.style.objectFit, 'contain');
    assert.equal(img.style.opacity, 0.8);
});

test('background manager accepts nested background media payloads', () => {
    const { registerElement } = createFakeDocument();
    const target = registerElement('background', new FakeElement('background'));
    const manager = new BackgroundManager({
        target_id: 'background',
        image_id: 'bg_img'
    });

    const result = manager.load({
        background: {
            gif: '/media/backgrounds/fireplace.gif',
            options: {
                width: '80%',
                objectPosition: 'top'
            }
        },
        options: {
            height: '90%'
        }
    });

    const img = target.children[0];

    assert.equal(result.type, 'gif');
    assert.equal(result.options.width, '80%');
    assert.equal(result.options.height, '90%');
    assert.equal(img.src, '/media/backgrounds/fireplace.gif');
    assert.equal(img.style.width, '80%');
    assert.equal(img.style.height, '90%');
    assert.equal(img.style.objectPosition, 'top');
});
