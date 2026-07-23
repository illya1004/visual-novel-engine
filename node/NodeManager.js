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
        this.transitionLogger = managers.transitionLogger || api?.transitionLogger || null;
        this._lastChoiceNode = null;
    }

    _logTransition(fromNodeId, toNodeId, reason = 'advance') {
        const fromLabel = fromNodeId ?? 'start';
        const toLabel = toNodeId ?? 'end';
        const message = `[node-transition] ${fromLabel} -> ${toLabel} (${reason})`;

        if (typeof this.transitionLogger === 'function') {
            this.transitionLogger(message);
        } else {
            console.log(message);
        }

        return message;
    }

    _moveToNode(targetNode, reason = 'advance') {
        if (!targetNode) {
            return null;
        }

        const previousNodeId = this.currentNodeId;
        this.currentNodeIndex = this.nodes.findIndex(node => String(node.id) === String(targetNode.id));
        this.currentNodeId = targetNode.id;
        this._logTransition(previousNodeId, targetNode.id, reason);
        return targetNode;
    }

    async loadNodes() {
        if (!this.api?.getNodes) {
            this.nodes = [];
            this.currentNodeId = null;
            this.currentNodeIndex = -1;
            return this.nodes;
        }

        const loadedNodes = await this.api.getNodes();
        this.nodes = Array.isArray(loadedNodes) ? loadedNodes : (loadedNodes?.results ?? []);
        this.currentNodeId = null;
        this.currentNodeIndex = -1;

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

        return this._moveToNode(targetNode, 'goto');
    }

    async start() {
        if (!this.nodes.length) {
            return null;
        }

        const firstNode = this.nodes[0];
        this._moveToNode(firstNode, 'start');
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
        if (nextNodeId === null || nextNodeId === undefined) {
            return null;
        }

        const targetNode = this.get(nextNodeId);
        console.log(`Next node: ${nextNodeId}`, targetNode);
        if (!targetNode) {
            return null;
        }

        return this.executeNode(this._moveToNode(targetNode, 'next'));
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

        if (this.choiceManager?.clear) {
            this.choiceManager.clear();
        }

        const targetNode = this.get(choice.nextNodeId ?? choice.next ?? null);
        if (!targetNode) {
            return null;
        }

        return this.executeNode(this._moveToNode(targetNode, 'choice'));
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

        if (node.skip_node) {
            this.next();
        }

        return node;
    }

    async handleDialogueNode(node) {
        const dialogue = node.dialogue || node.data || { text: node.text || "" };

        if (this.dialogueManager?.show) {
            await this.dialogueManager.show(dialogue);
        }

        if (this.charactersManager?.showDialogueCharacter) {
            this.charactersManager.showDialogueCharacter(dialogue);
        }

        return node;
    }

    async handleCharacterNode(node) {
        const characterId = node.characterId ?? node.character_id;
        const speakingOption = node.speaking ?? node.isSpeaking ?? node.is_speaking ?? null;

        if (node.visible === false || node.action === 'hide') {
            if (this.charactersManager?.hideCharacter) {
                this.charactersManager.hideCharacter(characterId);
            }
            if (speakingOption === false) {
                this.charactersManager?.setSpeakingCharacter?.(null, { speaking: false });
            }
            return node;
        }

        if (this.charactersManager?.showCharacter) {
            this.charactersManager.showCharacter(characterId, node.position || 'center', node.style || {}, { speaking: speakingOption });
        }

        if (node.emotion && this.charactersManager?.changeEmotion) {
            await this.charactersManager.changeEmotion(characterId, node.emotion);
        }

        if (this.charactersManager?.setSpeakingCharacter && characterId) {
            this.charactersManager.setSpeakingCharacter(characterId, { speaking: speakingOption });
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
