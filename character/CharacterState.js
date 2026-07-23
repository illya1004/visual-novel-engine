export class CharacterState {
    constructor(characterId) {
        this.id = characterId;
        this.visible = false;
        this.emotion = null;
        this.position = "center";
        this.image = null;
        this.lastShownAt = null;
        this.speaking = false;
    }

    setEmotion(emotion) {
        this.emotion = emotion;
    }

    setSpeaking(speaking) {
        this.speaking = Boolean(speaking);
    }

    show() {
        this.visible = true;
        this.lastShownAt = Date.now();
    }

    hide() {
        this.visible = false;
    }

    setPosition(position) {
        this.position = position;
    }

    setImage(image) {
        this.image = image;
    }
}
