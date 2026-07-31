export class CharacterState {
    constructor(characterId) {
        this.id = characterId;
        this.visible = false;
        this.emotion = null;
        this.position = "center";
        this.image = null;
        this.lastShownAt = null;
        this.speaking = false;
        this.nameColor = null;
    }

    setEmotion(emotion) {
        this.emotion = emotion ?? null;
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
        this.speaking = false;
    }

    setPosition(position) {
        this.position = position;
    }

    setImage(image) {
        this.image = image;
    }

    setNameColor(color) {
        this.nameColor = color ?? null;
    }

    resetAppearance(image = null) {
        this.emotion = null;
        this.image = image;
    }
}
