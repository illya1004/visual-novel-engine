export class NodeManager {
    constructor(api, managers = {}) {
        this.api = api;
        this.nodes = [];
        this.currentNodeId = null;
        this.currentNodeIndex = -1;
        this.dialogueManager = managers.dialogueManager || api?.dialogueManager || null;
        this.backgroundManager = managers.backgroundManager || api?.backgroundManager || null;
        this.charactersManager = managers.charactersManager || api?.charactersManager || null;
        this.choiceManager = managers.choiceManager || api?.choiceManager || null;
        this._lastChoiceNode = null;
    }

    async loadNodes() {
        if (!this.api?.getNodes) {
            this.nodes = [];
            this.currentNodeId = null;
            this.currentNodeIndex = -1;
            return this.nodes;
        }

        const loadedNodes = await this.api.getNodes();
        this.nodes = Array.isArray(loadedNodes) ? loadedNodes : [];
        this.currentNodeId = null;
        this.currentNodeIndex = -1;

        if (this.nodes.length) {
            this.currentNodeId = this.nodes[0].id;
            this.currentNodeIndex = 0;
        }

        return this.nodes;
    }

    get(nodeId) {
        return this.nodes.find(node => String(node.id) === String(nodeId)) ?? null;
    }

    current() {
        return this.get(this.currentNodeId);
    }

    goTo(nodeId) {
        const targetNode = this.get(nodeId);

        if (!targetNode) {
            return null;
        }

        this.currentNodeId = targetNode.id;
        this.currentNodeIndex = this.nodes.findIndex(node => String(node.id) === String(targetNode.id));
        return targetNode;
    }

    async start() {
        if (!this.nodes.length) {
            return null;
        }

        this.currentNodeIndex = 0;
        this.currentNodeId = this.nodes[0].id;
        return this.executeNode(this.current());
    }

    async next() {
        if (this.currentNodeIndex < 0) {
            return this.start();
        }

        const currentNode = this.current();
        if (!currentNode) {
            return null;
        }

        const nextNodeId = currentNode.next ?? currentNode.nextNodeId ?? null;
        if (!nextNodeId) {
            return null;
        }

        const targetNode = this.get(nextNodeId);
        if (!targetNode) {
            return null;
        }

        this.currentNodeIndex = this.nodes.findIndex(node => String(node.id) === String(targetNode.id));
        this.currentNodeId = targetNode.id;
        return this.executeNode(targetNode);
    }

    async selectChoice(choiceIndex = 0) {
        const currentNode = this.current();

        if (!currentNode || currentNode.type !== 'choice') {
            return null;
        }

        const choice = currentNode.choices?.[choiceIndex];

        if (!choice) {
            return null;
        }

        const targetNode = this.get(choice.nextNodeId ?? choice.next ?? null);
        if (!targetNode) {
            return null;
        }

        this.currentNodeIndex = this.nodes.findIndex(node => String(node.id) === String(targetNode.id));
        this.currentNodeId = targetNode.id;
        return this.executeNode(targetNode);
    }

    async executeNode(node) {
        if (!node) {
            return null;
        }

        if (this.choiceManager?.clear && node.type !== 'choice') {
            this.choiceManager.clear();
        }

        switch (node.type) {
            case 'background':
                return this.handleBackgroundNode(node);
            case 'dialogue':
                return this.handleDialogueNode(node);
            case 'character':
                return this.handleCharacterNode(node);
            case 'choice':
                return this.handleChoiceNode(node);
            default:
                return node;
        }
    }

    async handleBackgroundNode(node) {
        if (this.backgroundManager?.load) {
            await this.backgroundManager.load(node);
        } else if (this.backgroundManager?.showBackground) {
            await this.backgroundManager.showBackground(node.image, node.options || {});
        } else if (this.backgroundManager?.ShowBackground) {
            await this.backgroundManager.ShowBackground(node.image, node.options || {});
        }

        return node;
    }

    async handleDialogueNode(node) {
        const dialogue = node.dialogue || node.data || { text: node.text || "" };

        if (this.dialogueManager?.show) {
            await this.dialogueManager.show(dialogue);
        }

        return node;
    }

    async handleCharacterNode(node) {
        if (this.charactersManager?.showCharacter) {
            this.charactersManager.showCharacter(node.characterId, node.position || 'center', node.style || {});
        }

        if (this.charactersManager?.setSpeakingCharacter && node.characterId) {
            this.charactersManager.setSpeakingCharacter(node.characterId);
        }

        return node;
    }

    async handleChoiceNode(node) {
        this._lastChoiceNode = node;
        if (this.choiceManager) {
            this.choiceManager.show(node.choices || []);
        }
        return node;
    }
}

export class NodesManager extends NodeManager {}