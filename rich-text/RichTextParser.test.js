import test from 'node:test';
import assert from 'node:assert/strict';
import { RichTextParser } from './RichTextParser.js';

test('rich text parser handles color, cps, effects and waits', () => {
    const parser = new RichTextParser();
    const tokens = parser.parse('Hi {color=#f33}{cps=12}Mira{/cps}{/color}{w=0.25}! {shake=3}Run{/shake}');

    assert.equal(parser.toPlainText(tokens), 'Hi Mira! Run');

    const mira = tokens.find((token) => token.type === 'text' && token.text === 'Mira');
    const wait = tokens.find((token) => token.type === 'wait');
    const shake = tokens.find((token) => token.type === 'text' && token.text === 'Run');

    assert.equal(mira.attrs.style.color, '#f33');
    assert.equal(mira.attrs.cps, 12);
    assert.equal(wait.ms, 250);
    assert.deepEqual(shake.attrs.classes, ['rt-shake']);
    assert.equal(shake.attrs.style['--rt-shake-distance'], '3px');
});

test('rich text parser supports bracket style tags without eating variables', () => {
    const parser = new RichTextParser();
    const text = '[player_name] [color=#0af]speaks[/color]';
    const tokens = parser.parse(text);

    assert.equal(parser.toPlainText(tokens), '[player_name] speaks');
    assert.equal(tokens.find((token) => token.text === 'speaks').attrs.style.color, '#0af');
});
