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

        const result = this.onChoose ? await this.onChoose(choice, index) : choice;
        this.clear();
        return result;
    }
}
