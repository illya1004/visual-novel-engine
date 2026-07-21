export class ChoiceManager {
    constructor(options = {}) {
        this.choices = [];
        this.currentChoices = [];
        this.onChoose = options.onChoose || null;
    }

    show(choices = []) {
        this.currentChoices = Array.isArray(choices) ? choices : [];
        this.choices = this.currentChoices;
        return this.currentChoices;
    }

    clear() {
        this.currentChoices = [];
        this.choices = [];
    }

    async choose(index = 0) {
        const choice = this.currentChoices[index];

        if (!choice) {
            return null;
        }

        if (this.onChoose) {
            return this.onChoose(choice, index);
        }

        return choice;
    }
}
