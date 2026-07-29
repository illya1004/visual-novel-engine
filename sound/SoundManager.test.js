import test from 'node:test';
import assert from 'node:assert/strict';
import { SoundManager } from './SoundManager.js';

class FakeAudio {
    constructor(src) {
        this.src = src;
        this.loop = false;
        this.volume = 1;
        this.currentTime = 0;
        this.playCount = 0;
        this.pauseCount = 0;
        this.listeners = new Map();
    }

    async play() {
        this.playCount += 1;
    }

    pause() {
        this.pauseCount += 1;
    }

    addEventListener(name, callback) {
        this.listeners.set(name, callback);
    }

    emit(name) {
        this.listeners.get(name)?.();
    }
}

test('sound manager plays, pauses, resumes and stops background music', async () => {
    const created = [];
    const manager = new SoundManager({
        volume: 0.5,
        musicVolume: 0.8,
        audioFactory(source) {
            const audio = new FakeAudio(source);
            created.push(audio);
            return audio;
        }
    });

    const music = await manager.playMusic('/music.mp3');

    assert.equal(manager.currentMusic, music);
    assert.equal(music.src, '/music.mp3');
    assert.equal(music.loop, true);
    assert.equal(music.volume, 0.4);
    assert.equal(music.playCount, 1);

    manager.pauseMusic();
    await manager.resumeMusic();
    assert.equal(music.pauseCount, 1);
    assert.equal(music.playCount, 2);

    manager.stopMusic();
    assert.equal(music.pauseCount, 2);
    assert.equal(music.currentTime, 0);
    assert.equal(manager.currentMusic, null);
    assert.equal(created.length, 1);
});

test('sound manager tracks sound effects by id and removes one-shot effects when they end', async () => {
    const manager = new SoundManager({
        soundVolume: 0.25,
        audioFactory: (source) => new FakeAudio(source)
    });

    const sound = await manager.playSound('/click.mp3', {
        id: 'click',
        volume: 0.5
    });

    assert.equal(manager.activeSounds.has('click'), true);
    assert.equal(sound.volume, 0.125);

    sound.emit('ended');
    assert.equal(manager.activeSounds.has('click'), false);
});

test('disabling sound channels stops their active audio', async () => {
    const manager = new SoundManager({
        audioFactory: (source) => new FakeAudio(source)
    });

    const music = await manager.playMusic('/music.mp3');
    const sound = await manager.playSound('/hit.mp3', { id: 'hit', loop: true });

    manager.setMusicEnabled(false);
    assert.equal(music.pauseCount, 1);
    assert.equal(manager.currentMusic, null);

    manager.setSoundEnabled(false);
    assert.equal(sound.pauseCount, 1);
    assert.equal(manager.activeSounds.size, 0);
});
