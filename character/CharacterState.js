export class CharacterState {
    constructor(characterId) {
        this.id = characterId;
        this.visible = false;
        this.emotion = null;
        this.position = "center";
        this.image = null;
    }

    setEmotion(emotion) {
        this.emotion = emotion;
    }

    show() {
        this.visible = true;
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