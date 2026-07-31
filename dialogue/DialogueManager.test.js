import test from 'node:test';
import assert from 'node:assert/strict';
import { DialogueManager } from './DialogueManager.js';

function createClassList() {
    const values = new Set();

    return {
        add: (...classes) => classes.forEach((className) => values.add(className)),
        remove: (...classes) => classes.forEach((className) => values.delete(className)),
        contains: (className) => values.has(className)
    };
}

test('dialogue manager applies configurable box layout', async () => {
    const boxElement = {
        dataset: {},
        classList: createClassList(),
        style: {
            values: {},
            setProperty(name, value) {
                this.values[name] = value;
            },
            removeProperty(name) {
                delete this.values[name];
            }
        }
    };
    const targetElement = { textContent: '', style: {} };
    const manager = new DialogueManager(null, {
        targetElement,
        boxElement,
        layout: {
            position: 'left',
            width: '42rem'
        }
    });

    assert.equal(boxElement.dataset.dialoguePosition, 'left');
    assert.equal(boxElement.classList.contains('web-novel-dialogue--left'), true);
    assert.equal(boxElement.style.values['--wn-dialogue-custom-width'], '42rem');

    await manager.show({
        text: 'Hello',
        dialoguePosition: 'right',
        dialogueWidth: 480
    });

    assert.equal(boxElement.dataset.dialoguePosition, 'right');
    assert.equal(boxElement.classList.contains('web-novel-dialogue--left'), false);
    assert.equal(boxElement.classList.contains('web-novel-dialogue--right'), true);
    assert.equal(boxElement.style.values['--wn-dialogue-custom-width'], '480px');

    await manager.show({ text: 'Back to default' });

    assert.equal(boxElement.dataset.dialoguePosition, 'left');
    assert.equal(boxElement.classList.contains('web-novel-dialogue--right'), false);
    assert.equal(boxElement.classList.contains('web-novel-dialogue--left'), true);
    assert.equal(boxElement.style.values['--wn-dialogue-custom-width'], '42rem');
});

test('dialogue manager applies rich text fallback and speaker color', async () => {
    const speakerNameElement = {
        textContent: '',
        style: {}
    };
    const targetElement = {
        textContent: '',
        style: {}
    };
    const manager = new DialogueManager(null, {
        targetElement,
        speakerNameElement
    });

    await manager.show({
        speakerName: 'Mira',
        speakerNameColor: '#ff88aa',
        text: 'Hello {color=#f00}there{/color}.'
    });

    assert.equal(speakerNameElement.textContent, 'Mira');
    assert.equal(speakerNameElement.style.color, '#ff88aa');
    assert.equal(targetElement.textContent, 'Hello there.');
});
