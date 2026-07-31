import test from 'node:test';
import assert from 'node:assert/strict';
import { Typewriter } from './TypeWriter.js';

test('typewriter falls back to plain text when no DOM renderer is available', async () => {
    const target = { textContent: '' };
    const typewriter = new Typewriter(target);
    typewriter.sleep = () => Promise.resolve();

    await typewriter.write('A {color=#f00}red{/color} word {w=0.1}done', 1);

    assert.equal(target.textContent, 'A red word done');
});

test('typewriter uses cps tags as characters per second', async () => {
    const target = { textContent: '' };
    const waits = [];
    const typewriter = new Typewriter(target);
    typewriter.sleep = (ms) => {
        waits.push(ms);
        return Promise.resolve();
    };

    await typewriter.write('{cps=20}AB{/cps}', 100);

    assert.deepEqual(waits, [50, 50]);
    assert.equal(target.textContent, 'AB');
});

test('typewriter finish interrupts the current wait and renders full text', async () => {
    const target = { textContent: '' };
    const typewriter = new Typewriter(target);
    const writePromise = typewriter.write('ABCD', 10000);

    await Promise.resolve();
    typewriter.finish();
    await writePromise;

    assert.equal(typewriter.isTyping, false);
    assert.equal(target.textContent, 'ABCD');
});
